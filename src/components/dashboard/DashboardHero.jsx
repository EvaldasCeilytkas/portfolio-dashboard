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

function formatPercent(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value))} %`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function getPortfolioAge(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return "—";
  }

  return `${history.length} mėn.`;
}

export default function DashboardHero({ data }) {
  const profit = number(data?.profit);
  const returnRate = number(data?.returnRate);
  const isPositive = profit >= 0;

  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-main">
        <div className="dashboard-hero-topline">
          <span className="dashboard-eyebrow">{data?.eyebrow || "PORTFOLIO OVERVIEW"}</span>

          <span
            className={`dashboard-status ${
              isPositive ? "is-positive" : "is-negative"
            }`}
          >
            <i />
            {isPositive ? "Portfelis pelningas" : "Portfelis nuostolingas"}
          </span>
        </div>

        <h1>{data?.portfolioName || "Investicijų portfelis"}</h1>

        <div className="dashboard-hero-value">
          <span>Dabartinė vertė</span>
          <strong>{formatCurrency(data?.currentValue)}</strong>
        </div>

        <div
          className={`dashboard-hero-return ${
            isPositive ? "is-positive" : "is-negative"
          }`}
        >
          <b>{formatPercent(returnRate)}</b>
          <span>
            {profit >= 0 ? "+" : ""}
            {formatCurrency(profit)} bendras rezultatas
          </span>
        </div>
      </div>

      <div className="dashboard-hero-side">
        <article className="dashboard-hero-stat dashboard-hero-stat-large">
          <span>Investuota</span>
          <strong>{formatCurrency(data?.invested)}</strong>
          <small>Aktyvus investuotas kapitalas</small>
        </article>

        <article className="dashboard-hero-stat dashboard-hero-stat-large">
          <span>Pelnas</span>
          <strong className={isPositive ? "is-positive" : "is-negative"}>
            {formatCurrency(profit)}
          </strong>
          <small>Bendras portfelio rezultatas</small>
        </article>

        <article className="dashboard-hero-stat">
          <span>Atnaujinta</span>
          <strong className="dashboard-date-value">
            {formatDate(data?.generatedAt)}
          </strong>
          <small>Pagal istorinį Excel failą</small>
        </article>

        <article className="dashboard-hero-stat">
          <span>Portfelio istorija</span>
          <strong>{getPortfolioAge(data?.history)}</strong>
          <small>Mėnesinių įrašų laikotarpis</small>
        </article>
      </div>
    </section>
  );
}
