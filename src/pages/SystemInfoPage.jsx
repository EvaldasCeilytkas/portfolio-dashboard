import { useCallback, useEffect, useMemo, useState } from "react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import SectionHeader from "../components/ui/SectionHeader";
import StatCard from "../components/ui/StatCard";
import { useToast } from "../components/ui/Toast";
import { CHANGELOG, RELEASE } from "../config/release";
import { usePortfolioOwner } from "../context/PortfolioContext";
import "../styles/system-info.css";

const CHECKS = [
  { id: "portfolio", label: "Portfolio JSON", path: "data/portfolio.json" },
  { id: "history", label: "Portfolio istorija", path: "data/portfolio_history.json" },
  { id: "platforms", label: "Platformų istorija", path: "data/platform_history.json" },
  { id: "sync", label: "Sync būsena", path: "data/sync_status.json" },
  { id: "rima", label: "Rimos istorija", path: "data/rima/portfolio_history.json" },
  { id: "gerda", label: "Gerdos portfelis", path: "data/gerda/portfolio.json" },
];

function getLocalStorageSnapshot() {
  const values = {};
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;
    if (key.startsWith("portfolio") || key.includes("goal") || key.includes("dashboard")) {
      values[key] = window.localStorage.getItem(key);
    }
  }
  return values;
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("lt-LT");
}

export default function SystemInfoPage() {
  const { owners } = usePortfolioOwner();
  const { showToast } = useToast();
  const [sync, setSync] = useState(null);
  const [checks, setChecks] = useState([]);
  const [checking, setChecking] = useState(true);

  const runDiagnostics = useCallback(async () => {
    setChecking(true);
    const results = await Promise.all(
      CHECKS.map(async (check) => {
        try {
          const response = await fetch(`${import.meta.env.BASE_URL}${check.path}`, { cache: "no-store" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          return {
            ...check,
            status: "ok",
            details: Array.isArray(data) ? `${data.length} įrašai` : "JSON validus",
          };
        } catch (error) {
          return { ...check, status: "error", details: error.message };
        }
      }),
    );
    setChecks(results);
    setChecking(false);
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/sync_status.json`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then(setSync)
      .catch(() => setSync(null));
    runDiagnostics();
  }, [runDiagnostics]);

  const platformCount = sync?.platforms?.length || 0;
  const importerCount = new Set((sync?.platforms || []).map((item) => item.task).filter(Boolean)).size;
  const passed = checks.filter((item) => item.status === "ok").length;
  const diagnosticScore = checks.length ? Math.round((passed / checks.length) * 100) : 0;
  const systemHealthy = checks.length > 0 && passed === checks.length;

  const releaseChecklist = useMemo(
    () => [
      ["Dashboard", true], ["Portfolio", true], ["Analytics", true], ["P2P", true],
      ["Performance", true], ["Alerts", true], ["Intelligence", true], ["Goals", true],
      ["Sync", true], ["Search Index", true], ["Reports", true], ["AI Insights", true],
      ["Backup", true], ["Multi Portfolio", true], ["Design System", true], ["Routing", true],
    ],
    [],
  );

  function exportBackup() {
    const payload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      release: RELEASE,
      preferences: getLocalStorageSnapshot(),
      syncSummary: sync
        ? {
            generatedAt: sync.generatedAt,
            durationSeconds: sync.durationSeconds,
            portfolios: sync.portfolios,
          }
        : null,
    };
    downloadJson(payload, `portfolio-dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`);
    showToast("Atsarginė konfigūracijos kopija paruošta");
  }

  return (
    <div className="system-page ds-motion-page">
      <section className="system-hero">
        <div>
          <span className="system-kicker">STABLE RELEASE</span>
          <h2>{RELEASE.product}</h2>
          <p>Versijos, diagnostikos, atsarginių kopijų ir stabilaus leidimo būsenos centras.</p>
        </div>
        <div className="system-version-block">
          <strong>{RELEASE.label}</strong>
          <span>Build {RELEASE.build}</span>
          <Badge tone={systemHealthy ? "success" : "warning"}>
            <span className="stable-status-dot" aria-hidden="true" />
            {systemHealthy ? "SYSTEM HEALTHY" : "CHECK SYSTEM"}
          </Badge>
        </div>
      </section>

      <div className="system-stats">
        <StatCard label="Portfeliai" value={owners.length} note="Evaldas, Rima, Gerda, Šeima" />
        <StatCard label="Platformos" value={platformCount} note="Pagal paskutinį Sync" />
        <StatCard label="Importeriai" value={importerCount} note="Unikalūs Sync procesai" />
        <StatCard label="Diagnostika" value={`${diagnosticScore} %`} note={`${passed}/${checks.length} patikrų sėkmingos`} />
      </div>

      <div className="system-grid">
        <Card className="system-panel">
          <SectionHeader title="System Info" description="Aktyvios stabilios aplikacijos leidimo informacija" />
          <dl className="system-info-list">
            <div><dt>Produktas</dt><dd>{RELEASE.product}</dd></div>
            <div><dt>Versija</dt><dd>{RELEASE.label}</dd></div>
            <div><dt>Release Channel</dt><dd><Badge tone="success">{RELEASE.channel}</Badge></dd></div>
            <div><dt>Build</dt><dd>{RELEASE.build}</dd></div>
            <div><dt>Build ID</dt><dd>{RELEASE.buildNumber}</dd></div>
            <div><dt>Design System</dt><dd>v{RELEASE.designSystem}</dd></div>
            <div><dt>React režimas</dt><dd>Vite / BrowserRouter</dd></div>
            <div><dt>Paskutinis Sync</dt><dd>{formatDate(sync?.generatedAt)}</dd></div>
          </dl>
          <div className="system-actions">
            <Button variant="primary" onClick={exportBackup}>Eksportuoti Backup</Button>
            <Button onClick={() => { runDiagnostics(); showToast("Diagnostika paleista", "success", 1800); }}>
              Pakartoti diagnostiką
            </Button>
          </div>
          <p className="system-note">Backup saugo naršyklės nustatymus ir Goals konfigūraciją. Excel bei JSON duomenys lieka projekto aplankuose.</p>
        </Card>

        <Card className="system-panel">
          <SectionHeader title="Diagnostics" description="Pagrindinių duomenų šaltinių patikra" />
          <div className="diagnostic-score-wrap" aria-label={`Diagnostikos balas ${diagnosticScore} procentų`}>
            <div className="diagnostic-score-ring" style={{ "--score": diagnosticScore }}>
              <span>{diagnosticScore}%</span>
            </div>
            <div>
              <strong>{systemHealthy ? "Sistema veikia stabiliai" : "Reikalinga patikra"}</strong>
              <small>{passed} iš {checks.length} šaltinių patikrinti sėkmingai.</small>
            </div>
          </div>
          <div className="diagnostic-list">
            {checks.map((check) => (
              <div className="diagnostic-row" key={check.id}>
                <span className={`diagnostic-dot is-${check.status}`} />
                <div><strong>{check.label}</strong><small>{checking ? "Tikrinama..." : check.details}</small></div>
                <Badge tone={check.status === "ok" ? "success" : "danger"}>
                  {check.status === "ok" ? "✓ Healthy" : "Issue"}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="system-grid">
        <Card className="system-panel">
          <SectionHeader title="Final Release Checklist" description="Pagrindinių v2.0 modulių parengtis" />
          <div className="release-checklist">
            {releaseChecklist.map(([name, ready]) => (
              <div key={name}>
                <span>{ready ? "✓" : "•"}</span>
                <strong>{name}</strong>
                <Badge tone={ready ? "success" : "warning"}>{ready ? "READY" : "CHECK"}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="system-panel">
          <SectionHeader title="Changelog" description="Svarbiausi projekto leidimai" />
          <div className="changelog-list">
            {CHANGELOG.map((release) => (
              <article key={release.version}>
                <div><strong>{release.version}</strong><time>{release.date}</time></div>
                <h3>{release.title}</h3>
                <ul>{release.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </Card>
      </div>

      <footer className="system-footer">
        <strong>{RELEASE.product}</strong>
        <span>Version {RELEASE.version} · {RELEASE.channel} · Build {RELEASE.build}</span>
        <small>© {RELEASE.copyrightYear} · React · Vite · Python Import Framework</small>
      </footer>
    </div>
  );
}
