import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PerformanceChart from "../charts/PerformanceChart";
import "./robo.css";

const num = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const money = (v) => new Intl.NumberFormat("lt-LT",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(num(v));
const pct = (v,d=2) => `${new Intl.NumberFormat("lt-LT",{minimumFractionDigits:d,maximumFractionDigits:d}).format(num(v))} %`;
const dateFmt = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : new Intl.DateTimeFormat("lt-LT",{year:"numeric",month:"short",day:"2-digit"}).format(d);
};

function SoldBadge(){ return <span className="robo-status">Parduota</span>; }

function PositionTable({items, slug}) {
  const [query,setQuery] = useState("");
  const [sort,setSort] = useState("profit");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...items]
      .filter(x => !q || [x.ticker,x.name,x.fullName].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
      .sort((a,b) =>
        sort==="return" ? num(b.returnRate)-num(a.returnRate) :
        sort==="invested" ? num(b.invested)-num(a.invested) :
        num(b.profit)-num(a.profit)
      );
  },[items,query,sort]);

  return (
    <section className="robo-table-card">
      <div className="robo-table-title">
        <div>
          <span>ROBO PORTFELIS</span>
          <h2>Parduotos ETF pozicijos</h2>
          <p>Visos SEB Robo pozicijos uždarytos.</p>
        </div>
        <strong>{rows.length}</strong>
      </div>

      <div className="robo-tools">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Ieškoti pagal ETF arba tickerį"/>
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="profit">Pagal pelną</option>
          <option value="return">Pagal grąžą</option>
          <option value="invested">Pagal investuotą sumą</option>
        </select>
      </div>

      <div className="robo-table-wrap">
        <table className="robo-table">
          <thead>
            <tr><th>ETF</th><th>Investuota</th><th>Pelnas</th><th>Grąža</th><th>Dividendai</th><th>Pabaiga</th><th>Statusas</th><th/></tr>
          </thead>
          <tbody>
            {rows.map(x => {
              const route=`/platforms/${slug}/projects/${encodeURIComponent(x.id||x.slug)}`;
              return (
                <tr key={x.id}>
                  <td className="robo-name-cell">
                    <Link to={route}><strong>{x.ticker}</strong><span>{x.name}</span></Link>
                  </td>
                  <td>{money(x.invested)}</td>
                  <td className={num(x.profit)>=0?"positive":"negative"}>{money(x.profit)}</td>
                  <td className={num(x.returnRate)>=0?"positive":"negative"}>{x.returnRate==null?"—":pct(x.returnRate)}</td>
                  <td>{money(x.dividends)}</td>
                  <td>{dateFmt(x.endDate)}</td>
                  <td><SoldBadge/></td>
                  <td><Link className="robo-open" to={route}>Atidaryti →</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function RoboPlatformProfile({data}) {
  const p=data.platform||{}, s=data.summary||{}, items=Array.isArray(data.investments)?data.investments:[];
  const best=[...items].sort((a,b)=>num(b.profit)-num(a.profit))[0];

  return (
    <main className="robo-page">
      <Link className="robo-back" to="/portfolio">← Grįžti į portfelį</Link>

      <section className="robo-hero">
        <div>
          <span className="robo-eyebrow">UŽDARYTO ROBO ADVISOR PORTFELIO PROFILIS</span>
          <h1>{p.name}</h1>
          <div className="robo-badges">
            <span className="robo-closed">Uždaryta</span>
            <span>{p.category}</span>
            <span>Nuo {dateFmt(p.startDate)}</span>
          </div>
          <div className="robo-hero-summary">
            <strong>{s.completedInvestments||items.length} parduotos</strong>
            <span>•</span>
            <strong>{money(s.totalContributed)} įnešta</strong>
            <span>•</span>
            <strong>{money(s.realizedProceeds)} išmokėta</strong>
          </div>
        </div>

        <div className="robo-hero-value">
          <span>REALIZUOTAS REZULTATAS</span>
          <strong className="positive">+{money(s.realizedProfit)}</strong>
          <small>Uždaryta {dateFmt(p.updatedAt)}</small>
          {p.website&&<a href={p.website} target="_blank" rel="noreferrer">Atidaryti platformą ↗</a>}
        </div>
      </section>

      <section className="robo-metrics">
        <article><span>Įnešta</span><strong>{money(s.totalContributed)}</strong><small>Bendras kapitalas</small></article>
        <article><span>Išmokėta</span><strong>{money(s.realizedProceeds)}</strong><small>Po portfelio uždarymo</small></article>
        <article><span>Realizuotas pelnas</span><strong className="positive">{money(s.realizedProfit)}</strong><small>Grąža {pct(s.returnRate)}</small></article>
        <article><span>Parduotos pozicijos</span><strong>{s.completedInvestments||items.length}</strong><small>Aktyvių nėra</small></article>
        <article><span>Dividendai</span><strong>{money(s.incomeReceived)}</strong><small>Gautos pajamos</small></article>
        <article><span>Mokesčiai</span><strong>{money(s.fees)}</strong><small>Viso</small></article>
      </section>

      <section className="robo-card robo-chart">
        <div className="robo-card-heading"><div><span>PORTFELIO ISTORIJA</span><h2>Vertė ir investuotas kapitalas</h2></div></div>
        <PerformanceChart history={data.chartHistory||[]} />
      </section>

      <section className="robo-feature-grid">
        <article className="robo-card">
          <div className="robo-card-heading">
            <div><span>PORTFELIO UŽDARYMAS</span><h2>Galutinis rezultatas</h2></div>
            <strong className="positive">{pct(s.returnRate)}</strong>
          </div>
          <div className="robo-progress-track"><i style={{width:"100%"}}/></div>
          <div className="robo-progress-labels"><span>{money(s.totalContributed)} įnešta</span><span>{money(s.realizedProceeds)} išmokėta</span></div>
          <div className="robo-details">
            <div><span>Realizuotas pelnas</span><strong>{money(s.realizedProfit)}</strong></div>
            <div><span>Dabartinė vertė</span><strong>{money(s.currentValue)}</strong></div>
            <div><span>Aktyvios pozicijos</span><strong>{s.activeInvestments||0}</strong></div>
            <div><span>Parduotos pozicijos</span><strong>{s.completedInvestments||items.length}</strong></div>
          </div>
        </article>

        <article className="robo-card">
          <div className="robo-card-heading">
            <div><span>GERIAUSIA POZICIJA</span><h2>{best?.ticker||"—"}</h2></div>
            <strong className={num(best?.profit)>=0?"positive":"negative"}>{money(best?.profit)}</strong>
          </div>
          {best&&<>
            <p className="robo-largest-name">{best.name}</p>
            <div className="robo-badges"><SoldBadge/><span>{best.type}</span></div>
            <div className="robo-details">
              <div><span>Investuota</span><strong>{money(best.invested)}</strong></div>
              <div><span>Grąža</span><strong>{pct(best.returnRate)}</strong></div>
              <div><span>Dividendai</span><strong>{money(best.dividends)}</strong></div>
              <div><span>Pabaiga</span><strong>{dateFmt(best.endDate)}</strong></div>
            </div>
            <Link className="robo-primary-button" to={`/platforms/${p.slug}/projects/${encodeURIComponent(best.id||best.slug)}`}>Atidaryti ETF →</Link>
          </>}
        </article>
      </section>

      <PositionTable items={items} slug={p.slug}/>
    </main>
  );
}
