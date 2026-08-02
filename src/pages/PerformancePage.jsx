import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioOwner } from "../context/PortfolioContext";
import { loadPortfolioHistory, loadPortfolioPlatforms, PORTFOLIO_GROUP_LABELS } from "../services/portfolioService";
import "../styles/performance-center.css";

const money = (value, digits = 2) => new Intl.NumberFormat("lt-LT", {
  style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits,
}).format(Number(value) || 0);
const percent = (value) => `${new Intl.NumberFormat("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} %`;
const monthLabel = (date) => date ? new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long" }).format(new Date(`${date}T12:00:00`)) : "–";
const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);

const GROUP_ORDER = ["brokerage", "funds", "robo", "p2p", "real_estate"];
const GROUP_LABELS = {
  ...PORTFOLIO_GROUP_LABELS,
  brokerage: "Brokeriai ir ETF",
  funds: "Fondai",
  robo: "Robo investavimas",
  p2p: "P2P",
  real_estate: "NT finansavimas",
};

function OwnerBadge({ ownerId, ownerName }) {
  return <span className={`pc-owner is-${ownerId}`}>{ownerName}</span>;
}

function PlatformMark({ platform }) {
  return <span className="pc-platform-mark" style={{ background: platform.brandColorSoft, color: platform.brandColor }}>
    {platform.logoUrl ? <img src={platform.logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
    <b>{platform.logoText}</b>
  </span>;
}

export default function PerformancePage() {
  const { ownerId, owner, selectOwner } = usePortfolioOwner();
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState([]);
  const [history, setHistory] = useState([]);
  const [sortBy, setSortBy] = useState("profit");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    Promise.all([loadPortfolioPlatforms(ownerId), loadPortfolioHistory(ownerId)])
      .then(([platformRows, historyPayload]) => {
        if (!alive) return;
        setPlatforms(platformRows);
        setHistory(historyPayload.history || []);
        setError("");
        setStatus("ready");
      })
      .catch((reason) => {
        if (!alive) return;
        setError(reason?.message || "Nepavyko užkrauti Performance Center duomenų.");
        setStatus("error");
      });
    return () => { alive = false; };
  }, [ownerId]);

  useEffect(() => {
    setOwnerFilter("all");
  }, [ownerId]);

  const model = useMemo(() => {
    const active = platforms.filter((item) => item.isActive || item.currentValue > 0 || item.invested > 0);
    const ranked = active.filter((item) => item.invested > 0 || item.currentValue > 0);
    const latest = history.at(-1) || {};
    const totalValue = Number(latest.value) || sum(active, "currentValue");
    const totalInvested = Number(latest.invested) || sum(active, "invested");
    const totalProfit = Number(latest.profit) || totalValue - totalInvested;

    const topProfit = [...ranked].sort((a, b) => b.profit - a.profit)[0] || null;
    const topRoi = [...ranked].filter((item) => item.invested > 0).sort((a, b) => b.returnRate - a.returnRate)[0] || null;
    const topValue = [...ranked].sort((a, b) => b.currentValue - a.currentValue)[0] || null;
    const risky = [...ranked].sort((a, b) => b.delayedInvestments - a.delayedInvestments || b.currentValue - a.currentValue)[0] || null;

    const monthly = history.map((item) => ({ ...item, monthlyResult: Number(item.monthlyResult) || 0 }));
    const bestMonth = [...monthly].sort((a, b) => b.monthlyResult - a.monthlyResult)[0] || null;
    const worstMonth = [...monthly].sort((a, b) => a.monthlyResult - b.monthlyResult)[0] || null;
    const avgMonth = monthly.length ? sum(monthly, "monthlyResult") / monthly.length : 0;

    const groups = GROUP_ORDER.map((group) => {
      const rows = active.filter((item) => item.group === group);
      const invested = sum(rows, "invested");
      const value = sum(rows, "currentValue");
      const profit = sum(rows, "profit");
      return {
        group,
        label: GROUP_LABELS[group] || group,
        rows,
        invested,
        value,
        profit,
        roi: invested > 0 ? profit / invested * 100 : 0,
        averageProfit: rows.length > 0 ? profit / rows.length : 0,
        averageValue: rows.length > 0 ? value / rows.length : 0,
      };
    }).filter((item) => item.rows.length > 0 && (item.value > 0 || item.invested > 0));

    const ownerFilteredPlatforms = ownerId === "family" && ownerFilter !== "all"
      ? ranked.filter((item) => item.ownerId === ownerFilter)
      : ranked;

    const sortedPlatforms = [...ownerFilteredPlatforms].sort((a, b) => {
      if (sortBy === "roi") return b.returnRate - a.returnRate;
      if (sortBy === "value") return b.currentValue - a.currentValue;
      return b.profit - a.profit;
    });

    const totalInvestments = sum(active, "totalInvestments");
    const activeInvestments = sum(active, "activeInvestments");
    const delayedInvestments = sum(active, "delayedInvestments");
    const completedInvestments = sum(active, "completedInvestments");
    const delayedShare = activeInvestments > 0 ? delayedInvestments / activeInvestments * 100 : 0;
    const maxShare = totalValue > 0 && topValue ? topValue.currentValue / totalValue * 100 : 0;
    const avgInvestmentsPerPlatform = active.length > 0 ? totalInvestments / active.length : 0;
    const avgValuePerPlatform = active.length > 0 ? totalValue / active.length : 0;
    const positiveMonths = monthly.filter((row) => row.monthlyResult > 0).length;

    return { active, ranked, latest, totalValue, totalInvested, totalProfit, topProfit, topRoi, topValue, risky, bestMonth, worstMonth, avgMonth, groups, sortedPlatforms, totalInvestments, activeInvestments, delayedInvestments, completedInvestments, delayedShare, maxShare, avgInvestmentsPerPlatform, avgValuePerPlatform, positiveMonths };
  }, [platforms, history, sortBy, ownerFilter, ownerId]);

  function openPlatform(platform) {
    if (ownerId === "family" && platform.ownerId) selectOwner(platform.ownerId);
    navigate(`/platforms/${platform.slug}`);
  }

  if (status === "loading") return <main className="performance-center"><div className="pc-state"><span className="dashboard-loader" /><h2>Kraunamas Performance Center...</h2></div></main>;
  if (status === "error") return <main className="performance-center"><div className="pc-state is-error"><h2>Performance Center neužsikrovė</h2><p>{error}</p></div></main>;

  const heroTitle = ownerId === "family" ? "Šeimos Performance Center" : `${owner.name} – Performance Center`;

  return <main className="performance-center">
    <section className="pc-hero">
      <div className="pc-hero-copy"><p>INVESTICIJŲ EFEKTYVUMAS</p><h1>{heroTitle}</h1><span>Kas uždirba daugiausia, kur sukaupta daugiausia kapitalo ir kur verta atkreipti dėmesį.</span></div>
      <div className="pc-hero-result"><small>Bendras rezultatas</small><strong>{money(model.totalProfit)}</strong><b className={model.totalProfit >= 0 ? "positive" : "negative"}>{percent(model.totalInvested > 0 ? model.totalProfit / model.totalInvested * 100 : 0)}</b></div>
      <div className="pc-hero-meta"><span>Portfelio vertė <b>{money(model.totalValue)}</b></span><span>Aktyvios platformos <b>{model.active.length}</b></span></div>
    </section>

    <section className="pc-kpi-grid">
      <article><span>Didžiausias pelnas</span><strong>{model.topProfit?.name || "–"}</strong><b className="positive">{money(model.topProfit?.profit)}</b>{model.topProfit && <OwnerBadge {...model.topProfit} />}</article>
      <article><span>Didžiausias ROI</span><strong>{model.topRoi?.name || "–"}</strong><b className="positive">{percent(model.topRoi?.returnRate)}</b>{model.topRoi && <><small>{money(model.topRoi.invested)} investuota · {money(model.topRoi.profit)} pelno</small><OwnerBadge {...model.topRoi} /></>}</article>
      <article><span>Didžiausia pozicija</span><strong>{model.topValue?.name || "–"}</strong><b>{money(model.topValue?.currentValue)}</b><small>{percent(model.maxShare)} portfelio</small></article>
      <article><span>Geriausias mėnuo</span><strong>{monthLabel(model.bestMonth?.date)}</strong><b className="positive">{money(model.bestMonth?.monthlyResult)}</b><small>Istorinis mėnesio rezultatas</small></article>
      <article><span>Vėlavimų dalis</span><strong>{percent(model.delayedShare)}</strong><b className={model.delayedInvestments > 0 ? "warning" : "positive"}>{model.delayedInvestments} vėluoja</b><small>Iš {model.activeInvestments} aktyvių investicijų</small></article>
    </section>

    <section className="pc-grid pc-grid-main">
      <article className="pc-card pc-class-card">
        <header><div><p>TURTO KLASĖS</p><h2>Efektyvumo palyginimas</h2></div><span>ROI pagal dabartinę platformų suvestinę</span></header>
        <div className="pc-class-list">
          {model.groups.map((item) => {
            const max = Math.max(...model.groups.map((group) => Math.max(group.roi, 0)), 1);
            return <div className="pc-class-row" key={item.group}>
              <div className="pc-class-name"><strong>{item.label}</strong><span>{item.rows.length} platformos</span></div>
              <div className="pc-class-track"><i style={{ width: `${Math.max(3, item.roi / max * 100)}%` }} /></div>
              <div className="pc-class-metrics"><span>Vertė <b>{money(item.value)}</b></span><span>Pelnas <b className={item.profit >= 0 ? "positive" : "negative"}>{money(item.profit)}</b></span><span>Vid. pelnas <b className={item.averageProfit >= 0 ? "positive" : "negative"}>{money(item.averageProfit)}</b></span><span>ROI <b className={item.roi >= 0 ? "positive" : "negative"}>{percent(item.roi)}</b></span></div>
            </div>;
          })}
        </div>
      </article>

      <article className="pc-card pc-month-card">
        <header><div><p>LAIKO EFEKTYVUMAS</p><h2>Mėnesių analizė</h2></div></header>
        <div className="pc-month-grid">
          <div className="is-best"><span>Geriausias mėnuo</span><strong>{monthLabel(model.bestMonth?.date)}</strong><b>{money(model.bestMonth?.monthlyResult)}</b></div>
          <div className="is-worst"><span>Silpniausias mėnuo</span><strong>{monthLabel(model.worstMonth?.date)}</strong><b>{money(model.worstMonth?.monthlyResult)}</b></div>
          <div><span>Vidutinis mėnuo</span><strong>{money(model.avgMonth)}</strong><small>Per {history.length} mėn. istoriją</small></div>
          <div><span>Teigiami mėnesiai</span><strong>{model.positiveMonths} / {history.length}</strong><small>Pelningų mėnesių dažnis</small></div>
        </div>
      </article>
    </section>

    <section className="pc-card pc-ranking-card">
      <header className="pc-ranking-head"><div><p>PLATFORMŲ REITINGAS</p><h2>TOP platformos pagal rezultatą</h2><span>Spustelėjus eilutę atidaromas detalus platformos puslapis.</span></div>
        <div className="pc-ranking-controls">
          {ownerId === "family" && <div className="pc-segmented pc-owner-filter" aria-label="Platformų savininkas"><button className={ownerFilter === "all" ? "active" : ""} onClick={() => setOwnerFilter("all")}>Visi</button><button className={ownerFilter === "evaldas" ? "active" : ""} onClick={() => setOwnerFilter("evaldas")}>Evaldas</button><button className={ownerFilter === "rima" ? "active" : ""} onClick={() => setOwnerFilter("rima")}>Rima</button></div>}
          <div className="pc-segmented"><button className={sortBy === "profit" ? "active" : ""} onClick={() => setSortBy("profit")}>Pelnas</button><button className={sortBy === "roi" ? "active" : ""} onClick={() => setSortBy("roi")}>ROI</button><button className={sortBy === "value" ? "active" : ""} onClick={() => setSortBy("value")}>Vertė</button></div>
        </div>
      </header>
      <div className="pc-table-wrap"><table className="pc-table"><thead><tr><th>#</th><th>Platforma</th><th>Turto klasė</th><th>Investuota</th><th>Vertė</th><th>Pelnas</th><th>ROI</th></tr></thead><tbody>
        {model.sortedPlatforms.slice(0, 12).map((platform, index) => <tr key={`${platform.ownerId}:${platform.slug}`} onClick={() => openPlatform(platform)}>
          <td><span className={`pc-rank ${index < 3 ? `is-${index + 1}` : ""}`}>{index + 1}</span></td>
          <td><div className="pc-platform-cell"><PlatformMark platform={platform} /><div><strong>{platform.name}</strong>{ownerId === "family" && <OwnerBadge {...platform} />}</div></div></td>
          <td>{GROUP_LABELS[platform.group] || platform.category}</td><td>{money(platform.invested)}</td><td><b>{money(platform.currentValue)}</b></td><td className={platform.profit >= 0 ? "positive" : "negative"}>{money(platform.profit)}</td><td><b>{percent(platform.returnRate)}</b></td>
        </tr>)}
      </tbody></table></div>
    </section>

    <section className="pc-grid pc-grid-bottom">
      <article className="pc-card"><header><div><p>KONCENTRACIJA</p><h2>Didžiausios pozicijos</h2></div></header><div className="pc-position-list">
        {[...model.ranked].sort((a, b) => b.currentValue - a.currentValue).slice(0, 8).map((platform, index) => {
          const share = model.totalValue > 0 ? platform.currentValue / model.totalValue * 100 : 0;
          return <button key={`${platform.ownerId}:${platform.slug}`} onClick={() => openPlatform(platform)}><span>{index + 1}</span><div><strong>{platform.name}</strong>{ownerId === "family" && <OwnerBadge {...platform} />}</div><i><em style={{ width: `${share}%` }} /></i><b>{money(platform.currentValue)}</b><small>{percent(share)}</small></button>;
        })}
      </div></article>

      <article className="pc-card"><header><div><p>RIZIKOS SUVESTINĖ</p><h2>Portfelio būklė</h2></div></header><div className="pc-risk-grid">
        <div><span>Platformos</span><strong>{model.active.length}</strong><small>Aktyvios</small></div><div><span>Investicijos</span><strong>{model.totalInvestments}</strong><small>Visos pozicijos</small></div><div><span>Aktyvios</span><strong>{model.activeInvestments}</strong><small>Dabar portfelyje</small></div><div className={model.delayedInvestments ? "is-warning" : ""}><span>Vėluojančios</span><strong>{model.delayedInvestments}</strong><small>{percent(model.delayedShare)} aktyvių</small></div><div><span>Užbaigtos</span><strong>{model.completedInvestments}</strong><small>Istorinės pozicijos</small></div><div><span>Vidutinė aktyvi</span><strong>{money(model.activeInvestments > 0 ? model.totalValue / model.activeInvestments : 0)}</strong><small>Vienai investicijai</small></div>
      </div>
      <div className="pc-diversification">
        <div><span>Diversifikacija</span><strong>{model.active.length} platformos</strong><small>{model.totalInvestments} investicijos</small></div>
        <div><span>Vidutiniškai platformai</span><strong>{new Intl.NumberFormat("lt-LT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(model.avgInvestmentsPerPlatform)}</strong><small>investicijos</small></div>
        <div><span>Vidutinė platformos vertė</span><strong>{money(model.avgValuePerPlatform)}</strong><small>{percent(100 / Math.max(model.active.length, 1))} lygi dalis</small></div>
      </div>
      {model.risky && model.risky.delayedInvestments > 0 && <div className="pc-risk-note"><span>Reikia dėmesio</span><strong>{model.risky.name}</strong><p>{model.risky.delayedInvestments} vėluojančios investicijos · {model.risky.ownerName}</p></div>}</article>
    </section>
  </main>;
}
