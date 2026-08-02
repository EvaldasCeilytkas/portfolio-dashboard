import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { usePortfolioOwner } from "../context/PortfolioContext";

import platformRegistry from "../data/platforms.json";
import "../styles/p2p.css";

const P2P_SLUGS = Object.freeze([
  "profitus",
  "crowdpear",
  "nordstreet",
  "rontgen",
  "indemo",
  "afranga",
  "debitum",
  "income",
  "lande",
  "lendermarket",
  "loanch",
  "nectaro",
  "peerberry",
  "scramble",
  "viainvest",
]);

const OWNER_P2P_SLUGS = Object.freeze({
  evaldas: P2P_SLUGS,
  rima: Object.freeze([
    "profitus",
    "nordstreet",
    "indemo",
    "lendermarket",
    "scramble",
  ]),
});

const REAL_ESTATE_SLUGS = new Set([
  "profitus",
  "crowdpear",
  "nordstreet",
  "rontgen",
  "indemo",
]);

const PLATFORM_META = Object.freeze(
  Object.fromEntries(
    platformRegistry
      .filter((platform) => P2P_SLUGS.includes(platform.slug))
      .map((platform) => [platform.slug, platform]),
  ),
);

const RANGE_OPTIONS = Object.freeze([
  { id: "1m", label: "1M", months: 1 },
  { id: "3m", label: "3M", months: 3 },
  { id: "6m", label: "6M", months: 6 },
  { id: "ytd", label: "YTD", ytd: true },
  { id: "1y", label: "1Y", months: 12 },
  { id: "3y", label: "3Y", months: 36 },
  { id: "all", label: "Visas", months: null },
]);

const FILTER_OPTIONS = Object.freeze([
  { id: "all", label: "Visos platformos" },
  { id: "real_estate", label: "NT finansavimas" },
  { id: "p2p", label: "P2P paskolos" },
]);

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(number(value));
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value))} %`;
}

function formatDate(value, options = {}) {
  if (!value) return "–";

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: options.short ? "short" : "long",
    day: options.day === false ? undefined : "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatMonth(value) {
  if (!value) return "–";

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
  })
    .format(new Date(`${value}T12:00:00`))
    .replace(" m.", "");
}

function getPlatformType(slug) {
  return REAL_ESTATE_SLUGS.has(slug) ? "real_estate" : "p2p";
}

function getPlatformTypeLabel(slug) {
  return REAL_ESTATE_SLUGS.has(slug)
    ? "NT finansavimas"
    : "P2P paskolos";
}

function getInitials(name) {
  return String(name || "P")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function buildPlatformRows(platformHistory, slugs, ownerId = "evaldas") {
  const ownerName = ownerId === "rima" ? "Rima" : "Evaldas";

  return slugs.map((slug) => {
    const historyItem = platformHistory?.platforms?.[slug];
    const history = Array.isArray(historyItem?.history)
      ? historyItem.history
      : [];
    const latest = history.at(-1) || {};
    const previous = history.at(-2) || {};
    const currentProfit = number(latest.profit);
    const previousProfit = number(previous.profit);

    return {
      key: `${ownerId}:${slug}`,
      ownerId,
      ownerName,
      slug,
      name: historyItem?.name || PLATFORM_META[slug]?.name || slug,
      category: getPlatformTypeLabel(slug),
      type: getPlatformType(slug),
      date: latest.date || null,
      invested: number(latest.invested),
      value: number(latest.value),
      profit: currentProfit,
      returnRate: number(latest.returnRate),
      monthlyProfit: history.length > 1 ? currentProfit - previousProfit : currentProfit,
      history,
    };
  }).filter((platform) => platform.history.length > 0);
}

function mergeMonthlyHistories(histories) {
  const byDate = new Map();

  histories.forEach((history) => {
    (Array.isArray(history) ? history : []).forEach((item) => {
      if (!item?.date) return;
      const current = byDate.get(item.date) || {
        date: item.date,
        invested: 0,
        monthlyContribution: 0,
        value: 0,
        profit: 0,
        monthlyResult: 0,
      };
      current.invested += number(item.invested);
      current.monthlyContribution += number(item.monthlyContribution);
      current.value += number(item.value);
      current.profit += number(item.profit);
      current.monthlyResult += number(item.monthlyResult);
      byDate.set(item.date, current);
    });
  });

  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      returnRate: item.invested > 0 ? (item.profit / item.invested) * 100 : 0,
    }));
}

function OwnerBadge({ platform }) {
  if (!platform?.showOwner || !platform?.ownerName) return null;
  return (
    <span className={`p2p-owner-badge is-${platform.ownerId}`}>
      {platform.ownerName}
    </span>
  );
}

function RangeButtons({ value, onChange }) {
  return (
    <div className="p2p-range-tabs" aria-label="Grafiko laikotarpis">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={value === option.id ? "is-active" : ""}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function PortfolioHistoryChart({ history, range, onRangeChange }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const selectedOption = RANGE_OPTIONS.find((option) => option.id === range);
  const latestHistoryItem = history.at(-1);
  const latestYear = latestHistoryItem?.date
    ? new Date(`${latestHistoryItem.date}T12:00:00`).getFullYear()
    : null;

  const visibleHistory = selectedOption?.ytd
    ? history.filter((item) =>
        new Date(`${item.date}T12:00:00`).getFullYear() === latestYear,
      )
    : selectedOption?.months
      ? history.slice(-(selectedOption.months + 1))
      : history;

  const firstVisibleItem = visibleHistory[0] || {};
  const lastVisibleItem = visibleHistory.at(-1) || {};
  const periodChange = number(lastVisibleItem.value) - number(firstVisibleItem.value);
  const periodChangePercent = number(firstVisibleItem.value) > 0
    ? (periodChange / number(firstVisibleItem.value)) * 100
    : 0;

  const width = 920;
  const height = 310;
  const padding = { top: 24, right: 26, bottom: 48, left: 68 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const values = visibleHistory.flatMap((item) => [
    number(item.value),
    number(item.invested),
  ]);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const spread = Math.max(maxValue - minValue, 1);
  const chartMin = Math.max(0, minValue - spread * 0.12);
  const chartMax = maxValue + spread * 0.12;
  const chartSpread = chartMax - chartMin;

  const point = (item, index, key) => {
    const x =
      visibleHistory.length <= 1
        ? padding.left + plotWidth / 2
        : padding.left + (index / (visibleHistory.length - 1)) * plotWidth;
    const y =
      padding.top +
      plotHeight -
      ((number(item[key]) - chartMin) / chartSpread) * plotHeight;

    return { x, y };
  };

  const valuePoints = visibleHistory.map((item, index) =>
    point(item, index, "value"),
  );
  const investedPoints = visibleHistory.map((item, index) =>
    point(item, index, "invested"),
  );
  const valuePath = valuePoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const investedPath = investedPoints.map(({ x, y }) => `${x},${y}`).join(" ");
  const areaPath = valuePoints.length
    ? `${padding.left},${padding.top + plotHeight} ${valuePath} ${valuePoints.at(-1).x},${padding.top + plotHeight}`
    : "";
  const yTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return {
      y: padding.top + plotHeight * ratio,
      value: chartMax - chartSpread * ratio,
    };
  });
  const labelStep = Math.max(1, Math.ceil(visibleHistory.length / 6));
  const hoveredItem = hoveredIndex === null ? null : visibleHistory[hoveredIndex];
  const hoveredPoint = hoveredIndex === null ? null : valuePoints[hoveredIndex];

  return (
    <section className="p2p-card p2p-history-card">
      <header className="p2p-card-header p2p-history-header">
        <div className="p2p-history-heading">
          <p className="p2p-card-eyebrow">Portfelio dinamika</p>
          <h2>P2P vertės pokytis</h2>
          <p>Vertės ir investuoto kapitalo pokytis pagal pasirinktą laikotarpį.</p>

          <div className="p2p-period-result">
            <strong className={periodChange < 0 ? "p2p-negative" : "p2p-positive"}>
              {periodChange >= 0 ? "+" : ""}{formatCurrency(periodChange)}
            </strong>
            <span className={periodChangePercent < 0 ? "p2p-negative" : "p2p-positive"}>
              {periodChangePercent >= 0 ? "▲" : "▼"} {formatPercent(Math.abs(periodChangePercent))}
            </span>
          </div>
        </div>

        <div className="p2p-history-controls">
          <RangeButtons value={range} onChange={onRangeChange} />
          <div className="p2p-history-current">
            <span>Dabartinė vertė</span>
            <strong>{formatCurrency(lastVisibleItem.value)}</strong>
            <b className={periodChangePercent < 0 ? "p2p-negative" : "p2p-positive"}>
              {periodChangePercent >= 0 ? "▲" : "▼"} {periodChangePercent >= 0 ? "+" : "−"}{formatPercent(Math.abs(periodChangePercent))}
            </b>
          </div>
        </div>
      </header>

      <div className="p2p-chart-legend">
        <span><i className="p2p-legend-value" />Dabartinė vertė</span>
        <span><i className="p2p-legend-invested" />Investuota</span>
      </div>

      <div className="p2p-line-chart-scroll">
        <div className="p2p-line-chart-wrap">
          <svg
            className="p2p-line-chart"
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="P2P portfelio vertės istorijos grafikas"
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <defs>
              <linearGradient id="p2pValueArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#56e7c3" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#56e7c3" stopOpacity="0" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => (
              <g key={tick.y}>
                <line
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={tick.y}
                  y2={tick.y}
                  className="p2p-grid-line"
                />
                <text x={padding.left - 12} y={tick.y + 4} textAnchor="end">
                  {new Intl.NumberFormat("lt-LT", {
                    notation: "compact",
                    maximumFractionDigits: 1,
                  }).format(tick.value)}
                </text>
              </g>
            ))}

            {areaPath && <polygon points={areaPath} fill="url(#p2pValueArea)" />}
            <polyline points={investedPath} className="p2p-line-invested" />
            <polyline points={valuePath} className="p2p-line-value" />

            {valuePoints.map((item, index) => (
              <g
                key={visibleHistory[index].date}
                className="p2p-chart-point"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseMove={() => setHoveredIndex(index)}
              >
                {hoveredIndex === index && (
                  <line
                    x1={item.x}
                    x2={item.x}
                    y1={padding.top}
                    y2={padding.top + plotHeight}
                    className="p2p-hover-line"
                  />
                )}
                <circle cx={item.x} cy={item.y} r="22" className="p2p-point-hit" />
              </g>
            ))}

            {visibleHistory.map((item, index) => {
              const showLabel =
                index === 0 ||
                index === visibleHistory.length - 1 ||
                index % labelStep === 0;
              if (!showLabel) return null;
              const { x } = point(item, index, "value");

              return (
                <text
                  key={`label-${item.date}`}
                  x={x}
                  y={height - 17}
                  textAnchor="middle"
                >
                  {formatMonth(item.date)}
                </text>
              );
            })}
          </svg>

          {hoveredItem && hoveredPoint && (
            <div
              className={`p2p-chart-tooltip ${
                hoveredPoint.x < width * 0.22
                  ? "is-left-edge"
                  : hoveredPoint.x > width * 0.78
                    ? "is-right-edge"
                    : ""
              }`}
              style={{
                left: `${(hoveredPoint.x / width) * 100}%`,
              }}
            >
              <strong>{formatDate(hoveredItem.date, { day: false })}</strong>
              <span><i className="is-invested" />Investuota <b>{formatCurrency(hoveredItem.invested)}</b></span>
              <span><i className="is-value" />Dabartinė vertė <b>{formatCurrency(hoveredItem.value)}</b></span>
              <span><i className="is-profit" />Pelnas <b className={number(hoveredItem.profit) < 0 ? "p2p-negative" : "p2p-positive"}>{formatCurrency(hoveredItem.profit)}</b></span>
              <span><i className="is-return" />Grąža <b>{formatPercent(hoveredItem.returnRate)}</b></span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function AllocationPanel({ platforms, totalValue }) {
  const sorted = [...platforms].sort((a, b) => b.value - a.value);
  const largestShare = sorted[0]?.value || 1;

  return (
    <section className="p2p-card p2p-allocation-card">
      <header className="p2p-card-header">
        <div>
          <p className="p2p-card-eyebrow">Diversifikacija</p>
          <h2>Platformų pasiskirstymas</h2>
          <p>Aktyvios vertės dalis bendrame P2P portfelyje.</p>
        </div>
        <div className="p2p-card-total">
          <span>Visa vertė</span>
          <strong>{formatCurrency(totalValue, 0)}</strong>
        </div>
      </header>

      <div className="p2p-allocation-list">
        {sorted.map((platform) => {
          const share = totalValue > 0 ? (platform.value / totalValue) * 100 : 0;
          return (
            <Link
              key={platform.key || platform.slug}
              to={`/platforms/${platform.slug}`}
              onClick={() => platform.onOpen?.()}
              className="p2p-allocation-row"
            >
              <span className="p2p-platform-avatar">
                {getInitials(platform.name)}
              </span>
              <span className="p2p-allocation-main">
                <span className="p2p-allocation-copy">
                  <strong>{platform.name} <OwnerBadge platform={platform} /></strong>
                  <small>{formatCurrency(platform.value)}</small>
                </span>
                <span className="p2p-share-track">
                  <i style={{ width: `${(platform.value / largestShare) * 100}%` }} />
                </span>
              </span>
              <strong className="p2p-allocation-share">{formatPercent(share)}</strong>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getPlatformMonthResult(platform, selectedDate) {
  const history = Array.isArray(platform.history) ? platform.history : [];
  const index = history.findIndex((item) => item.date === selectedDate);

  if (index < 0) {
    return { ...platform, monthlyProfit: 0, hasData: false };
  }

  const current = history[index];
  const previous = index > 0 ? history[index - 1] : null;
  const monthlyProfit = previous
    ? number(current.profit) - number(previous.profit)
    : number(current.profit);

  return {
    ...platform,
    value: number(current.value),
    invested: number(current.invested),
    profit: number(current.profit),
    returnRate: number(current.returnRate),
    monthlyProfit,
    hasData: true,
  };
}

function MonthlyProfitPanel({ platforms, selectedDate, availableDates, onDateChange }) {
  const monthPlatforms = platforms
    .map((platform) => getPlatformMonthResult(platform, selectedDate))
    .filter((platform) => platform.hasData);
  const sorted = [...monthPlatforms].sort((a, b) => b.monthlyProfit - a.monthlyProfit);
  const largest = Math.max(...sorted.map((platform) => Math.abs(platform.monthlyProfit)), 1);
  const total = sorted.reduce((sum, platform) => sum + platform.monthlyProfit, 0);

  return (
    <section className="p2p-card p2p-monthly-card">
      <header className="p2p-card-header p2p-monthly-header">
        <div>
          <p className="p2p-card-eyebrow">Mėnesio pajamos</p>
          <h2>Platformų mėnesio rezultatas</h2>
          <p>{formatDate(selectedDate, { day: false })} pelno pasiskirstymas.</p>
        </div>
        <div className="p2p-monthly-controls">
          <label className="p2p-month-select-label">
            <span>Pasirinkite mėnesį</span>
            <select value={selectedDate} onChange={(event) => onDateChange(event.target.value)}>
              {[...availableDates].reverse().map((date) => (
                <option key={date} value={date}>{date.slice(0, 7)}</option>
              ))}
            </select>
          </label>
          <div className={`p2p-card-total ${total < 0 ? "is-negative" : "is-positive"}`}>
            <span>Iš viso</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>
      </header>

      <div className="p2p-profit-list">
        {sorted.map((platform) => (
          <Link
            key={platform.key || platform.slug}
            to={`/platforms/${platform.slug}`}
            onClick={() => platform.onOpen?.()}
            className="p2p-profit-row"
          >
            <span className="p2p-profit-name">{platform.name} <OwnerBadge platform={platform} /></span>
            <span className="p2p-profit-track">
              <i
                className={platform.monthlyProfit < 0 ? "is-negative" : ""}
                style={{ width: `${Math.max((Math.abs(platform.monthlyProfit) / largest) * 100, 1)}%` }}
              />
            </span>
            <strong className={platform.monthlyProfit < 0 ? "p2p-negative" : "p2p-positive"}>
              {formatCurrency(platform.monthlyProfit)}
            </strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

const PIE_COLORS = Object.freeze([
  "#56e7c3", "#4d92e8", "#8b7cf6", "#f0b84b", "#f47d69",
  "#4bc0c8", "#9ccc65", "#cf6fd8", "#ff9f43", "#5c7cfa",
  "#7fd1b9", "#e86a92", "#6d9dc5", "#c7a76c", "#72b7b2",
]);

function PlatformPieChart({ platforms, totalValue }) {
  const [hoveredPlatform, setHoveredPlatform] = useState(null);
  const [activePlatformSlug, setActivePlatformSlug] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const sorted = [...platforms].sort((a, b) => b.value - a.value);
  let cursor = 0;
  const segments = sorted.map((platform, index) => {
    const share = totalValue > 0 ? (platform.value / totalValue) * 100 : 0;
    const start = cursor;
    cursor += share;
    return {
      ...platform,
      share,
      start,
      end: cursor,
      color: PIE_COLORS[index % PIE_COLORS.length],
    };
  });

  function handleSegmentMove(event, platform) {
    const bounds = event.currentTarget.ownerSVGElement.getBoundingClientRect();
    setHoveredPlatform(platform);
    setActivePlatformSlug(platform.key || platform.slug);
    setTooltipPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
  }

  return (
    <section className="p2p-card p2p-pie-card">
      <header className="p2p-card-header">
        <div>
          <p className="p2p-card-eyebrow">Portfelio struktūra</p>
          <h2>Visų platformų skritulinė diagrama</h2>
          <p>Užveskite pelę ant segmento – matysite platformos rezultatą.</p>
        </div>
        <div className="p2p-card-total">
          <span>Visa vertė</span>
          <strong>{formatCurrency(totalValue, 0)}</strong>
        </div>
      </header>

      <div className="p2p-pie-layout">
        <div
          className="p2p-donut-wrap"
          onMouseLeave={() => {
            setHoveredPlatform(null);
            setActivePlatformSlug(null);
          }}
        >
          <svg
            className="p2p-donut-svg"
            viewBox="0 0 200 200"
            role="img"
            aria-label="P2P ir NT platformų pasiskirstymas"
          >
            <circle className="p2p-donut-track" cx="100" cy="100" r="72" />
            {segments.map((platform) => (
              <circle
                key={platform.key || platform.slug}
                className={`p2p-donut-segment ${
                  activePlatformSlug === (platform.key || platform.slug) ? "is-hovered" : ""
                } ${activePlatformSlug && activePlatformSlug !== (platform.key || platform.slug) ? "is-dimmed" : ""}`}
                cx="100"
                cy="100"
                r="72"
                pathLength="100"
                stroke={platform.color}
                strokeDasharray={`${platform.share} ${100 - platform.share}`}
                strokeDashoffset={-platform.start}
                onMouseEnter={(event) => handleSegmentMove(event, platform)}
                onMouseMove={(event) => handleSegmentMove(event, platform)}
              />
            ))}
          </svg>

          <div className="p2p-donut-center">
            <span>Platformos</span>
            <strong>{segments.length}</strong>
            <small>{formatCurrency(totalValue, 0)}</small>
          </div>

          {hoveredPlatform && (
            <div
              className={`p2p-pie-tooltip ${
                tooltipPosition.x < 150
                  ? "is-left-edge"
                  : tooltipPosition.x > 250
                    ? "is-right-edge"
                    : ""
              } ${tooltipPosition.y < 120 ? "is-below" : ""}`}
              style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
            >
              <strong>{hoveredPlatform.name}</strong>
              <span>Dabartinė vertė <b>{formatCurrency(hoveredPlatform.value)}</b></span>
              <span>Investuota <b>{formatCurrency(hoveredPlatform.invested)}</b></span>
              <span>Pelnas <b className={hoveredPlatform.profit < 0 ? "p2p-negative" : "p2p-positive"}>{formatCurrency(hoveredPlatform.profit)}</b></span>
              <span>Grąža <b>{formatPercent(hoveredPlatform.returnRate)}</b></span>
              <span>Portfelio dalis <b>{formatPercent(hoveredPlatform.share)}</b></span>
            </div>
          )}
        </div>

        <div className="p2p-pie-legend">
          {segments.map((platform) => (
            <Link
              key={platform.key || platform.slug}
              to={`/platforms/${platform.slug}`}
              onClick={() => platform.onOpen?.()}
              className={`p2p-pie-legend-row ${
                activePlatformSlug === (platform.key || platform.slug) ? "is-active" : ""
              } ${activePlatformSlug && activePlatformSlug !== (platform.key || platform.slug) ? "is-dimmed" : ""}`}
              onMouseEnter={() => {
                setHoveredPlatform(null);
                setActivePlatformSlug(platform.key || platform.slug);
              }}
              onMouseLeave={() => setActivePlatformSlug(null)}
            >
              <i style={{ background: platform.color }} />
              <span>{platform.name} <OwnerBadge platform={platform} /></span>
              <small>{formatCurrency(platform.value)}</small>
              <strong>{formatPercent(platform.share)}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlatformsTable({ platforms, filter, onFilterChange, totalValue, selectedDate }) {
  const filtered = platforms
    .filter((platform) => filter === "all" || platform.type === filter)
    .sort((a, b) => b.value - a.value);

  return (
    <section className="p2p-card p2p-platforms-card">
      <header className="p2p-card-header p2p-table-card-header">
        <div>
          <p className="p2p-card-eyebrow">Platformų analizė</p>
          <h2>P2P ir NT platformos</h2>
          <p>Visos platformos vienoje vietoje, surūšiuotos pagal dabartinę vertę.</p>
        </div>
        <div className="p2p-filter-tabs" aria-label="Platformų filtras">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={filter === option.id ? "is-active" : ""}
              onClick={() => onFilterChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p2p-platform-table">
        <div className="p2p-table-head">
          <span>Platforma</span>
          <span>Vertė</span>
          <span>Investuota</span>
          <span>Pelnas</span>
          <span>Šį mėnesį</span>
          <span>Grąža</span>
          <span>Dalis</span>
        </div>

        {filtered.map((platform) => {
          const share = totalValue > 0 ? (platform.value / totalValue) * 100 : 0;
          const monthResult = getPlatformMonthResult(platform, selectedDate);
          const monthIndex = platform.history.findIndex((item) => item.date === selectedDate);
          const previousMonth = monthIndex > 0 ? platform.history[monthIndex - 1] : null;
          const valueChange = previousMonth ? monthResult.value - number(previousMonth.value) : 0;
          const trendClass = valueChange > 0.005 ? "is-up" : valueChange < -0.005 ? "is-down" : "is-flat";
          const trendSymbol = valueChange > 0.005 ? "↗" : valueChange < -0.005 ? "↘" : "→";
          return (
            <Link
              key={platform.key || platform.slug}
              to={`/platforms/${platform.slug}`}
              onClick={() => platform.onOpen?.()}
              className="p2p-table-row"
            >
              <span className="p2p-table-platform">
                <span className="p2p-platform-avatar">
                  {getInitials(platform.name)}
                </span>
                <span>
                  <strong>{platform.name} <OwnerBadge platform={platform} /></strong>
                  <small>{platform.category}</small>
                </span>
              </span>
              <strong>{formatCurrency(platform.value)}</strong>
              <span>{formatCurrency(platform.invested)}</span>
              <strong className={platform.profit < 0 ? "p2p-negative" : "p2p-positive"}>
                {formatCurrency(platform.profit)}
              </strong>
              <span className={`p2p-month-cell ${monthResult.monthlyProfit < 0 ? "p2p-negative" : "p2p-positive"}`}>
                <i className={`p2p-trend ${trendClass}`}>{trendSymbol}</i>
                <strong>{formatCurrency(monthResult.monthlyProfit)}</strong>
              </span>
              <span>{formatPercent(platform.returnRate)}</span>
              <span className="p2p-share-cell">
                <strong>{formatPercent(share)}</strong>
                <span className="p2p-share-track"><i style={{ width: `${share}%` }} /></span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TopPlatformHighlights({ platforms, selectedDate, totalValue }) {
  const withMonth = platforms.map((platform) => getPlatformMonthResult(platform, selectedDate));
  const bestRoi = [...platforms].sort((a, b) => b.returnRate - a.returnRate)[0];
  const bestMonth = [...withMonth].sort((a, b) => b.monthlyProfit - a.monthlyProfit)[0];
  const largest = [...platforms].sort((a, b) => b.value - a.value)[0];

  const cards = [
    { label: "Didžiausia grąža", platform: bestRoi, value: bestRoi ? formatPercent(bestRoi.returnRate) : "–", icon: "🥇" },
    { label: "Didžiausias mėnesio pelnas", platform: bestMonth, value: bestMonth ? formatCurrency(bestMonth.monthlyProfit) : "–", icon: "★" },
    { label: "Didžiausia portfelio dalis", platform: largest, value: largest && totalValue > 0 ? formatPercent((largest.value / totalValue) * 100) : "–", icon: "◉" },
  ];

  return (
    <section className="p2p-top-highlights">
      {cards.map((card) => card.platform && (
        <Link key={card.label} to={`/platforms/${card.platform.slug}`} onClick={() => card.platform.onOpen?.()} className="p2p-top-card">
          <span className="p2p-top-icon">{card.icon}</span>
          <span className="p2p-top-copy">
            <small>{card.label}</small>
            <strong>{card.platform.name} <OwnerBadge platform={card.platform} /></strong>
          </span>
          <b>{card.value}</b>
          <i>→</i>
        </Link>
      ))}
    </section>
  );
}

function OwnerP2PPage() {
  const { ownerId, dataPath, selectOwner } = usePortfolioOwner();
  const ownerSlugs = OWNER_P2P_SLUGS[ownerId] || [];
  const [p2pHistory, setP2pHistory] = useState(null);
  const [platformHistory, setPlatformHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [range, setRange] = useState("1y");
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loanStats, setLoanStats] = useState({ active: 0, delayed: 0 });

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [p2pResponse, platformResponse] = await Promise.all([
          fetch(dataPath("p2p_history.json"), { cache: "no-store" }),
          fetch(dataPath("platform_history.json"), { cache: "no-store" }),
        ]);

        if (!p2pResponse.ok || !platformResponse.ok) {
          throw new Error("Nepavyko įkelti P2P istorijos duomenų.");
        }

        const [p2pPayload, platformPayload] = await Promise.all([
          p2pResponse.json(),
          platformResponse.json(),
        ]);

        const platformPayloads = await Promise.all(
          ownerSlugs.map(async (slug) => {
            try {
              const response = await fetch(dataPath(`platforms/${slug}.json`), { cache: "no-store" });
              return response.ok ? response.json() : null;
            } catch {
              return null;
            }
          }),
        );

        const counts = platformPayloads.reduce(
          (result, payload) => {
            result.active += number(payload?.summary?.activeInvestments);
            result.delayed += number(payload?.summary?.delayedInvestments);
            return result;
          },
          { active: 0, delayed: 0 },
        );

        if (active) {
          setP2pHistory(p2pPayload);
          setPlatformHistory(platformPayload);
          setLoanStats(counts);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Įvyko nežinoma klaida.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [ownerId, dataPath]);

  const platforms = useMemo(
    () => buildPlatformRows(platformHistory, ownerSlugs, ownerId).map((platform) => ({
      ...platform,
      onOpen: () => selectOwner(ownerId),
    })),
    [platformHistory, ownerId, selectOwner],
  );

  if (loading) {
    return (
      <main className="p2p-page">
        <section className="p2p-state">
          <span className="p2p-loader" />
          <h2>Kraunami P2P duomenys...</h2>
        </section>
      </main>
    );
  }

  if (errorMessage || !p2pHistory) {
    return (
      <main className="p2p-page">
        <section className="p2p-state p2p-state-error">
          <h2>Nepavyko atidaryti P2P puslapio</h2>
          <p>{errorMessage || "P2P istorijos duomenų nėra."}</p>
        </section>
      </main>
    );
  }

  const latest = p2pHistory.latest || {};
  const history = Array.isArray(p2pHistory.history) ? p2pHistory.history : [];
  const totalValue = number(latest.value);
  const activePlatforms = platforms.filter((platform) => platform.value > 0);
  const realEstateValue = activePlatforms
    .filter((platform) => platform.type === "real_estate")
    .reduce((sum, platform) => sum + platform.value, 0);
  const p2pValue = activePlatforms
    .filter((platform) => platform.type === "p2p")
    .reduce((sum, platform) => sum + platform.value, 0);
  const availableDates = history.map((item) => item.date).filter(Boolean);
  const effectiveMonth = selectedMonth || latest.date || availableDates.at(-1) || "";

  return (
    <main className="p2p-page" data-testid="p2p-page">
      <section className="p2p-hero">
        <div className="p2p-hero-main">
          <div className="p2p-hero-badges">
            <span className="p2p-eyebrow">{ownerId === "rima" ? "Rimos P2P portfolio overview" : "P2P portfolio overview"}</span>
            <span className="p2p-status-badge"><i />Portfelis aktyvus</span>
          </div>
          <h1>P2P investicijų portfelis</h1>
          <p className="p2p-hero-label">Dabartinė vertė</p>
          <strong className="p2p-hero-value">{formatCurrency(latest.value)}</strong>
          <div className="p2p-hero-result">
            <span>{formatPercent(latest.returnRate)}</span>
            <p><strong>{formatCurrency(latest.profit)}</strong> bendras rezultatas</p>
          </div>
        </div>

        <div className="p2p-hero-stats">
          <article>
            <span>Investuota</span>
            <strong>{formatCurrency(latest.invested)}</strong>
            <small>Aktyvus investuotas kapitalas</small>
          </article>
          <article>
            <span>Pelnas</span>
            <strong className="p2p-positive">{formatCurrency(latest.profit)}</strong>
            <small>Bendras P2P portfelio rezultatas</small>
          </article>
          <article className="p2p-updated-card">
            <span>Atnaujinta</span>
            <strong>{formatDate(latest.date)}</strong>
            <small>Pagal istorinį Excel failą</small>
          </article>
          <article className="p2p-loan-status-card">
            <span>Paskolų būklė</span>
            <div className="p2p-loan-status-values">
              <span><strong>{loanStats.active}</strong><small>Aktyvios</small></span>
              <span><strong className={loanStats.delayed > 0 ? "p2p-warning" : ""}>{loanStats.delayed}</strong><small>Vėluojančios</small></span>
            </div>
            <small>{activePlatforms.length} aktyvių platformų</small>
          </article>
        </div>
      </section>

      <section className="p2p-metrics-grid">
        <article className="p2p-metric-card p2p-metric-result">
          <span className="p2p-metric-label">Paskutinio mėnesio rezultatas</span>
          <strong className={`p2p-metric-value ${number(latest.monthlyResult) < 0 ? "p2p-negative" : "p2p-positive"}`}>
            {formatCurrency(latest.monthlyResult)}
          </strong>
          <span className="p2p-metric-description">Pokytis pagal paskutinį istorijos įrašą</span>
        </article>
        <article className="p2p-metric-card p2p-metric-contribution">
          <span className="p2p-metric-label">Paskutinio mėnesio įnašas</span>
          <strong className="p2p-metric-value">{formatCurrency(latest.monthlyContribution)}</strong>
          <span className="p2p-metric-description">Papildomai investuotas kapitalas</span>
        </article>
        <article className="p2p-metric-card p2p-metric-real-estate">
          <span className="p2p-metric-label">NT finansavimas</span>
          <strong className="p2p-metric-value">{formatCurrency(realEstateValue)}</strong>
          <span className="p2p-metric-description">{ownerId === "rima" ? "Profitus, Nordstreet ir Indemo" : "Profitus, Crowdpear, Nordstreet, Röntgen ir Indemo"}</span>
        </article>
        <article className="p2p-metric-card p2p-metric-loans">
          <span className="p2p-metric-label">P2P paskolos</span>
          <strong className="p2p-metric-value">{formatCurrency(p2pValue)}</strong>
          <span className="p2p-metric-description">Vartojimo, verslo ir žemės ūkio paskolos</span>
        </article>
      </section>

      <PortfolioHistoryChart history={history} range={range} onRangeChange={setRange} />

      <section className="p2p-primary-grid">
        <AllocationPanel platforms={activePlatforms} totalValue={totalValue} />
        <MonthlyProfitPanel
          platforms={platforms}
          selectedDate={effectiveMonth}
          availableDates={availableDates}
          onDateChange={setSelectedMonth}
        />
      </section>

      <PlatformPieChart platforms={activePlatforms} totalValue={totalValue} />

      <PlatformsTable
        platforms={activePlatforms}
        filter={filter}
        onFilterChange={setFilter}
        totalValue={totalValue}
        selectedDate={effectiveMonth}
      />

      <TopPlatformHighlights
        platforms={activePlatforms}
        selectedDate={effectiveMonth}
        totalValue={totalValue}
      />
    </main>
  );
}

function FamilyP2PPage() {
  const { selectOwner } = usePortfolioOwner();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [range, setRange] = useState("1y");
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    let active = true;

    async function readJson(path, required = true) {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${path}`, { cache: "no-store" });
      if (!response.ok) {
        if (!required) return null;
        throw new Error(`Nepavyko įkelti ${path}.`);
      }
      return response.json();
    }

    async function loadFamilyData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [evaldasP2P, rimaP2P, evaldasPlatforms, rimaPlatforms] = await Promise.all([
          readJson("p2p_history.json"),
          readJson("rima/p2p_history.json"),
          readJson("platform_history.json"),
          readJson("rima/platform_history.json"),
        ]);

        const ownerConfigs = [
          { ownerId: "evaldas", ownerName: "Evaldas", folder: "", slugs: OWNER_P2P_SLUGS.evaldas },
          { ownerId: "rima", ownerName: "Rima", folder: "rima/", slugs: OWNER_P2P_SLUGS.rima },
        ];

        const ownerResults = await Promise.all(ownerConfigs.map(async (config) => {
          const platformHistory = config.ownerId === "evaldas" ? evaldasPlatforms : rimaPlatforms;
          const rows = buildPlatformRows(platformHistory, config.slugs, config.ownerId).map((platform) => ({
            ...platform,
            showOwner: true,
            onOpen: () => selectOwner(config.ownerId),
          }));
          const details = await Promise.all(config.slugs.map(async (slug) => {
            try {
              return await readJson(`${config.folder}platforms/${slug}.json`, false);
            } catch {
              return null;
            }
          }));
          const stats = details.reduce((sum, item) => ({
            active: sum.active + number(item?.summary?.activeInvestments),
            delayed: sum.delayed + number(item?.summary?.delayedInvestments),
            completed: sum.completed + number(item?.summary?.completedInvestments),
            total: sum.total + number(item?.summary?.totalInvestments || item?.summary?.investmentsCount),
          }), { active: 0, delayed: 0, completed: 0, total: 0 });
          return { ...config, rows, stats };
        }));

        const history = mergeMonthlyHistories([
          evaldasP2P?.history,
          rimaP2P?.history,
        ]);
        const latest = history.at(-1) || {};
        const previous = history.at(-2) || {};
        const combined = {
          history,
          latest: {
            ...latest,
            monthlyResult: number(latest.profit) - number(previous.profit),
            monthlyContribution: number(latest.invested) - number(previous.invested),
          },
          platforms: ownerResults.flatMap((item) => item.rows),
          owners: ownerResults,
        };

        if (active) setPayload(combined);
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : "Įvyko nežinoma klaida.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFamilyData();
    return () => { active = false; };
  }, [selectOwner]);

  if (loading) {
    return <main className="p2p-page"><section className="p2p-state"><span className="p2p-loader" /><h2>Kraunami šeimos P2P duomenys...</h2></section></main>;
  }

  if (errorMessage || !payload) {
    return <main className="p2p-page"><section className="p2p-state p2p-state-error"><h2>Nepavyko atidaryti šeimos P2P puslapio</h2><p>{errorMessage}</p></section></main>;
  }

  const { history, latest, platforms, owners } = payload;
  const activePlatforms = platforms.filter((platform) => platform.value > 0);
  const totalValue = number(latest.value);
  const realEstateValue = activePlatforms.filter((platform) => platform.type === "real_estate").reduce((sum, platform) => sum + platform.value, 0);
  const p2pValue = activePlatforms.filter((platform) => platform.type === "p2p").reduce((sum, platform) => sum + platform.value, 0);
  const availableDates = history.map((item) => item.date).filter(Boolean);
  const effectiveMonth = selectedMonth || latest.date || availableDates.at(-1) || "";
  const familyStats = owners.reduce((sum, owner) => ({
    active: sum.active + owner.stats.active,
    delayed: sum.delayed + owner.stats.delayed,
    completed: sum.completed + owner.stats.completed,
    total: sum.total + owner.stats.total,
  }), { active: 0, delayed: 0, completed: 0, total: 0 });

  return (
    <main className="p2p-page family-p2p-page" data-testid="family-p2p-page">
      <section className="p2p-hero">
        <div className="p2p-hero-main">
          <div className="p2p-hero-badges"><span className="p2p-eyebrow">Family P2P portfolio overview</span><span className="p2p-status-badge"><i />Abu portfeliai aktyvūs</span></div>
          <h1>Šeimos P2P investicijų portfelis</h1>
          <p className="p2p-hero-label">Bendra dabartinė vertė</p>
          <strong className="p2p-hero-value">{formatCurrency(latest.value)}</strong>
          <div className="p2p-hero-result"><span>{formatPercent(latest.returnRate)}</span><p><strong>{formatCurrency(latest.profit)}</strong> bendras rezultatas</p></div>
        </div>
        <div className="p2p-hero-stats">
          <article><span>Investuota</span><strong>{formatCurrency(latest.invested)}</strong><small>Bendras aktyvus kapitalas</small></article>
          <article><span>Pelnas</span><strong className="p2p-positive">{formatCurrency(latest.profit)}</strong><small>Abiejų portfelių rezultatas</small></article>
          <article className="p2p-updated-card"><span>Atnaujinta</span><strong>{formatDate(latest.date)}</strong><small>Pagal abu istorinius failus</small></article>
          <article className="p2p-loan-status-card"><span>Investicijų būklė</span><div className="p2p-loan-status-values"><span><strong>{familyStats.active}</strong><small>Aktyvios</small></span><span><strong className={familyStats.delayed > 0 ? "p2p-warning" : ""}>{familyStats.delayed}</strong><small>Vėluojančios</small></span></div><small>{activePlatforms.length} aktyvių platformų</small></article>
        </div>
      </section>

      <section className="p2p-metrics-grid">
        <article className="p2p-metric-card p2p-metric-result"><span className="p2p-metric-label">Paskutinio mėnesio rezultatas</span><strong className={`p2p-metric-value ${number(latest.monthlyResult) < 0 ? "p2p-negative" : "p2p-positive"}`}>{formatCurrency(latest.monthlyResult)}</strong><span className="p2p-metric-description">Bendras mėnesio pelno pokytis</span></article>
        <article className="p2p-metric-card p2p-metric-contribution"><span className="p2p-metric-label">Paskutinio mėnesio įnašas</span><strong className="p2p-metric-value">{formatCurrency(latest.monthlyContribution)}</strong><span className="p2p-metric-description">Abiejų portfelių įnašai</span></article>
        <article className="p2p-metric-card p2p-metric-real-estate"><span className="p2p-metric-label">NT finansavimas</span><strong className="p2p-metric-value">{formatCurrency(realEstateValue)}</strong><span className="p2p-metric-description">NT ir NPL projektai</span></article>
        <article className="p2p-metric-card p2p-metric-loans"><span className="p2p-metric-label">P2P paskolos</span><strong className="p2p-metric-value">{formatCurrency(p2pValue)}</strong><span className="p2p-metric-description">Vartojimo, verslo ir žemės ūkio paskolos</span></article>
      </section>

      <section className="p2p-card family-p2p-summary-card">
        <header className="p2p-card-header"><div><p className="p2p-card-eyebrow">Šeimos suvestinė</p><h2>P2P portfeliai pagal savininką</h2><p>Platformų ir investicijų būklės palyginimas.</p></div></header>
        <div className="family-p2p-summary-table">
          <div className="family-p2p-summary-row is-head"><span>Rodiklis</span><strong>Evaldas</strong><strong>Rima</strong><strong>Šeima</strong></div>
          {[
            ["Platformos", owners[0].rows.filter((p) => p.value > 0).length, owners[1].rows.filter((p) => p.value > 0).length, activePlatforms.length],
            ["Aktyvios investicijos", owners[0].stats.active, owners[1].stats.active, familyStats.active],
            ["Vėluojančios", owners[0].stats.delayed, owners[1].stats.delayed, familyStats.delayed],
            ["Užbaigtos", owners[0].stats.completed, owners[1].stats.completed, familyStats.completed],
          ].map(([label, evaldas, rima, family]) => <div className="family-p2p-summary-row" key={label}><span>{label}</span><strong>{evaldas}</strong><strong>{rima}</strong><strong>{family}</strong></div>)}
        </div>
      </section>

      <PortfolioHistoryChart history={history} range={range} onRangeChange={setRange} />
      <section className="p2p-primary-grid"><AllocationPanel platforms={activePlatforms} totalValue={totalValue} /><MonthlyProfitPanel platforms={platforms} selectedDate={effectiveMonth} availableDates={availableDates} onDateChange={setSelectedMonth} /></section>
      <PlatformPieChart platforms={activePlatforms} totalValue={totalValue} />
      <PlatformsTable platforms={activePlatforms} filter={filter} onFilterChange={setFilter} totalValue={totalValue} selectedDate={effectiveMonth} />
      <TopPlatformHighlights platforms={activePlatforms} selectedDate={effectiveMonth} totalValue={totalValue} />
    </main>
  );
}

function P2PPage() {
  const { ownerId } = usePortfolioOwner();
  return ownerId === "family" ? <FamilyP2PPage /> : <OwnerP2PPage />;
}

export default P2PPage;
