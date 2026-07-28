import { useId, useMemo, useState } from "react";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../../styles/performancechart.css";

const PERIODS = [
  { key: "1M", label: "1M", months: 1 },
  { key: "3M", label: "3M", months: 3 },
  { key: "6M", label: "6M", months: 6 },
  { key: "YTD", label: "YTD" },
  { key: "1Y", label: "1Y", months: 12 },
  { key: "ALL", label: "All" },
];

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 %";
  }

  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function formatAxisValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

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

  return new Intl.NumberFormat("lt-LT", {
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatChartLabel(value, fallback) {
  const date = parseDate(value);

  if (!date) {
    return fallback;
  }

  return new Intl.DateTimeFormat("lt-LT", {
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function formatTooltipDate(value, fallback) {
  const date = parseDate(value);

  if (!date) {
    return fallback;
  }

  const formattedDate = new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
  }).format(date);

  return formattedDate.toLocaleLowerCase("lt-LT");
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map((item, index) => {
      const value = Number(
        item?.value ??
          item?.chartValue ??
          item?.currentValue ??
          item?.portfolioValue,
      );
      const invested = Number(
        item?.invested ??
          item?.chartInvested ??
          item?.investedAmount,
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
        Number.isFinite(item.chartValue) &&
        Number.isFinite(item.chartInvested),
    );
}

function filterHistoryByPeriod(history, periodKey) {
  if (history.length === 0 || periodKey === "ALL") {
    return history;
  }

  const latestDatedItem = [...history]
    .reverse()
    .find((item) => item.chartDate);

  if (!latestDatedItem?.chartDate) {
    const fallbackLengths = {
      "1M": 2,
      "3M": 4,
      "6M": 7,
      YTD: 13,
      "1Y": 13,
    };

    return history.slice(
      -Math.min(
        history.length,
        fallbackLengths[periodKey] ?? history.length,
      ),
    );
  }

  const latestDate = new Date(latestDatedItem.chartDate);

  if (periodKey === "YTD") {
    const firstCurrentYearIndex = history.findIndex(
      (item) =>
        item.chartDate &&
        item.chartDate.getFullYear() === latestDate.getFullYear(),
    );

    if (firstCurrentYearIndex <= 0) {
      return history.filter(
        (item) =>
          item.chartDate &&
          item.chartDate.getFullYear() === latestDate.getFullYear(),
      );
    }

    return history.slice(firstCurrentYearIndex - 1);
  }

  const selectedPeriod = PERIODS.find(
    (item) => item.key === periodKey,
  );

  if (!selectedPeriod?.months) {
    return history;
  }

  const startDate = new Date(latestDate);
  startDate.setMonth(startDate.getMonth() - selectedPeriod.months);

  const firstVisibleIndex = history.findIndex(
    (item) => item.chartDate && item.chartDate >= startDate,
  );

  if (firstVisibleIndex <= 0) {
    return history.slice(
      Math.max(0, history.length - selectedPeriod.months - 1),
    );
  }

  return history.slice(firstVisibleIndex - 1);
}

function calculatePerformance(history, periodKey) {
  if (history.length === 0) {
    return { profit: 0, percentage: 0 };
  }

  const lastPoint = history[history.length - 1];

  if (periodKey === "ALL") {
    const profit = lastPoint.chartValue - lastPoint.chartInvested;

    return {
      profit,
      percentage:
        lastPoint.chartInvested > 0
          ? (profit / lastPoint.chartInvested) * 100
          : 0,
    };
  }

  if (history.length < 2) {
    return { profit: 0, percentage: 0 };
  }

  const baselinePoint = history[0];
  const baselineProfit =
    baselinePoint.chartValue - baselinePoint.chartInvested;
  const currentProfit =
    lastPoint.chartValue - lastPoint.chartInvested;
  const profit = currentProfit - baselineProfit;
  const periodCapital =
    baselinePoint.chartValue > 0
      ? baselinePoint.chartValue
      : lastPoint.chartInvested;

  return {
    profit,
    percentage:
      periodCapital > 0 ? (profit / periodCapital) * 100 : 0,
  };
}

function PerformanceTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0]?.payload;
  const profit = item.chartValue - item.chartInvested;
  const returnPercentage =
    item.chartInvested > 0
      ? (profit / item.chartInvested) * 100
      : 0;

  return (
    <div className="performance-tooltip">
      <strong>{item.tooltipLabel}</strong>

      <div>
        <span>Vertė</span>
        <b>{formatCurrency(item.chartValue)}</b>
      </div>

      <div>
        <span>Investuota</span>
        <b>{formatCurrency(item.chartInvested)}</b>
      </div>

      <div>
        <span>Pelnas</span>
        <b className={profit >= 0 ? "positive" : "negative"}>
          {profit >= 0 ? "+" : ""}
          {formatCurrency(profit)}
        </b>
      </div>

      <div>
        <span>Grąža</span>
        <b className={returnPercentage >= 0 ? "positive" : "negative"}>
          {returnPercentage >= 0 ? "+" : ""}
          {formatPercentage(returnPercentage)}
        </b>
      </div>
    </div>
  );
}

function PerformanceLegend({ valueLabel, investedLabel }) {
  return (
    <div className="performance-legend">
      <span>
        <i className="performance-legend-value" />
        {valueLabel}
      </span>

      <span>
        <i className="performance-legend-invested" />
        {investedLabel}
      </span>
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
  const gradientId = `performanceGradient-${useId().replaceAll(":", "")}`;

  const normalizedHistory = useMemo(
    () => normalizeHistory(history),
    [history],
  );

  const visibleHistory = useMemo(
    () => filterHistoryByPeriod(normalizedHistory, period),
    [normalizedHistory, period],
  );

  const performance = useMemo(
    () => calculatePerformance(visibleHistory, period),
    [visibleHistory, period],
  );

  const latestValue =
    Number.isFinite(Number(currentValue))
      ? Number(currentValue)
      : normalizedHistory.at(-1)?.chartValue ?? 0;

  return (
    <section className={`performance-chart-card ${className}`.trim()}>
      <div className="performance-chart-header">
        <div className="performance-chart-copy">
          <p className="performance-chart-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="performance-chart-description">{description}</p>

          {showPeriodResult && visibleHistory.length > 0 && (
            <div className="performance-period-result">
              <strong
                className={
                  performance.profit >= 0
                    ? "performance-positive"
                    : "performance-negative"
                }
              >
                {performance.profit >= 0 ? "+" : ""}
                {formatCurrency(performance.profit)}
              </strong>

              <span
                className={
                  performance.percentage >= 0
                    ? "performance-positive"
                    : "performance-negative"
                }
              >
                {performance.percentage >= 0 ? "+" : ""}
                {formatPercentage(performance.percentage)}
              </span>
            </div>
          )}
        </div>

        <div className="performance-chart-header-right">
          <div
            className="performance-periods"
            role="group"
            aria-label="Grafiko laikotarpis"
          >
            {PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={
                  period === item.key
                    ? "performance-period-button active"
                    : "performance-period-button"
                }
                onClick={() => setPeriod(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="performance-chart-total">
            <span>{totalLabel}</span>
            <strong>{formatCurrency(latestValue)}</strong>

            {visibleHistory.length > 0 && (
              <small
                className={
                  performance.percentage >= 0
                    ? "performance-total-change performance-positive"
                    : "performance-total-change performance-negative"
                }
              >
                {performance.percentage >= 0 ? "▲" : "▼"}{" "}
                {performance.percentage >= 0 ? "+" : ""}
                {formatPercentage(performance.percentage)}
              </small>
            )}
          </div>
        </div>
      </div>

      {visibleHistory.length === 0 ? (
        <div className="performance-chart-empty">
          <strong>Grafiko duomenų nėra</strong>
          <span>Patikrink istorijos duomenis faile portfolio.json.</span>
        </div>
      ) : (
        <div className="performance-chart-canvas" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={visibleHistory}
              margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#3b82f6"
                    stopOpacity={0.42}
                  />
                  <stop
                    offset="95%"
                    stopColor="#3b82f6"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(148, 163, 184, 0.12)"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis
                dataKey="chartLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                minTickGap={24}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                tickFormatter={formatAxisValue}
                width={52}
              />

              <Tooltip
                content={<PerformanceTooltip />}
                cursor={{
                  stroke: "rgba(96, 165, 250, 0.55)",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />

              <Legend
                content={
                  <PerformanceLegend
                    valueLabel={valueLabel}
                    investedLabel={investedLabel}
                  />
                }
                verticalAlign="top"
              />

              <Area
                type="monotone"
                dataKey="chartValue"
                name={valueLabel}
                stroke="#60a5fa"
                strokeWidth={3}
                fill={`url(#${gradientId})`}
                activeDot={{
                  r: 6,
                  fill: "#60a5fa",
                  stroke: "#f8fafc",
                  strokeWidth: 2,
                }}
                animationDuration={800}
                animationEasing="ease-out"
              />

              <Line
                type="monotone"
                dataKey="chartInvested"
                name={investedLabel}
                stroke="#94a3b8"
                strokeWidth={2.5}
                strokeDasharray="8 7"
                strokeLinecap="round"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#94a3b8",
                  stroke: "#f8fafc",
                  strokeWidth: 2,
                }}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default PerformanceChart;
