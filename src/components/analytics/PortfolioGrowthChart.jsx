import { useMemo, useRef, useState } from "react";

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
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("lt-LT", {
    year: "2-digit",
    month: "short",
  }).format(date);
}

const RANGES = [
  { value: 6, label: "6M" },
  { value: 12, label: "1Y" },
  { value: 24, label: "2Y" },
  { value: 0, label: "ALL" },
];

function PortfolioGrowthChart({
  history = [],
  invested = 0,
  portfolioValue = 0,
  returnRate = 0,
  xirr = 0,
}) {
  const [range, setRange] = useState(12);
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartRef = useRef(null);

  const data = useMemo(() => {
    if (!Array.isArray(history)) return [];
    return range > 0 ? history.slice(-range) : history;
  }, [history, range]);

  const values = data.map((item) => number(item.value));
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 1);
  const spread = Math.max(1, maxValue - minValue);

  const chartPoints = data.map((item, index) => {
    const x =
      data.length <= 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 92 - ((number(item.value) - minValue) / spread) * 78;

    return { x, y, item };
  });

  const points = chartPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const hoveredPoint =
    hoverIndex !== null ? chartPoints[hoverIndex] : null;


  function handlePointerMove(event) {
    if (!chartRef.current || data.length === 0) return;

    const rect = chartRef.current.getBoundingClientRect();
    const localX = Math.min(
      rect.width,
      Math.max(0, event.clientX - rect.left),
    );

    const index =
      data.length <= 1
        ? 0
        : Math.round((localX / rect.width) * (data.length - 1));

    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  }

  return (
    <article className="analytics-card analytics-growth-card">
      <header className="analytics-card-header">
        <div>
          <p>PORTFOLIO GROWTH</p>
          <h2>Portfelio augimas</h2>
          <span>
            Istorinė portfelio vertė pagal pasirinktą analizės sritį.
          </span>
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
      </header>

      <div className="analytics-growth-kpis">
        <div>
          <span>Bendra grąža</span>
          <strong>{formatPercentage(returnRate)}</strong>
        </div>
        <div>
          <span>XIRR</span>
          <strong>{formatPercentage(xirr)}</strong>
        </div>
        <div>
          <span>Bendras pelnas</span>
          <strong>{formatCurrency(number(portfolioValue) - number(invested))}</strong>
        </div>
        <div>
          <span>Investuota</span>
          <strong>{formatCurrency(invested)}</strong>
        </div>
        <div>
          <span>Dabartinė vertė</span>
          <strong>{formatCurrency(portfolioValue)}</strong>
        </div>
      </div>

      {data.length >= 2 ? (
        <>
          <div className="analytics-growth-meta">
            <div>
              <span>Pirmas įrašas</span>
              <strong>
                {formatCurrency(
                  number(data[0]?.invested) > 0
                    ? data[0]?.invested
                    : data[0]?.value,
                )}
              </strong>
            </div>
            <div>
              <span>Dabartinė vertė</span>
              <strong>{formatCurrency(data[data.length - 1]?.value)}</strong>
            </div>
          </div>

          <div
            ref={chartRef}
            className="analytics-line-chart analytics-line-chart-interactive"
            onMouseMove={handlePointerMove}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="growthFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
                </linearGradient>
              </defs>

              {[20, 40, 60, 80].map((y) => (
                <line
                  key={`h-${y}`}
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.10)"
                  strokeWidth="0.35"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              {[20, 40, 60, 80].map((x) => (
                <line
                  key={`v-${x}`}
                  x1={x}
                  x2={x}
                  y1="0"
                  y2="100"
                  stroke="rgba(148, 163, 184, 0.08)"
                  strokeWidth="0.35"
                  vectorEffect="non-scaling-stroke"
                />
              ))}

              <polygon
                points={`0,100 ${points} 100,100`}
                fill="url(#growthFill)"
              />

              <polyline
                points={points}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              {hoveredPoint ? (
                <>
                  <line
                    x1={hoveredPoint.x}
                    x2={hoveredPoint.x}
                    y1={hoveredPoint.y}
                    y2="100"
                    stroke="rgba(147, 197, 253, 0.55)"
                    strokeWidth="0.7"
                    strokeDasharray="2 2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r="1.6"
                    fill="#0a1221"
                    stroke="#93c5fd"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              ) : null}
            </svg>

            {hoveredPoint ? (
              <div
                className={`analytics-growth-tooltip ${
                  hoveredPoint.y < 30 ? "is-below" : "is-above"
                } ${
                  hoveredPoint.x < 18
                    ? "is-left-edge"
                    : hoveredPoint.x > 82
                      ? "is-right-edge"
                      : ""
                }`}
                style={{
                  left: `${hoveredPoint.x}%`,
                  top: `${hoveredPoint.y}%`,
                }}
              >
                <strong>{hoveredPoint.item.date}</strong>
                <span>
                  Vertė
                  <b>{formatCurrency(hoveredPoint.item.value)}</b>
                </span>
                <span>
                  Investuota
                  <b>{formatCurrency(hoveredPoint.item.invested)}</b>
                </span>
                <span>
                  Pelnas
                  <b>
                    {formatCurrency(
                      number(hoveredPoint.item.value) -
                        number(hoveredPoint.item.invested),
                    )}
                  </b>
                </span>
              </div>
            ) : null}
          </div>

          <div className="analytics-axis-labels">
            {data
              .filter(
                (_, index) =>
                  index === 0 ||
                  index === data.length - 1 ||
                  index === Math.floor(data.length / 2),
              )
              .map((item) => (
                <span key={item.date}>{formatMonth(item.date)}</span>
              ))}
          </div>
        </>
      ) : (
        <div className="analytics-empty">
          Pasirinktai sričiai istorinės vertės duomenų dar nepakanka.
        </div>
      )}
    </article>
  );
}

export default PortfolioGrowthChart;