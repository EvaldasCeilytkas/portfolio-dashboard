import { formatCurrency, formatDateTime, formatInteger, formatPercentage } from "../../utils/portfolioFormatters";

function HeroStat({ label, value, helper }) {
  return <div className="dashboard-hero-stat"><span>{label}</span><strong>{value}</strong><small>{helper}</small></div>;
}

export default function DashboardHero({ data }) {
  const positive = data.profit >= 0;
  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-main">
        <span className="dashboard-eyebrow">PORTFOLIO OVERVIEW</span>
        <h1>Investicijų portfelis</h1>
        <p>Bendra aktyvių investicijų vertė ir svarbiausi viso portfelio rodikliai.</p>
        <div className="dashboard-hero-value"><span>Dabartinė vertė</span><strong>{formatCurrency(data.currentValue, data.currency)}</strong></div>
        <div className={`dashboard-hero-return ${positive ? "is-positive" : "is-negative"}`}>
          <b>{formatPercentage(data.returnRate)}</b>
          <span>{positive ? "+" : ""}{formatCurrency(data.profit, data.currency)} bendras rezultatas</span>
        </div>
      </div>
      <div className="dashboard-hero-side">
        <HeroStat label="Aktyvios platformos" value={formatInteger(data.activePlatformCount)} helper="Dabartinė diversifikacija" />
        <HeroStat label="Archyvuotos" value={formatInteger(data.archivedPlatformCount)} helper="Istorinės platformos" />
        <HeroStat label="Laisvos lėšos" value={formatCurrency(data.cash, data.currency)} helper="Paruošta investuoti" />
        <HeroStat label="Atnaujinta" value={formatDateTime(data.generatedAt)} helper="Pagal portfolio.json" />
      </div>
    </section>
  );
}
