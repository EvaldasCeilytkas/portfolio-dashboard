import { useEffect, useMemo, useState } from "react";
import "../styles/sync-center.css";

const fmtDate = (value) => {
  if (!value) return "Nėra duomenų";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium", timeStyle: "short" }).format(date);
};
const fmtSeconds = (value) => `${new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 2 }).format(Number(value) || 0)} s`;

function StatusPill({ status }) {
  const normalized = status === "ok" || status === "success" ? "ok" : status === "warning" ? "warning" : "error";
  return <span className={`sc-status is-${normalized}`}>{normalized === "ok" ? "Sėkmingai" : normalized === "warning" ? "Perspėjimas" : "Klaida"}</span>;
}

export default function SyncPage() {
  const [payload, setPayload] = useState(null);
  const [state, setState] = useState("loading");
  const [showHelp, setShowHelp] = useState(false);

  async function loadStatus() {
    setState("loading");
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/sync_status.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("sync_status.json nerastas");
      setPayload(await response.json());
      setState("ready");
    } catch {
      setState("error");
    }
  }

  useEffect(() => { loadStatus(); }, []);

  const model = useMemo(() => {
    const platforms = payload?.platforms || [];
    const portfolios = payload?.portfolios || [];
    const ok = platforms.filter((item) => item.status === "ok").length;
    const warnings = platforms.filter((item) => item.status === "warning").length;
    const errors = platforms.filter((item) => !["ok", "warning"].includes(item.status)).length;
    const records = platforms.reduce((sum, item) => sum + (Number(item.records) || 0), 0);
    const excelFound = platforms.filter((item) => item.sourceFile).length;
    const fastest = [...platforms].filter((item) => Number(item.durationSeconds) > 0).sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
    const slowest = [...platforms].filter((item) => Number(item.durationSeconds) > 0).sort((a, b) => b.durationSeconds - a.durationSeconds)[0];
    const quality = platforms.length ? Math.max(0, Math.round((ok / platforms.length) * 100)) : 0;
    return { platforms, portfolios, ok, warnings, errors, records, excelFound, fastest, slowest, quality };
  }, [payload]);

  if (state === "loading") return <section className="sc-state">Tikrinama sinchronizavimo būsena…</section>;
  if (state === "error") return <section className="sc-state is-error"><h2>Sync Center duomenys dar nesugeneruoti</h2><p>Paleiskite <strong>ATNAUJINTI_VISUS_PORTFELIUS.bat</strong>, tada atnaujinkite puslapį.</p><button onClick={loadStatus}>Tikrinti dar kartą</button></section>;

  return <section className="sync-center">
    <article className="sc-hero">
      <div><span className="sc-eyebrow">SYNC CENTER v1.0</span><h2>Portfelių duomenų valdymas</h2><p>Evaldo, Rimos ir Gerdos importų būsena, duomenų kokybė ir paskutinio atnaujinimo rezultatai vienoje vietoje.</p><div className="sc-tags"><span className={model.errors ? "is-error" : "is-ok"}>● {model.errors ? "Reikia dėmesio" : "Sistema paruošta"}</span><span>Paskutinis sync: {fmtDate(payload.generatedAt)}</span></div></div>
      <div className="sc-health"><div className="sc-ring" style={{ "--score": `${model.quality * 3.6}deg` }}><strong>{model.quality}%</strong><span>Data Quality</span></div></div>
      <div className="sc-hero-stats"><div><span>Portfeliai</span><strong>{model.portfolios.length}</strong></div><div><span>Platformos</span><strong>{model.platforms.length}</strong></div><div><span>Įrašai</span><strong>{model.records}</strong></div></div>
    </article>

    <article className="sc-run-card">
      <div className="sc-run-icon">↻</div><div><span>VIENAS ATNAUJINIMO FAILAS</span><h3>Atnaujinti visus portfelius</h3><p>Naršyklė saugumo sumetimais negali tiesiogiai paleisti Windows BAT failo. Paleiskite jį projekto aplanke, o čia paspauskite „Atnaujinti būseną“.</p></div>
      <div className="sc-run-actions"><button className="is-primary" onClick={() => setShowHelp(true)}>Kaip paleisti</button><button onClick={loadStatus}>Atnaujinti būseną</button></div>
    </article>

    <div className="sc-kpis">
      <article><span>Sėkmingai</span><strong>{model.ok}</strong><small>importerių</small></article>
      <article className="is-warning"><span>Perspėjimai</span><strong>{model.warnings}</strong><small>reikia patikrinti</small></article>
      <article className="is-error"><span>Klaidos</span><strong>{model.errors}</strong><small>kritinių</small></article>
      <article className="is-blue"><span>Bendra trukmė</span><strong>{fmtSeconds(payload.durationSeconds)}</strong><small>paskutinis sync</small></article>
    </div>

    <div className="sc-grid">
      <article className="sc-card">
        <header><div><span className="sc-section-label">PORTFELIAI</span><h3>Portfelių būsena</h3></div></header>
        <div className="sc-portfolio-list">{model.portfolios.map((item) => <div key={item.id} className="sc-portfolio-row"><div className="sc-avatar">{item.initials}</div><div><strong>{item.name}</strong><span>{item.platforms} platformos · {item.records} įrašai</span></div><div className="sc-portfolio-date"><StatusPill status={item.status} /><small>{fmtDate(item.updatedAt)}</small></div></div>)}</div>
      </article>
      <article className="sc-card">
        <header><div><span className="sc-section-label">PERFORMANCE</span><h3>Importo našumas</h3></div></header>
        <div className="sc-performance"><div><span>Greičiausias</span><strong>{model.fastest?.platformName || "—"}</strong><small>{model.fastest ? fmtSeconds(model.fastest.durationSeconds) : "—"}</small></div><div><span>Lėčiausias</span><strong>{model.slowest?.platformName || "—"}</strong><small>{model.slowest ? fmtSeconds(model.slowest.durationSeconds) : "—"}</small></div><div><span>Excel šaltiniai</span><strong>{model.excelFound}/{model.platforms.length}</strong><small>atpažinta</small></div></div>
      </article>
    </div>

    <article className="sc-card">
      <header><div><span className="sc-section-label">IMPORT STATUS</span><h3>Platformų atnaujinimo lentelė</h3></div><button className="sc-refresh" onClick={loadStatus}>↻ Atnaujinti</button></header>
      <div className="sc-table-wrap"><table className="sc-table"><thead><tr><th>Platforma</th><th>Portfelis</th><th>Šaltinis</th><th>Įrašai</th><th>Duomenų data</th><th>Trukmė</th><th>Būsena</th></tr></thead><tbody>{model.platforms.map((item, index) => <tr key={`${item.ownerId}-${item.platformName}-${index}`}><td><strong>{item.platformName}</strong><small>{item.moduleType || "platforma"}</small></td><td>{item.ownerName || "Evaldas"}</td><td>{item.sourceFile || "—"}</td><td>{item.records ?? 0}</td><td>{item.latestDataDate || "—"}</td><td>{fmtSeconds(item.durationSeconds)}</td><td><StatusPill status={item.status} />{item.error ? <small className="sc-error-text">{item.error}</small> : null}</td></tr>)}</tbody></table></div>
    </article>

    <div className="sc-grid">
      <article className="sc-card"><header><div><span className="sc-section-label">DATA QUALITY</span><h3>Kokybės patikra</h3></div></header><div className="sc-quality-list"><div><span>Excel šaltiniai</span><strong>{model.excelFound}/{model.platforms.length}</strong></div><div><span>JSON platformos</span><strong>{model.ok}/{model.platforms.length}</strong></div><div><span>Neatitikimai</span><strong className={model.errors ? "bad" : "good"}>{model.errors}</strong></div><div><span>Kokybės balas</span><strong className="good">{model.quality}%</strong></div></div></article>
      <article className="sc-card sc-log"><header><div><span className="sc-section-label">IMPORT LOG</span><h3>Paskutinio sync žurnalas</h3></div></header><div className="sc-terminal">{(payload.log || []).map((line, index) => <div key={index}><time>{line.time}</time><span className={`is-${line.level || "info"}`}>{line.message}</span></div>)}</div></article>
    </div>

    {showHelp && <div className="sc-modal-backdrop" onClick={() => setShowHelp(false)}><div className="sc-modal" onClick={(event) => event.stopPropagation()}><button className="sc-close" onClick={() => setShowHelp(false)}>×</button><span className="sc-section-label">WINDOWS</span><h3>Atnaujinimo eiga</h3><ol><li>Atidarykite pagrindinį projekto aplanką.</li><li>Dukart spustelėkite <strong>ATNAUJINTI_VISUS_PORTFELIUS.bat</strong>.</li><li>Palaukite, kol lange bus parodyta, kad visi portfeliai atnaujinti.</li><li>Grįžkite į Sync Center ir paspauskite <strong>Atnaujinti būseną</strong>.</li></ol><button className="is-primary" onClick={() => setShowHelp(false)}>Supratau</button></div></div>}
  </section>;
}
