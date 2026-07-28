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

function SummaryCard({
  label,
  value,
  description,
  tone = "neutral",
  featured = false,
}) {
  return (
    <article
      className={`analytics-summary-card tone-${tone} ${
        featured ? "is-featured" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}

function AnalyticsSummary({ analysis, showInactive = false }) {
  const platformDescription = showInactive
    ? `${analysis.inactivePlatforms.length} istorinės · iš viso ${analysis.analysisPlatforms.length}`
    : `${analysis.inactivePlatforms.length} istorinės · iš viso ${
        analysis.activePlatforms.length + analysis.inactivePlatforms.length
      }`;

  return (
    <div className="analytics-summary-grid">
      <SummaryCard
        label="Portfelio vertė"
        value={formatCurrency(analysis.portfolioValue)}
        description={`Investuota ${formatCurrency(analysis.invested)}`}
      />

      <SummaryCard
        label="Bendras pelnas"
        value={formatCurrency(analysis.profit)}
        description={`Grąža ${formatPercentage(analysis.returnRate)}`}
        tone={analysis.profit >= 0 ? "positive" : "negative"}
      />

      <SummaryCard
        label="Vid. mėnesio grąža"
        value={formatPercentage(analysis.averageMonthlyReturn)}
        description={
          showInactive
            ? "Pagal aktyvią ir istorinę platformų istoriją"
            : "Pagal aktyvių platformų istoriją"
        }
        tone={
          analysis.averageMonthlyReturn >= 0
            ? "positive"
            : "negative"
        }
        featured
      />

      <SummaryCard
        label="Aktyvios platformos"
        value={String(analysis.activePlatforms.length)}
        description={platformDescription}
      />
    </div>
  );
}

export default AnalyticsSummary;