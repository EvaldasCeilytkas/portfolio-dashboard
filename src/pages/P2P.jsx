import { useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { PortfolioContext } from "../context/PortfolioContext";
import PlatformAllocationCard from "../components/PlatformAllocationCard";
import "../styles/p2p.css";

function number(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
}

function formatPercentage(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value))} %`;
}

function formatMonth(value) {
  if (!value) return "–";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
  }).format(date);
}

const P2P_CHART_RANGES = [
  { value: 6, label: "6M" },
  { value: 12, label: "1Y" },
  { value: 24, label: "2Y" },
  { value: 0, label: "All" },
];

function isAlternativePlatform(platform) {
  const assetClass = String(platform?.assetClass || "").toLowerCase();

  const allowedAssetClasses = [
    "p2p",
    "real_estate",
    "private_credit",
    "npl",
  ];

  if (assetClass) {
    return allowedAssetClasses.includes(assetClass);
  }

  const category = String(platform?.category || "").toLowerCase();
  const name = String(platform?.name || "").toLowerCase();

  const excludedNames = [
    "seb fondai",
    "seb mikro",
    "seb robo",
    "revolut brokerage",
    "revolut robo",
    "synergy",
  ];

  const excludedCategories = [
    "investiciniai fondai",
    "akcijos ir etf",
    "robo advisor",
  ];

  if (excludedNames.includes(name)) return false;
  if (excludedCategories.includes(category)) return false;

  return true;
}

function getMonthlyPerformance(platforms) {
  const monthlyMap = new Map();

  platforms.forEach((platform) => {
    const rows = Array.isArray(platform?.analytics?.monthlyPerformance)
      ? platform.analytics.monthlyPerformance
      : [];

    rows.forEach((row) => {
      const date = row?.date;

      if (!date) return;

      const current = monthlyMap.get(date) || {
        date,
        profit: 0,
        weightedReturnTotal: 0,
        weight: 0,
      };

      const previousValue = Math.max(number(row.previousValue), 0);
      const monthlyReturn = number(row.monthlyReturn);

      current.profit += number(row.monthlyProfit);
      current.weightedReturnTotal += monthlyReturn * previousValue;
      current.weight += previousValue;

      monthlyMap.set(date, current);
    });
  });

  return [...monthlyMap.values()]
    .map((item) => ({
      date: item.date,
      profit: item.profit,
      returnRate:
        item.weight > 0 ? item.weightedReturnTotal / item.weight : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function MetricCard({ label, value, description, tone = "neutral" }) {
  return (
    <article className={`p2p-metric-card p2p-tone-${tone}`}>
      <span className="p2p-metric-label">{label}</span>
      <strong className="p2p-metric-value">{value}</strong>
      <span className="p2p-metric-description">{description}</span>
    </article>
  );
}

function P2P() {
  const context = useContext(PortfolioContext);
  const portfolio = context?.portfolio;
  const loading = context?.loading;
  const errorMessage = context?.errorMessage;
  const [chartRange, setChartRange] = useState(12);

  const analysis = useMemo(() => {
    if (!portfolio) return null;

    const platforms = Array.isArray(portfolio.platforms)
      ? portfolio.platforms.filter(isAlternativePlatform)
      : [];

    const activePlatforms = platforms.filter(
      (platform) => platform?.active && number(platform?.value) > 0,
    );

    const totalInvested = activePlatforms.reduce(
      (sum, platform) => sum + number(platform.invested),
      0,
    );

    const totalValue = activePlatforms.reduce(
      (sum, platform) => sum + number(platform.value),
      0,
    );

    const totalProfit = activePlatforms.reduce(
      (sum, platform) => sum + number(platform.profit),
      0,
    );

    const returnRate =
      totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    const portfolioShare =
      number(portfolio.portfolioValue) > 0
        ? (totalValue / number(portfolio.portfolioValue)) * 100
        : 0;

    const rankedByValue = [...activePlatforms].sort(
      (a, b) => number(b.value) - number(a.value),
    );

    const rankedByReturn = [...activePlatforms]
      .filter((platform) => number(platform.invested) > 0)
      .sort((a, b) => number(b.returnRate) - number(a.returnRate));

    const largestPlatform = rankedByValue[0] || null;
    const largestShare =
      largestPlatform && totalValue > 0
        ? (number(largestPlatform.value) / totalValue) * 100
        : 0;

    const monthlyPerformance = getMonthlyPerformance(activePlatforms);
    const latestMonth =
      monthlyPerformance[monthlyPerformance.length - 1] || null;

    const positiveMonths = monthlyPerformance.filter(
      (item) => item.returnRate > 0,
    ).length;

    const winningRate =
      monthlyPerformance.length > 0
        ? (positiveMonths / monthlyPerformance.length) * 100
        : 0;

    const averageMonthlyReturn =
      monthlyPerformance.length > 0
        ? monthlyPerformance.reduce(
            (sum, item) => sum + item.returnRate,
            0,
          ) / monthlyPerformance.length
        : 0;

    const diversificationScore = Math.max(
      0,
      Math.min(
        100,
        activePlatforms.length * 7 -
          Math.max(0, largestShare - 20) * 1.7,
      ),
    );

    return {
      platforms,
      activePlatforms,
      totalInvested,
      totalValue,
      totalProfit,
      returnRate,
      portfolioShare,
      rankedByValue,
      rankedByReturn,
      largestPlatform,
      largestShare,
      monthlyPerformance,
      latestMonth,
      winningRate,
      averageMonthlyReturn,
      diversificationScore,
    };
  }, [portfolio]);

  if (loading) {
    return (
      <section className="p2p-page">
        <div className="p2p-state">Kraunami P2P duomenys...</div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="p2p-page">
        <div className="p2p-state p2p-state-error">
          Nepavyko užkrauti P2P duomenų: {errorMessage}
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="p2p-page">
        <div className="p2p-state">P2P duomenų nėra.</div>
      </section>
    );
  }

  const chartMonths =
    chartRange > 0
      ? analysis.monthlyPerformance.slice(-chartRange)
      : analysis.monthlyPerformance;

  const maxMonthlyProfit = Math.max(
    1,
    ...chartMonths.map((item) => Math.abs(number(item.profit))),
  );

  const chartDescription =
    chartRange === 0
      ? "Visa bendro P2P pelno istorija."
      : `Paskutinių ${chartRange} mėnesių bendras P2P pelnas.`;

  return (
    <section className="p2p-page">
      <header className="p2p-header">
        <div>
          <p className="p2p-eyebrow">P2P PORTFOLIO INTELLIGENCE</p>
          <h1>P2P portfelis</h1>
          <p className="p2p-subtitle">
            Visų sutelktinio finansavimo, privataus kredito ir P2P
            platformų rezultatai vienoje vietoje.
          </p>
        </div>

        <div className="p2p-updated">
          <span>Duomenys atnaujinti</span>
          <strong>{portfolio?.updatedAt || "–"}</strong>
        </div>
      </header>

      <div className="p2p-metrics-grid">
        <MetricCard
          label="P2P portfelio vertė"
          value={formatCurrency(analysis.totalValue)}
          description={`${formatPercentage(
            analysis.portfolioShare,
          )} viso portfelio`}
        />
        <MetricCard
          label="Investuota"
          value={formatCurrency(analysis.totalInvested)}
          description="Aktyviose alternatyvaus finansavimo platformose"
        />
        <MetricCard
          label="Bendras pelnas"
          value={formatCurrency(analysis.totalProfit)}
          description={`Grąža ${formatPercentage(analysis.returnRate)}`}
          tone={analysis.totalProfit >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="Aktyvios platformos"
          value={String(analysis.activePlatforms.length)}
          description={`Iš viso platformų: ${analysis.platforms.length}`}
        />
      </div>

      <PlatformAllocationCard
        platforms={analysis.activePlatforms}
        totalValue={analysis.totalValue}
        portfolioShare={analysis.portfolioShare}
      />

      <div className="p2p-primary-grid p2p-primary-grid-ranking">
        <article className="p2p-card">
          <div className="p2p-card-header">
            <div>
              <p className="p2p-card-eyebrow">PLATFORM RANKING</p>
              <h2>Geriausia grąža</h2>
              <p>
                Aktyvios alternatyvaus finansavimo platformos pagal
                dabartinę grąžą.
              </p>
            </div>
            <span className="p2p-card-icon">🏆</span>
          </div>

          <div className="p2p-ranking-list">
            {analysis.rankedByReturn.slice(0, 6).map((platform, index) => (
              <Link
                key={platform.slug || platform.name}
                to={`/portfolio/${platform.slug}`}
                className="p2p-ranking-row"
              >
                <span className="p2p-rank">
                  {index === 0
                    ? "🥇"
                    : index === 1
                      ? "🥈"
                      : index === 2
                        ? "🥉"
                        : index + 1}
                </span>

                <img
                  src={platform.logoUrl}
                  alt=""
                  className="p2p-platform-logo"
                />

                <div className="p2p-platform-copy">
                  <strong>{platform.name}</strong>
                  <span>
                    {platform.category} · {formatCurrency(platform.value)}
                  </span>
                </div>

                <strong
                  className={
                    number(platform.returnRate) >= 0
                      ? "p2p-positive"
                      : "p2p-negative"
                  }
                >
                  {formatPercentage(platform.returnRate)}
                </strong>
              </Link>
            ))}
          </div>
        </article>
      </div>

      <div className="p2p-secondary-grid">
        <article className="p2p-card">
          <div className="p2p-card-header">
            <div>
              <p className="p2p-card-eyebrow">MONTHLY PERFORMANCE</p>
              <h2>P2P mėnesio rezultatai</h2>
              <p>{chartDescription}</p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                role="group"
                aria-label="P2P grafiko laikotarpis"
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "4px",
                  border: "1px solid rgba(148, 163, 184, 0.14)",
                  borderRadius: "11px",
                  background: "rgba(2, 6, 23, 0.24)",
                }}
              >
                {P2P_CHART_RANGES.map((item) => {
                  const isActive = chartRange === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setChartRange(item.value)}
                      style={{
                        minWidth: "42px",
                        minHeight: "34px",
                        padding: "0 10px",
                        border: isActive
                          ? "1px solid rgba(96, 165, 250, 0.5)"
                          : "1px solid transparent",
                        borderRadius: "8px",
                        background: isActive
                          ? "rgba(37, 99, 235, 0.2)"
                          : "transparent",
                        color: isActive ? "#dbeafe" : "#8fa4c2",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <div className="p2p-latest-month">
                <span>Paskutinis mėnuo</span>
                <strong>{formatMonth(analysis.latestMonth?.date)}</strong>
                <b
                  className={
                    number(analysis.latestMonth?.profit) >= 0
                      ? "p2p-positive"
                      : "p2p-negative"
                  }
                >
                  {formatCurrency(analysis.latestMonth?.profit)}
                </b>
              </div>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              overflowX: chartMonths.length > 12 ? "auto" : "visible",
              paddingBottom: chartMonths.length > 12 ? "10px" : 0,
            }}
          >
            <div
              className="p2p-chart"
              style={{
                gridTemplateColumns:
                  chartMonths.length <= 12
                    ? `repeat(${Math.max(chartMonths.length, 1)}, minmax(48px, 1fr))`
                    : `repeat(${chartMonths.length}, minmax(58px, 1fr))`,
                minWidth:
                  chartMonths.length > 12
                    ? `${chartMonths.length * 66}px`
                    : "100%",
              }}
            >
            {chartMonths.map((item) => {
              const height = Math.max(
                8,
                (Math.abs(number(item.profit)) / maxMonthlyProfit) * 100,
              );

              return (
                <div className="p2p-chart-column" key={item.date}>
                  <div className="p2p-chart-value">
                    {formatCurrency(item.profit)}
                  </div>
                  <div className="p2p-chart-track">
                    <div
                      className={
                        item.profit >= 0
                          ? "p2p-chart-bar positive"
                          : "p2p-chart-bar negative"
                      }
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span>{formatMonth(item.date)}</span>
                </div>
              );
            })}
            </div>
          </div>
        </article>

        <article className="p2p-card">
          <div className="p2p-card-header">
            <div>
              <p className="p2p-card-eyebrow">P2P HEALTH</p>
              <h2>Portfelio būklė</h2>
              <p>Stabilumo ir diversifikacijos rodikliai.</p>
            </div>
            <span className="p2p-card-icon">◎</span>
          </div>

          <div className="p2p-health-grid">
            <MetricCard
              label="Vid. mėnesio grąža"
              value={formatPercentage(analysis.averageMonthlyReturn)}
              description="Pagal istorinius duomenis"
              tone={
                analysis.averageMonthlyReturn >= 0
                  ? "positive"
                  : "negative"
              }
            />
            <MetricCard
              label="Teigiamų mėnesių"
              value={formatPercentage(analysis.winningRate)}
              description="Visoje P2P istorijoje"
              tone={analysis.winningRate >= 55 ? "positive" : "neutral"}
            />
            <MetricCard
              label="Didžiausia pozicija"
              value={formatPercentage(analysis.largestShare)}
              description={analysis.largestPlatform?.name || "–"}
              tone={analysis.largestShare > 35 ? "negative" : "neutral"}
            />
            <MetricCard
              label="Diversifikacija"
              value={`${Math.round(analysis.diversificationScore)}/100`}
              description={`${analysis.activePlatforms.length} aktyvių platformų`}
              tone={
                analysis.diversificationScore >= 70
                  ? "positive"
                  : "neutral"
              }
            />
          </div>
        </article>
      </div>

      <article className="p2p-card">
        <div className="p2p-card-header">
          <div>
            <p className="p2p-card-eyebrow">PLATFORM ALLOCATION</p>
            <h2>Platformų paskirstymas</h2>
            <p>Aktyvios platformos pagal dabartinę vertę.</p>
          </div>
          <span className="p2p-card-icon">≡</span>
        </div>

        <div className="p2p-platform-table">
          <div className="p2p-table-head">
            <span>Platforma</span>
            <span>Investuota</span>
            <span>Vertė</span>
            <span>Pelnas</span>
            <span>Grąža</span>
            <span>P2P dalis</span>
          </div>

          {analysis.rankedByValue.map((platform) => {
            const share =
              analysis.totalValue > 0
                ? (number(platform.value) / analysis.totalValue) * 100
                : 0;

            return (
              <Link
                key={platform.slug || platform.name}
                to={`/portfolio/${platform.slug}`}
                className="p2p-table-row"
              >
                <div className="p2p-table-platform">
                  <img
                    src={platform.logoUrl}
                    alt=""
                    className="p2p-platform-logo"
                  />
                  <div>
                    <strong>{platform.name}</strong>
                    <span>{platform.category}</span>
                  </div>
                </div>
                <span>{formatCurrency(platform.invested)}</span>
                <span>{formatCurrency(platform.value)}</span>
                <span
                  className={
                    number(platform.profit) >= 0
                      ? "p2p-positive"
                      : "p2p-negative"
                  }
                >
                  {formatCurrency(platform.profit)}
                </span>
                <span
                  className={
                    number(platform.returnRate) >= 0
                      ? "p2p-positive"
                      : "p2p-negative"
                  }
                >
                  {formatPercentage(platform.returnRate)}
                </span>
                <div className="p2p-share-cell">
                  <strong>{formatPercentage(share)}</strong>
                  <div className="p2p-share-track">
                    <div style={{ width: `${Math.min(100, share)}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
}

export default P2P;