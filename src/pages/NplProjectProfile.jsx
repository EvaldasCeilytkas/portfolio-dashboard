import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { usePortfolio } from "../hooks/usePortfolio";

import "../styles/npl.css";

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 %";
  }

  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function formatDate(value) {
  if (!value) return "—";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsedDate);
}

function getProjectType(name) {
  const normalized = String(name || "").toLowerCase();

  if (normalized.includes("apartment") || normalized.includes("flat")) {
    return "Butas";
  }

  if (
    normalized.includes("commercial") ||
    normalized.includes("premises") ||
    normalized.includes("office")
  ) {
    return "Komercinis turtas";
  }

  if (normalized.includes("house") || normalized.includes("villa")) {
    return "Gyvenamasis namas";
  }

  return "Nekilnojamojo turto projektas";
}


function getRiskMeta(project) {
  const ptv = Number(project?.ptv) || 0;
  const pdt = Number(project?.pdt) || 0;

  let score = 100;

  if (ptv > 70) score -= 28;
  else if (ptv > 60) score -= 18;
  else if (ptv > 50) score -= 9;

  if (pdt > 75) score -= 25;
  else if (pdt > 65) score -= 15;
  else if (pdt > 55) score -= 7;

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 85) return { score, label: "Žema rizika", tone: "excellent" };
  if (score >= 70) return { score, label: "Vidutinė rizika", tone: "good" };
  if (score >= 55) return { score, label: "Padidinta rizika", tone: "medium" };

  return { score, label: "Aukšta rizika", tone: "watch" };
}

function getCity(name) {
  const text = String(name || "");
  const match = text.match(/\b(?:in|at)\s+(.+)$/i);

  return match ? match[1].trim() : "Nenurodyta";
}

function DetailItem({ label, value, positive }) {
  return (
    <div className="npl-project-detail-item">
      <span>{label}</span>
      <strong className={positive ? "npl-positive" : ""}>{value}</strong>
    </div>
  );
}

function NplProjectProfile() {
  const { slug, projectId } = useParams();
  const { portfolio, loading, errorMessage } = usePortfolio();

  const platform = useMemo(() => {
    if (!Array.isArray(portfolio?.platforms)) {
      return null;
    }

    return portfolio.platforms.find((item) => item.slug === slug);
  }, [portfolio, slug]);

  const details = platform?.details || portfolio?.indemo || null;

  const project = useMemo(() => {
    const projects = Array.isArray(details?.projects)
      ? details.projects
      : [];

    return projects.find(
      (item) =>
        String(item.id) === decodeURIComponent(projectId || "") ||
        String(item.slug) === decodeURIComponent(projectId || ""),
    );
  }, [details, projectId]);

  if (loading) {
    return (
      <main className="npl-project-page">
        <section className="npl-project-state">
          Kraunami projekto duomenys...
        </section>
      </main>
    );
  }

  if (errorMessage || !platform || !project) {
    return (
      <main className="npl-project-page">
        <section className="npl-project-state">
          <h2>Projektas nerastas</h2>
          <p>{errorMessage || "Patikrink projekto adresą."}</p>
          <Link to={`/platforms/${slug}`}>Grįžti į platformą</Link>
        </section>
      </main>
    );
  }

  const transactions = Array.isArray(project.transactions)
    ? project.transactions
    : [];

  const risk = getRiskMeta(project);
  const city = getCity(project.name);

  const progress =
    Number(project.invested) > 0
      ? (Number(project.returnedPrincipal) / Number(project.invested)) * 100
      : 0;

  return (
    <main className="npl-project-page">
      <Link className="npl-project-back" to={`/platforms/${slug}`}>
        <span aria-hidden="true">←</span>
        Grįžti į {platform.name}
      </Link>

      <section className="npl-project-hero">
        <div className="npl-project-heading">
          <div className="npl-project-icon">
            {String(project.id || "N").slice(0, 3)}
          </div>

          <div>
            <p>NPL / MORTGAGE PROJECT</p>
            <h1>{project.name || project.id}</h1>

            <div className="npl-project-meta">
              <span>{project.id}</span>
              <span>{getProjectType(project.name)}</span>
              <span
                className={`npl-status ${
                  project.status === "completed"
                    ? "completed"
                    : "active"
                }`}
              >
                <span />
                {project.status === "completed"
                  ? "Užbaigtas"
                  : "Aktyvus"}
              </span>
            </div>
          </div>
        </div>

        <div className="npl-project-hero-value">
          <span>Likusi investicija</span>
          <strong>{formatCurrency(project.remaining)}</strong>
          <small>
            iš {formatCurrency(project.invested)} investuotos sumos
          </small>
        </div>
      </section>

      <section className="npl-project-kpis">
        <DetailItem
          label="Investuota"
          value={formatCurrency(project.invested)}
        />
        <DetailItem
          label="Grąžinta"
          value={formatCurrency(project.returnedPrincipal)}
        />
        <DetailItem
          label="Palūkanos"
          value={formatCurrency(project.interest)}
          positive
        />
        <DetailItem
          label="XIRR"
          value={formatPercentage(project.xirr)}
          positive
        />
        <DetailItem
          label="PTV"
          value={formatPercentage(project.ptv)}
        />
        <DetailItem
          label="PDT"
          value={formatPercentage(project.pdt)}
        />
      </section>

      <section className="npl-project-risk-banner">
        <div>
          <span>PROJECT RISK</span>
          <strong>{risk.label}</strong>
          <small>Vertinama pagal PTV ir PDT rodiklius.</small>
        </div>

        <div className={`npl-project-risk-score ${risk.tone}`}>
          <strong>{risk.score}</strong>
          <span>/100</span>
        </div>

        <div className="npl-project-risk-factors">
          <div>
            <span>Vietovė</span>
            <strong>{city}</strong>
          </div>
          <div>
            <span>Objekto tipas</span>
            <strong>{getProjectType(project.name)}</strong>
          </div>
          <div>
            <span>Investavimo dalių</span>
            <strong>{project.transactionCount || transactions.length}</strong>
          </div>
        </div>
      </section>

      <section className="npl-project-grid">
        <article className="npl-project-card">
          <div className="npl-section-heading">
            <div>
              <p>PROJECT DETAILS</p>
              <h2>Projekto informacija</h2>
            </div>
          </div>

          <dl className="npl-project-details-list">
            <div>
              <dt>Mortgage ID</dt>
              <dd>{project.id}</dd>
            </div>
            <div>
              <dt>Investavimo data</dt>
              <dd>{formatDate(project.investmentDate)}</dd>
            </div>
            <div>
              <dt>Paskolos pradžia</dt>
              <dd>{formatDate(project.loanStartDate)}</dd>
            </div>
            <div>
              <dt>Grąžinimo data</dt>
              <dd>{formatDate(project.returnedDate)}</dd>
            </div>
            <div>
              <dt>Trukmė</dt>
              <dd>
                {Number(project.durationDays) > 0
                  ? `${Math.round(project.durationDays)} d.`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Investavimo dalių</dt>
              <dd>{project.transactionCount || transactions.length}</dd>
            </div>
          </dl>
        </article>

        <article className="npl-project-card">
          <div className="npl-section-heading">
            <div>
              <p>REPAYMENT PROGRESS</p>
              <h2>Grąžinimo eiga</h2>
            </div>
          </div>

          <div className="npl-project-progress-value">
            <strong>{formatPercentage(progress)}</strong>
            <span>grąžinta pagrindinės sumos</span>
          </div>

          <div className="npl-project-progress-track">
            <span
              style={{
                width: `${Math.max(0, Math.min(100, progress))}%`,
              }}
            />
          </div>

          <div className="npl-project-progress-footer">
            <div>
              <span>Grąžinta</span>
              <strong>{formatCurrency(project.returnedPrincipal)}</strong>
            </div>
            <div>
              <span>Likutis</span>
              <strong>{formatCurrency(project.remaining)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="npl-table-card">
        <div className="npl-section-heading">
          <div>
            <p>INVESTMENT NOTES</p>
            <h2>Investavimo dalių istorija</h2>
            <span>
              Visos su šiuo mortgage projektu susijusios Indemo operacijos.
            </span>
          </div>

          <span className="npl-count-badge">{transactions.length}</span>
        </div>

        <div className="npl-table-wrap">
          <table className="npl-note-table">
            <thead>
              <tr>
                <th>Note ID</th>
                <th>Data</th>
                <th>Investuota</th>
                <th>Grąžinimo data</th>
                <th>Grąžinta</th>
                <th>Palūkanos</th>
                <th>Grąža</th>
                <th>Trukmė</th>
                <th>Statusas</th>
              </tr>
            </thead>

            <tbody>
              {transactions.map((transaction, index) => (
                <tr key={`${transaction.noteId}-${index}`}>
                  <td>
                    <strong>{transaction.noteId || "—"}</strong>
                  </td>
                  <td>{formatDate(transaction.date)}</td>
                  <td>{formatCurrency(transaction.amount)}</td>
                  <td>{formatDate(transaction.repaymentDate)}</td>
                  <td>{formatCurrency(transaction.returnedPrincipal)}</td>
                  <td className="npl-positive">
                    {formatCurrency(transaction.interest)}
                  </td>
                  <td>{formatPercentage(transaction.profitRate)}</td>
                  <td>
                    {Number(transaction.durationDays) > 0
                      ? `${Math.round(transaction.durationDays)} d.`
                      : "—"}
                  </td>
                  <td>
                    <span
                      className={`npl-status ${
                        transaction.status === "completed"
                          ? "completed"
                          : "active"
                      }`}
                    >
                      <span />
                      {transaction.status === "completed"
                        ? "Užbaigta"
                        : "Aktyvi"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default NplProjectProfile;
