import { formatCurrency, formatPercentage } from "../../utils/portfolioFormatters";

export default function AllocationPanel({ data }) {
  const rows = Array.isArray(data.allocation) ? data.allocation : [];
  let offset = 0;
  const gradient = rows.filter((r) => r.value > 0).map((row, index) => {
    const start = offset; offset += row.share;
    return `hsl(${202 + index * 31} 82% 58%) ${start + .35}% ${Math.max(start + .35, start + row.share - .35)}%`;
  }).join(", ") || "rgba(148,163,184,.2) 0 100%";

  return (
    <article className="dashboard-card dashboard-allocation-card">
      <header className="dashboard-card-header"><div><span>ALLOCATION</span><h2>Turto paskirstymas</h2><p>Vertė ir pagrindinis platformų skaičius skaičiuojami tik pagal aktyvias platformas.</p></div></header>
      <div className="dashboard-allocation-content">
        <div className="dashboard-donut" style={{ background: `conic-gradient(${gradient})` }}>
          <div><span>Portfelis</span><strong>{formatCurrency(data.currentValue, data.currency)}</strong><small>{data.activePlatformCount} aktyvių platformų</small></div>
        </div>
        <div className="dashboard-allocation-list">
          {rows.map((row, index) => (
            <div className="dashboard-allocation-row" key={row.key}>
              <i style={{ "--hue": 202 + index * 31 }} />
              <div><strong>{row.label}</strong><small>{row.activeCount} aktyvių{row.archivedCount > 0 ? ` • ${row.archivedCount} archyvuotų` : ""}</small></div>
              <div><strong>{formatCurrency(row.value, data.currency)}</strong><small>{formatPercentage(row.share)}</small></div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
