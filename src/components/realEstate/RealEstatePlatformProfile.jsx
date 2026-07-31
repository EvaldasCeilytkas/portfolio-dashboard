import { Link } from "react-router-dom";

import PerformanceChart from "../charts/PerformanceChart";
import RealEstateProjectTable from "./RealEstateProjectTable";
import { RatingBadge, StatusBadge } from "./RealEstateBadges";
import "../../styles/realestatev35.css";

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
  new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));

const percent = (value, digits = 2) =>
  `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(number(value))} %`;

const formatDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
};

function projectStatus(project) {
  const status = String(project?.status || "").toLowerCase();
  if (["completed", "repaid", "closed", "finished"].includes(status)) {
    return "completed";
  }
  if (["delayed", "late", "overdue"].includes(status) || number(project?.delayDays) > 0) {
    return "delayed";
  }
  return "active";
}

function DistributionCard({ title, rows = [], total = 0 }) {
  return (
    <article className="re-card re-distribution re-distribution-blue">
      <div className="re-card-heading">
        <div>
          <span>PORTFELIO SUDĖTIS</span>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="re-distribution-list">
        {rows.length ? rows.map((row) => {
          const share = total > 0 ? (number(row.value) / total) * 100 : 0;
          return (
            <div className="re-distribution-row" key={row.label}>
              <div className="re-distribution-meta">
                <strong>{row.label || "Nenurodyta"}</strong>
                <span>{money(row.value)} · {percent(share)}</span>
              </div>
              <div className="re-track">
                <i style={{ width: `${Math.max(2, share)}%` }} />
              </div>
            </div>
          );
        }) : (
          <div className="re-empty">Duomenų šiai grupei nėra.</div>
        )}
      </div>
    </article>
  );
}

function buildDistribution(projects, selector) {
  const groups = new Map();

  projects
    .filter((project) => projectStatus(project) !== "completed")
    .forEach((project) => {
      const label = selector(project) || "Nenurodyta";
      const previous = groups.get(label) || { label, count: 0, value: 0 };
      previous.count += 1;
      previous.value += number(project.outstanding ?? project.currentValue);
      groups.set(label, previous);
    });

  return [...groups.values()].sort((a, b) => b.value - a.value);
}

function ltvBand(project) {
  const ltv = number(project?.ltv);

  if (ltv <= 0) return "LTV nenurodytas";
  if (ltv <= 40) return "Iki 40 %";
  if (ltv <= 55) return "41–55 %";
  if (ltv <= 65) return "56–65 %";
  return "Virš 65 %";
}

export default function RealEstatePlatformProfile({ data }) {
  const platform = data?.platform || {};
  const summary = data?.summary || {};
  const projects = Array.isArray(data?.investments)
    ? data.investments
    : Array.isArray(data?.projects)
      ? data.projects
      : [];

  const activeProjects = projects.filter(
    (project) => projectStatus(project) !== "completed",
  );
  const currentTotal = activeProjects.reduce(
    (sum, project) =>
      sum + number(project.outstanding ?? project.currentValue),
    0,
  );

  const ratingRows = buildDistribution(
    projects,
    (project) =>
      project.rating ? `Reitingas ${project.rating}` : "Be reitingo",
  );

  const ltvRows = buildDistribution(projects, ltvBand);

  const biggest =
    data?.largestInvestment ||
    [...activeProjects].sort(
      (a, b) =>
        number(b.outstanding ?? b.currentValue) -
        number(a.outstanding ?? a.currentValue),
    )[0];

  const outstanding = activeProjects.reduce(
    (sum, project) =>
      sum + number(project.outstanding ?? project.currentValue),
    0,
  );

  const weightedDuration = activeProjects.reduce(
    (sum, project) =>
      sum + number(project.durationMonths) * number(project.outstanding),
    0,
  );
  const durationBase = activeProjects.reduce(
    (sum, project) => sum + number(project.outstanding),
    0,
  );
  const averageDuration =
    durationBase > 0 ? weightedDuration / durationBase : 0;

  return (
    <main className="re-page">
      <Link className="re-back" to="/portfolio">
        ← Grįžti į portfelį
      </Link>

      <section className="re-hero">
        <div className="re-hero-copy">
          <span className="re-eyebrow">NT PLATFORMOS PROFILIS</span>
          <h1>{platform.name}</h1>

          <div className="re-brand-row">
            <StatusBadge status="active" />
            <span className="re-meta-badge">{platform.category}</span>
            <span className="re-meta-badge">
              Nuo {formatDate(platform.startDate)}
            </span>
          </div>

          <div className="re-latest-strip">
            <strong>{summary.activeInvestments || 0} aktyvių</strong>
            <span>•</span>
            <strong>{summary.delayedInvestments || 0} vėluojančių</strong>
            <span>•</span>
            <strong>{summary.completedInvestments || 0} užbaigtų</strong>
            <span>•</span>
            <strong>{projects.length} projektai</strong>
            <span>•</span>
            <strong>{money(summary.currentValue)}</strong>
          </div>
        </div>

        <div className="re-hero-side">
          <span>DABARTINĖ VERTĖ</span>
          <strong>{money(summary.currentValue)}</strong>
          <small>Atnaujinta {formatDate(platform.updatedAt)}</small>
          {platform.website && (
            <a
              className="re-website-button"
              href={platform.website}
              target="_blank"
              rel="noreferrer"
            >
              Atidaryti platformą ↗
            </a>
          )}
        </div>
      </section>

      <section className="re-metrics-grid">
        <article className="re-metric re-tone-info">
          <span>Investuota</span>
          <strong>{money(summary.invested)}</strong>
          <small>Bendra įnešta suma</small>
        </article>
        <article className="re-metric re-tone-positive">
          <span>Pelnas</span>
          <strong>+{money(summary.profit)}</strong>
          <small>ROI {percent(summary.returnRate)}</small>
        </article>
        <article className="re-metric re-tone-positive">
          <span>XIRR</span>
          <strong>{percent(summary.xirr)}</strong>
          <small>Metinė grąža</small>
        </article>
        <article className="re-metric re-tone-info">
          <span>Aktyvūs projektai</span>
          <strong>{summary.activeInvestments || 0}</strong>
          <small>{summary.delayedInvestments || 0} vėluojančių</small>
        </article>
        <article className="re-metric re-tone-info">
          <span>Vidutinis LTV</span>
          <strong>{percent(summary.averageLtv, 1)}</strong>
          <small>Aktyvaus portfelio rizika</small>
        </article>
        <article className="re-metric re-tone-positive">
          <span>Vid. palūkanos</span>
          <strong>{percent(summary.averageRate)}</strong>
          <small>Aktyvių projektų norma</small>
        </article>
      </section>

      <section className="re-card re-chart">
        <div className="re-card-heading">
          <div>
            <span>PORTFELIO ISTORIJA</span>
            <h2>Vertė ir investuotas kapitalas</h2>
          </div>
        </div>
        <PerformanceChart history={data?.chartHistory || []} />
      </section>

      <section className="re-distribution-grid">
        <DistributionCard
          title="Pagal reitingą"
          rows={ratingRows}
          total={currentTotal}
        />
        <DistributionCard
          title="Pagal LTV"
          rows={ltvRows}
          total={currentTotal}
        />
      </section>

      <section className="re-feature-grid">
        <article className="re-card">
          <div className="re-card-heading">
            <div>
              <span>PORTFELIO SANTRAUKA</span>
              <h2>Pagrindiniai rodikliai</h2>
            </div>
          </div>
          <div className="re-details-grid">
            <div>
              <span>Negrąžintas kapitalas</span>
              <strong>{money(outstanding)}</strong>
            </div>
            <div>
              <span>Visi projektai</span>
              <strong>{projects.length}</strong>
            </div>
            <div>
              <span>Vidutinė trukmė</span>
              <strong>
                {averageDuration ? `${averageDuration.toFixed(1)} mėn.` : "—"}
              </strong>
            </div>
            <div>
              <span>Gautos pajamos</span>
              <strong>{money(summary.incomeReceived)}</strong>
            </div>
            <div>
              <span>Valiuta</span>
              <strong>{platform.currency || "EUR"}</strong>
            </div>
            <div>
              <span>Atnaujinta</span>
              <strong>{formatDate(platform.updatedAt)}</strong>
            </div>
          </div>
        </article>

        <article className="re-card">
          <div className="re-card-heading">
            <div>
              <span>DIDŽIAUSIA POZICIJA</span>
              <h2>{biggest?.name || "—"}</h2>
            </div>
            {biggest && (
              <strong>
                {money(biggest.outstanding ?? biggest.currentValue)}
              </strong>
            )}
          </div>

          {biggest ? (
            <>
              <div className="re-project-badges">
                <RatingBadge rating={biggest.rating} />
                <StatusBadge status={projectStatus(biggest)} />
              </div>
              <div className="re-details-grid">
                <div>
                  <span>Projekto kodas</span>
                  <strong>{biggest.code || biggest.id || "—"}</strong>
                </div>
                <div>
                  <span>Palūkanos</span>
                  <strong>{percent(biggest.interestRate)}</strong>
                </div>
                <div>
                  <span>LTV</span>
                  <strong>{percent(biggest.ltv, 0)}</strong>
                </div>
                <div>
                  <span>Pabaiga</span>
                  <strong>{formatDate(biggest.maturityDate)}</strong>
                </div>
                <div>
                  <span>Investuota</span>
                  <strong>{money(biggest.invested)}</strong>
                </div>
                <div>
                  <span>Mokėjimų dažnis</span>
                  <strong>{biggest.paymentFrequency || "—"}</strong>
                </div>
                <div>
                  <span>Portfelio dalis</span>
                  <strong>
                    {percent(
                      currentTotal > 0
                        ? (number(
                            biggest.outstanding ?? biggest.currentValue,
                          ) /
                            currentTotal) *
                            100
                        : 0,
                    )}
                  </strong>
                </div>
              </div>
              <Link
                className="re-back-button"
                to={`/platforms/${platform.slug}/projects/${encodeURIComponent(
                  biggest.code || biggest.id,
                )}`}
              >
                Atidaryti projektą →
              </Link>
            </>
          ) : (
            <div className="re-empty">Aktyvių pozicijų nėra.</div>
          )}
        </article>
      </section>

      <RealEstateProjectTable
        projects={projects}
        platformName={platform.name}
      />
    </main>
  );
}
