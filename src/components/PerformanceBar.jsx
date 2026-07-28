import "../styles/performancebar.css";

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

function PerformanceBar({ metrics = {} }) {
  const {
    value = 0,
    invested = 0,
    profit = 0,
    returnRate = 0,
    xirr = 0,
    monthlyChange = 0,
  } = metrics;

  const positiveReturn = Number(returnRate) >= 0;
  const positiveProfit = Number(profit) >= 0;
  const positiveMonthlyChange = Number(monthlyChange) >= 0;

  return (
    <section className="performance-card">
      <div className="performance-card__main">
        <div className="performance-card__headline">
          <p className="performance-card__eyebrow">
            Portfolio value
          </p>

          <h2 className="performance-card__value">
            {formatCurrency(value)}
          </h2>

          <div
            className={`performance-card__return ${
              positiveReturn
                ? "performance-card__return--positive"
                : "performance-card__return--negative"
            }`}
          >
            <span
              className="performance-card__return-icon"
              aria-hidden="true"
            >
              {positiveReturn ? "▲" : "▼"}
            </span>

            <span>
              {positiveReturn ? "+" : ""}
              {formatPercentage(returnRate)}
            </span>
          </div>
        </div>

        <div className="performance-card__summary">
          <div className="performance-metric">
            <span className="performance-metric__label">
              Investuota
            </span>

            <strong className="performance-metric__value">
              {formatCurrency(invested)}
            </strong>
          </div>

          <div className="performance-metric">
            <span className="performance-metric__label">
              Pelnas
            </span>

            <strong
              className={`performance-metric__value ${
                positiveProfit
                  ? "performance-metric__value--positive"
                  : "performance-metric__value--negative"
              }`}
            >
              {positiveProfit ? "+" : ""}
              {formatCurrency(profit)}
            </strong>
          </div>

          <div className="performance-metric">
            <span className="performance-metric__label">
              XIRR
            </span>

            <strong className="performance-metric__value">
              {formatPercentage(xirr)}
            </strong>
          </div>

          <div className="performance-metric">
            <span className="performance-metric__label">
              Mėnesio pokytis
            </span>

            <strong
              className={`performance-metric__value ${
                positiveMonthlyChange
                  ? "performance-metric__value--positive"
                  : "performance-metric__value--negative"
              }`}
            >
              {positiveMonthlyChange ? "+" : ""}
              {formatCurrency(monthlyChange)}
            </strong>
          </div>
        </div>
      </div>

      <div
        className="performance-card__glow"
        aria-hidden="true"
      />
    </section>
  );
}

export default PerformanceBar;