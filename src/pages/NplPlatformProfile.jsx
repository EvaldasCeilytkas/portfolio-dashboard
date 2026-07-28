import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import PerformanceChart from "../components/charts/PerformanceChart";
import NplProfileModule from "../components/npl/NplProfileModule";
import ProgressBar from "../components/ui/ProgressBar";
import { usePortfolio } from "../hooks/usePortfolio";

import "../styles/platformprofile.css";
import "../styles/npl.css";

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "0,00 €";

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "0,00 %";

  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function formatSignedCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "0,00 €";

  const formatted = formatCurrency(Math.abs(numericValue));

  if (numericValue > 0) return `+${formatted}`;
  if (numericValue < 0) return `−${formatted}`;

  return formatted;
}

function formatSignedPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "0,00 %";

  const formatted = formatPercentage(Math.abs(numericValue));

  if (numericValue > 0) return `+${formatted}`;
  if (numericValue < 0) return `−${formatted}`;

  return formatted;
}

function formatDate(value) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
  }).format(parsed);
}

function NplPlatformProfile() {
  const { portfolio, loading, errorMessage } = usePortfolio();
  const [logoFailed, setLogoFailed] = useState(false);

  const platform = useMemo(() => {
    if (!Array.isArray(portfolio?.platforms)) return null;

    return portfolio.platforms.find(
      (item) =>
        item?.slug === "indemo" ||
        String(item?.name || "").trim().toLowerCase() === "indemo",
    );
  }, [portfolio]);

  const details = platform?.details || portfolio?.indemo || null;
  const summary = details?.nplSummary || details?.summary || {};
  const history = Array.isArray(details?.history)
    ? details.history
    : Array.isArray(platform?.history)
      ? platform.history
      : [];

  if (loading) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state">
          Kraunami Indemo duomenys...
        </section>
      </main>
    );
  }

  if (errorMessage || !platform || !details) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state error">
          <h2>Nepavyko įkelti Indemo</h2>
          <p>
            {errorMessage ||
              "Indemo detalūs duomenys nerasti. Paleisk update_portfolio.py."}
          </p>
          <Link to="/portfolio">Grįžti į portfelį</Link>
        </section>
      </main>
    );
  }

  const invested = Number(summary.invested ?? platform.invested ?? 0);
  const currentValue = Number(summary.value ?? platform.value ?? 0);
  const profit = Number(summary.profit ?? platform.profit ?? 0);
  const returnRate = Number(summary.returnRate ?? platform.returnRate ?? 0);
  const xirr = Number(summary.xirr ?? 0);
  const portfolioValue = Number(portfolio?.portfolioValue || 0);
  const portfolioShare =
    portfolioValue > 0 ? (currentValue / portfolioValue) * 100 : 0;
  const latestPoint = history.at(-1);
  const startDate = history[0]?.date || platform?.analytics?.startDate || "";
  const logoUrl = platform.logoUrl || "";

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        55 +
          Math.min(20, Math.max(0, returnRate)) +
          (Number(summary.averagePtv || 0) <= 60 ? 15 : 8) +
          Math.min(10, Number(summary.completedProjects || 0)),
      ),
    ),
  );

  return (
    <main
      className="platform-profile-page npl-dedicated-page"
      style={{
        "--platform-accent": "#e879f9",
        "--platform-accent-soft": "rgba(232, 121, 249, 0.16)",
      }}
    >
      <Link className="platform-profile-back" to="/portfolio">
        <span aria-hidden="true">←</span>
        Grįžti į portfelį
      </Link>

      <section className="platform-profile-hero">
        <div className="platform-profile-heading">
          <div className="platform-profile-logo">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt="Indemo logotipas"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span>I</span>
            )}
          </div>

          <div>
            <p className="platform-profile-eyebrow">NPL PLATFORM PROFILE</p>

            <div className="platform-profile-title-row">
              <h1>Indemo</h1>

              <div
                className={`platform-profile-score-badge ${
                  score >= 85 ? "excellent" : score >= 70 ? "good" : "neutral"
                }`}
              >
                <span>NPL Portfolio Health</span>
                <strong>{score} / 100</strong>
              </div>
            </div>

            <div className="platform-profile-meta">
              <span>NPL ir mortgage investicijos</span>

              <span className="platform-profile-status active">
                <span className="platform-profile-status-dot" />
                Aktyvi platforma
              </span>
            </div>

            <div className="platform-profile-quick-meta">
              <span>Nuo {formatDate(startDate)}</span>
              <span>{history.length} mėn.</span>
              <span>EUR</span>
            </div>
          </div>
        </div>

        <div className="platform-profile-hero-side">
          <div className="platform-profile-value">
            <span>Dabartinė vertė</span>
            <strong>{formatCurrency(currentValue)}</strong>

            <div className="platform-profile-hero-return">
              <b className={profit >= 0 ? "platform-profile-positive" : "platform-profile-negative"}>
                {formatSignedCurrency(profit)}
              </b>
              <small className={returnRate >= 0 ? "platform-profile-positive" : "platform-profile-negative"}>
                {formatSignedPercentage(returnRate)}
              </small>
            </div>
          </div>

          {platform.website && (
            <a
              className="platform-profile-website-button"
              href={platform.website}
              target="_blank"
              rel="noreferrer"
            >
              Atidaryti svetainę
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>

      <section className="platform-profile-stats">
        <article className="platform-profile-stat-card">
          <span>Investuota</span>
          <strong>{formatCurrency(invested)}</strong>
          <small>Bendra investuota suma</small>
        </article>

        <article className="platform-profile-stat-card">
          <span>Pelnas</span>
          <strong className={profit >= 0 ? "platform-profile-positive" : "platform-profile-negative"}>
            {formatSignedCurrency(profit)}
          </strong>
          <small>Vertė minus įneštas kapitalas</small>
        </article>

        <article className="platform-profile-stat-card">
          <span>Grąža</span>
          <strong className={returnRate >= 0 ? "platform-profile-positive" : "platform-profile-negative"}>
            {formatSignedPercentage(returnRate)}
          </strong>
          <small>Bendra platformos grąža</small>
        </article>

        <article className="platform-profile-stat-card">
          <span>XIRR</span>
          <strong className={xirr >= 0 ? "platform-profile-positive" : "platform-profile-negative"}>
            {formatSignedPercentage(xirr)}
          </strong>
          <small>Metinė svertinė grąža</small>
        </article>
      </section>

      <section className="npl-dedicated-insights">
        <article>
          <span>Aktyvūs projektai</span>
          <strong>{summary.activeProjects ?? 0}</strong>
          <small>Dar negrąžintos investicijos</small>
        </article>

        <article>
          <span>Užbaigti projektai</span>
          <strong>{summary.completedProjects ?? 0}</strong>
          <small>Pilnai realizuoti projektai</small>
        </article>

        <article>
          <span>Vidutinis PTV</span>
          <strong>{formatPercentage(summary.averagePtv)}</strong>
          <small>Pirkimo kainos ir turto vertės santykis</small>
        </article>

        <article>
          <span>Vidutinis PDT</span>
          <strong>{formatPercentage(summary.averagePdt)}</strong>
          <small>Skolos ir turto vertės santykis</small>
        </article>

        <article>
          <span>Palūkanos</span>
          <strong className="platform-profile-positive">
            {formatCurrency(summary.interest)}
          </strong>
          <small>Iki šiol gautos palūkanos</small>
        </article>

        <article>
          <span>Premijos</span>
          <strong className="platform-profile-positive">
            {formatCurrency(summary.bonuses)}
          </strong>
          <small>Platformos suteiktos premijos</small>
        </article>
      </section>

      <section className="npl-dedicated-grid">
        <article className="platform-profile-card platform-profile-share-card">
          <div className="platform-profile-card-header">
            <div>
              <p>PORTFELIO STRUKTŪRA</p>
              <h2>Indemo dalis</h2>
            </div>

            <strong>{formatPercentage(portfolioShare)}</strong>
          </div>

          <ProgressBar value={portfolioShare} showLabel={false} />

          <div className="platform-profile-share-footer">
            <span>Indemo</span>
            <span>{formatCurrency(currentValue)}</span>
          </div>
        </article>

        <article className="npl-dedicated-summary-card">
          <div>
            <span>Laisvi pinigai</span>
            <strong>{formatCurrency(summary.cash)}</strong>
          </div>
          <div>
            <span>Grąžinta pagrindinė suma</span>
            <strong>{formatCurrency(summary.returnedPrincipal)}</strong>
          </div>
          <div>
            <span>Aktyvi projektų vertė</span>
            <strong>{formatCurrency(summary.activeValue)}</strong>
          </div>
          <div>
            <span>Investavimo dalių</span>
            <strong>{summary.totalTransactions ?? 0}</strong>
          </div>
        </article>
      </section>

      <PerformanceChart
        history={history}
        currentValue={currentValue}
        eyebrow="NPL PORTFELIO REZULTATAS"
        title="Indemo vertės istorija"
        description="Indemo portfelio vertės ir įnešto kapitalo pokytis."
        valueLabel="Portfelio vertė"
        investedLabel="Įneštas kapitalas"
        totalLabel="Dabartinė vertė"
        showPeriodResult
        className="platform-profile-performance-chart"
        height={420}
      />

      <section className="npl-latest-result">
        <div>
          <span>Paskutinis duomenų mėnuo</span>
          <strong>{formatDate(latestPoint?.date)}</strong>
        </div>
        <div>
          <span>Mėnesio pelnas</span>
          <strong className="platform-profile-positive">
            {formatSignedCurrency(latestPoint?.monthlyProfit)}
          </strong>
        </div>
        <div>
          <span>Mėnesio grąža</span>
          <strong className="platform-profile-positive">
            {formatSignedPercentage(latestPoint?.monthlyReturn)}
          </strong>
        </div>
        <div>
          <span>Portfelio vertė</span>
          <strong>{formatCurrency(latestPoint?.value)}</strong>
        </div>
      </section>

      <NplProfileModule
        details={details}
        platformName="Indemo"
        platformSlug="indemo"
      />
    </main>
  );
}

export default NplPlatformProfile;
