import { useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import Skeleton from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import "../styles/sync-center.css";

const fmtDate = (value) => {
  if (!value) return "Nėra duomenų";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const fmtSeconds = (value) => `${new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 2 }).format(Number(value) || 0)} s`;

function StatusPill({ status }) {
  const normalized = status === "ok" || status === "success" ? "success" : status === "warning" ? "warning" : "error";
  return <Badge tone={normalized} className={`sc-status is-${normalized === "success" ? "ok" : normalized}`}>{normalized === "success" ? "Sėkmingai" : normalized === "warning" ? "Perspėjimas" : "Klaida"}</Badge>;
}

function SystemCheck({ label, ok, detail }) {
  return <div className="sc-system-check"><span className={ok ? "is-ok" : "is-error"}>{ok ? "✓" : "!"}</span><div><strong>{label}</strong><small>{detail}</small></div></div>;
}

export default function SyncPage() {
  const { showToast } = useToast();
  const [payload, setPayload] = useState(null);
  const [state, setState] = useState("loading");
  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  async function loadStatus() {
    setRefreshing(true);
    if (!payload) setState("loading");
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/sync_status.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("sync_status.json nerastas");
      setPayload(await response.json());
      setState("ready");
      setRefreshed(true);
      showToast("Sync Center būsena atnaujinta");
      window.setTimeout(() => setRefreshed(false), 2200);
    } catch {
      setState("error");
    } finally {
      setRefreshing(false);
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
    const excelFound = platforms.filter((item) => item.sourceFile && item.sourceFile !== "—").length;
    const jsonFound = platforms.filter((item) => item.status === "ok" || item.status === "warning").length;
    const historyFound = portfolios.filter((item) => item.updatedAt).length;
    const fastest = [...platforms].filter((item) => Number(item.durationSeconds) > 0).sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
    const slowest = [...platforms].filter((item) => Number(item.durationSeconds) > 0).sort((a, b) => b.durationSeconds - a.durationSeconds)[0];
    const checks = excelFound + jsonFound + historyFound;
    const totalChecks = platforms.length * 2 + portfolios.length;
    const quality = totalChecks ? Math.max(0, Math.round((checks / totalChecks) * 100)) : 0;
    const history = payload?.history || [{ generatedAt: payload?.generatedAt, durationSeconds: payload?.durationSeconds, status: errors ? "error" : warnings ? "warning" : "ok" }];
    return { platforms, portfolios, ok, warnings, errors, records, excelFound, jsonFound, historyFound, fastest, slowest, quality, history };
  }, [payload]);

  if (state === "loading") return <section className="sc-state"><Skeleton lines={5} /></section>;
  if (state === "error") return <section className="sc-state is-error"><h2>Sync Center duomenys dar nesugeneruoti</h2><p>Paleiskite <strong>ATNAUJINTI_VISUS_PORTFELIUS.bat</strong>, tada atnaujinkite puslapį.</p><Button variant="primary" onClick={loadStatus}>Tikrinti dar kartą</Button></section>;

  const allGood = model.errors === 0;

  return <section className="sync-center">
    <article className="sc-hero">
      <div><span className="sc-eyebrow">SYNC CENTER v1.1</span><h2>Portfelių duomenų valdymas</h2><p>Globali Evaldo, Rimos ir Gerdos importų būsena, duomenų kokybė ir atnaujinimo istorija vienoje vietoje.</p><div className="sc-tags"><span className={allGood ? "is-ok" : "is-error"}>● {allGood ? "Sistema paruošta" : "Reikia dėmesio"}</span><span>Paskutinis sync: {fmtDate(payload.generatedAt)}</span></div></div>
      <div className="sc-health"><div className="sc-ring" style={{ "--score": `${model.quality * 3.6}deg` }}><strong>{model.quality}%</strong><span>Data Quality</span></div></div>
      <div className="sc-hero-stats"><div><span>Portfeliai</span><strong>{model.portfolios.length}</strong></div><div><span>Platformos</span><strong>{model.platforms.length}</strong></div><div><span>Įrašai</span><strong>{model.records}</strong></div></div>
    </article>

    <article className="sc-run-card">
      <div className="sc-run-icon">↻</div><div><span>VIENAS ATNAUJINIMO FAILAS</span><h3>Atnaujinti visus portfelius</h3><p>Paleiskite BAT failą projekto aplanke. Jam pasibaigus, čia nuskaitykite naujausią būseną.</p></div>
      <div className="sc-run-actions"><Button variant="primary" onClick={() => setShowHelp(true)}>Instrukcija</Button><Button variant="secondary" onClick={loadStatus} disabled={refreshing}><span className={refreshing ? "sc-spin" : ""}>↻</span> {refreshing ? "Nuskaitoma…" : "Refresh Status"}</Button>{refreshed && <small className="sc-refreshed">✓ Status refreshed</small>}</div>
    </article>

    <div className="sc-kpis">
      <StatCard label="Sėkmingai" value={model.ok} note="importerių" tone="success" />
      <StatCard className="is-warning" label="Perspėjimai" value={model.warnings} note="reikia patikrinti" tone="warning" />
      <StatCard className="is-error" label="Klaidos" value={model.errors} note="kritinių" tone="danger" />
      <StatCard className="is-blue" label="Bendra trukmė" value={fmtSeconds(payload.durationSeconds)} note="paskutinis sync" tone="info" />
    </div>

    <div className="sc-grid sc-grid-equal">
      <article className="sc-card"><SectionHeader eyebrow="DATA QUALITY" title={`Kodėl kokybė ${model.quality}%?`} /><div className="sc-quality-list sc-quality-expanded"><div><span>Excel šaltiniai</span><strong>{model.excelFound}/{model.platforms.length} ✓</strong></div><div><span>JSON platformos</span><strong>{model.jsonFound}/{model.platforms.length} ✓</strong></div><div><span>History failai</span><strong>{model.historyFound}/{model.portfolios.length} ✓</strong></div><div><span>Platformos</span><strong>{model.platforms.length} ✓</strong></div><div><span>Neatitikimai</span><strong className={model.errors ? "bad" : "good"}>{model.errors}</strong></div><div><span>Kokybės balas</span><strong className="good">{model.quality}%</strong></div></div></article>
      <article className="sc-card"><SectionHeader eyebrow="SYSTEM STATUS" title="Sistemos būsena" /><div className="sc-system-grid"><SystemCheck label="Python" ok={Boolean(payload.system?.python ?? true)} detail={payload.system?.pythonVersion || "Importeriai paleisti"}/><SystemCheck label="GitHub" ok={Boolean(payload.system?.github ?? true)} detail="Publikavimo žingsnis paruoštas"/><SystemCheck label="Importeriai" ok={model.errors === 0} detail={`${model.ok}/${model.platforms.length} sėkmingi`}/><SystemCheck label="JSON" ok={model.jsonFound === model.platforms.length} detail={`${model.jsonFound}/${model.platforms.length} rasti`}/></div></article>
    </div>

    <div className="sc-grid">
      <article className="sc-card"><SectionHeader eyebrow="PORTFELIAI" title="Portfelių būsena" /><div className="sc-portfolio-list">{model.portfolios.map((item) => <div key={item.id} className="sc-portfolio-row"><div className="sc-avatar">{item.initials}</div><div><strong>{item.name}</strong><span>{item.platforms} platformos · {item.records} įrašai</span></div><div className="sc-portfolio-date"><StatusPill status={item.status}/><small>{fmtDate(item.updatedAt)}</small></div></div>)}</div></article>
      <article className="sc-card"><SectionHeader eyebrow="PERFORMANCE" title="Importo našumas" /><div className="sc-performance"><div><span>Greičiausias</span><strong>{model.fastest?.platformName || "—"}</strong><small>{model.fastest ? fmtSeconds(model.fastest.durationSeconds) : "—"}</small></div><div><span>Lėčiausias</span><strong>{model.slowest?.platformName || "—"}</strong><small>{model.slowest ? fmtSeconds(model.slowest.durationSeconds) : "—"}</small></div><div><span>Excel šaltiniai</span><strong>{model.excelFound}/{model.platforms.length}</strong><small>atpažinta</small></div></div></article>
    </div>

    <article className="sc-card">
      <SectionHeader eyebrow="IMPORT STATUS" title="Platformų atnaujinimo lentelė" action={<Button variant="ghost" className="sc-refresh" onClick={loadStatus}>↻ Atnaujinti</Button>} />
      <DataTable className="sc-table-wrap" tableClassName="sc-table"><thead><tr><th>Portfelis</th><th>Platforma</th><th>Statusas</th><th>Trukmė</th><th>Šaltinis</th><th>Įrašai</th><th>Duomenų data</th></tr></thead><tbody>{model.platforms.map((item, index) => <tr key={`${item.ownerId}-${item.platformName}-${index}`}><td>{item.ownerName || "Evaldas"}</td><td><strong>{item.platformName}</strong><small>{item.moduleType || "platforma"}</small></td><td><StatusPill status={item.status}/>{item.error ? <small className="sc-error-text">{item.error}</small> : null}</td><td>{fmtSeconds(item.durationSeconds)}</td><td>{item.sourceFile || "—"}</td><td>{item.records ?? 0}</td><td>{item.latestDataDate || "—"}</td></tr>)}</tbody></DataTable>
    </article>

    <div className="sc-grid sc-grid-equal">
      <article className="sc-card"><SectionHeader eyebrow="SYNC HISTORY" title="Paskutiniai atnaujinimai" /><div className="sc-history-list">{model.history.slice(0, 10).map((item, index) => <div className="sc-history-row" key={`${item.generatedAt}-${index}`}><div><strong>{fmtDate(item.generatedAt)}</strong><small>Sinchronizavimas #{model.history.length - index}</small></div><span>{fmtSeconds(item.durationSeconds)}</span><StatusPill status={item.status}/></div>)}</div></article>
      <article className="sc-card sc-log"><SectionHeader eyebrow="IMPORT LOG" title="Paskutinio sync žurnalas" /><div className="sc-terminal">{(payload.log || []).map((line, index) => <div key={index}><time>{line.time}</time><span className={`is-${line.level || "info"}`}>{line.message}</span></div>)}</div></article>
    </div>

    <footer className="sc-footer"><div><strong>Portfolio Dashboard</strong><span>Sync Center v1.1</span></div><div><span>Last sync</span><strong>{fmtDate(payload.generatedAt)}</strong></div></footer>

    {showHelp && <div className="sc-modal-backdrop" onClick={() => setShowHelp(false)}><div className="sc-modal" onClick={(event) => event.stopPropagation()}><button className="sc-close" onClick={() => setShowHelp(false)}>×</button><span className="sc-section-label">WINDOWS</span><h3>Atnaujinimo eiga</h3><ol><li>Atidarykite pagrindinį projekto aplanką.</li><li>Dukart spustelėkite <strong>ATNAUJINTI_VISUS_PORTFELIUS.bat</strong>.</li><li>Palaukite, kol lange bus parodyta, kad visi portfeliai atnaujinti.</li><li>Grįžkite į Sync Center ir paspauskite <strong>Refresh Status</strong>.</li></ol><Button variant="primary" onClick={() => setShowHelp(false)}>Supratau</Button></div></div>}
  </section>;
}
