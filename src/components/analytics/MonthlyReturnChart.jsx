import { useMemo, useState } from "react";

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

const MONTH_NAMES = [
  "Sau",
  "Vas",
  "Kov",
  "Bal",
  "Geg",
  "Bir",
  "Lie",
  "Rgp",
  "Rgs",
  "Spa",
  "Lap",
  "Gru",
];

function formatMonth(value) {
  if (!value) return "–";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return MONTH_NAMES[date.getMonth()];
}

function formatLongMonth(value) {
  if (!value) return "–";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
  }).format(date);
}

const RANGES = [
  { value: 12, label: "12 mėn." },
  { value: 24, label: "24 mėn." },
  { value: 0, label: "Visa istorija" },
];

function MonthlyReturnChart({ data = [] }) {
  const [range, setRange] = useState(12);
  const [mode, setMode] = useState("profit");
  const [hoveredDate, setHoveredDate] = useState(null);

  const rows = useMemo(
    () => (range > 0 ? data.slice(-range) : data),
    [data, range],
  );

  const maxValue = Math.max(
    1,
    ...rows.map((item) =>
      Math.abs(
        mode === "profit"
          ? number(item.profit)
          : number(item.returnRate),
      ),
    ),
  );

  return (
    <article className="analytics-card">
      <header className="analytics-card-header analytics-card-header-controls">
        <div>
          <p>MONTHLY PERFORMANCE</p>
          <h2>Mėnesio rezultatai</h2>
          <span>
            Mėnesio pelnas eurais arba pinigų srautais pakoreguota grąža.
          </span>
        </div>

        <div className="analytics-monthly-chart-controls">
          <div className="analytics-mode-switch">
            <button
              type="button"
              className={mode === "profit" ? "is-active" : ""}
              onClick={() => setMode("profit")}
            >
              €
            </button>
            <button
              type="button"
              className={mode === "return" ? "is-active" : ""}
              onClick={() => setMode("return")}
            >
              %
            </button>
          </div>

          <div className="analytics-range-switch">
            {RANGES.map((item) => (
              <button
                key={item.label}
                type="button"
                className={range === item.value ? "is-active" : ""}
                onClick={() => setRange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {rows.length > 0 ? (
        <div className="analytics-column-chart-scroll">
          <div
            className={`analytics-column-chart analytics-column-chart-interactive ${
              rows.length <= 12 ? "is-compact" : "is-scrollable"
            }`}
            style={{
              gridTemplateColumns:
                rows.length <= 12
                  ? `repeat(${rows.length}, minmax(34px, 1fr))`
                  : `repeat(${rows.length}, minmax(52px, 1fr))`,
              minWidth:
                rows.length > 12
                  ? `${rows.length * 60}px`
                  : "100%",
            }}
          >
            {rows.map((item) => {
            const profit = number(item.profit);
            const returnRate = number(item.returnRate);
            const invested = number(item.invested);
            const portfolioValue = number(item.value);
            const value = mode === "profit" ? profit : returnRate;
            const height = (Math.abs(value) / maxValue) * 100;
            const isHovered = hoveredDate === item.date;

            return (
              <div
                className={`analytics-column ${
                  isHovered ? "is-hovered" : ""
                }`}
                key={item.date}
                onMouseEnter={() => setHoveredDate(item.date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <strong
                  className={
                    value >= 0
                      ? "analytics-positive"
                      : "analytics-negative"
                  }
                >
                  {mode === "profit"
                    ? formatCurrency(value)
                    : formatPercentage(value)}
                </strong>

                <div className="analytics-column-track">
                  <div
                    className={value >= 0 ? "positive" : "negative"}
                    style={{ height: `${Math.max(4, height)}%` }}
                  />
                </div>

                <span>{formatMonth(item.date)}</span>

                <div className="analytics-monthly-tooltip">
                  <strong>{formatLongMonth(item.date)}</strong>

                  <span>
                    Pelnas
                    <b
                      className={
                        profit >= 0
                          ? "analytics-positive"
                          : "analytics-negative"
                      }
                    >
                      {formatCurrency(profit)}
                    </b>
                  </span>

                  <span>
                    Grąža
                    <b
                      className={
                        returnRate >= 0
                          ? "analytics-positive"
                          : "analytics-negative"
                      }
                    >
                      {formatPercentage(returnRate)}
                    </b>
                  </span>

                  <span>
                    Investuota
                    <b>{formatCurrency(invested)}</b>
                  </span>

                  <span>
                    Portfelis
                    <b>{formatCurrency(portfolioValue)}</b>
                  </span>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      ) : (
        <div className="analytics-empty">
          Mėnesio rezultatų duomenų dar nėra.
        </div>
      )}
    </article>
  );
}

export default MonthlyReturnChart;