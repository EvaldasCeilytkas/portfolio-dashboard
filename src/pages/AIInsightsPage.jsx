import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useReportData from "../hooks/useReportData";
import { usePortfolioOwner } from "../context/PortfolioContext";
import Skeleton from "../components/ui/Skeleton";
import Badge from "../components/ui/Badge";
import { buildAIInsights } from "../components/ai/aiEngine";
import "../styles/ai-insights.css";

const money = (value) => new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(value) || 0);

function AIInsightsPage() {
  const { report, loading, errorMessage } = useReportData();
  const { ownerId, owner } = usePortfolioOwner();
  const navigate = useNavigate();
  const model = useMemo(() => report ? buildAIInsights(report, ownerId) : null, [report, ownerId]);

  if (loading) return <div className="ai-loading">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} lines={index === 0 ? 5 : 3} />)}</div>;
  if (errorMessage || !model) return <section className="ai-error"><h2>AI Insights nepavyko paruošti</h2><p>{errorMessage || "Trūksta portfelio duomenų."}</p></section>;

  return (
    <section className="ai-insights ds-page-enter">
      <article className="ai-hero">
        <div className="ai-hero-copy">
          <span className="ai-eyebrow">AI INSIGHTS v1.0</span>
          <h2>{owner.name} portfelio rytinė santrauka</h2>
          <p>{model.summary}</p>
          <div className="ai-hero-tags"><span>● Vietinė analizė</span><span>Be išorinio API</span><span>Atnaujinta {model.generatedAt}</span></div>
        </div>
        <div className="ai-score-card">
          <div className="ai-score-ring" style={{ "--score": model.score }}><strong>{model.score}</strong><span>/100</span></div>
          <div><small>AI PORTFOLIO SCORE</small><b>{model.grade}</b><span>{model.score >= 85 ? "Labai stipri būklė" : model.score >= 70 ? "Stabili būklė" : "Reikia dėmesio"}</span></div>
        </div>
      </article>

      <div className="ai-score-parts">
        {model.scoreParts.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><div><i style={{ width: `${item.value}%` }} /></div></article>)}
      </div>

      <article className="ai-panel ai-daily">
        <header><div><span className="ai-eyebrow">DAILY BRIEF</span><h3>Ką svarbiausia žinoti dabar</h3></div><Badge tone="analytics">Automatinė santrauka</Badge></header>
        <div className="ai-brief-grid">
          {model.dailyBrief.map((item) => <div key={item.title} className={`ai-brief-item is-${item.tone}`}><span>{item.icon}</span><div><strong>{item.title}</strong><p>{item.text}</p></div></div>)}
        </div>
      </article>

      <section className="ai-highlight-grid">
        {model.highlights.map((item) => <article key={item.label} className={`ai-highlight is-${item.tone}`}><span>{item.label}</span><strong>{item.value}</strong><small>{item.meta}</small></article>)}
      </section>

      <div className="ai-main-grid">
        <article className="ai-panel">
          <header><div><span className="ai-eyebrow">OPPORTUNITIES</span><h3>Kur yra didžiausia nauda</h3></div></header>
          <div className="ai-opportunity-list">{model.opportunities.map((item, index) => <button key={item.title} onClick={() => navigate(item.action)}><span>{index + 1}</span><div><strong>{item.title}</strong><p>{item.text}</p></div><em>{item.impact}</em></button>)}</div>
        </article>
        <article className="ai-panel">
          <header><div><span className="ai-eyebrow">RISK RADAR</span><h3>Kas reikalauja dėmesio</h3></div></header>
          <div className="ai-risk-list">{model.risks.map((item) => <button key={item.title} className={`is-${item.level}`} onClick={() => navigate(item.action)}><span>!</span><div><strong>{item.title}</strong><p>{item.text}</p></div><em>{item.level === "high" ? "Aukšta" : item.level === "medium" ? "Vidutinė" : "Žema"}</em></button>)}</div>
        </article>
      </div>

      <div className="ai-secondary-grid">
        <article className="ai-panel ai-goal-card">
          <header><div><span className="ai-eyebrow">GOAL INTELLIGENCE</span><h3>Kelias iki pagrindinio tikslo</h3></div><button onClick={() => navigate("/goals")}>Atidaryti Goals →</button></header>
          <div className="ai-goal-content"><div className="ai-goal-ring" style={{ "--goal": Math.min(100, model.goal.progress) }}><strong>{Math.round(model.goal.progress)}%</strong></div><div><span>Tikslas</span><strong>{money(model.goal.target)}</strong><p>{model.goal.date ? `Dabartiniu tempu tikslas prognozuojamas ${new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long" }).format(model.goal.date)}.` : "Pagal dabartinį planą tikslas per prognozės laikotarpį nepasiekiamas."}</p><small>{money(model.goal.monthlyContribution)} reguliari mėnesio įmoka</small></div></div>
        </article>
        <article className="ai-panel">
          <header><div><span className="ai-eyebrow">TREND DETECTOR</span><h3>Aptiktos kryptys</h3></div></header>
          <div className="ai-trend-list">{model.trends.map((item) => <div key={item.label} className={`is-${item.direction}`}><span>{item.direction === "up" ? "↗" : item.direction === "down" ? "↘" : "→"}</span><div><strong>{item.label}</strong><small>{item.text}</small></div><b>{item.value}</b></div>)}</div>
        </article>
      </div>

      <article className="ai-panel ai-actions">
        <header><div><span className="ai-eyebrow">ACTION LIST</span><h3>Rekomenduojami kiti žingsniai</h3></div><Badge tone="info">{model.actions.length} veiksmai</Badge></header>
        <div>{model.actions.map((item, index) => <button key={item.title} onClick={() => navigate(item.path)}><span className={`is-${item.priority}`}>{index + 1}</span><div><strong>{item.title}</strong><p>{item.text}</p></div><em>Atidaryti →</em></button>)}</div>
      </article>

      <footer className="ai-footer"><span>AI Insights v1.0</span><p>Įžvalgos generuojamos taisyklėmis iš jūsų sinchronizuotų portfelio duomenų. Tai nėra individuali finansinė konsultacija.</p></footer>
    </section>
  );
}

export default AIInsightsPage;
