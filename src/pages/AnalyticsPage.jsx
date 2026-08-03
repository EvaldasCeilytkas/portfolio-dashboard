import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioOwner } from "../context/PortfolioContext";
import { requestJson } from "../services/jsonClient";
import "../styles/analytics.css";

const RANGES = [
  ["6M", 6], ["YTD", "ytd"], ["1Y", 12], ["3Y", 36], ["ALL", 0],
];

const euro = (v, digits = 2) => new Intl.NumberFormat("lt-LT", {
  style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits,
}).format(Number(v) || 0);
const pct = (v) => `${new Intl.NumberFormat("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v) || 0)} %`;
const month = (d) => new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "short" }).format(new Date(`${d}T12:00:00`));
const fullDate = (d) => d ? new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long", day: "numeric" }).format(new Date(`${d}T12:00:00`)) : "–";

function LineChart({ rows }) {
  const [hover, setHover] = useState(null);
  const ref = useRef(null);
  const width = 1000, height = 330, left = 62, right = 18, top = 20, bottom = 42;
  const values = rows.flatMap((r) => [Number(r.value) || 0, Number(r.invested) || 0]);
  const max = Math.max(...values, 1) * 1.08;
  const min = Math.min(0, ...values);
  const x = (i) => left + (rows.length <= 1 ? 0 : i / (rows.length - 1)) * (width - left - right);
  const y = (v) => top + (max - v) / Math.max(1, max - min) * (height - top - bottom);
  const path = (key) => rows.map((r, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(Number(r[key]) || 0).toFixed(1)}`).join(" ");
  const ticks = Array.from({ length: 5 }, (_, i) => max - i * (max - min) / 4);

  function move(e) {
    if (!ref.current || !rows.length) return;
    const rect = ref.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHover(Math.round((px / rect.width) * (rows.length - 1)));
  }
  const active = hover == null ? null : rows[hover];

  return <div className="an-chart-wrap" ref={ref} onMouseMove={move} onMouseLeave={() => setHover(null)}>
    <svg className="an-line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {ticks.map((t, i) => <g key={i}>
        <line x1={left} x2={width-right} y1={y(t)} y2={y(t)} className="an-grid-line" />
        <text x={left-12} y={y(t)+4} textAnchor="end" className="an-axis-text">{Math.round(t).toLocaleString("lt-LT")} €</text>
      </g>)}
      <path d={`${path("value")} L${x(rows.length-1)},${height-bottom} L${x(0)},${height-bottom} Z`} className="an-area" />
      <path d={path("invested")} className="an-line an-line-invested" />
      <path d={path("value")} className="an-line an-line-value" />
      {active && <>
        <line x1={x(hover)} x2={x(hover)} y1={top} y2={height-bottom} className="an-hover-line" />
        <circle cx={x(hover)} cy={y(active.value)} r="5" className="an-dot-value" />
        <circle cx={x(hover)} cy={y(active.invested)} r="5" className="an-dot-invested" />
      </>}
      {rows.filter((_, i) => i === 0 || i === rows.length-1 || i % Math.max(1, Math.ceil(rows.length/6)) === 0).map((r) => {
        const i = rows.indexOf(r); return <text key={r.date} x={x(i)} y={height-12} textAnchor={i===0?"start":i===rows.length-1?"end":"middle"} className="an-axis-text">{month(r.date)}</text>
      })}
    </svg>
    {active && <div className="an-tooltip" style={{ left: `${Math.min(82, Math.max(8, hover/(rows.length-1||1)*100))}%` }}>
      <strong>{month(active.date)}</strong>
      <span>Vertė <b>{euro(active.value)}</b></span>
      <span>Investuota <b>{euro(active.invested)}</b></span>
      <span>Pelnas <b className={(active.profit||0)>=0?"positive":"negative"}>{euro(active.profit)}</b></span>
      <span>Grąža <b>{pct(active.returnRate)}</b></span>
    </div>}
  </div>;
}

function MonthlyBars({ rows }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...rows.flatMap(r => [Math.abs(Number(r.monthlyResult)||0), Math.abs(Number(r.monthlyContribution)||0)]), 1);
  return <div className="an-bars-wrap">
    <div className="an-bars">
      {rows.map(r => <div className="an-bar-col" key={r.date} onMouseEnter={()=>setHovered(r)} onMouseLeave={()=>setHovered(null)}>
        <div className="an-bar-stage">
          <span className={`an-result-bar ${(r.monthlyResult||0)<0?"is-negative":""}`} style={{height:`${Math.max(2,Math.abs(r.monthlyResult||0)/max*100)}%`}} />
          <span className="an-contribution-bar" style={{height:`${Math.max(2,Math.abs(r.monthlyContribution||0)/max*100)}%`}} />
        </div>
        <small>{new Date(`${r.date}T12:00:00`).toLocaleDateString("lt-LT",{month:"short"})}</small>
      </div>)}
    </div>
    {hovered && <div className="an-bars-tooltip">
      <strong>{month(hovered.date)}</strong>
      <span>Rezultatas <b className={(hovered.monthlyResult||0)>=0?"positive":"negative"}>{euro(hovered.monthlyResult)}</b></span>
      <span>Įnašas <b>{euro(hovered.monthlyContribution)}</b></span>
      <span>Portfelio vertė <b>{euro(hovered.value)}</b></span>
      <span>Investuota <b>{euro(hovered.invested)}</b></span>
    </div>}
  </div>;
}

export default function AnalyticsPage() {
  const { ownerId, dataPath, selectOwner } = usePortfolioOwner();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState(12);
  const [platformSort, setPlatformSort] = useState("profit");
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    const controller = new AbortController();

    const ownerPath = (owner, fileName) => {
      const prefix = owner === "evaldas" ? "" : `${owner}/`;
      return `${import.meta.env.BASE_URL}data/${prefix}${fileName}`;
    };

    async function loadJson(path, optional = false) {
      return requestJson(path, { signal: controller.signal, optional });
    }

    function combineHistories(firstPayload, secondPayload) {
      const first = [...(firstPayload?.history || [])].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      const second = [...(secondPayload?.history || [])].sort((a,b)=>String(a.date).localeCompare(String(b.date)));
      const dates = [...new Set([...first, ...second].map((item)=>item.date))].sort();
      const firstByDate = new Map(first.map((item) => [item.date, item]));
      const secondByDate = new Map(second.map((item) => [item.date, item]));
      let a = null, b = null, ai = 0, bi = 0;
      const history = dates.map((date) => {
        while (ai < first.length && first[ai].date <= date) a = first[ai++];
        while (bi < second.length && second[bi].date <= date) b = second[bi++];
        const exactA = firstByDate.get(date);
        const exactB = secondByDate.get(date);
        const invested = (Number(a?.invested)||0) + (Number(b?.invested)||0);
        const value = (Number(a?.value)||0) + (Number(b?.value)||0);
        const profit = value - invested;
        return {
          date, invested, value, profit,
          returnRate: invested > 0 ? profit / invested * 100 : 0,
          monthlyContribution: (Number(exactA?.monthlyContribution)||0) + (Number(exactB?.monthlyContribution)||0),
          monthlyResult: (Number(exactA?.monthlyResult)||0) + (Number(exactB?.monthlyResult)||0),
        };
      });
      return { history, latest: history.at(-1) || {}, period: { months: history.length } };
    }

    function combinePlatforms(first, second) {
      const platforms = {};
      Object.entries(first?.platforms || {}).forEach(([slug, payload]) => {
        platforms[`evaldas:${slug}`] = { ...payload, ownerId: "evaldas", ownerName: "Evaldas", originalSlug: slug };
      });
      Object.entries(second?.platforms || {}).forEach(([slug, payload]) => {
        platforms[`rima:${slug}`] = { ...payload, ownerId: "rima", ownerName: "Rima", originalSlug: slug };
      });
      return { platforms };
    }

    async function loadOwner(owner) {
      const [portfolio, funds, p2p, platforms, portfolioData] = await Promise.all([
        loadJson(ownerPath(owner, "portfolio_history.json")),
        loadJson(ownerPath(owner, "funds_history.json")),
        loadJson(ownerPath(owner, "p2p_history.json")),
        loadJson(ownerPath(owner, "platform_history.json")),
        loadJson(ownerPath(owner, "portfolio.json"), true),
      ]);
      return { portfolio, funds, p2p, platforms, portfolioData };
    }

    const request = ownerId === "family"
      ? Promise.all([loadOwner("evaldas"), loadOwner("rima")]).then(([evaldas, rima]) => ({
          portfolio: combineHistories(evaldas.portfolio, rima.portfolio),
          funds: combineHistories(evaldas.funds, rima.funds),
          p2p: combineHistories(evaldas.p2p, rima.p2p),
          platforms: combinePlatforms(evaldas.platforms, rima.platforms),
          portfolioData: null,
          owners: { evaldas: evaldas.portfolio.latest || {}, rima: rima.portfolio.latest || {} },
        }))
      : Promise.all([
          loadJson(dataPath("portfolio_history.json")),
          loadJson(dataPath("funds_history.json")),
          loadJson(dataPath("p2p_history.json")),
          loadJson(dataPath("platform_history.json")),
          loadJson(dataPath("portfolio.json"), true),
        ]).then(([portfolio, funds, p2p, platforms, portfolioData]) => ({ portfolio, funds, p2p, platforms, portfolioData }));

    request.then((payload) => {
      if (live) { setData(payload); setError(""); }
    }).catch((error) => {
      if (live && error.name !== "AbortError") setError(`Nepavyko užkrauti ${error.message}`);
    });

    return () => { live = false; controller.abort(); };
  }, [dataPath, ownerId]);

  const model = useMemo(() => {
    if (!data) return null;
    const all = data.portfolio.history || [];
    const rows = range === "ytd"
      ? all.filter((r) => r.date.startsWith(String((all.at(-1)?.date || "").slice(0,4))))
      : range ? all.slice(-range) : all;
    const latest = data.portfolio.latest || all.at(-1) || {};
    const periodResult = rows.reduce((s,r)=>s+(Number(r.monthlyResult)||0),0);
    const periodContrib = rows.reduce((s,r)=>s+(Number(r.monthlyContribution)||0),0);
    const best = [...all].sort((a,b)=>(b.monthlyResult||0)-(a.monthlyResult||0))[0];
    const worst = [...all].sort((a,b)=>(a.monthlyResult||0)-(b.monthlyResult||0))[0];
    const positive = all.filter(r => (r.monthlyResult||0)>0).length;
    const years = Object.values(all.reduce((acc,r)=>{
      const y=r.date.slice(0,4); acc[y] ||= {year:y,result:0,contribution:0,start:null,end:null};
      acc[y].result += Number(r.monthlyResult)||0; acc[y].contribution += Number(r.monthlyContribution)||0;
      acc[y].start ||= r; acc[y].end=r; return acc;
    },{})).map(y=>{
      const base = Math.max(1, (Number(y.start?.invested)||0) + y.contribution / 2);
      return {...y, roi: y.result / base * 100};
    });
    const aggregateSlugs = new Set(["viso", "p2p", "fondai"]);
    const platforms = Object.entries(data.platforms.platforms || {})
      .map(([key,p])=>{
        const slug = p.originalSlug || key;
        const h=p.history||[], last=h.at(-1)||{};
        const meta=(data.portfolioData?.platforms||[]).find(item=>item.slug===slug)||{};
        const website=meta.website||"";
        let logoUrl="";
        try { const domain=new URL(website).hostname; logoUrl=`https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(domain)}&sz=128`; } catch {}
        return {key,slug,name:p.name,value:+last.value||0,invested:+last.invested||0,profit:+last.profit||0,roi:+last.returnRate||0,logoUrl,ownerId:p.ownerId,ownerName:p.ownerName};
      })
      .filter((p)=>p.value>0 && !aggregateSlugs.has(p.slug));
    const topProfit=[...platforms].sort((a,b)=>b.profit-a.profit)[0]||null;
    const topRoi=[...platforms].sort((a,b)=>b.roi-a.roi)[0]||null;
    const topValue=[...platforms].sort((a,b)=>b.value-a.value)[0]||null;
    return {all,rows,latest,periodResult,periodContrib,best,worst,positive,years,platforms,topProfit,topRoi,topValue};
  }, [data, range]);

  if (error) return <main className="analytics-page"><div className="analytics-state analytics-state-error"><h2>Analytics neužsikrovė</h2><p>{error}</p></div></main>;
  if (!model) return <main className="analytics-page"><div className="analytics-state"><span className="dashboard-loader"/><h2>Kraunami Analytics duomenys...</h2></div></main>;

  const { latest } = model;
  return <main className="analytics-page">
    <section className="an-hero">
      <div><p>{ownerId === "family" ? "FAMILY PORTFOLIO INTELLIGENCE" : "PORTFOLIO INTELLIGENCE"}</p><h1>{ownerId === "family" ? "Šeimos Analytics" : "Analytics"}</h1><span>{ownerId === "family" ? "Bendras Evaldo ir Rimos portfelio augimas, pinigų srautai ir platformų rezultatai." : "Portfelio augimas, pinigų srautai ir rezultatų kokybė vienoje vietoje."}</span></div>
      <div className="an-hero-main"><small>Dabartinė vertė</small><strong>{euro(latest.value)}</strong><b className={latest.profit>=0?"positive":"negative"}>{euro(latest.profit)} · {pct(latest.returnRate)}</b></div>
      <div className="an-hero-meta"><span>Atnaujinta <b>{fullDate(latest.date)}</b></span><span>Istorija <b>{model.all.length} mėn.</b></span></div>
    </section>

    <section className="an-kpi-grid">
      <article><span>Investuota</span><strong>{euro(latest.invested)}</strong><small>Bendras kapitalas</small></article>
      <article><span>Laikotarpio rezultatas</span><strong className={model.periodResult>=0?"positive":"negative"}>{euro(model.periodResult)}</strong><small>Pasirinktas grafiko laikotarpis</small></article>
      <article><span>Laikotarpio įnašai</span><strong>{euro(model.periodContrib)}</strong><small>Naujas investuotas kapitalas</small></article>
      <article><span>Teigiami mėnesiai</span><strong>{model.positive} / {model.all.length}</strong><small>{pct(model.positive/model.all.length*100)} sėkmės dažnis</small></article>
    </section>

    {ownerId === "family" && data.owners && <section className="an-family-grid">
      {[['evaldas','Evaldas'],['rima','Rima']].map(([id,name]) => {
        const item=data.owners[id]||{};
        const share=latest.value>0?(Number(item.value)||0)/latest.value*100:0;
        return <article key={id} className={`an-family-owner is-${id}`}>
          <div><span>{name}</span><strong>{euro(item.value)}</strong></div>
          <div className="an-family-track"><i style={{width:`${share}%`}} /></div>
          <small>{pct(share)} šeimos portfelio · pelnas <b className={(item.profit||0)>=0?'positive':'negative'}>{euro(item.profit)}</b></small>
        </article>;
      })}
    </section>}

    <section className="an-card an-growth-card">
      <header className="an-card-head"><div><p>PORTFELIO DINAMIKA</p><h2>Vertė ir investuotas kapitalas</h2><span>Mėnesinė istorija iš Investavimas.xlsx</span></div>
        <div className="an-range">{RANGES.map(([label,val])=><button key={label} className={range===val?"active":""} onClick={()=>setRange(val)}>{label}</button>)}</div>
      </header>
      <div className="an-legend"><span><i className="value"/>Portfelio vertė</span><span><i className="invested"/>Investuota</span></div>
      <LineChart rows={model.rows}/>
    </section>

    <section className="an-two-grid">
      <article className="an-card"><header className="an-card-head"><div><p>PINIGŲ SRAUTAS</p><h2>Mėnesio rezultatai ir įnašai</h2><span>Paskutiniai 12 mėnesių</span></div></header><div className="an-legend"><span><i className="result"/>Rezultatas</span><span><i className="contribution"/>Įnašas</span></div><MonthlyBars rows={model.all.slice(-12)}/></article>
      <article className="an-card"><header className="an-card-head"><div><p>TURTO KLASĖS</p><h2>Fondai ir P2P</h2><span>Dabartinis rezultatas</span></div></header>
        {[data.funds.latest,data.p2p.latest].map((r,i)=><div className="an-compare" key={i}><div><strong>{i===0?"Fondai ir brokeriai":"P2P ir NT"}</strong><span>{euro(r.value)}</span></div><div className="an-progress"><i style={{width:`${Math.max(3,r.value/latest.value*100)}%`}}/></div><div><small>Pelnas <b className={r.profit>=0?"positive":"negative"}>{euro(r.profit)}</b></small><small>ROI <b>{pct(r.returnRate)}</b></small></div></div>)}
      </article>
    </section>

    <section className="an-two-grid an-bottom-grid">
      <article className="an-card"><header className="an-card-head"><div><p>METINIAI REZULTATAI</p><h2>Portfelio rezultatas pagal metus</h2></div></header><div className="an-year-list">{model.years.map(y=><div key={y.year}><strong>{y.year}</strong><span className={y.result>=0?"positive":"negative"}>{euro(y.result)}</span><small>Įnašai {euro(y.contribution,0)}</small><small>ROI <b className={y.roi>=0?"positive":"negative"}>{pct(y.roi)}</b></small></div>)}</div></article>
      <article className="an-card">
        <header className="an-card-head an-platform-head">
          <div>
            <p>PLATFORMŲ INDĖLIS</p>
            <h2>{platformSort === "profit" ? "Daugiausiai pelno sukūrusios platformos" : "Didžiausią grąžą turinčios platformos"}</h2>
            <span>Rodomos tik realios platformos, be bendrų P2P, fondų ir viso portfelio grupių.</span>
          </div>
          <div className="an-platform-sort" role="group" aria-label="Platformų rikiavimas">
            <button className={platformSort === "profit" ? "active" : ""} onClick={()=>setPlatformSort("profit")}>Pagal pelną</button>
            <button className={platformSort === "roi" ? "active" : ""} onClick={()=>setPlatformSort("roi")}>Pagal ROI</button>
          </div>
        </header>
        <div className="an-platform-list">
          {[...model.platforms]
            .sort((a,b)=>platformSort === "roi" ? b.roi-a.roi : b.profit-a.profit)
            .slice(0,8)
            .map((p,i)=><button type="button" key={p.key || `${p.ownerId}:${p.slug}`} className="an-platform-row" onClick={()=>{ if (p.ownerId) selectOwner(p.ownerId); navigate(`/platforms/${p.slug}`); }}>
              <b className="an-platform-logo">{p.logoUrl ? <img src={p.logoUrl} alt="" /> : p.name.slice(0,1)}</b>
              <span><strong>{p.name}{p.ownerName ? <em className={`an-owner-badge is-${p.ownerId}`}>{p.ownerName}</em> : null}</strong><small>{euro(p.value)} vertė</small></span>
              <em className={platformSort === "profit" ? (p.profit>=0?"positive":"negative") : (p.roi>=0?"positive":"negative")}>
                {platformSort === "profit" ? euro(p.profit) : pct(p.roi)}
              </em>
              <i aria-hidden="true">→</i>
            </button>)}
        </div>
      </article>
    </section>

    <section className="an-card an-waterfall-card">
      <header className="an-card-head"><div><p>VERTĖS SUDĖTIS</p><h2>Kaip susidarė dabartinė portfelio vertė</h2><span>Investuotas kapitalas, investicijų rezultatas ir dabartinė vertė.</span></div></header>
      <div className="an-waterfall">
        <div className="an-waterfall-step is-base"><span>Investuota</span><strong>{euro(latest.invested)}</strong><i style={{height:`${Math.max(18, latest.invested/latest.value*100)}%`}} /></div>
        <div className={`an-waterfall-step is-change ${latest.profit>=0?"is-positive":"is-negative"}`}><span>Investicijų rezultatas</span><strong>{euro(latest.profit)}</strong><i style={{height:`${Math.max(8, Math.abs(latest.profit)/latest.value*100)}%`}} /></div>
        <div className="an-waterfall-equals">=</div>
        <div className="an-waterfall-step is-total"><span>Dabartinė vertė</span><strong>{euro(latest.value)}</strong><i style={{height:"100%"}} /></div>
      </div>
    </section>

    <section className="an-insights an-insights-six">
      <article><span>Geriausias mėnuo</span><strong>{month(model.best.date)}</strong><b className="positive">{euro(model.best.monthlyResult)}</b></article>
      <article><span>Silpniausias mėnuo</span><strong>{month(model.worst.date)}</strong><b className="negative">{euro(model.worst.monthlyResult)}</b></article>
      <article className="is-clickable" onClick={()=>{if(model.topProfit?.ownerId)selectOwner(model.topProfit.ownerId);if(model.topProfit)navigate(`/platforms/${model.topProfit.slug}`)}}><span>Didžiausias pelnas</span><strong>{model.topProfit?.name || "–"}</strong><b className="positive">{euro(model.topProfit?.profit)}</b></article>
      <article className="is-clickable" onClick={()=>{if(model.topRoi?.ownerId)selectOwner(model.topRoi.ownerId);if(model.topRoi)navigate(`/platforms/${model.topRoi.slug}`)}}><span>Didžiausia ROI</span><strong>{model.topRoi?.name || "–"}</strong><b className="positive">{pct(model.topRoi?.roi)}</b></article>
      <article className="is-clickable" onClick={()=>{if(model.topValue?.ownerId)selectOwner(model.topValue.ownerId);if(model.topValue)navigate(`/platforms/${model.topValue.slug}`)}}><span>Didžiausia vertė</span><strong>{model.topValue?.name || "–"}</strong><b>{euro(model.topValue?.value)}</b></article>
    </section>
  </main>;
}
