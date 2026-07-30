import { Link } from "react-router-dom";
import { formatCurrency, formatPercentage } from "../../utils/portfolioFormatters";

export default function TopPlatforms({ data }) {
  return (
    <article className="dashboard-card">
      <header className="dashboard-card-header"><div><span>TOP PLATFORMS</span><h2>Didžiausios platformos</h2><p>Rodomos tik šiuo metu aktyvios platformos.</p></div></header>
      <div className="dashboard-platform-list">
        {data.topPlatforms.map((platform, index) => {
          const content = <><span className="dashboard-platform-rank">{String(index + 1).padStart(2, "0")}</span><span className="dashboard-platform-name"><strong>{platform.name}</strong><small>{platform.category}</small></span><span className="dashboard-platform-value"><strong>{formatCurrency(platform.value, data.currency)}</strong><small>{formatPercentage(platform.share)}</small></span><span className="dashboard-platform-arrow">→</span></>;
          return platform.slug ? <Link className="dashboard-platform-row" key={platform.name} to={`/platforms/${platform.slug}`}>{content}</Link> : <div className="dashboard-platform-row" key={platform.name}>{content}</div>;
        })}
      </div>
    </article>
  );
}
