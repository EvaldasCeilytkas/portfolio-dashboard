import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePortfolio } from "../hooks/usePortfolio";

import "../styles/etfprofile.css";

const RANGE_OPTIONS = [
  { key: "1M", months: 1 },
  { key: "3M", months: 3 },
  { key: "6M", months: 6 },
  { key: "YTD", months: null },
  { key: "1Y", months: 12 },
  { key: "ALL", months: Infinity },
];

function formatCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

function formatPercentage(value, signed = false) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted = new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(number));

  if (!signed || number === 0) {
    return `${formatted} %`;
  }

  return `${number > 0 ? "+" : "−"}${formatted} %`;
}

function formatNumber(value, maximumFractionDigits = 4) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(number);
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

function formatShortDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "2-digit",
    month: "short",
  }).format(date);
}

function getPlatformName(platform) {
  return (
    platform?.name ??
    platform?.platformName ??
    platform?.platform ??
    platform?.title ??
    "Nežinoma platforma"
  );
}

function createPlatformSlug(platformName) {
  return String(platformName || "")
    .trim()
    .toLocaleLowerCase("lt-LT")
    .replaceAll(" ", "-");
}

function getPlatformDetails(portfolio, platform) {
  if (platform?.details && typeof platform.details === "object") {
    return platform.details;
  }

  const platformSlug = createPlatformSlug(getPlatformName(platform));

  if (platformSlug === "seb-mikro" && portfolio?.sebMikro) {
    return portfolio.sebMikro;
  }

  if (
    platformSlug === "revolut-brokerage" &&
    portfolio?.revolutBrokerage
  ) {
    return portfolio.revolutBrokerage;
  }

  return null;
}

function findPosition(details, ticker) {
  const normalizedTicker = String(ticker || "").toUpperCase();

  const active = Array.isArray(details?.positions?.active)
    ? details.positions.active
    : Array.isArray(details?.holdings)
      ? details.holdings
      : [];

  const sold = Array.isArray(details?.positions?.sold)
    ? details.positions.sold
    : Array.isArray(details?.sold)
      ? details.sold
      : [];

  const matchPosition = (position) => {
    const positionTicker =
      position?.ticker ?? position?.symbol ?? position?.id ?? "";

    return String(positionTicker).toUpperCase() === normalizedTicker;
  };

  const activePosition = active.find(matchPosition);

  if (activePosition) {
    return { position: activePosition, sold: false, activePositions: active };
  }

  const soldPosition = sold.find(matchPosition);

  if (soldPosition) {
    return { position: soldPosition, sold: true, activePositions: active };
  }

  return { position: null, sold: false, activePositions: active };
}

function inferHoldingRole(position, portfolioShare, sold) {
  const explicitRole =
    position?.role ??
    position?.holdingRole ??
    position?.classification ??
    position?.strategyRole;

  if (explicitRole) {
    return String(explicitRole);
  }

  if (sold) {
    return "Uždaryta pozicija";
  }

  if (portfolioShare >= 25) {
    return "Core Holding";
  }

  if (portfolioShare >= 10) {
    return "Strateginė pozicija";
  }

  return "Satellite";
}

function inferQuality(position, returnRate, sold) {
  const explicitScore = Number(
    position?.qualityScore ?? position?.score ?? position?.rating,
  );

  if (Number.isFinite(explicitScore)) {
    return Math.max(1, Math.min(5, Math.round(explicitScore)));
  }

  if (sold) {
    return 3;
  }

  if (returnRate >= 15) {
    return 5;
  }

  if (returnRate >= 5) {
    return 4;
  }

  if (returnRate >= 0) {
    return 3;
  }

  if (returnRate >= -10) {
    return 2;
  }

  return 1;
}


function calculateChartStats(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      minimum: 0,
      maximum: 0,
      average: 0,
      maxDrawdown: 0,
    };
  }

  const values = history
    .map((item) => Number(item?.value ?? 0))
    .filter(Number.isFinite);

  if (!values.length) {
    return {
      minimum: 0,
      maximum: 0,
      average: 0,
      maxDrawdown: 0,
    };
  }

  let peak = values[0];
  let maxDrawdown = 0;

  values.forEach((value) => {
    peak = Math.max(peak, value);

    if (peak > 0) {
      maxDrawdown = Math.min(maxDrawdown, ((value - peak) / peak) * 100);
    }
  });

  return {
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    average: values.reduce((total, value) => total + value, 0) / values.length,
    maxDrawdown,
  };
}

function filterHistoryByRange(history, selectedRange) {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  if (selectedRange === "ALL") {
    return history;
  }

  const lastItem = history[history.length - 1];
  const endDate = new Date(lastItem.date);

  if (Number.isNaN(endDate.getTime())) {
    return history;
  }

  if (selectedRange === "YTD") {
    return history.filter((item) => {
      const date = new Date(item.date);
      return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === endDate.getFullYear()
      );
    });
  }

  const range = RANGE_OPTIONS.find((item) => item.key === selectedRange);
  const months = range?.months;

  if (!Number.isFinite(months)) {
    return history;
  }

  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - months);

  return history.filter((item) => {
    const date = new Date(item.date);
    return !Number.isNaN(date.getTime()) && date >= startDate;
  });
}

function buildLinePath(points, key, width, height, minValue, maxValue) {
  if (!points.length) {
    return "";
  }

  const innerWidth = width - 64;
  const innerHeight = height - 54;
  const range = maxValue - minValue || 1;

  return points
    .map((point, index) => {
      const x =
        42 +
        (points.length === 1
          ? innerWidth / 2
          : (index / (points.length - 1)) * innerWidth);
      const rawValue = Number(point?.[key] ?? 0);
      const y = 18 + innerHeight - ((rawValue - minValue) / range) * innerHeight;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function PerformanceChart({ history }) {
  const [selectedRange, setSelectedRange] = useState("ALL");
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const filteredHistory = useMemo(
    () => filterHistoryByRange(history, selectedRange),
    [history, selectedRange],
  );

  const chart = useMemo(() => {
    const width = 900;
    const height = 310;
    const values = filteredHistory.flatMap((item) => [
      Number(item?.value ?? 0),
      Number(item?.invested ?? 0),
    ]);
    const finiteValues = values.filter(Number.isFinite);
    const minValue = finiteValues.length ? Math.min(...finiteValues, 0) : 0;
    const maxValue = finiteValues.length ? Math.max(...finiteValues, 1) : 1;

    return {
      width,
      height,
      valuePath: buildLinePath(
        filteredHistory,
        "value",
        width,
        height,
        minValue,
        maxValue,
      ),
      investedPath: buildLinePath(
        filteredHistory,
        "invested",
        width,
        height,
        minValue,
        maxValue,
      ),
      minValue,
      maxValue,
    };
  }, [filteredHistory]);

  const chartStats = useMemo(
    () => calculateChartStats(filteredHistory),
    [filteredHistory],
  );

  const latest = filteredHistory[filteredHistory.length - 1];
  const first = filteredHistory[0];
  const periodChange =
    latest && first ? Number(latest.value ?? 0) - Number(first.value ?? 0) : 0;

  const hoveredPoint =
    hoveredIndex !== null ? filteredHistory[hoveredIndex] : null;

  const getPointCoordinates = (item, index, key = "value") => {
    const innerWidth = chart.width - 64;
    const innerHeight = chart.height - 54;
    const range = chart.maxValue - chart.minValue || 1;
    const x =
      42 +
      (filteredHistory.length === 1
        ? innerWidth / 2
        : (index / (filteredHistory.length - 1)) * innerWidth);
    const rawValue = Number(item?.[key] ?? 0);
    const y =
      18 +
      innerHeight -
      ((rawValue - chart.minValue) / range) * innerHeight;

    return { x, y };
  };

  const handlePointerMove = (event) => {
    if (!filteredHistory.length) {
      return;
    }

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * chart.width;
    const chartX = Math.min(
      chart.width - 22,
      Math.max(42, relativeX),
    );
    const ratio = (chartX - 42) / (chart.width - 64);
    const index = Math.round(ratio * (filteredHistory.length - 1));

    setHoveredIndex(Math.max(0, Math.min(filteredHistory.length - 1, index)));
  };

  if (!filteredHistory.length) {
    return (
      <div className="etf-profile-empty">
        Pozicijos istorijos duomenų dar nėra.
      </div>
    );
  }

  const hoverCoordinates =
    hoveredPoint && hoveredIndex !== null
      ? getPointCoordinates(hoveredPoint, hoveredIndex)
      : null;

  return (
    <>
      <div className="etf-profile-chart-toolbar">
        <div className="etf-profile-chart-result">
          <span>Periodo pokytis</span>
          <strong
            className={
              periodChange >= 0
                ? "etf-profile-positive"
                : "etf-profile-negative"
            }
          >
            {periodChange >= 0 ? "+" : "−"}
            {formatCurrency(Math.abs(periodChange))}
          </strong>
        </div>

        <div className="etf-profile-range-switcher">
          {RANGE_OPTIONS.map((option) => (
            <button
              className={selectedRange === option.key ? "active" : ""}
              key={option.key}
              onClick={() => {
                setSelectedRange(option.key);
                setHoveredIndex(null);
              }}
              type="button"
            >
              {option.key}
            </button>
          ))}
        </div>
      </div>

      <div className="etf-profile-chart-wrap">
        <svg
          className="etf-profile-chart"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          role="img"
          aria-label="Pozicijos vertės ir investuotos sumos grafikas"
          onMouseMove={handlePointerMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="valueAreaGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.34)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map((line) => {
            const y = 18 + (line / 4) * (chart.height - 54);

            return (
              <line
                key={line}
                x1="42"
                x2={chart.width - 22}
                y1={y}
                y2={y}
                className="etf-profile-grid-line"
              />
            );
          })}

          <path
            d={`${chart.valuePath} L ${chart.width - 22} ${chart.height - 36} L 42 ${chart.height - 36} Z`}
            className="etf-profile-value-area"
          />
          <path
            d={chart.investedPath}
            className="etf-profile-invested-line"
          />
          <path d={chart.valuePath} className="etf-profile-value-line" />

          {filteredHistory.map((item, index) => {
            if (
              index !== 0 &&
              index !== filteredHistory.length - 1 &&
              index % Math.ceil(filteredHistory.length / 5) !== 0
            ) {
              return null;
            }

            const x =
              42 +
              (filteredHistory.length === 1
                ? (chart.width - 64) / 2
                : (index / (filteredHistory.length - 1)) *
                  (chart.width - 64));

            return (
              <text
                key={`${item.date}-${index}`}
                x={x}
                y={chart.height - 10}
                textAnchor="middle"
                className="etf-profile-axis-label"
              >
                {formatShortDate(item.date)}
              </text>
            );
          })}

          {hoveredPoint && hoverCoordinates && (
            <>
              <line
                className="etf-profile-hover-line"
                x1={hoverCoordinates.x}
                x2={hoverCoordinates.x}
                y1="18"
                y2={chart.height - 36}
              />
              <circle
                className="etf-profile-hover-point"
                cx={hoverCoordinates.x}
                cy={hoverCoordinates.y}
                r="5"
              />
            </>
          )}
        </svg>

        {hoveredPoint && hoverCoordinates && (
          <div
            className="etf-profile-chart-tooltip"
            style={{
              left:
                hoverCoordinates.x > chart.width * 0.72
                  ? `calc(${(hoverCoordinates.x / chart.width) * 100}% - 14px)`
                  : `calc(${(hoverCoordinates.x / chart.width) * 100}% + 14px)`,
              top: `clamp(88px, ${(hoverCoordinates.y / chart.height) * 100}%, calc(100% - 88px))`,
              transform:
                hoverCoordinates.x > chart.width * 0.72
                  ? "translate(-100%, -50%)"
                  : "translate(0, -50%)",
            }}
          >
            <time>{formatDate(hoveredPoint.date)}</time>
            <div>
              <span>Vertė</span>
              <strong>{formatCurrency(hoveredPoint.value)}</strong>
            </div>
            <div>
              <span>Investuota</span>
              <strong>{formatCurrency(hoveredPoint.invested)}</strong>
            </div>
            <div>
              <span>Pelnas</span>
              <strong
                className={
                  Number(hoveredPoint.profit ?? 0) >= 0
                    ? "etf-profile-positive"
                    : "etf-profile-negative"
                }
              >
                {formatCurrency(hoveredPoint.profit)}
              </strong>
            </div>
          </div>
        )}
      </div>

      <div className="etf-profile-chart-legend">
        <span><i className="value" /> Pozicijos vertė</span>
        <span><i className="invested" /> Investuota</span>
        <span>{filteredHistory.length} laikotarpiai</span>
      </div>

      <div className="etf-profile-chart-stats">
        <div>
          <span>Minimali vertė</span>
          <strong>{formatCurrency(chartStats.minimum)}</strong>
        </div>
        <div>
          <span>Maksimali vertė</span>
          <strong>{formatCurrency(chartStats.maximum)}</strong>
        </div>
        <div>
          <span>Vidutinė vertė</span>
          <strong>{formatCurrency(chartStats.average)}</strong>
        </div>
        <div>
          <span>Max drawdown</span>
          <strong
            className={
              chartStats.maxDrawdown < 0
                ? "etf-profile-negative"
                : "etf-profile-positive"
            }
          >
            {formatPercentage(chartStats.maxDrawdown, true)}
          </strong>
        </div>
      </div>
    </>
  );
}

function TransactionsTable({ transactions }) {
  const PAGE_SIZE = 7;
  const [currentPage, setCurrentPage] = useState(1);

  const sortedTransactions = useMemo(
    () => [...transactions].reverse(),
    [transactions],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedTransactions.length / PAGE_SIZE),
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleTransactions = sortedTransactions.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  if (!transactions.length) {
    return (
      <div className="etf-profile-empty">
        Sandorių istorijos dar nėra.
      </div>
    );
  }

  return (
    <>
      <div className="etf-profile-table-wrap">
        <table className="etf-profile-table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipas</th>
              <th>Kiekis</th>
              <th>Kaina</th>
              <th>Suma</th>
              <th>Mokestis</th>
            </tr>
          </thead>
          <tbody>
            {visibleTransactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.date)}</td>
                <td>
                  <span className={`etf-profile-type ${transaction.type}`}>
                    {transaction.type === "sell" ? "SELL" : "BUY"}
                  </span>
                </td>
                <td title={formatNumber(transaction.quantity, 8)}>
                  {formatNumber(transaction.quantity, 4)}
                </td>
                <td>{formatCurrency(transaction.price)}</td>
                <td>{formatCurrency(transaction.netAmount ?? transaction.amount)}</td>
                <td>{formatCurrency(transaction.fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="etf-profile-pagination">
          <span>
            Rodomi {startIndex + 1}–
            {Math.min(startIndex + PAGE_SIZE, sortedTransactions.length)} iš{" "}
            {sortedTransactions.length}
          </span>

          <div>
            <button
              type="button"
              disabled={safePage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              ←
            </button>

            <strong>{safePage} / {totalPages}</strong>

            <button
              type="button"
              disabled={safePage === totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DividendHistory({ dividends, legacyDividendTotal }) {
  if (!dividends.length) {
    return (
      <div className="etf-profile-dividend-empty">
        <div className="etf-profile-dividend-icon">↗</div>
        <div>
          <strong>Dividendų išmokų nerasta</strong>
          <p>
            Pozicija gali būti kaupianti arba dividendų duomenys dar neįvesti.
          </p>
          {Number(legacyDividendTotal) > 0 && (
            <small>
              Ankstesnėje suvestinėje užfiksuota:{" "}
              {formatCurrency(legacyDividendTotal)}
            </small>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="etf-profile-table-wrap">
      <table className="etf-profile-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Bruto</th>
            <th>Mokestis</th>
            <th>Neto</th>
          </tr>
        </thead>
        <tbody>
          {[...dividends].reverse().map((dividend) => (
            <tr key={dividend.id}>
              <td>{formatDate(dividend.date)}</td>
              <td>{formatCurrency(dividend.gross)}</td>
              <td>{formatCurrency(dividend.tax)}</td>
              <td className="etf-profile-positive">
                {formatCurrency(dividend.net)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Timeline({ events }) {
  const DEFAULT_VISIBLE = 6;
  const [expanded, setExpanded] = useState(false);

  const sortedEvents = useMemo(
    () => [...events].reverse(),
    [events],
  );

  const visibleEvents = expanded
    ? sortedEvents
    : sortedEvents.slice(0, DEFAULT_VISIBLE);

  if (!events.length) {
    return (
      <div className="etf-profile-empty">
        Pozicijos įvykių dar nėra.
      </div>
    );
  }

  return (
    <>
      <div
        className={`etf-profile-timeline ${
          expanded ? "expanded" : "compact"
        }`}
      >
        {visibleEvents.map((event) => (
          <div className="etf-profile-timeline-item" key={event.id}>
            <div className={`etf-profile-timeline-dot ${event.type}`}>
              <span aria-hidden="true">
                {event.type === "sell"
                  ? "−"
                  : event.type === "dividend"
                    ? "€"
                    : event.type === "allTimeHigh"
                      ? "↑"
                      : "+"}
              </span>
            </div>

            <div className="etf-profile-timeline-content">
              <time>{formatDate(event.date)}</time>
              <strong>{event.title}</strong>
              <p>
                {Number(event.quantity) > 0 &&
                  `${formatNumber(event.quantity, 4)} vnt. · `}
                {Number(event.price) > 0 &&
                  `${formatCurrency(event.price)} · `}
                {Number(event.amount) > 0 && formatCurrency(event.amount)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {sortedEvents.length > DEFAULT_VISIBLE && (
        <button
          className="etf-profile-show-more"
          type="button"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded
            ? "Rodyti mažiau"
            : `Rodyti visus ${sortedEvents.length} įvykius`}
        </button>
      )}
    </>
  );
}

function EtfProfile() {
  const { slug, ticker } = useParams();
  const { portfolio, loading, errorMessage } = usePortfolio();

  const platform = useMemo(() => {
    if (!Array.isArray(portfolio?.platforms)) {
      return null;
    }

    return portfolio.platforms.find((item) => {
      const itemSlug =
        item?.slug ?? createPlatformSlug(getPlatformName(item));

      return itemSlug === slug;
    });
  }, [portfolio, slug]);

  const details = useMemo(
    () => getPlatformDetails(portfolio, platform),
    [portfolio, platform],
  );

  const { position, sold, activePositions } = useMemo(
    () => findPosition(details, ticker),
    [details, ticker],
  );

  if (loading) {
    return (
      <main className="etf-profile-page">
        <section className="etf-profile-state">
          Kraunami pozicijos duomenys...
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="etf-profile-page">
        <section className="etf-profile-state error">
          <h2>Nepavyko įkelti pozicijos</h2>
          <p>{errorMessage}</p>
          <Link to={`/platforms/${slug}`}>Grįžti į platformą</Link>
        </section>
      </main>
    );
  }

  if (!platform || !position) {
    return (
      <main className="etf-profile-page">
        <section className="etf-profile-state">
          <h2>Pozicija nerasta</h2>
          <p>
            Patikrink adresą arba pasirink poziciją platformos puslapyje.
          </p>
          <Link to={`/platforms/${slug}`}>Grįžti į platformą</Link>
        </section>
      </main>
    );
  }

  const platformName = getPlatformName(platform);
  const symbol =
    position?.ticker ?? position?.symbol ?? position?.id ?? ticker;
  const name = position?.name ?? symbol;
  const summary = position?.summary ?? {};
  const invested = Number(summary?.invested ?? position?.invested ?? 0);
  const value = Number(
    sold
      ? position?.soldValue ?? position?.value ?? 0
      : summary?.value ?? position?.value ?? position?.currentValue ?? 0,
  );
  const profit = Number(
    summary?.profit ?? position?.profit ?? value - invested,
  );
  const returnRate = Number(
    summary?.returnRate ??
      position?.returnRate ??
      (invested !== 0 ? (profit / invested) * 100 : 0),
  );
  const xirr = Number(summary?.xirr ?? position?.xirr);
  const quantity = Number(
    summary?.quantity ??
      position?.quantity ??
      position?.units ??
      position?.shares,
  );
  const averageBuyPrice = Number(
    summary?.averagePrice ??
      position?.averageBuyPrice ??
      position?.averagePrice ??
      (Number.isFinite(quantity) && quantity > 0 ? invested / quantity : NaN),
  );
  const currentPrice = Number(
    summary?.currentPrice ??
      position?.currentPrice ??
      position?.price ??
      (Number.isFinite(quantity) && quantity > 0 ? value / quantity : NaN),
  );
  const fees = Number(
    summary?.fees ??
      position?.fees ??
      Number(position?.buyFees ?? 0) + Number(position?.sellFees ?? 0),
  );
  const dividendIncome = Number(
    summary?.dividendIncome ??
      position?.dividendIncome ??
      0,
  );

  const history = Array.isArray(position?.history) ? position.history : [];
  const transactions = Array.isArray(position?.transactions)
    ? position.transactions
    : [];
  const dividends = Array.isArray(position?.dividends)
    ? position.dividends
    : [];
  const events = Array.isArray(position?.events) ? position.events : [];

  const activePositionsTotal = activePositions.reduce(
    (total, item) =>
      total + Number(item?.value ?? item?.currentValue ?? 0),
    0,
  );

  const portfolioShare =
    !sold && activePositionsTotal > 0
      ? (value / activePositionsTotal) * 100
      : 0;

  const holdingRole = inferHoldingRole(position, portfolioShare, sold);
  const quality = inferQuality(position, returnRate, sold);
  const qualityStars = `${"★".repeat(quality)}${"☆".repeat(5 - quality)}`;
  const holdingSince =
    position?.holdingSince ??
    position?.startDate ??
    position?.firstPurchaseDate ??
    position?.openedAt ??
    "";

  const returnClass =
    returnRate >= 0 ? "etf-profile-positive" : "etf-profile-negative";
  const profitClass =
    profit >= 0 ? "etf-profile-positive" : "etf-profile-negative";

  return (
    <main className="etf-profile-page">
      <Link className="etf-profile-back" to={`/platforms/${slug}`}>
        <span aria-hidden="true">←</span>
        Grįžti į {platformName}
      </Link>

      <section className="etf-profile-hero">
        <div className="etf-profile-heading">
          <div className="etf-profile-symbol">
            {String(symbol).toUpperCase()}
          </div>

          <div className="etf-profile-title-block">
            <p className="etf-profile-eyebrow">INVESTMENT PROFILE</p>
            <h1>{name}</h1>

            <div className="etf-profile-meta">
              <span>{symbol}</span>
              <span>{platformName}</span>
              <span
                className={`etf-profile-status ${
                  sold ? "sold" : "active"
                }`}
              >
                <i />
                {sold ? "Parduota pozicija" : "Aktyvi pozicija"}
              </span>
            </div>

            <div className="etf-profile-quality-row">
              <div className="etf-profile-quality-badge">
                <span className="etf-profile-stars">{qualityStars}</span>
                <strong>{holdingRole}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="etf-profile-hero-overview">
          <div className="etf-profile-hero-primary">
            <span>{sold ? "Realizuota vertė" : "Dabartinė vertė"}</span>
            <strong>{formatCurrency(value)}</strong>
            <small className={returnClass}>
              {formatPercentage(returnRate, true)}
            </small>
          </div>

          <div className="etf-profile-hero-facts">
            <div>
              <span>Pelnas</span>
              <strong className={profitClass}>{formatCurrency(profit)}</strong>
            </div>
            <div>
              <span>XIRR</span>
              <strong>
                {Number.isFinite(xirr)
                  ? formatPercentage(xirr, true)
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Portfelio dalis</span>
              <strong>
                {sold ? "—" : formatPercentage(portfolioShare)}
              </strong>
            </div>
            <div>
              <span>Laikoma nuo</span>
              <strong>{formatDate(holdingSince)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="etf-profile-kpis">
        <article>
          <span>Dividendai</span>
          <strong>{formatCurrency(dividendIncome)}</strong>
          <small>Gautos išmokos</small>
        </article>

        <article>
          <span>Vidutinė kaina</span>
          <strong>{formatCurrency(averageBuyPrice)}</strong>
          <small>Vieno vieneto savikaina</small>
        </article>

        <article>
          <span>Sandoriai</span>
          <strong>{transactions.length}</strong>
          <small>Pirkimai ir pardavimai</small>
        </article>

        <article>
          <span>Mokesčiai</span>
          <strong>{formatCurrency(fees)}</strong>
          <small>Pirkimo ir pardavimo</small>
        </article>
      </section>

      <section className="etf-profile-main-grid">
        <article className="etf-profile-card etf-profile-summary-card">
          <div className="etf-profile-card-heading">
            <div>
              <p>POSITION SUMMARY</p>
              <h2>Pozicijos santrauka</h2>
            </div>
          </div>

          <div className="etf-profile-summary-grid">
            <div>
              <span>Investuota</span>
              <strong>{formatCurrency(invested)}</strong>
            </div>

            <div>
              <span>Dabartinė vertė</span>
              <strong>{formatCurrency(value)}</strong>
            </div>

            <div>
              <span>Nerealizuotas pelnas</span>
              <strong className={profitClass}>
                {formatCurrency(profit)}
              </strong>
            </div>

            <div>
              <span>Vidutinė kaina</span>
              <strong>{formatCurrency(averageBuyPrice)}</strong>
            </div>

            <div>
              <span>Dabartinė kaina</span>
              <strong>{formatCurrency(currentPrice)}</strong>
            </div>

            <div>
              <span>Vienetų skaičius</span>
              <strong>{formatNumber(quantity, 4)}</strong>
            </div>
          </div>
        </article>

        <article className="etf-profile-card etf-profile-performance-card">
          <div className="etf-profile-card-heading etf-profile-card-heading-row">
            <div>
              <p>PERFORMANCE</p>
              <h2>Pozicijos vertės istorija</h2>
            </div>
            <div className="etf-profile-chart-total">
              <span>Dabartinė vertė</span>
              <strong>{formatCurrency(value)}</strong>
            </div>
          </div>

          <PerformanceChart history={history} />
        </article>
      </section>

      <section className="etf-profile-lower-grid">
        <article className="etf-profile-card etf-profile-transactions-card etf-profile-full-width">
          <div className="etf-profile-card-heading etf-profile-card-heading-row">
            <div>
              <p>TRANSACTIONS</p>
              <h2>Pirkimų ir pardavimų istorija</h2>
            </div>
            <span className="etf-profile-count-badge">
              {transactions.length} įrašai
            </span>
          </div>

          <TransactionsTable transactions={transactions} />
        </article>

        <article className="etf-profile-card">
          <div className="etf-profile-card-heading etf-profile-card-heading-row">
            <div>
              <p>DIVIDENDS</p>
              <h2>Dividendų istorija</h2>
            </div>
            <span className="etf-profile-count-badge">
              {formatCurrency(dividendIncome)}
            </span>
          </div>

          <DividendHistory
            dividends={dividends}
            legacyDividendTotal={position?.legacyDividendTotal}
          />
        </article>

        <article className="etf-profile-card etf-profile-timeline-card">
          <div className="etf-profile-card-heading etf-profile-card-heading-row">
            <div>
              <p>TIMELINE</p>
              <h2>Pozicijos laiko juosta</h2>
            </div>
            <span className="etf-profile-count-badge">
              {events.length} įvykiai
            </span>
          </div>

          <Timeline events={events} />
        </article>
      </section>
    </main>
  );
}

export default EtfProfile;
