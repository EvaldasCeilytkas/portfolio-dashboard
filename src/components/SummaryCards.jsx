function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatPercent(value) {
  return `${Number(value ?? 0).toLocaleString("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} %`;
}

function SummaryCards({ portfolio }) {
  const cards = [
    {
      label: "Portfelio vertė",
      value: formatCurrency(portfolio?.portfolioValue),
      change: `Investuota ${formatCurrency(portfolio?.invested)}`,
    },
    {
      label: "Bendra grąža",
      value: formatPercent(portfolio?.returnRate),
      change: `${formatCurrency(portfolio?.profit)} pelno`,
    },
    {
      label: "XIRR",
      value: formatPercent(portfolio?.xirr),
      change: "Metinė grąža",
    },
    {
      label: "Pasyvios pajamos",
      value: formatCurrency(portfolio?.passiveIncome),
      change: "Einamaisiais metais",
    },
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article className="summary-card" key={card.label}>
          <p className="summary-label">{card.label}</p>
          <strong className="summary-value">{card.value}</strong>
          <p className="summary-change">{card.change}</p>
        </article>
      ))}
    </section>
  );
}

export default SummaryCards;