import { useEffect, useMemo, useState } from "react";

import "../styles/datacenter.css";

const STATUS_LABELS = {
  ok: "Veikia",
  warning: "Dėmesio",
  error: "Klaida",
  missing: "Failas nerastas",
};

const MODULE_LABELS = {
  etf: "ETF",
  broker: "Brokerage",
  brokerage: "Brokerage",
  p2p: "P2P",
};

function number(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatDuration(value) {
  const seconds = number(value);

  if (seconds < 1) {
    return `${Math.round(seconds * 1000)} ms`;
  }

  return `${seconds.toFixed(2)} s`;
}

function formatFileSize(bytes) {
  const value = number(bytes);

  if (value <= 0) return "–";
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;

  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function formatDateTime(value) {
  if (!value) return "–";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value) {
  if (!value) return "–";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
  }).format(date);
}

function normalizeModuleType(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized.includes("p2p")) return "p2p";
  if (normalized.includes("broker")) return "brokerage";
  if (normalized.includes("etf")) return "etf";

  return normalized || "other";
}

function SummaryCard({ eyebrow, value, description, icon }) {
  return (
    <article className="data-center-summary-card">
      <div className="data-center-summary-icon" aria-hidden="true">
        {icon}
      </div>

      <div>
        <p>{eyebrow}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>
    </article>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = STATUS_LABELS[status] ? status : "warning";

  return (
    <span className={`data-center-status data-center-status-${normalizedStatus}`}>
      <span aria-hidden="true" />
      {STATUS_LABELS[normalizedStatus]}
    </span>
  );
}

function PlatformLogo({ platform }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = platform?.logoUrl;

  if (!logoUrl || failed) {
    return (
      <span className="data-center-platform-fallback">
        {String(platform?.name || "?").slice(0, 1)}
      </span>
    );
  }

  return (
    <span className="data-center-platform-logo">
      <img
        src={logoUrl}
        alt=""
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function DataCenter() {
  const [statusData, setStatusData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDataCenter() {
      setLoading(true);
      setErrorMessage("");

      try {
        const [statusResponse, portfolioResponse] = await Promise.all([
          fetch("/data/import_status.json", { cache: "no-store" }),
          fetch("/data/portfolio.json", { cache: "no-store" }),
        ]);

        if (!statusResponse.ok) {
          throw new Error(
            "Nerastas import_status.json. Pirmiausia paleisk update_all.py.",
          );
        }

        if (!portfolioResponse.ok) {
          throw new Error("Nepavyko perskaityti portfolio.json.");
        }

        const [nextStatusData, nextPortfolio] = await Promise.all([
          statusResponse.json(),
          portfolioResponse.json(),
        ]);

        if (!cancelled) {
          setStatusData(nextStatusData);
          setPortfolio(nextPortfolio);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Nepavyko užkrauti Data Center duomenų.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDataCenter();

    return () => {
      cancelled = true;
    };
  }, []);

  const analysis = useMemo(() => {
    const imports = Array.isArray(statusData?.platforms)
      ? statusData.platforms
      : [];

    const okImports = imports.filter((item) => item.status === "ok");
    const failedImports = imports.filter((item) => item.status !== "ok");
    const platforms = Array.isArray(portfolio?.platforms)
      ? portfolio.platforms
      : [];

    const platformByName = new Map(
      platforms.map((platform) => [
        String(platform?.name || "").trim().toLowerCase(),
        platform,
      ]),
    );

    const enrichedImports = imports.map((item) => {
      const matchingPlatform = platformByName.get(
        String(item?.platformName || "").trim().toLowerCase(),
      );

      return {
        ...item,
        platform: matchingPlatform || {
          name: item.platformName,
          logoUrl: "",
        },
        normalizedModuleType: normalizeModuleType(item.moduleType),
      };
    });

    const historyRecords = platforms.reduce(
      (sum, platform) =>
        sum + (Array.isArray(platform?.history) ? platform.history.length : 0),
      0,
    );

    const positionRecords = imports.reduce(
      (sum, item) => sum + number(item.records),
      0,
    );

    const recordBreakdown = enrichedImports.reduce(
      (result, item) => {
        const key = item.normalizedModuleType;
        result[key] = (result[key] || 0) + number(item.records);
        return result;
      },
      {},
    );

    const portfolioHistory = Array.isArray(portfolio?.history)
      ? portfolio.history
      : [];

    const historyDates = portfolioHistory
      .map((item) => item?.date)
      .filter(Boolean)
      .sort();

    const firstHistoryDate = historyDates[0] || "";
    const lastHistoryDate = historyDates.at(-1) || "";

    const completion =
      imports.length > 0 ? Math.round((okImports.length / imports.length) * 100) : 0;

    const healthScore = Math.max(
      0,
      Math.min(
        100,
        completion -
          failedImports.filter((item) => item.status === "error").length * 10 -
          failedImports.filter((item) => item.status === "missing").length * 5,
      ),
    );

    return {
      imports,
      enrichedImports,
      okImports,
      failedImports,
      platforms,
      historyRecords,
      positionRecords,
      recordBreakdown,
      firstHistoryDate,
      lastHistoryDate,
      portfolioHistoryCount: portfolioHistory.length,
      completion,
      healthScore,
    };
  }, [statusData, portfolio]);

  if (loading) {
    return (
      <section className="data-center-page">
        <div className="data-center-state">Kraunamas Portfolio Control Center...</div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="data-center-page">
        <div className="data-center-state data-center-state-error">
          <span aria-hidden="true">!</span>
          <div>
            <h2>Data Center dar neparuoštas</h2>
            <p>{errorMessage}</p>
            <code>python scripts/update_all.py</code>
          </div>
        </div>
      </section>
    );
  }

  const allImportsOk =
    analysis.imports.length > 0 && analysis.failedImports.length === 0;

  return (
    <section className="data-center-page">
      <header className="data-center-hero">
        <div>
          <p className="data-center-eyebrow">PORTFOLIO SYSTEM ADMINISTRATION</p>
          <h1>Portfolio Control Center</h1>
          <p className="data-center-subtitle">
            Importavimo būsena, duomenų apimtis ir sistemos informacija vienoje
            vietoje.
          </p>
        </div>

        <div
          className={`data-center-health ${
            allImportsOk ? "is-healthy" : "has-warning"
          }`}
        >
          <div className="data-center-health-score">
            <strong>{analysis.healthScore}</strong>
            <span>/100</span>
          </div>

          <div>
            <small>SYSTEM HEALTH</small>
            <strong>
              {allImportsOk
                ? "Excellent"
                : `${analysis.failedImports.length} importams reikia dėmesio`}
            </strong>
            <p>
              {allImportsOk
                ? "Visi importai sėkmingi"
                : "Patikrink platformų importavimo lentelę"}
            </p>
          </div>
        </div>
      </header>

      <div className="data-center-summary-grid">
        <SummaryCard
          icon="◫"
          eyebrow="PORTFOLIO SCHEMA"
          value={`V${statusData?.schemaVersion ?? portfolio?.schemaVersion ?? "–"}`}
          description="Dabartinė JSON struktūra"
        />
        <SummaryCard
          icon="◎"
          eyebrow="PLATFORMOS PORTFELYJE"
          value={String(portfolio?.platformCounts?.total ?? analysis.platforms.length)}
          description={`${portfolio?.platformCounts?.active ?? 0} aktyvios`}
        />
        <SummaryCard
          icon="↻"
          eyebrow="PILNI IMPORTERIAI"
          value={`${analysis.okImports.length}/${analysis.imports.length}`}
          description="Sėkmingai apdoroti"
        />
        <SummaryCard
          icon="⌁"
          eyebrow="PASKUTINIS ATNAUJINIMAS"
          value={formatDateTime(statusData?.generatedAt)}
          description={`Trukmė ${formatDuration(statusData?.durationSeconds)}`}
        />
      </div>

      <article className="data-center-panel">
        <div className="data-center-panel-header">
          <div>
            <p>IMPORT PIPELINE</p>
            <h2>Platformų importai</h2>
            <span>
              Kiekvienos prijungtos platformos šaltinis ir paskutinio importo
              rezultatas.
            </span>
          </div>

          <div className="data-center-progress-summary">
            <strong>{analysis.completion}%</strong>
            <span>{analysis.okImports.length} / {analysis.imports.length} importuoti</span>
          </div>
        </div>

        <div className="data-center-progress-track" aria-hidden="true">
          <span style={{ width: `${analysis.completion}%` }} />
        </div>

        <div className="data-center-table-wrap">
          <table className="data-center-table">
            <thead>
              <tr>
                <th>Platforma</th>
                <th>Excel failas</th>
                <th>Būsena</th>
                <th>Įrašai</th>
                <th>Duomenų data</th>
                <th>Trukmė</th>
              </tr>
            </thead>

            <tbody>
              {analysis.enrichedImports.map((item) => (
                <tr key={item.platformName}>
                  <td>
                    <div className="data-center-platform">
                      <PlatformLogo platform={item.platform} />
                      <div>
                        <strong>{item.platformName}</strong>
                        <small>
                          {MODULE_LABELS[item.normalizedModuleType] ||
                            item.moduleType ||
                            "Platforma"}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="data-center-file">{item.sourceFile || "–"}</code>
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                    {item.error ? (
                      <p className="data-center-error-text">{item.error}</p>
                    ) : null}
                  </td>
                  <td>
                    <strong>{number(item.records)}</strong>
                  </td>
                  <td>{item.latestDataDate || "–"}</td>
                  <td>{formatDuration(item.durationSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <div className="data-center-secondary-grid">
        <article className="data-center-panel">
          <div className="data-center-panel-header compact">
            <div>
              <p>DATA STATISTICS</p>
              <h2>Duomenų apimtis</h2>
            </div>

            <span className="data-center-panel-count">
              {analysis.positionRecords} įrašų
            </span>
          </div>

          <div className="data-center-breakdown-grid">
            <div>
              <span>ETF pozicijos</span>
              <strong>{analysis.recordBreakdown.etf || 0}</strong>
            </div>
            <div>
              <span>Brokerio pozicijos</span>
              <strong>{analysis.recordBreakdown.brokerage || 0}</strong>
            </div>
            <div>
              <span>P2P paskolos</span>
              <strong>{analysis.recordBreakdown.p2p || 0}</strong>
            </div>
            <div className="is-total">
              <span>Iš viso</span>
              <strong>{analysis.positionRecords}</strong>
            </div>
          </div>

          <div className="data-center-stat-list">
            <div>
              <span>
                Platformų istorija
                <small>
                  {formatDate(analysis.firstHistoryDate)} –{" "}
                  {formatDate(analysis.lastHistoryDate)}
                </small>
              </span>
              <strong>{analysis.historyRecords} įrašų</strong>
            </div>
            <div>
              <span>
                Portfelio istorija
                <small>{analysis.portfolioHistoryCount} mėnesių</small>
              </span>
              <strong>{analysis.portfolioHistoryCount} įrašų</strong>
            </div>
            <div>
              <span>
                portfolio.json
                <small>
                  Schema V
                  {statusData?.schemaVersion ?? portfolio?.schemaVersion ?? "–"}
                </small>
              </span>
              <strong>{formatFileSize(statusData?.portfolioJsonBytes)}</strong>
            </div>
          </div>
        </article>

        <article className="data-center-panel data-center-update-panel">
          <div className="data-center-panel-header compact">
            <div>
              <p>UPDATE WORKFLOW</p>
              <h2>Portfelio atnaujinimas</h2>
            </div>

            <span
              className={`data-center-ready-badge ${
                allImportsOk ? "is-ready" : "has-warning"
              }`}
            >
              <span />
              {allImportsOk ? "Ready" : "Check imports"}
            </span>
          </div>

          <div className="data-center-update-body">
            <div className="data-center-update-command">
              <span>UPDATE PORTFOLIO</span>
              <code>python scripts/update_all.py</code>
              <p>
                Atnaujink Excel failus ir paleisk komandą terminale arba
                dukart paspausk <strong>update_all.bat</strong>.
              </p>
            </div>

            <div className="data-center-update-meta">
              <div>
                <span>Paskutinis atnaujinimas</span>
                <strong>{formatDateTime(statusData?.generatedAt)}</strong>
              </div>
              <div>
                <span>Importo trukmė</span>
                <strong>{formatDuration(statusData?.durationSeconds)}</strong>
              </div>
              <div>
                <span>Importuota platformų</span>
                <strong>
                  {analysis.okImports.length} / {analysis.imports.length}
                </strong>
              </div>
              <div>
                <span>Sistemos būsena</span>
                <strong>{allImportsOk ? "Excellent" : "Attention"}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export default DataCenter;
