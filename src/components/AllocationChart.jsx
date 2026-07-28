import { useState } from "react";
import "../styles/allocationchart.css";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
} from "recharts";

const COLORS = [
  "#4F9CFF",
  "#7C5CFC",
  "#2DD4BF",
  "#F59E0B",
  "#EF4444",
  "#64748B",
];

function formatCurrency(value) {
  const numericValue = Number(value);

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatShortCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 €";
  }

  const absoluteValue = Math.abs(numericValue);

  if (absoluteValue >= 1000000) {
    const formattedValue = new Intl.NumberFormat("lt-LT", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(numericValue / 1000000);

    return `${formattedValue} mln. €`;
  }

  if (absoluteValue >= 1000) {
    const formattedValue = new Intl.NumberFormat("lt-LT", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(numericValue / 1000);

    return `${formattedValue} tūkst. €`;
  }

  return formatCurrency(numericValue);
}

function renderActiveShape(props) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 7}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="rgba(248, 250, 252, 0.95)"
        strokeWidth={1.5}
      />

      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.2}
      />
    </g>
  );
}

function AllocationChart({
  allocation = [],
  portfolioValue = 0,
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const safeAllocation = Array.isArray(allocation)
    ? allocation
    : [];

  const total = safeAllocation.reduce((sum, item) => {
    return sum + Number(item.value || 0);
  }, 0);

  const chartData = safeAllocation
    .map((item, index) => {
      const value = Number(item.value || 0);

      return {
        ...item,
        value,
        color: COLORS[index % COLORS.length],
        percent: total > 0 ? (value / total) * 100 : 0,
      };
    })
    .filter((item) => item.value > 0);

  function handleMouseEnter(index) {
    setActiveIndex(index);
  }

  function handleMouseLeave() {
    setActiveIndex(null);
  }

  return (
    <section
      className="allocation-card"
      onMouseLeave={handleMouseLeave}
    >
      <div className="allocation-header">
        <div>
          <p className="chart-eyebrow">
            Turto struktūra
          </p>

          <h2>
            Portfelio paskirstymas
          </h2>
        </div>

        <span className="allocation-total">
          {chartData.length} klasės
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="allocation-empty">
          Portfelio paskirstymo duomenų nėra.
        </div>
      ) : (
        <div className="allocation-content">
          <div className="allocation-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={98}
                  paddingAngle={2}
                  stroke="rgba(226, 232, 240, 0.9)"
                  strokeWidth={1}
                  activeIndex={
                    activeIndex === null
                      ? undefined
                      : activeIndex
                  }
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) =>
                    handleMouseEnter(index)
                  }
                  onMouseLeave={handleMouseLeave}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((item, index) => (
                    <Cell
                      key={`${item.name}-${index}`}
                      fill={item.color}
                      opacity={
                        activeIndex === null ||
                        activeIndex === index
                          ? 1
                          : 0.48
                      }
                      className="allocation-chart-cell"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-center">
              <strong>
                {formatShortCurrency(portfolioValue)}
              </strong>

              <span>
                Bendra vertė
              </span>
            </div>
          </div>

          <div className="allocation-list">
            {chartData.map((item, index) => {
              const isActive = activeIndex === index;
              const isDimmed =
                activeIndex !== null &&
                activeIndex !== index;

              return (
                <div
                  className={[
                    "allocation-item",
                    isActive
                      ? "allocation-item-active"
                      : "",
                    isDimmed
                      ? "allocation-item-dimmed"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={`${item.name}-${index}`}
                  style={{
                    "--allocation-color": item.color,
                  }}
                  onMouseEnter={() =>
                    handleMouseEnter(index)
                  }
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="allocation-item-main">
                    <div className="allocation-name">
                      <span
                        className="allocation-dot"
                        style={{
                          backgroundColor: item.color,
                        }}
                      />

                      <span>
                        {item.name}
                      </span>
                    </div>

                    <strong className="allocation-percent">
                      {item.percent.toFixed(1)} %
                    </strong>
                  </div>

                  <span className="allocation-value">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default AllocationChart;