import { Link } from "react-router-dom";
import "./robo.css";

const n=v=>Number.isFinite(Number(v))?Number(v):0;
const money=v=>new Intl.NumberFormat("lt-LT",{style:"currency",currency:"EUR",minimumFractionDigits:2,maximumFractionDigits:2}).format(n(v));
const pct=(v,d=2)=>`${new Intl.NumberFormat("lt-LT",{minimumFractionDigits:d,maximumFractionDigits:d}).format(n(v))} %`;
const dateFmt=v=>{if(!v)return"—";const d=new Date(v);return Number.isNaN(d.getTime())?String(v):new Intl.DateTimeFormat("lt-LT",{year:"numeric",month:"short",day:"2-digit"}).format(d)};

export default function RoboInvestmentProfile({platform,investment}){
  return (
    <main className="robo-page">
      <Link className="robo-back" to={`/platforms/${platform.slug}`}>← Grįžti į {platform.name}</Link>

      <section className="robo-investment-hero">
        <div>
          <span className="robo-eyebrow">PARDUOTOS ETF POZICIJOS PROFILIS</span>
          <h1>{investment.ticker}</h1>
          <p>{investment.name}</p>
          <div className="robo-badges"><span className="robo-closed">Parduota</span><span>{investment.type}</span><span>{investment.currency}</span></div>
        </div>
        <div className="robo-hero-value">
          <span>REALIZUOTAS PELNAS</span>
          <strong className={n(investment.profit)>=0?"positive":"negative"}>{money(investment.profit)}</strong>
          <small>Grąža {investment.returnRate==null?"—":pct(investment.returnRate)}</small>
        </div>
      </section>

      <section className="robo-metrics">
        <article><span>Investuota</span><strong>{money(investment.invested)}</strong></article>
        <article><span>Realizuotas pelnas</span><strong className={n(investment.profit)>=0?"positive":"negative"}>{money(investment.profit)}</strong></article>
        <article><span>Grąža</span><strong className={n(investment.returnRate)>=0?"positive":"negative"}>{investment.returnRate==null?"—":pct(investment.returnRate)}</strong></article>
        <article><span>Dividendai</span><strong>{money(investment.dividends)}</strong></article>
        <article><span>Dabartinė vertė</span><strong>{money(investment.currentValue)}</strong></article>
        <article><span>Statusas</span><strong>Parduota</strong></article>
      </section>

      <section className="robo-feature-grid">
        <article className="robo-card">
          <div className="robo-card-heading"><div><span>POZICIJOS BŪSENA</span><h2>Pozicija uždaryta</h2></div><strong>100 %</strong></div>
          <div className="robo-progress-track"><i style={{width:"100%"}}/></div>
          <div className="robo-progress-labels"><span>ETF realizuotas</span><span>{dateFmt(investment.endDate)}</span></div>
        </article>

        <article className="robo-card">
          <div className="robo-card-heading"><div><span>ETF INFORMACIJA</span><h2>Pagrindiniai duomenys</h2></div></div>
          <div className="robo-details">
            <div><span>Tickeris</span><strong>{investment.ticker}</strong></div>
            <div><span>Tipas</span><strong>{investment.type}</strong></div>
            <div><span>Pradžia</span><strong>{dateFmt(investment.startDate)}</strong></div>
            <div><span>Pabaiga</span><strong>{dateFmt(investment.endDate)}</strong></div>
            <div><span>Istoriškai investuota</span><strong>{money(investment.invested)}</strong></div>
            <div><span>Dividendai</span><strong>{money(investment.dividends)}</strong></div>
          </div>
        </article>
      </section>
    </main>
  );
}
