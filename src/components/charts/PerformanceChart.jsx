import { useMemo, useRef, useState } from "react";

import "../../styles/performancechart.css";

const PERIODS = [
  { key: "1M", label: "1M", months: 1 },
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "YTD", label: "YTD" },
  { key: "1Y", label: "1Y", months: 12 },
  { key: "ALL", label: "All" },
];

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 360;
const PLOT = { left: 72, right: 20, top: 28, bottom: 42 };

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

function formatAxisValue(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "0";

  const absoluteValue = Math.abs(numericValue);
  if (absoluteValue >= 1000000) {
    return `${new Intl.NumberFormat("lt-LT", {
      maximumFractionDigits: absoluteValue >= 10000000 ? 0 : 1,
    }).format(numericValue / 1000000)}M`;
  }
  if (absoluteValue >= 1000) {
    return `${new Intl.NumberFormat("lt-LT", {
      maximumFractionDigits: absoluteValue >= 10000 ? 0 : 1,
    }).format(numericValue / 1000)}k`;
  }

  return new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 0 }).format(
    numericValue,
  );
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatChartLabel(value, fallback) {
  const date = parseDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("lt-LT", {
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatTooltipDate(value, fallback) {
  const date = parseDate(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
  })
    .format(date)
    .toLocaleLowerCase("lt-LT");
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .map((item, index) => {
      const value = Number(
        item?.value ?? item?.chartValue ?? item?.currentValue ?? item?.portfolioValue,
      );
      const invested = Number(
        item?.invested ?? item?.chartInvested ?? item?.investedAmount,
      );
      const dateValue = item?.date ?? item?.month ?? item?.period ?? "";
      const chartDate = parseDate(dateValue);

      return {
        ...item,
        dateValue,
        chartDate,
        chartLabel: formatChartLabel(dateValue, String(index + 1)),
        tooltipLabel: formatTooltipDate(dateValue, String(index + 1)),
        chartValue: Number.isFinite(value) ? value : 0,
        chartInvested: Number.isFinite(invested) ? invested : 0,
      };
    })
    .filter(
      (item) =>
        Number.isFinite(item.chartValue) && Number.isFinite(item.chartInvested),
    );
}

function filterHistoryByPeriod(history, periodKey) {
  if (history.length === 0 || periodKey === "ALL") return history;

  const latestDatedItem = [...history].reverse().find((item) => item.chartDate);
  if (!latestDatedItem?.chartDate) {
    const fallbackLengths = { "1M": 2, "3M": 4, "6M": 7, YTD: 13, "1Y": 13 };
    return history.slice(
      -Math.min(history.length, fallbackLengths[periodKey] ?? history.length),
    );
  }

  const latestDate = new Date(latestDatedItem.chartDate);
  if (periodKey === "YTD") {
    const firstCurrentYearIndex = history.findIndex(
      (item) => item.chartDate && item.chartDate.getFullYear() === latestDate.getFullYear(),
    );

    if (firstCurrentYearIndex <= 0) {
      return history.filter(
        (item) => item.chartDate && item.chartDate.getFullYear() === latestDate.getFullYear(),
      );
    }
    return history.slice(firstCurrentYearIndex - 1);
  }

  const selectedPeriod = PERIODS.find((item) => item.key === periodKey);
  if (!selectedPeriod?.months) return history;

  const startDate = new Date(latestDate);
  startDate.setMonth(startDate.getMonth() - selectedPeriod.months);
  const firstVisibleIndex = history.findIndex(
    (item) => item.chartDate && item.chartDate >= startDate,
  );

  if (firstVisibleIndex <= 0) {
    return history.slice(Math.max(0, history.length - selectedPeriod.months - 1));
  }
  return history.slice(firstVisibleIndex - 1);
}

function calculatePerformance(history, periodKey) {
  if (history.length === 0) return { profit: 0, percentage: 0 };

  const lastPoint = history[history.length - 1];
  if (periodKey === "ALL") {
    const profit = lastPoint.chartValue - lastPoint.chartInvested;
    return {
      profit,
      percentage: lastPoint.chartInvested > 0 ? (profit / lastPoint.chartInvested) * 100 : 0,
    };
  }

  if (history.length < 2) return { profit: 0, percentage: 0 };

  const baselinePoint = history[0];
  const baselineProfit = baselinePoint.chartValue - baselinePoint.chartInvested;
  const currentProfit = lastPoint.chartValue - lastPoint.chartInvested;
  const profit = currentProfit - baselineProfit;
  const periodCapital = baselinePoint.chartValue > 0 ? baselinePoint.chartValue : lastPoint.chartInvested;

  return {
    profit,
    percentage: periodCapital > 0 ? (profit / periodCapital) * 100 : 0,
  };
}

function buildChart(history) {
  if (!history.length) return null;

  const values = history.flatMap((item) => [item.chartValue, item.chartInvested]);
  let min = Math.min(...values);
  let max = Math.max(...values);
  const rawSpread = max - min;
  const padding = rawSpread > 0 ? rawSpread * 0.14 : Math.max(Math.abs(max) * 0.08, 10);
  min -= padding;
  max += padding;

  const plotWidth = VIEWBOX_WIDTH - PLOT.left - PLOT.right;
  const plotHeight = VIEWBOX_HEIGHT - PLOT.top - PLOT.bottom;
  const spread = Math.max(max - min, 1);
  const xFor = (index) =>
    history.length === 1
      ? PLOT.left + plotWidth / 2
      : PLOT.left + (index / (history.length - 1)) * plotWidth;
  const yFor = (value) => PLOT.top + ((max - value) / spread) * plotHeight;

  const valuePoints = history.map((item, index) => ({
    x: xFor(index),
    y: yFor(item.chartValue),
  }));
  const investedPoints = history.map((item, index) => ({
    x: xFor(index),
    y: yFor(item.chartInvested),
  }));

  const toPath = (points) =>
    points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

  const valuePath = toPath(valuePoints);
  const investedPath = toPath(investedPoints);
  const baselineY = PLOT.top + plotHeight;
  const areaPath = `${valuePath} L${valuePoints.at(-1).x},${baselineY} L${valuePoints[0].x},${baselineY} Z`;
  const ticks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return {
      y: PLOT.top + ratio * plotHeight,
      value: max - ratio * spread,
    };
  });

  const labelStep = Math.max(1, Math.ceil(history.length / 7));
  const labels = history
    .map((item, index) => ({ item, index, x: xFor(index) }))
    .filter(({ index }) => index % labelStep === 0 || index === history.length - 1);

  return {
    min,
    max,
    valuePoints,
    investedPoints,
    valuePath,
    investedPath,
    areaPath,
    ticks,
    labels,
  };
}

function PerformanceLegend({ valueLabel, investedLabel }) {
  return (
    <div className="performance-legend">
      <span><i className="performance-legend-value" />{valueLabel}</span>
      <span><i className="performance-legend-invested" />{investedLabel}</span>
    </div>
  );
}

function PerformanceTooltip({ item, style }) {
  if (!item) return null;
  const profit = item.chartValue - item.chartInvested;
  const returnPercentage = item.chartInvested > 0 ? (profit / item.chartInvested) * 100 : 0;

  return (
    <div className="performance-tooltip performance-tooltip-floating" style={style}>
      <strong>{item.tooltipLabel}</strong>
      <div><span>Vertė</span><b>{formatCurrency(item.chartValue)}</b></div>
      <div><span>Investuota</span><b>{formatCurrency(item.chartInvested)}</b></div>
      <div><span>Pelnas</span><b className={profit >= 0 ? "positive" : "negative"}>{profit >= 0 ? "+" : ""}{formatCurrency(profit)}</b></div>
      <div><span>Grąža</span><b className={returnPercentage >= 0 ? "positive" : "negative"}>{returnPercentage >= 0 ? "+" : ""}{formatPercentage(returnPercentage)}</b></div>
    </div>
  );
}

function PerformanceChart({
  history = [],
  currentValue,
  eyebrow = "Portfelio dinamika",
  title = "Portfelio vertės pokytis",
  description = "Vertės ir investuotos sumos pokytis pagal pasirinktą laikotarpį.",
  valueLabel = "Portfelio vertė",
  investedLabel = "Investuota",
  totalLabel = "Dabartinė vertė",
  showPeriodResult = true,
  defaultPeriod = "ALL",
  className = "",
  height = 440,
}) {
  const [period, setPeriod] = useState(defaultPeriod);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const canvasRef = useRef(null);

  const normalizedHistory = useMemo(() => normalizeHistory(history), [history]);
  const visibleHistory = useMemo(
    () => filterHistoryByPeriod(normalizedHistory, period),
    [normalizedHistory, period],
  );
  const performance = useMemo(
    () => calculatePerformance(visibleHistory, period),
    [visibleHistory, period],
  );
  const chart = useMemo(() => buildChart(visibleHistory), [visibleHistory]);

  const latestValue = Number.isFinite(Number(currentValue))
    ? Number(currentValue)
    : normalizedHistory.at(-1)?.chartValue ?? 0;

  const handlePointerMove = (event) => {
    if (!canvasRef.current || !visibleHistory.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const plotStart = (PLOT.left / VIEWBOX_WIDTH) * rect.width;
    const plotWidth = ((VIEWBOX_WIDTH - PLOT.left - PLOT.right) / VIEWBOX_WIDTH) * rect.width;
    const ratio = Math.max(0, Math.min(1, (relativeX - plotStart) / Math.max(plotWidth, 1)));
    const index = Math.round(ratio * Math.max(visibleHistory.length - 1, 0));
    setHoveredIndex(index);
  };

  const hoveredItem = hoveredIndex === null ? null : visibleHistory[hoveredIndex];
  const hoveredPoint = hoveredIndex === null ? null : chart?.valuePoints[hoveredIndex];
  const tooltipStyle = hoveredPoint
    ? {
        left: `${Math.min(82, Math.max(12, (hoveredPoint.x / VIEWBOX_WIDTH) * 100))}%`,
        top: `${Math.min(66, Math.max(12, (hoveredPoint.y / VIEWBOX_HEIGHT) * 100))}%`,
      }
    : undefined;

  return (
    <section className={`performance-chart-card ${className}`.trim()}>
      <div className="performance-chart-header">
        <div className="performance-chart-copy">
          <p className="performance-chart-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="performance-chart-description">{description}</p>

          {showPeriodResult && visibleHistory.length > 0 && (
            <div className="performance-period-result">
              <strong className={performance.profit >= 0 ? "performance-positive" : "performance-negative"}>
                {performance.profit >= 0 ? "+" : ""}{formatCurrency(performance.profit)}
              </strong>
              <span className={performance.percentage >= 0 ? "performance-positive" : "performance-negative"}>
                {performance.percentage >= 0 ? "+" : ""}{formatPercentage(performance.percentage)}
              </span>
            </div>
          )}
        </div>

        <div className="performance-chart-header-right">
          <div className="performance-periods" role="group" aria-label="Grafiko laikotarpis">
            {PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={period === item.key ? "performance-period-button active" : "performance-period-button"}
                onClick={() => {
                  setPeriod(item.key);
                  setHoveredIndex(null);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="performance-chart-total">
            <span>{totalLabel}</span>
            <strong>{formatCurrency(latestValue)}</strong>
            {visibleHistory.length > 0 && (
              <small className={performance.percentage >= 0 ? "performance-total-change performance-positive" : "performance-total-change performance-negative"}>
                {performance.percentage >= 0 ? "▲" : "▼"} {performance.percentage >= 0 ? "+" : ""}{formatPercentage(performance.percentage)}
              </small>
            )}
          </div>
        </div>
      </div>

      {visibleHistory.length === 0 || !chart ? (
        <div className="performance-chart-empty">
          <strong>Grafiko duomenų nėra</strong>
          <span>Patikrink istorijos duomenis faile portfolio.json.</span>
        </div>
      ) : (
        <>
          <PerformanceLegend valueLabel={valueLabel} investedLabel={investedLabel} />
          <div
            ref={canvasRef}
            className="performance-chart-canvas performance-chart-native"
            style={{ height }}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => setHoveredIndex(null)}
          >
            <svg
              className="performance-native-svg"
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              preserveAspectRatio="none"
              role="img"
              aria-label={`${title}: ${valueLabel} ir ${investedLabel}`}
            >
              <defs>
                <linearGradient id="performanceNativeArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity="0.42" />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {chart.ticks.map((tick) => (
                <g key={tick.y}>
                  <line
                    x1={PLOT.left}
                    x2={VIEWBOX_WIDTH - PLOT.right}
                    y1={tick.y}
                    y2={tick.y}
                    className="performance-native-grid"
                  />
                  <text x={PLOT.left - 12} y={tick.y + 4} textAnchor="end" className="performance-native-axis-label">
                    {formatAxisValue(tick.value)}
                  </text>
                </g>
              ))}

              <path d={chart.areaPath} className="performance-native-area" />
              <path d={chart.valuePath} className="performance-native-value-line" />
              <path d={chart.investedPath} className="performance-native-invested-line" />

              {chart.labels.map(({ item, index, x }) => (
                <text key={`${item.chartLabel}-${index}`} x={x} y={VIEWBOX_HEIGHT - 12} textAnchor="middle" className="performance-native-axis-label">
                  {item.chartLabel}
                </text>
              ))}

              {hoveredPoint && (
                <>
                  <line x1={hoveredPoint.x} x2={hoveredPoint.x} y1={PLOT.top} y2={VIEWBOX_HEIGHT - PLOT.bottom} className="performance-native-cursor" />
                  <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" className="performance-native-dot" />
                  <circle cx={chart.investedPoints[hoveredIndex].x} cy={chart.investedPoints[hoveredIndex].y} r="5" className="performance-native-invested-dot" />
                </>
              )}
            </svg>

            <PerformanceTooltip item={hoveredItem} style={tooltipStyle} />
          </div>
        </>
      )}
    </section>
  );
}

export default PerformanceChart;
