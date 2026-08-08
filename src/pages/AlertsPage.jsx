import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioOwner } from "../context/PortfolioContext";
import { loadPortfolioHistory, loadPortfolioPlatforms, PORTFOLIO_GROUP_LABELS } from "../services/portfolioService";
import "../styles/alerts-center.css";

const money = (value, digits = 2) => new Intl.NumberFormat("lt-LT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(Number(value) || 0);

const percent = (value) => `${new Intl.NumberFormat("lt-LT", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
}).format(Number(value) || 0)} %`;

const integer = (value) => new Intl.NumberFormat("lt-LT", {
  maximumFractionDigits: 0,
}).format(Number(value) || 0);

const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);

const severityRank = { critical: 0, high: 1, medium: 2, info: 3 };
const severityLabels = {
  critical: "Kritinis",
  high: "Svarbus",
  medium: "Stebėti",
  info: "Informacija",
};

function OwnerBadge({ ownerId, ownerName }) {
  return <span className={`ac-owner is-${ownerId}`}>{ownerName}</span>;
}

function PlatformMark({ platform }) {
  return (
    <span className="ac-platform-mark" style={{ background: platform.brandColorSoft, color: platform.brandColor }}>
      {platform.logoUrl ? (
        <img
          src={platform.logoUrl}
          alt=""
          onError={(event) => { event.currentTarget.style.display = "none"; }}
        />
      ) : null}
      <b>{platform.logoText}</b>
    </span>
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDate(value) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export default function AlertsPage() {
  const { ownerId, owner, selectOwner } = usePortfolioOwner();
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let alive = true;
    setStatus("loading");

    Promise.all([
      loadPortfolioPlatforms(ownerId),
      loadPortfolioHistory(ownerId),
    ])
      .then(([platformRows, historyPayload]) => {
        if (!alive) return;
        setPlatforms(platformRows);
        setHistory(historyPayload.history || []);
        setError("");
        setStatus("ready");
      })
      .catch((reason) => {
        if (!alive) return;
        setError(reason?.message || "Nepavyko užkrauti Alerts Center duomenų.");
        setStatus("error");
      });

    return () => { alive = false; };
  }, [ownerId]);

  useEffect(() => setFilter("all"), [ownerId]);

  const model = useMemo(() => {
    const activePlatforms = platforms.filter((item) => item.isActive || item.currentValue > 0 || item.invested > 0);
    const totalValue = sum(activePlatforms, "currentValue");
    const totalInvested = sum(activePlatforms, "invested");
    const totalProfit = sum(activePlatforms, "profit");
    const totalInvestments = sum(activePlatforms, "totalInvestments");
    const activeInvestments = sum(activePlatforms, "activeInvestments");
    const delayedInvestments = sum(activePlatforms, "delayedInvestments");
    const openInvestments = activeInvestments + delayedInvestments;
    const completedInvestments = sum(activePlatforms, "completedInvestments");
    const delayedShare = openInvestments > 0 ? delayedInvestments / openInvestments * 100 : 0;

    const latest = history.at(-1) || {};
    const previous = history.at(-2) || {};
    const monthlyResult = Number(latest.monthlyResult) || 0;
    const monthlyContribution = Number(latest.monthlyContribution) || 0;
    const valueChange = (Number(latest.value) || totalValue) - (Number(previous.value) || 0);
    const investedChange = (Number(latest.invested) || totalInvested) - (Number(previous.invested) || 0);

    const biggest = [...activePlatforms].sort((a, b) => b.currentValue - a.currentValue)[0] || null;
    const maxShare = biggest && totalValue > 0 ? biggest.currentValue / totalValue * 100 : 0;
    const negativePlatforms = activePlatforms.filter((item) => item.profit < -0.01);
    const delayedPlatforms = activePlatforms.filter((item) => item.delayedInvestments > 0);

    const alerts = [];

    delayedPlatforms.forEach((platform) => {
      const platformActive = Number(platform.activeInvestments) || 0;
      const platformDelayed = Number(platform.delayedInvestments) || 0;
      const platformOpen = platformActive + platformDelayed;
      const platformDelayedShare = platformOpen > 0 ? platformDelayed / platformOpen * 100 : 0;
      const severity = platform.delayedInvestments >= 5 || platformDelayedShare >= 20
        ? "critical"
        : platform.delayedInvestments >= 2 || platformDelayedShare >= 8
          ? "high"
          : "medium";

      alerts.push({
        id: `delay-${platform.ownerId}-${platform.slug}`,
        severity,
        title: `${platform.name}: vėluojančios investicijos`,
        description: `${integer(platform.delayedInvestments)} vėluoja iš ${integer(platformOpen)} aktyvių (${percent(platformDelayedShare)}).`,
        platform,
        metric: integer(platform.delayedInvestments),
        metricLabel: "vėluoja",
      });
    });

    activePlatforms.forEach((platform) => {
      const share = totalValue > 0 ? platform.currentValue / totalValue * 100 : 0;
      if (share >= 20) {
        alerts.push({
          id: `concentration-${platform.ownerId}-${platform.slug}`,
          severity: share >= 30 ? "high" : "medium",
          title: `${platform.name}: didelė koncentracija`,
          description: `Platforma sudaro ${percent(share)} pasirinkto portfelio vertės.`,
          platform,
          metric: percent(share),
          metricLabel: "portfelio",
        });
      }
    });

    negativePlatforms.forEach((platform) => {
      alerts.push({
        id: `negative-${platform.ownerId}-${platform.slug}`,
        severity: platform.returnRate <= -10 ? "high" : "medium",
        title: `${platform.name}: neigiamas rezultatas`,
        description: `${money(platform.profit)} rezultatas, ROI ${percent(platform.returnRate)}.`,
        platform,
        metric: money(platform.profit),
        metricLabel: "rezultatas",
      });
    });

    if (!alerts.length) {
      alerts.push({
        id: "portfolio-clear",
        severity: "info",
        title: "Kritinių portfelio perspėjimų nėra",
        description: "Pagal dabartinius platformų JSON duomenis portfelio būklė stabili.",
        platform: null,
        metric: "✓",
        metricLabel: "tvarkoje",
      });
    }

    alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    const criticalCount = alerts.filter((item) => item.severity === "critical").length;
    const warningCount = alerts.filter((item) => item.severity === "high" || item.severity === "medium").length;
    const healthyCount = activePlatforms.filter((platform) => platform.delayedInvestments === 0 && platform.profit >= 0).length;

    const delayedPenalty = clamp(delayedShare * 1.7, 0, 38);
    const concentrationPenalty = clamp((maxShare - 15) * 0.8, 0, 22);
    const negativePenalty = clamp(negativePlatforms.length * 4, 0, 16);
    const criticalPenalty = clamp(criticalCount * 7, 0, 14);
    const healthScore = Math.round(clamp(100 - delayedPenalty - concentrationPenalty - negativePenalty - criticalPenalty, 0, 100));
    const healthLabel = healthScore >= 85 ? "Puiki būklė" : healthScore >= 70 ? "Stabili būklė" : healthScore >= 50 ? "Reikia stebėti" : "Reikia dėmesio";
    const healthTone = healthScore >= 85 ? "good" : healthScore >= 70 ? "stable" : healthScore >= 50 ? "warning" : "critical";

    const platformHealth = activePlatforms
      .map((platform) => {
        const platformActive = Number(platform.activeInvestments) || 0;
        const platformDelayed = Number(platform.delayedInvestments) || 0;
        const platformOpen = platformActive + platformDelayed;
        const platformDelayedShare = platformOpen > 0 ? platformDelayed / platformOpen * 100 : 0;
        const share = totalValue > 0 ? platform.currentValue / totalValue * 100 : 0;
        let score = 100;
        score -= clamp(platformDelayedShare * 2.4, 0, 55);
        if (platform.profit < 0) score -= clamp(Math.abs(platform.returnRate) * 1.2, 5, 25);
        if (share > 25) score -= clamp((share - 25) * 0.7, 0, 12);
        score = Math.round(clamp(score, 0, 100));
        const state = score >= 88 ? "Puiki" : score >= 72 ? "Stabili" : score >= 52 ? "Stebėti" : "Dėmesio";
        const tone = score >= 88 ? "good" : score >= 72 ? "stable" : score >= 52 ? "warning" : "critical";
        return { ...platform, healthScore: score, healthState: state, healthTone: tone, share };
      })
      .sort((a, b) => a.healthScore - b.healthScore || b.currentValue - a.currentValue);

    const riskItems = [
      {
        level: delayedShare >= 10 ? "critical" : delayedShare > 0 ? "medium" : "info",
        title: "Vėluojančių investicijų dalis",
        value: percent(delayedShare),
        description: `${integer(delayedInvestments)} iš ${integer(openInvestments)} aktyvių investicijų.`,
      },
      {
        level: maxShare >= 30 ? "high" : maxShare >= 20 ? "medium" : "info",
        title: "Didžiausios platformos koncentracija",
        value: percent(maxShare),
        description: biggest ? `${biggest.name} yra didžiausia portfelio pozicija.` : "Nėra aktyvių platformų.",
      },
      {
        level: activePlatforms.length < 5 ? "medium" : "info",
        title: "Platformų diversifikacija",
        value: integer(activePlatforms.length),
        description: `${integer(totalInvestments)} investicijos paskirstytos per aktyvias platformas.`,
      },
      {
        level: negativePlatforms.length >= 3 ? "high" : negativePlatforms.length ? "medium" : "info",
        title: "Neigiamą rezultatą turinčios platformos",
        value: integer(negativePlatforms.length),
        description: negativePlatforms.length ? "Šias platformas verta peržiūrėti detaliau." : "Visos aktyvios platformos yra teigiamame rezultate.",
      },
    ];

    const insights = [];
    const topProfit = [...activePlatforms].sort((a, b) => b.profit - a.profit)[0];
    const topRoi = [...activePlatforms].filter((item) => item.invested > 0).sort((a, b) => b.returnRate - a.returnRate)[0];
    if (topProfit) insights.push(`${topProfit.name} sukūrė didžiausią bendrą pelną: ${money(topProfit.profit)}.`);
    if (topRoi) insights.push(`${topRoi.name} turi didžiausią ROI: ${percent(topRoi.returnRate)} nuo ${money(topRoi.invested)} investuoto kapitalo.`);
    if (delayedInvestments > 0) insights.push(`Dabar vėluoja ${integer(delayedInvestments)} investicijos; daugiausia dėmesio reikalauja ${delayedPlatforms[0]?.name || "P2P portfelis"}.`);
    else insights.push("Šiuo metu vėluojančių investicijų neužfiksuota.");
    if (monthlyResult !== 0) insights.push(`Naujausio mėnesio rezultatas: ${money(monthlyResult)}.`);
    if (maxShare >= 20 && biggest) insights.push(`${biggest.name} sudaro ${percent(maxShare)} portfelio – verta stebėti koncentraciją.`);

    return {
      activePlatforms,
      totalValue,
      totalInvested,
      totalProfit,
      totalInvestments,
      activeInvestments,
      delayedInvestments,
      completedInvestments,
      delayedShare,
      latest,
      monthlyResult,
      monthlyContribution,
      valueChange,
      investedChange,
      alerts,
      criticalCount,
      warningCount,
      healthyCount,
      healthScore,
      healthLabel,
      healthTone,
      platformHealth,
      riskItems,
      insights,
    };
  }, [platforms, history]);

  const visibleAlerts = filter === "all"
    ? model.alerts
    : model.alerts.filter((item) => item.severity === filter || (filter === "warning" && ["high", "medium"].includes(item.severity)));

  function openPlatform(platform) {
    if (!platform) return;
    if (ownerId === "family" && platform.ownerId) selectOwner(platform.ownerId);
    navigate(`/platforms/${platform.slug}`);
  }

  if (status === "loading") {
    return <main className="alerts-center"><div className="ac-state"><span className="dashboard-loader" /><h2>Kraunamas Alerts Center...</h2></div></main>;
  }

  if (status === "error") {
    return <main className="alerts-center"><div className="ac-state is-error"><h2>Alerts Center neužsikrovė</h2><p>{error}</p></div></main>;
  }

  const heroTitle = ownerId === "family" ? "Šeimos Alerts Center" : `${owner.name} – Alerts Center`;

  return (
    <main className="alerts-center">
      <section className={`ac-hero is-${model.healthTone}`}>
        <div className="ac-hero-copy">
          <p>PORTFELIO STEBĖJIMO CENTRAS</p>
          <h1>{heroTitle}</h1>
          <span>Vienoje vietoje – vėlavimai, koncentracija, platformų būklė ir svarbiausi veiksmai.</span>
        </div>
        <div className="ac-health-score">
          <div className="ac-score-ring" style={{ "--score": `${model.healthScore * 3.6}deg` }}>
            <span><strong>{model.healthScore}</strong><small>/ 100</small></span>
          </div>
          <div><small>Portfolio Health</small><strong>{model.healthLabel}</strong><span>{model.criticalCount ? `${model.criticalCount} kritiniai perspėjimai` : "Kritinių perspėjimų nėra"}</span></div>
        </div>
        <div className="ac-hero-meta">
          <span>Portfelio vertė <b>{money(model.totalValue)}</b></span>
          <span>Atnaujinta <b>{formatDate(model.latest?.date)}</b></span>
        </div>
      </section>

      <section className="ac-summary-grid">
        <article className="is-critical"><span>Kritiniai</span><strong>{model.criticalCount}</strong><small>Reikia veiksmų dabar</small></article>
        <article className="is-warning"><span>Perspėjimai</span><strong>{model.warningCount}</strong><small>Verta peržiūrėti</small></article>
        <article className="is-good"><span>Tvarkoje</span><strong>{model.healthyCount}</strong><small>Stabilios platformos</small></article>
        <article><span>Vėluojančios</span><strong>{model.delayedInvestments}</strong><small>{percent(model.delayedShare)} aktyvių</small></article>
        <article><span>Aktyvios platformos</span><strong>{model.activePlatforms.length}</strong><small>{integer(model.totalInvestments)} investicijos</small></article>
      </section>

      <section className="ac-grid ac-grid-main">
        <article className="ac-card ac-alerts-card">
          <header className="ac-card-head">
            <div><p>PRIORITETAI</p><h2>Reikia dėmesio</h2><span>Perspėjimai automatiškai skaičiuojami iš dabartinių platformų JSON.</span></div>
            <div className="ac-segmented">
              <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Visi</button>
              <button className={filter === "critical" ? "active" : ""} onClick={() => setFilter("critical")}>Kritiniai</button>
              <button className={filter === "warning" ? "active" : ""} onClick={() => setFilter("warning")}>Stebėti</button>
            </div>
          </header>
          <div className="ac-alert-list">
            {visibleAlerts.map((alert) => (
              <button
                key={alert.id}
                className={`ac-alert-item is-${alert.severity}`}
                type="button"
                onClick={() => openPlatform(alert.platform)}
                disabled={!alert.platform}
              >
                <span className="ac-alert-dot" />
                <div className="ac-alert-copy">
                  <div><span className="ac-severity">{severityLabels[alert.severity]}</span>{alert.platform && ownerId === "family" && <OwnerBadge {...alert.platform} />}</div>
                  <strong>{alert.title}</strong>
                  <small>{alert.description}</small>
                </div>
                <div className="ac-alert-metric"><strong>{alert.metric}</strong><span>{alert.metricLabel}</span></div>
                {alert.platform && <span className="ac-open-arrow">→</span>}
              </button>
            ))}
          </div>
        </article>

        <article className="ac-card ac-month-card">
          <header className="ac-card-head"><div><p>NAUJAUSIAS MĖNUO</p><h2>Portfelio veikla</h2><span>Pokytis pagal istorinį portfolio failą.</span></div></header>
          <div className="ac-month-grid">
            <div><span>Mėnesio rezultatas</span><strong className={model.monthlyResult >= 0 ? "positive" : "negative"}>{money(model.monthlyResult)}</strong><small>Pelnas / vertės pokytis</small></div>
            <div><span>Mėnesio įnašas</span><strong>{money(model.monthlyContribution)}</strong><small>Istorijoje pažymėti įnašai</small></div>
            <div><span>Vertės pokytis</span><strong className={model.valueChange >= 0 ? "positive" : "negative"}>{money(model.valueChange)}</strong><small>Nuo ankstesnio mėnesio</small></div>
            <div><span>Investuotos sumos pokytis</span><strong className={model.investedChange >= 0 ? "positive" : "negative"}>{money(model.investedChange)}</strong><small>Nuo ankstesnio mėnesio</small></div>
          </div>
          <div className="ac-action-plan">
            <span>Šio mėnesio prioritetas</span>
            <strong>{model.criticalCount ? "Peržiūrėti kritinius vėlavimus" : model.warningCount ? "Peržiūrėti stebimas platformas" : "Portfelis stabilus"}</strong>
            <p>{model.criticalCount ? "Pradėk nuo aukščiausio prioriteto kortelių kairėje." : "Didelių neatidėliotinų veiksmų pagal dabartinius duomenis nėra."}</p>
          </div>
        </article>
      </section>

      <section className="ac-card ac-health-card">
        <header className="ac-card-head"><div><p>PLATFORMŲ SVEIKATA</p><h2>Būklė pagal platformas</h2><span>Balas įvertina vėlavimus, rezultatą ir koncentraciją.</span></div></header>
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead><tr><th>Platforma</th><th>Turto klasė</th><th>Būsena</th><th>Vėluoja</th><th>ROI</th><th>Portfelio dalis</th><th>Balas</th></tr></thead>
            <tbody>
              {model.platformHealth.map((platform) => (
                <tr key={`${platform.ownerId}:${platform.slug}`} onClick={() => openPlatform(platform)}>
                  <td><div className="ac-platform-cell"><PlatformMark platform={platform} /><div><strong>{platform.name}</strong>{ownerId === "family" && <OwnerBadge {...platform} />}</div></div></td>
                  <td>{PORTFOLIO_GROUP_LABELS[platform.group] || platform.category}</td>
                  <td><span className={`ac-health-pill is-${platform.healthTone}`}>{platform.healthState}</span></td>
                  <td className={platform.delayedInvestments ? "warning" : "positive"}>{integer(platform.delayedInvestments)}</td>
                  <td className={platform.returnRate >= 0 ? "positive" : "negative"}>{percent(platform.returnRate)}</td>
                  <td>{percent(platform.share)}</td>
                  <td><div className="ac-score-bar"><i style={{ width: `${platform.healthScore}%` }} /><b>{platform.healthScore}</b></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ac-grid ac-grid-bottom">
        <article className="ac-card">
          <header className="ac-card-head"><div><p>RIZIKOS STEBĖJIMAS</p><h2>Automatiniai patikrinimai</h2></div></header>
          <div className="ac-risk-list">
            {model.riskItems.map((item) => (
              <div key={item.title} className={`ac-risk-item is-${item.level}`}>
                <span className="ac-risk-icon">{item.level === "info" ? "✓" : "!"}</span>
                <div><strong>{item.title}</strong><small>{item.description}</small></div>
                <b>{item.value}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="ac-card">
          <header className="ac-card-head"><div><p>AUTOMATINĖS ĮŽVALGOS</p><h2>Ką verta žinoti</h2></div></header>
          <div className="ac-insights">
            {model.insights.map((insight, index) => (
              <div key={insight}><span>{index + 1}</span><p>{insight}</p></div>
            ))}
          </div>
          <div className="ac-foot-summary">
            <div><span>Bendra investuota</span><strong>{money(model.totalInvested)}</strong></div>
            <div><span>Bendras pelnas</span><strong className={model.totalProfit >= 0 ? "positive" : "negative"}>{money(model.totalProfit)}</strong></div>
            <div><span>Užbaigtos investicijos</span><strong>{integer(model.completedInvestments)}</strong></div>
          </div>
        </article>
      </section>
    </main>
  );
}
