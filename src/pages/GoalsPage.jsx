import { useEffect, useMemo, useState } from "react";
import { usePortfolioOwner } from "../context/PortfolioContext";
import { loadPortfolioHistory, loadPortfolioPlatforms } from "../services/portfolioService";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import "../styles/goals-center.css";

const money = (value, digits = 0) => new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value) || 0);
const number = (value, digits = 1) => new Intl.NumberFormat("lt-LT", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value) || 0);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const STORAGE_PREFIX = "portfolio-goals-v1";
const DEFAULTS = { targetValue: 100000, monthlyContribution: 500, expectedReturn: 8, withdrawalRate: 4, monthlyPassiveIncome: 2000 };
const ACHIEVEMENTS = [
  { value: 10000, icon: "★", title: "First 10k" },
  { value: 25000, icon: "◆", title: "First 25k" },
  { value: 50000, icon: "●", title: "First 50k" },
  { value: 100000, icon: "◇", title: "First 100k" },
];

function addMonths(date, months) { const result = new Date(date); result.setMonth(result.getMonth() + months); return result; }
function futureValue(currentValue, monthlyContribution, annualRate, months) {
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return currentValue + monthlyContribution * months;
  return currentValue * Math.pow(1 + monthlyRate, months) + monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}
function monthsToGoal(currentValue, targetValue, monthlyContribution, annualRate) {
  if (currentValue >= targetValue) return 0;
  for (let month = 1; month <= 1200; month += 1) if (futureValue(currentValue, monthlyContribution, annualRate, month) >= targetValue) return month;
  return null;
}
function ProgressRing({ value, label }) {
  const progress = clamp(value, 0, 100);
  return <div className="gc-ring" style={{ "--progress": `${progress * 3.6}deg` }}><div><strong>{number(progress, 0)}%</strong><span>{label}</span></div></div>;
}
function ProjectionChart({ currentValue, monthlyContribution, expectedReturn, targetValue }) {
  const years = Array.from({ length: 11 }, (_, index) => index);
  const scenarios = [
    { key: "conservative", label: "Konservatyvi", rate: Math.max(0, expectedReturn - 3) },
    { key: "base", label: "Bazinė", rate: expectedReturn },
    { key: "optimistic", label: "Optimistinė", rate: expectedReturn + 3 },
  ].map((scenario) => ({ ...scenario, values: years.map((year) => futureValue(currentValue, monthlyContribution, scenario.rate, year * 12)) }));
  const maxValue = Math.max(targetValue, ...scenarios.flatMap((item) => item.values)) * 1.08 || 1;
  const toPoints = (values) => values.map((value, index) => ({ x: 34 + index * 86, y: 230 - (value / maxValue) * 188, value, year: index }));
  const targetY = 230 - (targetValue / maxValue) * 188;
  return <div className="gc-chart-wrap">
    <div className="gc-chart-legend">{scenarios.map((item) => <span key={item.key} className={`is-${item.key}`}><i />{item.label} {number(item.rate)} %</span>)}</div>
    <svg className="gc-chart" viewBox="0 0 930 270" role="img" aria-label="Trys portfelio vertės prognozės scenarijai">
      {[0, .25, .5, .75, 1].map((ratio) => <line key={ratio} x1="34" y1={230 - ratio * 188} x2="894" y2={230 - ratio * 188} className="gc-grid-line" />)}
      <line x1="34" y1={targetY} x2="894" y2={targetY} className="gc-target-line" />
      <text x="884" y={Math.max(18, targetY - 8)} textAnchor="end" className="gc-target-label">Tikslas {money(targetValue)}</text>
      {scenarios.map((scenario) => {
        const points = toPoints(scenario.values);
        return <g key={scenario.key} className={`gc-scenario is-${scenario.key}`}>
          <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} className="gc-chart-line" />
          {scenario.key === "base" && points.map((point) => <g key={point.year} className="gc-chart-point"><circle cx={point.x} cy={point.y} r="5" /><title>{point.year === 0 ? "Dabar" : `Po ${point.year} m.`}: ${money(point.value)}</title><text x={point.x} y="255" textAnchor="middle">{point.year === 0 ? "Dabar" : `${point.year} m.`}</text></g>)}
        </g>;
      })}
    </svg>
  </div>;
}

export default function GoalsPage() {
  const { ownerId, owner } = usePortfolioOwner();
  const [platforms, setPlatforms] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState("loading");
  const [settings, setSettings] = useState(DEFAULTS);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(DEFAULTS);
  const [simulator, setSimulator] = useState(DEFAULTS);

  useEffect(() => {
    try { const saved = JSON.parse(window.localStorage.getItem(`${STORAGE_PREFIX}-${ownerId}`)); const next = saved ? { ...DEFAULTS, ...saved } : DEFAULTS; setSettings(next); setDraft(next); setSimulator(next); }
    catch { setSettings(DEFAULTS); setDraft(DEFAULTS); setSimulator(DEFAULTS); }
  }, [ownerId]);
  useEffect(() => {
    let alive = true; setStatus("loading");
    Promise.all([loadPortfolioPlatforms(ownerId), loadPortfolioHistory(ownerId)]).then(([platformRows, historyPayload]) => { if (!alive) return; setPlatforms(platformRows); setHistory(historyPayload.history || []); setStatus("ready"); }).catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [ownerId]);

  const model = useMemo(() => {
    const active = platforms.filter((item) => item.isActive || item.currentValue > 0 || item.invested > 0);
    const platformValue = active.reduce((sum, item) => sum + (Number(item.currentValue) || 0), 0);
    const currentValue = Number(history.at(-1)?.value) || platformValue;
    const goalProgress = settings.targetValue > 0 ? currentValue / settings.targetValue * 100 : 0;
    const months = monthsToGoal(currentValue, settings.targetValue, settings.monthlyContribution, settings.expectedReturn);
    const targetDate = months === null ? null : addMonths(new Date(), months);
    const fireTarget = settings.withdrawalRate > 0 ? (settings.monthlyPassiveIncome * 12) / (settings.withdrawalRate / 100) : 0;
    const fireProgress = fireTarget > 0 ? currentValue / fireTarget * 100 : 0;
    const currentMonthlyIncome = currentValue * (settings.withdrawalRate / 100) / 12;
    const projections = [1, 3, 5, 10].map((years) => ({ years, value: futureValue(currentValue, settings.monthlyContribution, settings.expectedReturn, years * 12) }));
    const tenYearGrowth = projections.at(-1).value - (currentValue + settings.monthlyContribution * 120);
    const nextTarget = [25000, 50000, 100000, 250000, 500000, 1000000].find((value) => value > Math.max(currentValue, settings.targetValue)) || settings.targetValue * 2;
    const milestoneValues = [25000, 50000, 100000, 250000, 500000, 1000000].filter((value) => value > currentValue).slice(0, 3).map((value) => {
      const milestoneMonths = monthsToGoal(currentValue, value, settings.monthlyContribution, settings.expectedReturn);
      const previous = [0, 10000, 25000, 50000, 100000, 250000, 500000].filter((item) => item < value).at(-1) || 0;
      const progress = clamp((currentValue - previous) / Math.max(1, value - previous) * 100, 0, 100);
      return { value, months: milestoneMonths, date: milestoneMonths === null ? null : addMonths(new Date(), milestoneMonths), progress };
    });
    const contributionScenarios = [100, 250, 500].map((extra) => ({ extra, months: monthsToGoal(currentValue, settings.targetValue, settings.monthlyContribution + extra, settings.expectedReturn) }));
    return { currentValue, goalProgress, months, targetDate, fireTarget, fireProgress, currentMonthlyIncome, projections, tenYearGrowth, milestoneValues, nextTarget, contributionScenarios };
  }, [platforms, history, settings]);

  const simulation = useMemo(() => {
    const months = monthsToGoal(model.currentValue, simulator.targetValue, simulator.monthlyContribution, simulator.expectedReturn);
    return { months, date: months === null ? null : addMonths(new Date(), months), fiveYears: futureValue(model.currentValue, simulator.monthlyContribution, simulator.expectedReturn, 60) };
  }, [model.currentValue, simulator]);

  function saveSettings(event) {
    event.preventDefault();
    const normalized = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, Math.max(0, Number(value) || 0)]));
    setSettings(normalized); setDraft(normalized); setSimulator(normalized);
    try { window.localStorage.setItem(`${STORAGE_PREFIX}-${ownerId}`, JSON.stringify(normalized)); } catch { /* localStorage gali būti išjungtas */ }
    setEditing(false);
  }
  if (status === "loading") return <section className="gc-state">Skaičiuojami finansiniai tikslai…</section>;
  if (status === "error") return <section className="gc-state is-error">Nepavyko įkelti Goals Center duomenų.</section>;
  const dateFormatter = new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long" });
  const duration = (months) => months === null ? "—" : `${Math.floor(months / 12)} m. ${months % 12} mėn.`;

  return <section className="goals-center">
    <article className="gc-hero">
      <div className="gc-hero-copy"><span className="gc-eyebrow">GOALS CENTER v1.1</span><h2>{owner.name} finansinių tikslų kelias</h2><p>Portfelio augimo, finansinės laisvės ir pasyvių pajamų prognozė pagal dabartinį tempą.</p><div className="gc-hero-tags"><span>● Duomenys atnaujinti</span><span>{money(settings.monthlyContribution)} / mėn. įmoka</span><span>{number(settings.expectedReturn)} % prognozuojama grąža</span></div></div>
      <div className="gc-hero-progress"><ProgressRing value={model.goalProgress} label="tikslo" /><div className="gc-hero-progressbar"><i style={{ width: `${clamp(model.goalProgress, 0, 100)}%` }} /></div><strong>{money(Math.max(0, settings.targetValue - model.currentValue))} liko</strong><span>{model.targetDate ? dateFormatter.format(model.targetDate) : "Data neapskaičiuota"}</span></div>
      <div className="gc-hero-stats"><span>Dabartinė vertė<strong>{money(model.currentValue, 2)}</strong></span><span>Pagrindinis tikslas<strong>{money(settings.targetValue)}</strong></span><span>Kitas tikslas<strong>{money(model.nextTarget)}</strong></span></div>
    </article>

    <div className="gc-kpi-grid"><StatCard className="gc-kpi is-blue" tone="info" label="Tikslo progresas" value={`${number(model.goalProgress)} %`} note={model.targetDate ? `Prognozė: ${dateFormatter.format(model.targetDate)}` : "Tikslas nepasiekiamas"} /><StatCard className="gc-kpi is-green" tone="success" label="Prognozė po 5 metų" value={money(model.projections.find((item) => item.years === 5)?.value)} note={`Su reguliariomis ${money(settings.monthlyContribution)} įmokomis`} /><StatCard className="gc-kpi is-violet" tone="analytics" label="Pasyvios pajamos dabar" value={`${money(model.currentMonthlyIncome, 2)} / mėn.`} note={`Pagal ${number(settings.withdrawalRate)} % išėmimo taisyklę`} /><StatCard className="gc-kpi is-orange" tone="warning" label="FIRE tikslas" value={money(model.fireTarget)} note={`${number(model.fireProgress)} % finansinės laisvės kelio`} /></div>

    <div className="gc-main-grid"><article className="ds-card gc-card gc-projection-card"><header><div><span className="gc-eyebrow">FORECAST</span><h3>Portfelio augimo scenarijai</h3></div><Button variant="secondary" className="gc-settings-button" onClick={() => setEditing(true)}>Keisti tikslus</Button></header><ProjectionChart currentValue={model.currentValue} monthlyContribution={settings.monthlyContribution} expectedReturn={settings.expectedReturn} targetValue={settings.targetValue} /><div className="gc-projection-grid">{model.projections.map((item) => <div key={item.years}><span>Po {item.years} metų</span><strong>{money(item.value)}</strong></div>)}</div></article>
    <article className="ds-card gc-card gc-fire-card"><span className="gc-eyebrow">FIRE CENTER</span><h3>Finansinės laisvės progresas</h3><div className="gc-fire-ring"><ProgressRing value={model.fireProgress} label="FIRE" /></div><div className="gc-fire-row"><span>Norimos pajamos</span><strong>{money(settings.monthlyPassiveIncome)} / mėn.</strong></div><div className="gc-fire-row"><span>Dabartinis potencialas</span><strong>{money(model.currentMonthlyIncome, 2)} / mėn.</strong></div><div className="gc-fire-progress"><i style={{ width: `${clamp(model.fireProgress, 0, 100)}%` }} /></div><div className="gc-fire-boosts">{model.contributionScenarios.map((item) => <div key={item.extra}><span>+{money(item.extra)} / mėn.</span><strong>{duration(item.months)}</strong></div>)}</div><p>Kaip keistųsi pagrindinio tikslo terminas padidinus mėnesinę įmoką.</p></article></div>

    <article className="ds-card gc-card gc-simulator"><header><div><span className="gc-eyebrow">GOAL SIMULATOR</span><h3>Žaiskite su savo planu</h3></div><div className="gc-sim-result"><strong>{simulation.date ? dateFormatter.format(simulation.date) : "—"}</strong><span>{duration(simulation.months)} iki tikslo</span></div></header><div className="gc-sim-grid">
      <label>Mėnesio investicija <strong>{money(simulator.monthlyContribution)}</strong><input type="range" min="0" max="3000" step="50" value={simulator.monthlyContribution} onChange={(e) => setSimulator({ ...simulator, monthlyContribution: Number(e.target.value) })} /></label>
      <label>Metinė grąža <strong>{number(simulator.expectedReturn)} %</strong><input type="range" min="0" max="20" step="0.5" value={simulator.expectedReturn} onChange={(e) => setSimulator({ ...simulator, expectedReturn: Number(e.target.value) })} /></label>
      <label>Tikslas <strong>{money(simulator.targetValue)}</strong><input type="range" min="25000" max="1000000" step="5000" value={simulator.targetValue} onChange={(e) => setSimulator({ ...simulator, targetValue: Number(e.target.value) })} /></label>
    </div><div className="gc-sim-footer"><span>Prognozė po 5 metų</span><strong>{money(simulation.fiveYears)}</strong><Button variant="primary" onClick={() => { setDraft({ ...settings, ...simulator }); setEditing(true); }}>Naudoti šį planą</Button></div></article>

    <div className="gc-secondary-grid"><article className="ds-card gc-card"><span className="gc-eyebrow">MILESTONES</span><h3>Artimiausi portfelio etapai</h3><div className="gc-milestones">{model.milestoneValues.map((item, index) => <div className="gc-milestone" key={item.value}><span>{index + 1}</span><div><strong>{money(item.value)}</strong><small>{item.date ? dateFormatter.format(item.date) : "Neapskaičiuota"}</small><div className="gc-milestone-progress"><i style={{ width: `${item.progress}%` }} /></div><em>{number(item.progress, 0)} %</em></div><b>{duration(item.months)}</b></div>)}</div></article>
    <article className="ds-card gc-card gc-impact-card"><span className="gc-eyebrow">COMPOUNDING</span><h3>Sudėtinių palūkanų poveikis</h3><div className="gc-impact-value"><strong>{money(model.tenYearGrowth)}</strong><span>prognozuojamas investicijų augimas per 10 metų virš pradinio kapitalo ir įmokų</span></div><div className="gc-impact-bars"><div><span>Kapitalas ir įmokos</span><i style={{ width: `${clamp((model.currentValue + settings.monthlyContribution * 120) / model.projections.at(-1).value * 100, 0, 100)}%` }} /></div><div><span>Prognozuojamas augimas</span><i className="is-growth" style={{ width: `${clamp(model.tenYearGrowth / model.projections.at(-1).value * 100, 0, 100)}%` }} /></div></div></article></div>

    <article className="ds-card gc-card gc-achievements"><span className="gc-eyebrow">ACHIEVEMENTS</span><h3>Finansinio kelio pasiekimai</h3><div className="gc-achievement-grid">{[...ACHIEVEMENTS, { value: model.fireTarget, icon: "♛", title: "FIRE" }].map((item) => { const unlocked = model.currentValue >= item.value; return <div key={item.title} className={unlocked ? "is-unlocked" : ""}><span>{item.icon}</span><strong>{item.title}</strong><small>{unlocked ? "Pasiekta" : money(item.value)}</small></div>; })}</div></article>

    <article className="ds-card gc-card gc-plan-card"><div><span className="gc-eyebrow">GOAL INSIGHT</span><h3>Ką rodo dabartinis planas?</h3><p>Investuojant po <b>{money(settings.monthlyContribution)}</b> per mėnesį ir pasiekiant <b>{number(settings.expectedReturn)} %</b> vidutinę metinę grąžą, {money(settings.targetValue)} tikslas {model.targetDate ? <>galėtų būti pasiektas <b>{dateFormatter.format(model.targetDate)}</b></> : <>nebus pasiektas per prognozės laikotarpį</>}. Kitas automatinis etapas – <b>{money(model.nextTarget)}</b>.</p></div><span className="gc-plan-badge">{duration(model.months)}<small>iki pagrindinio tikslo</small></span></article>

    {editing && <div className="gc-modal-backdrop" role="presentation" onMouseDown={() => setEditing(false)}><form className="gc-modal" onSubmit={saveSettings} onMouseDown={(event) => event.stopPropagation()}><header><div><span className="gc-eyebrow">GOAL SETTINGS</span><h3>Tikslų nustatymai</h3></div><button type="button" onClick={() => setEditing(false)}>×</button></header>{[
      ["targetValue", "Pagrindinis portfelio tikslas (€)", 1000], ["monthlyContribution", "Mėnesinė investuojama suma (€)", 10], ["expectedReturn", "Prognozuojama metinė grąža (%)", .1], ["monthlyPassiveIncome", "Norimos pasyvios pajamos per mėnesį (€)", 100], ["withdrawalRate", "FIRE išėmimo norma (%)", .1],
    ].map(([key, label, step]) => <label key={key}>{label}<input type="number" min="0" step={step} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}<footer><Button variant="secondary" onClick={() => setEditing(false)}>Atšaukti</Button><Button variant="primary" type="submit">Išsaugoti tikslus</Button></footer></form></div>}
  </section>;
}
