import { useMemo, useState } from "react";
import RealEstateProjectTable from "./RealEstateProjectTable";

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatPercentage(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} %`;
}

function getHealthMessage(score) {
  const value = Number(score) || 0;

  if (value >= 85) {
    return "NT projektų portfelis gerai diversifikuotas, o pagrindiniai rizikos rodikliai kontroliuojami.";
  }

  if (value >= 70) {
    return "Portfelio būklė gera, tačiau verta stebėti LTV, koncentraciją ir mokėjimų vėlavimus.";
  }

  if (value >= 55) {
    return "Portfelis subalansuotas, bet keli NT rizikos rodikliai reikalauja papildomo dėmesio.";
  }

  return "Rekomenduojama peržiūrėti projektų koncentraciją, LTV ir vėluojančius mokėjimus.";
}

function normalizeHealthMetrics(health) {
  if (Array.isArray(health?.metrics)) {
    return health.metrics;
  }

  const parts = health?.parts;

  if (!parts || typeof parts !== "object") {
    return [];
  }

  const labels = {
    diversification: "Diversifikacija",
    rating: "Projektų reitingai",
    ltv: "LTV kokybė",
    delays: "Mokėjimų drausmė",
    cash: "Laisvų pinigų efektyvumas",
  };

  return Object.entries(parts).map(([key, value]) => ({
    key,
    label: labels[key] || key,
    score: Number(value) || 0,
    max: 100,
  }));
}

export default function RealEstateProfileModule({
  details,
  platformName = "Platformos",
}) {
  const [showHealthHelp, setShowHealthHelp] = useState(false);

  const projects = Array.isArray(details?.projects)
    ? details.projects
    : [];

  const summary =
    details?.summary && typeof details.summary === "object"
      ? details.summary
      : {};

  const health =
    details?.health && typeof details.health === "object"
      ? details.health
      : {};

  const healthMetrics = useMemo(
    () => normalizeHealthMetrics(health),
    [health],
  );

  const activeProjects = projects.filter(
    (project) => project?.status !== "repaid",
  );

  const totalOutstanding = activeProjects.reduce(
    (sum, project) =>
      sum + (Number(project?.outstanding) || 0),
    0,
  );

  const largestProject = activeProjects.reduce(
    (largest, project) =>
      (Number(project?.outstanding) || 0) >
      (Number(largest?.outstanding) || 0)
        ? project
        : largest,
    null,
  );

  const largestProjectShare =
    totalOutstanding > 0 && largestProject
      ? ((Number(largestProject.outstanding) || 0) /
          totalOutstanding) *
        100
      : 0;

  const delayedOutstanding = activeProjects
    .filter((project) => project?.status === "delayed")
    .reduce(
      (sum, project) =>
        sum + (Number(project?.outstanding) || 0),
      0,
    );

  const delayedShare =
    totalOutstanding > 0
      ? (delayedOutstanding / totalOutstanding) * 100
      : 0;

  const portfolioValue =
    Number(summary.portfolioValue) || 0;

  const cashShare =
    portfolioValue > 0
      ? ((Number(summary.cash) || 0) / portfolioValue) *
        100
      : 0;

  const monthlyIncome = Array.isArray(details?.history)
    ? [...details.history]
        .map((item) => ({
          ...item,
          netIncome:
            Number(item?.netIncome) ||
            Number(item?.monthlyProfit) ||
            0,
        }))
        .reverse()
        .slice(0, 12)
    : [];

  const maxIncome = Math.max(
    ...monthlyIncome.map((item) =>
      Math.abs(Number(item.netIncome) || 0),
    ),
    1,
  );

  const repaymentTimeline = Array.isArray(
    details?.repaymentTimeline,
  )
    ? details.repaymentTimeline.slice(0, 12)
    : [];

  const maxRepayment = Math.max(
    ...repaymentTimeline.map(
      (item) => Number(item.amount) || 0,
    ),
    1,
  );

  return (
    <div className="p2p-profile-module">
      <div className="p2p-module-title">
        <div>
          <p>NT SUTELKTINIS FINANSAVIMAS</p>
          <h2>{platformName} projektų analizė</h2>
          <span>
            Projektai, pajamos, grąžinimai ir NT
            portfelio rizikos rodikliai.
          </span>
        </div>
      </div>

      <section className="p2p-snapshot-grid">
        <article>
          <span>Visi projektai</span>
          <strong>
            {summary.totalProjects ?? projects.length}
          </strong>
          <small>
            {summary.activeProjects ?? activeProjects.length} aktyvūs
          </small>
        </article>

        <article>
          <span>Vid. palūkanos</span>
          <strong>
            {formatPercentage(summary.averageInterest)}
          </strong>
          <small>Svertinė pagal aktyvų likutį</small>
        </article>

        <article>
          <span>Vid. LTV</span>
          <strong>
            {formatPercentage(summary.averageLtv)}
          </strong>
          <small>Svertinis aktyvių projektų LTV</small>
        </article>

        <article>
          <span>Gautos palūkanos</span>
          <strong className="p2p-positive">
            {formatCurrency(summary.interestReceived)}
          </strong>
          <small>Iki paskutinio atnaujinimo</small>
        </article>

        <article>
          <span>Vėluojantys</span>
          <strong
            className={
              Number(summary.delayedProjects) > 0
                ? "p2p-negative"
                : "p2p-positive"
            }
          >
            {summary.delayedProjects ?? 0}
          </strong>
          <small>Aktyvūs vėluojantys projektai</small>
        </article>
      </section>

      <section className="p2p-health-card">
        <div className="p2p-health-score">
          <div className="p2p-health-heading">
            <span>PORTFOLIO HEALTH</span>
            <button
              type="button"
              aria-label="Kaip skaičiuojamas Portfolio Health"
              onClick={() =>
                setShowHealthHelp((value) => !value)
              }
            >
              ?
            </button>
          </div>

          <strong>
            {health.score ?? 0}
            <small>/100</small>
          </strong>

          <b>{health.label || "Portfolio Health"}</b>
          <p>{health.summary || getHealthMessage(health.score)}</p>

          {showHealthHelp && (
            <div className="p2p-health-help">
              NT portfelio balas vertina projektų
              diversifikaciją, reitingus, LTV,
              mokėjimų drausmę ir laisvų pinigų
              panaudojimą.
            </div>
          )}
        </div>

        <div className="p2p-health-metrics">
          {healthMetrics.map((metric) => {
            const width = Math.max(
              0,
              Math.min(
                100,
                (Number(metric.score) /
                  Number(metric.max || 100)) *
                  100,
              ),
            );

            return (
              <div key={metric.key}>
                <div>
                  <span>{metric.label}</span>
                  <strong>
                    {metric.score} / {metric.max}
                  </strong>
                </div>

                <div className="p2p-health-track">
                  <span style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="p2p-health-facts">
          <div>
            <span>Didžiausias projektas</span>
            <strong>
              {formatPercentage(largestProjectShare)}
            </strong>
            <div className="p2p-mini-track">
              <i
                style={{
                  width: `${Math.min(
                    100,
                    largestProjectShare,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <span>Vėluojanti dalis</span>
            <strong>{formatPercentage(delayedShare)}</strong>
          </div>

          <div>
            <span>Laisvų pinigų dalis</span>
            <strong>{formatPercentage(cashShare)}</strong>
          </div>
        </div>
      </section>

      <section className="p2p-income-card">
        <div className="p2p-module-header">
          <div>
            <p>PAJAMŲ ISTORIJA</p>
            <h2>Paskutiniai 12 mėnesių</h2>
            <span>
              Gautų palūkanų ir papildomų pajamų istorija.
            </span>
          </div>

          <strong>
            {formatCurrency(summary.interestReceived)}
          </strong>
        </div>

        <div className="p2p-income-list">
          {monthlyIncome.map((month) => (
            <div key={month.date}>
              <span>{month.date?.slice(0, 7)}</span>
              <div>
                <i
                  style={{
                    width: `${Math.max(
                      3,
                      (Math.abs(
                        Number(month.netIncome) || 0,
                      ) /
                        maxIncome) *
                        100,
                    )}%`,
                  }}
                />
              </div>
              <strong
                className={
                  Number(month.netIncome) >= 0
                    ? "p2p-positive"
                    : "p2p-negative"
                }
              >
                {formatCurrency(month.netIncome)}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section className="p2p-income-card p2p-forecast-card">
        <div className="p2p-module-header">
          <div>
            <p>GRĄŽINIMO KALENDORIUS</p>
            <h2>Planuojami projektų grąžinimai</h2>
            <span>
              Aktyvių projektų likučiai pagal planuojamą
              grąžinimo mėnesį.
            </span>
          </div>

          <strong>
            {formatCurrency(
              repaymentTimeline.reduce(
                (sum, item) =>
                  sum + (Number(item.amount) || 0),
                0,
              ),
            )}
          </strong>
        </div>

        {repaymentTimeline.length > 0 ? (
          <div className="p2p-forecast-grid">
            {repaymentTimeline.map((item) => (
              <article key={item.month}>
                <div>
                  <span>{item.month}</span>
                  <strong>
                    {formatCurrency(item.amount)}
                  </strong>
                </div>

                <div className="p2p-forecast-track">
                  <i
                    style={{
                      width: `${Math.max(
                        4,
                        ((Number(item.amount) || 0) /
                          maxRepayment) *
                          100,
                      )}%`,
                    }}
                  />
                </div>

                <footer>
                  <span>{item.count || 0} projektai</span>
                  <b>
                    {formatCurrency(item.amount)}
                  </b>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="p2p-empty">
            Planuojamų grąžinimų nerasta.
          </div>
        )}
      </section>

      <RealEstateProjectTable
        projects={projects}
        platformName={platformName}
      />
    </div>
  );
}
