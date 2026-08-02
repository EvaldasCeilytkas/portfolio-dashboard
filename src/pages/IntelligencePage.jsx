import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioOwner } from "../context/PortfolioContext";
import {
  loadPortfolioHistory,
  loadPortfolioPlatforms,
  PORTFOLIO_GROUP_LABELS,
} from "../services/portfolioService";
import "../styles/intelligence-center.css";

const money = (value, digits = 2) => new Intl.NumberFormat("lt-LT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(Number(value) || 0);

const percent = (value, digits = 1) => `${new Intl.NumberFormat("lt-LT", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
}).format(Number(value) || 0)} %`;

const integer = (value) => new Intl.NumberFormat("lt-LT", {
  maximumFractionDigits: 0,
}).format(Number(value) || 0);

const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function scoreTone(score) {
  if (score >= 85) return { label: "Puiki", className: "is-excellent" };
  if (score >= 70) return { label: "Gera", className: "is-good" };
  if (score >= 55) return { label: "Vidutinė", className: "is-medium" };
  return { label: "Reikia dėmesio", className: "is-warning" };
}

function PlatformMark({ platform }) {
  return (
    <span className="ic-platform-mark" style={{ background: platform.brandColorSoft, color: platform.brandColor }}>
      {platform.logoUrl ? (
        <img src={platform.logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      ) : null}
      <b>{platform.logoText}</b>
    </span>
  );
}

function OwnerBadge({ platform, show }) {
  if (!show) return null;
  return <span className={`ic-owner is-${platform.ownerId}`}>{platform.ownerName}</span>;
}

function portfolioGrade(score) {
  if (score >= 95) return "AAA";
  if (score >= 90) return "AA";
  if (score >= 85) return "A";
  if (score >= 80) return "A−";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

function TrendBadge({ value, suffix = "" }) {
  const numeric = Number(value) || 0;
  const direction = numeric > 0.05 ? "up" : numeric < -0.05 ? "down" : "flat";
  const symbol = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const label = direction === "flat" ? "stabilu" : `${numeric > 0 ? "+" : ""}${new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 1 }).format(numeric)}${suffix}`;
  return <span className={`ic-trend is-${direction}`}>{symbol} {label}</span>;
}

function ScoreRing({ score }) {
  const tone = scoreTone(score);
  const grade = portfolioGrade(score);
  const [displayScore, setDisplayScore] = useState(0);
  const [ringScore, setRingScore] = useState(0);

  useEffect(() => {
    setDisplayScore(0);
    setRingScore(0);
    const target = Math.round(clamp(score, 0, 100));
    let frame;
    const startedAt = performance.now();
    const duration = 950;
    const animate = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(target * eased));
      setRingScore(score * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="ic-health-score">
      <div className={`ic-score-ring ${tone.className}`} style={{ "--score": `${clamp(ringScore, 0, 100) * 3.6}deg` }}>
        <div>
          <span className="ic-score-grade">{grade}</span>
          <strong>{displayScore}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <div className="ic-score-caption"><b>Portfolio Health</b><span>{tone.label}</span></div>
    </div>
  );
}

export default function IntelligencePage() {
  const { ownerId, owner } = usePortfolioOwner();
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [copilotQuestion, setCopilotQuestion] = useState("next");

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
        setError(reason?.message || "Nepavyko užkrauti Portfolio Intelligence duomenų.");
        setStatus("error");
      });

    return () => { alive = false; };
  }, [ownerId]);

  const model = useMemo(() => {
    const active = platforms.filter((item) => item.isActive || item.currentValue > 0 || item.invested > 0);
    const totalValue = sum(active, "currentValue");
    const totalInvested = sum(active, "invested");
    const totalProfit = sum(active, "profit");
    const totalCash = sum(active, "cash");
    const activeInvestments = sum(active, "activeInvestments");
    const delayedInvestments = sum(active, "delayedInvestments");
    const delayedShare = activeInvestments > 0 ? delayedInvestments / activeInvestments * 100 : 0;
    const roi = totalInvested > 0 ? totalProfit / totalInvested * 100 : 0;

    const rankedByValue = [...active].sort((a, b) => b.currentValue - a.currentValue);
    const biggest = rankedByValue[0] || null;
    const biggestShare = biggest && totalValue > 0 ? biggest.currentValue / totalValue * 100 : 0;

    const groupMap = new Map();
    active.forEach((platform) => {
      const current = groupMap.get(platform.group) || { group: platform.group, value: 0, invested: 0, profit: 0, count: 0 };
      current.value += platform.currentValue;
      current.invested += platform.invested;
      current.profit += platform.profit;
      current.count += 1;
      groupMap.set(platform.group, current);
    });
    const groups = [...groupMap.values()]
      .map((group) => ({
        ...group,
        label: PORTFOLIO_GROUP_LABELS[group.group] || group.group,
        share: totalValue > 0 ? group.value / totalValue * 100 : 0,
        roi: group.invested > 0 ? group.profit / group.invested * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const concentrationPenalty = Math.max(0, biggestShare - 15) * 1.25;
    const platformCountBonus = Math.min(active.length, 12) * 4.2;
    const groupCountBonus = Math.min(groups.length, 5) * 8;
    const diversificationScore = clamp(30 + platformCountBonus + groupCountBonus - concentrationPenalty, 0, 100);

    const riskScore = clamp(100 - delayedShare * 3.2 - Math.max(0, biggestShare - 20) * 1.4, 0, 100);
    const allocationScore = clamp(100 - Math.max(0, biggestShare - 18) * 1.5 - Math.max(0, (groups[0]?.share || 0) - 45) * 0.9, 0, 100);
    const performanceScore = clamp(58 + roi * 2.4, 0, 100);
    const cashRatio = totalValue > 0 ? totalCash / totalValue * 100 : 0;
    const cashScore = clamp(100 - Math.max(0, cashRatio - 4) * 4, 0, 100);
    const healthScore = clamp(
      diversificationScore * 0.28 + riskScore * 0.28 + allocationScore * 0.2 + performanceScore * 0.16 + cashScore * 0.08,
      0,
      100,
    );

    const bestPlatform = [...active]
      .filter((item) => item.invested > 0)
      .sort((a, b) => b.returnRate - a.returnRate)[0] || null;
    const weakestPlatform = [...active]
      .filter((item) => item.invested > 0)
      .sort((a, b) => a.returnRate - b.returnRate)[0] || null;
    const delayedPlatform = [...active].sort((a, b) => b.delayedInvestments - a.delayedInvestments)[0] || null;

    const latest = history.at(-1) || {};
    const previous = history.at(-2) || {};
    const monthlyResult = Number(latest.monthlyResult) || 0;
    const valueChange = (Number(latest.value) || totalValue) - (Number(previous.value) || 0);
    const previousRoi = Number(previous.returnRate) || roi;
    const performanceTrend = (roi - previousRoi) * 2.4;
    const healthTrend = performanceTrend * 0.16;
    const scoreTrends = {
      diversification: 0,
      risk: 0,
      allocation: 0,
      performance: performanceTrend,
    };

    const insights = [];
    if (biggest && biggestShare >= 25) {
      insights.push({ type: "warning", title: "Didelė koncentracija", text: `${biggest.name} sudaro ${percent(biggestShare)} portfelio. Naujas lėšas verta nukreipti kitur.`, platform: biggest });
    } else {
      insights.push({ type: "positive", title: "Koncentracija kontroliuojama", text: `Didžiausia pozicija sudaro ${percent(biggestShare)} portfelio.`, platform: biggest });
    }
    if (delayedInvestments > 0) {
      insights.push({ type: delayedShare >= 8 ? "warning" : "neutral", title: "Vėlavimų stebėjimas", text: `${integer(delayedInvestments)} investicijos vėluoja – ${percent(delayedShare)} aktyvių pozicijų.`, platform: delayedPlatform });
    } else {
      insights.push({ type: "positive", title: "Vėlavimų nėra", text: "Šiuo metu aktyviose investicijose vėlavimų neužfiksuota." });
    }
    if (cashRatio > 6) {
      insights.push({ type: "warning", title: "Per daug neįdarbintų lėšų", text: `${money(totalCash)} grynųjų sudaro ${percent(cashRatio)} portfelio.` });
    } else {
      insights.push({ type: "positive", title: "Grynieji įdarbinti efektyviai", text: `Neinvestuotos lėšos sudaro tik ${percent(cashRatio)} portfelio.` });
    }

    const yearlyCashDrag = totalCash * Math.max(roi, 7) / 100;
    const topGroup = groups[0] || null;
    const targetEqualGroup = groups.length ? 100 / groups.length : 0;
    const analysisDate = new Intl.DateTimeFormat("lt-LT", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).format(new Date());
    const summaryActions = [];
    if (delayedInvestments > 0) summaryActions.push(`stebėti ${integer(delayedInvestments)} vėluojančių investicijų`);
    if (groups.some((group) => group.share < targetEqualGroup - 6)) {
      const underweight = [...groups].sort((a, b) => a.share - b.share)[0];
      summaryActions.push(`naujas lėšas pirmiausia nukreipti į ${underweight?.label || "mažiausią turto klasę"}`);
    }
    if (cashRatio > 6) summaryActions.push(`įdarbinti dalį iš ${money(totalCash)} grynųjų`);
    const summaryAction = summaryActions.length
      ? `${summaryActions.slice(0, 2).join(" ir ")}.`
      : "išlaikyti dabartinį balansą ir tęsti mėnesinę stebėseną.";

    const summarySentences = [];
    summarySentences.push(`Šį mėnesį portfelio būklė išliko ${healthScore >= 85 ? "labai stipri" : healthScore >= 70 ? "stabili" : "reikalaujanti daugiau dėmesio"}.`);
    if (monthlyResult > 0) summarySentences.push(`Naujausio mėnesio rezultatas buvo teigiamas – ${money(monthlyResult)}.`);
    else if (monthlyResult < 0) summarySentences.push(`Naujausio mėnesio rezultatas buvo neigiamas – ${money(monthlyResult)}, todėl verta stebėti trumpalaikį svyravimą.`);
    if (delayedInvestments > 0) summarySentences.push(`Didžiausia operacinė rizika – ${integer(delayedInvestments)} vėluojančių investicijų, sudarančių ${percent(delayedShare)} aktyvių pozicijų.`);
    else summarySentences.push("Aktyviose investicijose vėlavimų šiuo metu nėra.");
    const underweightGroup = [...groups].sort((a, b) => a.share - b.share)[0] || null;
    if (underweightGroup && underweightGroup.share < targetEqualGroup - 6) summarySentences.push(`Naujas lėšas racionaliausia nukreipti į grupę „${underweightGroup.label}“, kurios dalis tebėra mažesnė už orientacinį tikslą.`);
    else summarySentences.push("Turto klasių balansas yra pakankamai tolygus, todėl didelių korekcijų nereikia.");
    const dynamicSummary = summarySentences.join(" ");

    const copilotAnswers = {
      next: `Šiuo metu svarbiausias žingsnis – ${summaryAction}`,
      invest500: underweightGroup ? `Iš papildomų 500 € didžiausią dalį verta skirti grupei „${underweightGroup.label}“, nes jos dabartinė dalis yra ${percent(underweightGroup.share)}, o orientacinis tikslas – ${percent(targetEqualGroup)}.` : "Papildomus 500 € galima paskirstyti proporcingai dabartinėms turto klasėms.",
      improve: delayedInvestments > 0 ? `Health Score labiausiai pagerintų vėlavimų sumažėjimas ir naujų lėšų nukreipimas už didžiausios pozicijos ribų. Dabar vėluoja ${integer(delayedInvestments)} investicijų.` : `Health Score labiausiai pagerintų mažesnė didžiausios pozicijos koncentracija ir tolygesnė turto klasių alokacija.`,
      risk: biggest ? `Didžiausia koncentracijos rizika šiuo metu yra „${biggest.name}“ – ${percent(biggestShare)} portfelio. Vėlavimų dalis sudaro ${percent(delayedShare)} aktyvių investicijų.` : "Reikšmingos koncentracijos rizikos nenustatyta.",
    };

    return {
      active,
      totalValue,
      totalInvested,
      totalProfit,
      totalCash,
      activeInvestments,
      delayedInvestments,
      delayedShare,
      roi,
      biggest,
      biggestShare,
      groups,
      diversificationScore,
      riskScore,
      allocationScore,
      performanceScore,
      cashScore,
      healthScore,
      bestPlatform,
      weakestPlatform,
      delayedPlatform,
      monthlyResult,
      valueChange,
      insights,
      yearlyCashDrag,
      cashRatio,
      topGroup,
      targetEqualGroup,
      rankedByValue,
      analysisDate,
      summaryAction,
      dynamicSummary,
      copilotAnswers,
      scoreTrends,
      healthTrend,
      grade: portfolioGrade(healthScore),
    };
  }, [platforms, history]);

  function openPlatform(platform) {
    if (!platform) return;
    navigate(`/platforms/${platform.slug}${ownerId === "family" ? `?owner=${platform.ownerId}` : ""}`);
  }

  if (status === "loading") return <div className="ic-state">Skaičiuojamas Portfolio Intelligence…</div>;
  if (status === "error") return <div className="ic-state is-error">{error}</div>;

  const healthTone = scoreTone(model.healthScore);
  const showOwner = ownerId === "family";

  return (
    <main className="intelligence-center">
      <section className="ic-hero">
        <div className="ic-hero-copy">
          <p>PORTFOLIO INTELLIGENCE v1.2</p>
          <h1>{owner.name} portfelio būklė</h1>
          <span>Automatinė diversifikacijos, rizikos, alokacijos ir efektyvumo analizė.</span>
          <div className="ic-health-labels">
            <span className={healthTone.className}>{healthTone.label}</span>
            <small><b>Paskutinė analizė</b> {model.analysisDate}</small>
          </div>
        </div>
        <ScoreRing score={model.healthScore} />
        <div className="ic-hero-metrics">
          <div><span>Portfelio vertė</span><strong>{money(model.totalValue)}</strong></div>
          <div><span>Bendras pelnas</span><strong className={model.totalProfit >= 0 ? "positive" : "negative"}>{money(model.totalProfit)}</strong></div>
          <div><span>Bendras ROI</span><strong>{percent(model.roi)}</strong></div>
        </div>
      </section>

      <section className="ic-score-grid">
        {[
          ["Diversifikacija", model.diversificationScore, `${model.active.length} aktyvios platformos`, "diversification", model.scoreTrends.diversification],
          ["Rizikos kontrolė", model.riskScore, `${integer(model.delayedInvestments)} vėluojančios`, "risk", model.scoreTrends.risk],
          ["Alokacija", model.allocationScore, `${percent(model.biggestShare)} didžiausia pozicija`, "allocation", model.scoreTrends.allocation],
          ["Efektyvumas", model.performanceScore, `${percent(model.roi)} bendras ROI`, "performance", model.scoreTrends.performance],
        ].map(([label, score, detail, accent, trend]) => {
          const tone = scoreTone(score);
          return (
            <article key={label} className={`is-${accent}`}>
              <div><span>{label}</span><span className="ic-score-value"><strong>{Math.round(score)}</strong><TrendBadge value={trend} /></span></div>
              <div className="ic-score-track"><i className={tone.className} style={{ width: `${score}%` }} /></div>
              <small>{detail}</small>
            </article>
          );
        })}
      </section>

      <section className="ic-grid ic-grid-main">
        <article className="ic-card ic-insights-card">
          <header><div><p>INTELLIGENCE FEED</p><h2>Išmaniosios įžvalgos</h2></div><span>Kas dabar labiausiai veikia portfelio būklę</span></header>
          <div className="ic-insight-list">
            {model.insights.map((insight, index) => (
              <button key={`${insight.title}-${index}`} className={`is-${insight.type}`} onClick={() => openPlatform(insight.platform)} disabled={!insight.platform}>
                <span className="ic-insight-icon">{insight.type === "positive" ? "✓" : insight.type === "warning" ? "!" : "i"}</span>
                <div><span className="ic-insight-kicker">{insight.type === "positive" ? "STIPRYBĖ" : insight.type === "warning" ? "REIKIA DĖMESIO" : "STEBĖSENA"}</span><strong>{insight.title}</strong><p>{insight.text}</p></div>
                {insight.platform && <span className="ic-arrow">→</span>}
              </button>
            ))}
          </div>
        </article>

        <article className="ic-card ic-cash-card">
          <header><div><p>CASH DRAG</p><h2>Neįdarbintos lėšos</h2></div></header>
          <div className="ic-cash-value"><strong>{money(model.totalCash)}</strong><span>{percent(model.cashRatio)} portfelio</span></div>
          <div className="ic-cash-impact"><span>Galima metinė negauta grąža</span><strong>{money(model.yearlyCashDrag)}</strong><small>Skaičiuojama pagal didesnę iš 7 % arba dabartinio ROI reikšmę.</small></div>
          <div className={`ic-status-pill ${model.cashRatio <= 6 ? "is-positive" : "is-warning"}`}>{model.cashRatio <= 6 ? "Grynųjų lygis optimalus" : "Verta įdarbinti dalį lėšų"}</div>
        </article>
      </section>

      <section className="ic-grid ic-grid-secondary">
        <article className="ic-card ic-allocation-card">
          <header><div><p>ALLOCATION ADVISOR</p><h2>Turto klasių balansas</h2></div><span>Orientyras – tolygesnis paskirstymas tarp turimų klasių</span></header>
          <div className="ic-allocation-list">
            {model.groups.map((group) => {
              const delta = group.share - model.targetEqualGroup;
              const statusLabel = Math.abs(delta) < 6 ? "Balanced" : delta > 0 ? "Overweight" : "Underweight";
              return (
                <div key={group.group}>
                  <div className="ic-allocation-name"><strong>{group.label}</strong><span>{group.count} platformos</span></div>
                  <div className="ic-allocation-track"><i style={{ width: `${group.share}%` }} /><em style={{ left: `${model.targetEqualGroup}%` }} /></div>
                  <div className="ic-allocation-numbers"><b>{percent(group.share)}</b><span>Target {percent(model.targetEqualGroup)} · {delta >= 0 ? "+" : ""}{percent(delta)}</span></div>
                  <span className={`ic-allocation-status is-${statusLabel.toLowerCase()}`}>{statusLabel}</span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="ic-card ic-opportunity-card">
          <header><div><p>OPPORTUNITY FINDER</p><h2>Galimybės ir silpnos vietos</h2></div></header>
          <div className="ic-opportunity-list">
            <button className="is-best" onClick={() => openPlatform(model.bestPlatform)} disabled={!model.bestPlatform}>
              <span><i>🏆</i> BEST PERFORMER</span><div><strong>{model.bestPlatform?.name || "–"}</strong><OwnerBadge platform={model.bestPlatform || {}} show={showOwner && Boolean(model.bestPlatform)} /></div><b className="positive">{percent(model.bestPlatform?.returnRate)}</b>
            </button>
            <button className="is-attention" onClick={() => openPlatform(model.weakestPlatform)} disabled={!model.weakestPlatform}>
              <span><i>⚠</i> NEEDS ATTENTION</span><div><strong>{model.weakestPlatform?.name || "–"}</strong><OwnerBadge platform={model.weakestPlatform || {}} show={showOwner && Boolean(model.weakestPlatform)} /></div><b className={model.weakestPlatform?.returnRate < 0 ? "negative" : ""}>{percent(model.weakestPlatform?.returnRate)}</b>
            </button>
            <button className="is-largest" onClick={() => openPlatform(model.biggest)} disabled={!model.biggest}>
              <span><i>◆</i> LARGEST POSITION</span><div><strong>{model.biggest?.name || "–"}</strong><OwnerBadge platform={model.biggest || {}} show={showOwner && Boolean(model.biggest)} /></div><b>{percent(model.biggestShare)}</b>
            </button>
            <div className="is-month"><span><i>↗</i> LATEST MONTH</span><strong>{money(model.monthlyResult)}</strong><b className={model.valueChange >= 0 ? "positive" : "negative"}>{model.valueChange >= 0 ? "+" : ""}{money(model.valueChange)}</b></div>
          </div>
        </article>
      </section>

      <section className="ic-card ic-concentration-card">
        <header><div><p>CONCENTRATION MAP</p><h2>Didžiausios portfelio pozicijos</h2></div><span>Spustelėjus atidaromas platformos puslapis</span></header>
        <div className="ic-position-grid">
          {model.rankedByValue.slice(0, 8).map((platform, index) => {
            const share = model.totalValue > 0 ? platform.currentValue / model.totalValue * 100 : 0;
            return (
              <button key={`${platform.ownerId}:${platform.slug}`} onClick={() => openPlatform(platform)}>
                <span className="ic-position-rank">{index + 1}</span>
                <PlatformMark platform={platform} />
                <div className="ic-position-copy"><strong>{platform.name}</strong><OwnerBadge platform={platform} show={showOwner} /></div>
                <div className="ic-position-track"><i style={{ width: `${share}%` }} /></div>
                <b>{money(platform.currentValue)}</b>
                <small>{percent(share)}</small>
                <div className="ic-position-tooltip">
                  <span><small>Investuota</small><b>{money(platform.invested)}</b></span>
                  <span><small>Pelnas</small><b className={platform.profit >= 0 ? "positive" : "negative"}>{money(platform.profit)}</b></span>
                  <span><small>ROI</small><b>{percent(platform.returnRate)}</b></span>
                  <span><small>Aktyvios investicijos</small><b>{integer(platform.activeInvestments)}</b></span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="ic-card ic-summary-card">
        <div className="ic-summary-orb">AI</div>
        <div className="ic-summary-copy">
          <p>AI PORTFOLIO SUMMARY</p>
          <h2>{owner.name} portfelio santrauka</h2>
          <p className="ic-summary-lead"><b>{model.grade} · {Math.round(model.healthScore)}/100.</b> {model.dynamicSummary}</p>
          <div className="ic-summary-points">
            <span><i>✓</i><b>Stiprybė</b> {model.active.length} aktyvių platformų ir kontroliuojama {percent(model.biggestShare)} didžiausia pozicija.</span>
            <span className={model.delayedInvestments > 0 ? "is-warning" : ""}><i>{model.delayedInvestments > 0 ? "!" : "✓"}</i><b>Rizika</b> {model.delayedInvestments > 0 ? `${integer(model.delayedInvestments)} investicijos vėluoja (${percent(model.delayedShare)}).` : "Vėluojančių investicijų nėra."}</span>
            <span><i>→</i><b>Kitas žingsnis</b> {model.summaryAction}</span>
          </div>
        </div>
      </section>

      <section className="ic-card ic-copilot-card">
        <div className="ic-copilot-heading">
          <div className="ic-copilot-orb">✦</div>
          <div><p>PORTFOLIO COPILOT</p><h2>Paklauskite apie kitą portfelio žingsnį</h2><span>Atsakymai skaičiuojami iš dabartinių portfelio duomenų.</span></div>
        </div>
        <div className="ic-copilot-questions">
          {[
            ["next", "Ką daryti dabar?"],
            ["invest500", "Kur investuoti kitus 500 €?"],
            ["improve", "Kas pagerintų Health Score?"],
            ["risk", "Kur didžiausia rizika?"],
          ].map(([key, label]) => <button key={key} className={copilotQuestion === key ? "is-active" : ""} onClick={() => setCopilotQuestion(key)}>{label}</button>)}
        </div>
        <div className="ic-copilot-answer"><span>AI</span><p>{model.copilotAnswers[copilotQuestion]}</p></div>
      </section>
    </main>
  );
}
