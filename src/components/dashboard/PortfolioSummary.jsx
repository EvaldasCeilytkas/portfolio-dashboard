function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value, showSign = false) {
  const numericValue = number(value);
  const sign = showSign && numericValue > 0 ? "+" : "";

  return `${sign}${new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)}`;
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value))} %`;
}

export default function PortfolioSummary({ data }) {
  const history = Array.isArray(data?.history) ? data.history : [];
  const first = history[0] || {};
  const latest = history.at(-1) || {};

  const valueGrowth = number(latest.value) - number(first.value);
  const investedGrowth = number(latest.invested) - number(first.invested);

  const items = [
    {
      label: "Vertės pokytis per istoriją",
      value: formatCurrency(valueGrowth, true),
      note: "Pokytis nuo pirmo istorijos įrašo",
      tone: valueGrowth >= 0 ? "positive" : "negative",
    },
    {
      label: "Investuota nuo pradžios",
      value: formatCurrency(investedGrowth),
      note: "Kapitalo pokytis nuo pirmo įrašo",
    },
    {
      label: "Didžiausia turto grupė",
      value: data?.largestAssetClass?.label || "—",
      note: data?.largestAssetClass
        ? formatPercent(data.largestAssetClass.share)
        : "Duomenų nėra",
    },
    {
      label: "Istorijos laikotarpis",
      value: history.length ? `${history.length} mėn.` : "—",
      note: "Mėnesinių įrašų skaičius",
    },
  ];

  return (
    <section className="dashboard-card dashboard-summary-card">
      <header className="dashboard-card-header">
        <div>
          <span>PORTFOLIO SUMMARY</span>
          <h2>Portfelio santrauka</h2>
          <p>
            Ilgalaikis portfelio augimas ir svarbiausi pokyčiai pagal visą
            turimą istoriją.
          </p>
        </div>
      </header>

      <div className="dashboard-summary-grid">
        {items.map((item) => (
          <article className="dashboard-summary-item" key={item.label}>
            <span>{item.label}</span>

            <strong
              className={
                item.tone ? `dashboard-summary-${item.tone}` : ""
              }
            >
              {item.value}
            </strong>

            <small>{item.note}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
