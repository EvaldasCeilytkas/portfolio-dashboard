import { formatCurrency, formatPercentage } from "../../utils/portfolioFormatters";

function Card({ label, value, helper, tone = "neutral" }) {
  return <article className={`dashboard-metric dashboard-tone-${tone}`}><span>{label}</span><strong>{value}</strong><small>{helper}</small></article>;
}

export default function MetricCards({ data }) {
  return (
    <section className="dashboard-metrics">
      <Card label="Investuota" value={formatCurrency(data.invested, data.currency)} helper="Aktyvus investuotas kapitalas" />
      <Card label="Pelnas" value={formatCurrency(data.profit, data.currency)} helper={formatPercentage(data.returnRate)} tone={data.profit >= 0 ? "positive" : "negative"} />
      <Card label="Gautos pajamos" value={formatCurrency(data.passiveIncome, data.currency)} helper="Palūkanos ir kitos pajamos" tone="positive" />
      <Card label="XIRR" value={formatPercentage(data.xirr)} helper="Metinė pinigų srautų grąža" tone={data.xirr >= 0 ? "positive" : "negative"} />
    </section>
  );
}
