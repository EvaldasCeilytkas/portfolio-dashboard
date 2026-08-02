import StatCard from "../ui/StatCard";

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

function formatMonth(value) {
  if (!value) return "Duomenų nėra";

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function getMonthlyExtremes(history) {
  const rows = Array.isArray(history)
    ? history.filter((item) => Number.isFinite(Number(item?.monthlyResult)))
    : [];

  if (!rows.length) {
    return { best: null, worst: null };
  }

  return rows.reduce(
    (result, item) => {
      const value = number(item.monthlyResult);

      if (!result.best || value > number(result.best.monthlyResult)) {
        result.best = item;
      }

      if (!result.worst || value < number(result.worst.monthlyResult)) {
        result.worst = item;
      }

      return result;
    },
    { best: null, worst: null },
  );
}

export default function MetricCards({ data }) {
  const latestResult = number(data?.latestMonthlyResult);
  const latestContribution = number(data?.latestMonthlyContribution);
  const { best, worst } = getMonthlyExtremes(data?.history);

  const cards = [
    {
      label: "Paskutinio mėnesio rezultatas",
      value: formatCurrency(latestResult),
      note: "Pokytis pagal paskutinį istorijos įrašą",
      tone: latestResult >= 0 ? "positive" : "negative",
    },
    {
      label: "Paskutinio mėnesio įnašas",
      value: formatCurrency(latestContribution),
      note: "Papildomai investuotas kapitalas",
      tone: latestContribution < 0 ? "negative" : "",
    },
    {
      label: "Geriausias mėnuo",
      value: best ? formatCurrency(best.monthlyResult) : "—",
      note: best ? formatMonth(best.date) : "Duomenų nėra",
      tone: best && number(best.monthlyResult) >= 0 ? "positive" : "negative",
    },
    {
      label: "Silpniausias mėnuo",
      value: worst ? formatCurrency(worst.monthlyResult) : "—",
      note: worst ? formatMonth(worst.date) : "Duomenų nėra",
      tone: worst && number(worst.monthlyResult) >= 0 ? "positive" : "negative",
    },
  ];

  return (
    <section className="dashboard-metrics">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={card.value}
          note={card.note}
          tone={card.tone || "info"}
          className={`dashboard-metric ${card.tone ? `dashboard-tone-${card.tone}` : ""}`}
        />
      ))}
    </section>
  );
}
