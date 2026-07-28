import { useMemo } from "react";
import NplProjectTable from "./NplProjectTable";

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


function getPropertyType(name) {
  const normalized = String(name || "").toLowerCase();

  if (normalized.includes("apartment") || normalized.includes("flat")) {
    return "Butai";
  }

  if (
    normalized.includes("commercial") ||
    normalized.includes("premises") ||
    normalized.includes("office")
  ) {
    return "Komercinis";
  }

  if (normalized.includes("house") || normalized.includes("villa")) {
    return "Namai";
  }

  if (normalized.includes("land") || normalized.includes("plot")) {
    return "Žemė";
  }

  return "Kita";
}

function getCity(name) {
  const text = String(name || "");
  const match = text.match(/\b(?:in|at)\s+(.+)$/i);

  if (!match) {
    return "Nenurodyta";
  }

  return match[1].trim();
}

function getRiskScore(project) {
  const ptv = Number(project?.ptv) || 0;
  const pdt = Number(project?.pdt) || 0;

  let score = 100;

  if (ptv > 70) score -= 28;
  else if (ptv > 60) score -= 18;
  else if (ptv > 50) score -= 9;

  if (pdt > 75) score -= 25;
  else if (pdt > 65) score -= 15;
  else if (pdt > 55) score -= 7;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function DistributionBar({ label, value, total, suffix = "" }) {
  const share = total > 0 ? (value / total) * 100 : 0;

  return (
    <div className="npl-distribution-row">
      <div className="npl-distribution-label">
        <span>{label}</span>
        <strong>
          {value}
          {suffix}
        </strong>
      </div>

      <div className="npl-distribution-track">
        <span style={{ width: `${Math.min(100, share)}%` }} />
      </div>

      <small>{formatPercentage(share)}</small>
    </div>
  );
}

function MetricCard({ label, value, description }) {
  return (
    <article className="npl-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{description}</small>
    </article>
  );
}

function NplProfileModule({ details, platformName, platformSlug }) {
  const projects = Array.isArray(details?.projects)
    ? details.projects
    : [];

  const activeProjects = Array.isArray(details?.activeProjects)
    ? details.activeProjects
    : projects.filter((project) => project.status !== "completed");

  const completedProjects = Array.isArray(details?.completedProjects)
    ? details.completedProjects
    : projects.filter((project) => project.status === "completed");

  const summary = details?.nplSummary || details?.summary || {};


  const advanced = useMemo(() => {
    const ptvBuckets = {
      "≤ 40 %": 0,
      "41–50 %": 0,
      "51–60 %": 0,
      "61–70 %": 0,
      "> 70 %": 0,
    };

    const propertyTypes = {};
    const cities = {};
    const maturity = {};

    let riskTotal = 0;

    projects.forEach((project) => {
      const ptv = Number(project.ptv) || 0;

      if (ptv <= 40) ptvBuckets["≤ 40 %"] += 1;
      else if (ptv <= 50) ptvBuckets["41–50 %"] += 1;
      else if (ptv <= 60) ptvBuckets["51–60 %"] += 1;
      else if (ptv <= 70) ptvBuckets["61–70 %"] += 1;
      else ptvBuckets["> 70 %"] += 1;

      const type = getPropertyType(project.name);
      propertyTypes[type] = (propertyTypes[type] || 0) + 1;

      const city = getCity(project.name);
      cities[city] = (cities[city] || 0) + 1;

      const maturityDate = project.returnedDate || project.repaymentDate;

      if (maturityDate) {
        const key = String(maturityDate).slice(0, 7);
        maturity[key] = (maturity[key] || 0) + 1;
      }

      riskTotal += getRiskScore(project);
    });

    const sortRows = (values) =>
      Object.entries(values)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return {
      averageRisk: projects.length ? Math.round(riskTotal / projects.length) : 0,
      ptvBuckets: sortRows(ptvBuckets),
      propertyTypes: sortRows(propertyTypes),
      topCities: sortRows(cities).slice(0, 6),
      maturity: Object.entries(maturity)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 12),
    };
  }, [projects]);

  const largestProject = useMemo(() => {
    if (!activeProjects.length) {
      return null;
    }

    return [...activeProjects].sort(
      (first, second) =>
        Number(second.remaining || second.invested || 0) -
        Number(first.remaining || first.invested || 0),
    )[0];
  }, [activeProjects]);

  const totalActiveValue = activeProjects.reduce(
    (sum, project) => sum + Number(project.remaining || 0),
    0,
  );

  const largestProjectShare =
    largestProject && totalActiveValue > 0
      ? (Number(largestProject.remaining || 0) / totalActiveValue) * 100
      : 0;

  return (
    <div className="npl-profile-module">
      <section className="npl-overview-card">
        <div className="npl-section-heading">
          <div>
            <p>MORTGAGE INVESTMENTS</p>
            <h2>{platformName} projektų suvestinė</h2>
            <span>
              Hipoteka užtikrintos investicijos, PTV, PDT ir projektų grąžinimo
              eiga.
            </span>
          </div>

          <div className="npl-overview-badge">
            <span>Projektų</span>
            <strong>{summary.totalProjects ?? projects.length}</strong>
          </div>
        </div>

        <div className="npl-metrics-grid">
          <MetricCard
            label="Aktyvūs projektai"
            value={summary.activeProjects ?? activeProjects.length}
            description="Dar negrąžintos investicijos"
          />
          <MetricCard
            label="Užbaigti projektai"
            value={summary.completedProjects ?? completedProjects.length}
            description="Pilnai realizuoti projektai"
          />
          <MetricCard
            label="Vidutinis PTV"
            value={formatPercentage(summary.averagePtv)}
            description="Pirkimo kainos ir turto vertės santykis"
          />
          <MetricCard
            label="Vidutinis PDT"
            value={formatPercentage(summary.averagePdt)}
            description="Skolos ir turto vertės santykis"
          />
          <MetricCard
            label="Gautos palūkanos"
            value={formatCurrency(summary.interest)}
            description="Iki šiol realizuotos palūkanos"
          />
          <MetricCard
            label="Premijos"
            value={formatCurrency(summary.bonuses)}
            description="Platformos suteiktos premijos"
          />
        </div>
      </section>

      <section className="npl-risk-grid">
        <article className="npl-risk-card">
          <div>
            <p>DIDŽIAUSIAS PROJEKTAS</p>
            <h3>{largestProject?.id || "—"}</h3>
            <span>{largestProject?.name || "Aktyvių projektų nėra"}</span>
          </div>

          <div className="npl-risk-value">
            <strong>
              {largestProject
                ? formatCurrency(largestProject.remaining)
                : "0,00 €"}
            </strong>
            <small>{formatPercentage(largestProjectShare)} portfelio</small>
          </div>

          <div className="npl-risk-progress">
            <span
              style={{
                width: `${Math.max(0, Math.min(100, largestProjectShare))}%`,
              }}
            />
          </div>
        </article>

        <article className="npl-cash-card">
          <div>
            <span>Laisvi pinigai</span>
            <strong>{formatCurrency(summary.cash)}</strong>
          </div>

          <div>
            <span>Grąžinta pagrindinė suma</span>
            <strong>{formatCurrency(summary.returnedPrincipal)}</strong>
          </div>

          <div>
            <span>Aktyvi projektų vertė</span>
            <strong>{formatCurrency(summary.activeValue)}</strong>
          </div>

          <div>
            <span>Operacijų</span>
            <strong>{summary.totalTransactions ?? 0}</strong>
          </div>
        </article>
      </section>


      <section className="npl-advanced-grid">
        <article className="npl-analysis-card">
          <div className="npl-section-heading compact">
            <div>
              <p>RISK PROFILE</p>
              <h2>Mortgage rizikos profilis</h2>
              <span>Automatinis PTV ir PDT pagrįstas vertinimas.</span>
            </div>

            <div className="npl-risk-score-ring">
              <strong>{advanced.averageRisk}</strong>
              <span>/100</span>
            </div>
          </div>

          <div className="npl-risk-scale">
            <span className="excellent">Žema</span>
            <span className="good">Vidutinė</span>
            <span className="medium">Padidinta</span>
            <span className="watch">Aukšta</span>
          </div>
        </article>

        <article className="npl-analysis-card">
          <div className="npl-section-heading compact">
            <div>
              <p>PROPERTY MIX</p>
              <h2>Objektų tipai</h2>
            </div>
          </div>

          <div className="npl-distribution-list">
            {advanced.propertyTypes.map((item) => (
              <DistributionBar
                key={item.name}
                label={item.name}
                value={item.value}
                total={projects.length}
              />
            ))}
          </div>
        </article>

        <article className="npl-analysis-card">
          <div className="npl-section-heading compact">
            <div>
              <p>PTV DISTRIBUTION</p>
              <h2>PTV pasiskirstymas</h2>
            </div>
          </div>

          <div className="npl-distribution-list">
            {advanced.ptvBuckets.map((item) => (
              <DistributionBar
                key={item.name}
                label={item.name}
                value={item.value}
                total={projects.length}
              />
            ))}
          </div>
        </article>

        <article className="npl-analysis-card">
          <div className="npl-section-heading compact">
            <div>
              <p>LOCATION EXPOSURE</p>
              <h2>Dažniausios vietovės</h2>
              <span>Vietovė išskiriama iš projekto pavadinimo.</span>
            </div>
          </div>

          <div className="npl-location-grid">
            {advanced.topCities.map((item) => (
              <div key={item.name}>
                <span>{item.name}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="npl-analysis-card npl-maturity-card">
        <div className="npl-section-heading compact">
          <div>
            <p>MATURITY TIMELINE</p>
            <h2>Grąžinimų laiko juosta</h2>
            <span>Projektai, kuriems Excel faile nurodyta grąžinimo data.</span>
          </div>
        </div>

        {advanced.maturity.length > 0 ? (
          <div className="npl-maturity-list">
            {advanced.maturity.map((item) => {
              const maximum = Math.max(
                ...advanced.maturity.map((point) => point.value),
                1,
              );

              return (
                <div key={item.name} className="npl-maturity-row">
                  <span>{item.name}</span>
                  <div>
                    <i style={{ width: `${(item.value / maximum) * 100}%` }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="npl-empty-state">
            Būsimų grąžinimo datų Excel faile nerasta.
          </div>
        )}
      </section>


      <NplProjectTable
        eyebrow="AKTYVŪS PROJEKTAI"
        title="Aktyvios mortgage investicijos"
        projects={activeProjects}
        platformSlug={platformSlug}
        emptyMessage="Aktyvių Indemo projektų nerasta."
      />

      <NplProjectTable
        eyebrow="UŽBAIGTI PROJEKTAI"
        title="Realizuotos investicijos"
        projects={completedProjects}
        platformSlug={platformSlug}
        emptyMessage="Užbaigtų Indemo projektų dar nėra."
      />
    </div>
  );
}

export default NplProfileModule;
