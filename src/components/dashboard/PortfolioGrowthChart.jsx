import { useMemo, useState } from "react";

const PERIODS = [
  { key: "6M", label: "6M", months: 6 },
  { key: "1Y", label: "1Y", months: 12 },
  { key: "2Y", label: "2Y", months: 24 },
  { key: "ALL", label: "ALL", months: 0 },
];

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "2-digit",
    month: "2-digit",
  }).format(date);
}

function buildPoints(rows, key, minValue, range) {
  const width = 1000;
  const height = 260;
  const divisor = Math.max(1, rows.length - 1);

  return rows.map((item, index) => {
    const x = (index / divisor) * width;
    const y = height - ((number(item?.[key]) - minValue) / range) * height;

    return { x, y, item };
  });
}

function toPath(points) {
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
}

export default function PortfolioGrowthChart({ data }) {
  const [period, setPeriod] = useState("1Y");
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const rows = useMemo(() => {
    const allRows = Array.isArray(data?.history) ? data.history : [];
    const selected = PERIODS.find((item) => item.key === period);

    return selected?.months ? allRows.slice(-selected.months) : allRows;
  }, [data?.history, period]);

  const chart = useMemo(() => {
    if (!rows.length) return null;

    const allValues = rows.flatMap((item) => [
      number(item.value),
      number(item.invested),
    ]);

    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);
    const padding = Math.max((rawMax - rawMin) * 0.14, rawMax * 0.025, 1);
    const minValue = Math.max(0, rawMin - padding);
    const maxValue = rawMax + padding;
    const range = Math.max(1, maxValue - minValue);

    const valuePoints = buildPoints(rows, "value", minValue, range);
    const investedPoints = buildPoints(rows, "invested", minValue, range);

    return {
      valuePoints,
      investedPoints,
      valuePath: toPath(valuePoints),
      investedPath: toPath(investedPoints),
      areaPath: `${toPath(valuePoints)} L 1000 260 L 0 260 Z`,
    };
  }, [rows]);

  const hovered =
    hoveredIndex !== null && chart ? chart.valuePoints[hoveredIndex] : null;

  const hoveredProfit = hovered
    ? number(hovered.item.value) - number(hovered.item.invested)
    : 0;

  return (
    <article className="dashboard-card dashboard-growth-card">
      <header className="dashboard-card-header">
        <div>
          <span>PORTFOLIO GROWTH</span>
          <h2>Portfelio augimas</h2>
          <p>
            Bendra portfelio vertė ir investuotas kapitalas pagal pasirinktą
            laikotarpį.
          </p>
        </div>

        <div className="dashboard-periods">
          {PERIODS.map((item) => (
            <button
              type="button"
              className={period === item.key ? "is-active" : ""}
              key={item.key}
              onClick={() => setPeriod(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <div className="dashboard-growth-summary">
        <div>
          <span>Dabartinė vertė</span>
          <strong>{formatCurrency(data?.currentValue)}</strong>
        </div>

        <div>
          <span>Investuota</span>
          <strong>{formatCurrency(data?.invested)}</strong>
        </div>
      </div>

      {chart ? (
        <div
          className="dashboard-chart"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <svg viewBox="0 0 1000 260" preserveAspectRatio="none">
            <defs>
              <linearGradient id="dashboardAreaV5" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#42a4ff" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#42a4ff" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 65, 130, 195, 260].map((y) => (
              <line
                className="dashboard-chart-grid"
                key={y}
                x1="0"
                x2="1000"
                y1={y}
                y2={y}
              />
            ))}

            <path d={chart.areaPath} fill="url(#dashboardAreaV5)" />
            <path className="dashboard-value-line" d={chart.valuePath} />
            <path className="dashboard-invested-line" d={chart.investedPath} />

            {chart.valuePoints.map((point, index) => (
              <rect
                key={`${point.item.date}-${index}`}
                x={Math.max(0, point.x - 1000 / Math.max(rows.length, 1) / 2)}
                y="0"
                width={1000 / Math.max(rows.length, 1)}
                height="260"
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(index)}
              />
            ))}

            {hovered && (
              <>
                <line
                  className="dashboard-chart-cursor"
                  x1={hovered.x}
                  x2={hovered.x}
                  y1="0"
                  y2="260"
                />
                <circle
                  className="dashboard-chart-point"
                  cx={hovered.x}
                  cy={hovered.y}
                  r="5"
                />
              </>
            )}
          </svg>

          {hovered && (
            <div
              className="dashboard-chart-tooltip"
              style={{ left: `${hovered.x / 10}%` }}
            >
              <span className="dashboard-tooltip-date">
                {formatDate(hovered.item.date)}
              </span>

              <div className="dashboard-tooltip-block">
                <small>Portfelio vertė</small>
                <strong>{formatCurrency(hovered.item.value)}</strong>
              </div>

              <div className="dashboard-tooltip-block">
                <small>Investuota</small>
                <b>{formatCurrency(hovered.item.invested)}</b>
              </div>

              <div className="dashboard-tooltip-block">
                <small>Pelnas</small>
                <b
                  className={
                    hoveredProfit >= 0
                      ? "dashboard-tooltip-positive"
                      : "dashboard-tooltip-negative"
                  }
                >
                  {formatCurrency(hoveredProfit)}
                </b>
              </div>
            </div>
          )}

          <div className="dashboard-chart-dates">
            <span>{formatDate(rows[0]?.date)}</span>
            <span>{formatDate(rows.at(-1)?.date)}</span>
          </div>
        </div>
      ) : (
        <div className="dashboard-empty">Istorinių duomenų dar nėra.</div>
      )}
    </article>
  );
}
