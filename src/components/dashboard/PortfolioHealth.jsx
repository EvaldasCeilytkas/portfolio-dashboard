import { formatCurrency, formatInteger, formatPercentage } from "../../utils/portfolioFormatters";

function Item({ label, value, helper }) {
  return <div className="dashboard-health-item"><span>{label}</span><strong>{value}</strong><small>{helper}</small></div>;
}

export default function PortfolioHealth({ data }) {
  return (
    <article className="dashboard-card">
      <header className="dashboard-card-header"><div><span>PORTFOLIO STRUCTURE</span><h2>Portfelio būklė</h2><p>Bendri viso portfelio koncentracijos ir diversifikacijos rodikliai.</p></div></header>
      <div className="dashboard-health-grid">
        <Item label="Didžiausia platforma" value={data.largestPlatform?.name ?? "–"} helper={data.largestPlatform ? formatPercentage(data.largestPlatform.share) : "Duomenų nėra"} />
        <Item label="Didžiausia turto grupė" value={data.largestAssetClass?.label ?? "–"} helper={data.largestAssetClass ? formatPercentage(data.largestAssetClass.share) : "Duomenų nėra"} />
        <Item label="Laisvos lėšos" value={formatCurrency(data.cash, data.currency)} helper="Paruošta investuoti" />
        <Item label="Diversifikacija" value={`${formatInteger(data.activePlatformCount)} aktyvių`} helper={`${formatInteger(data.archivedPlatformCount)} archyvuotų platformų`} />
      </div>
    </article>
  );
}
