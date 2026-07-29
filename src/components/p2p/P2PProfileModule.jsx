import { useMemo, useState } from "react";
import P2PLoanTable from "./P2PLoanTable";

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
    return "Portfelis stabilus, nevėluoja mokėjimai, o laisvų pinigų dalis maža.";
  }

  if (value >= 70) {
    return "Portfelio būklė gera, tačiau verta stebėti koncentraciją ir vėlavimus.";
  }

  if (value >= 55) {
    return "Portfelis subalansuotas, bet keli rizikos rodikliai reikalauja dėmesio.";
  }

  return "Rekomenduojama peržiūrėti vėlavimus, koncentraciją ir laisvų pinigų panaudojimą.";
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
    rating: "Paskolų kokybė",
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

function normalizeLoans(details) {
  if (Array.isArray(details?.loans)) {
    return details.loans;
  }

  if (Array.isArray(details?.projects)) {
    return details.projects;
  }

  return [];
}

function normalizeSummary(details, loans) {
  if (details?.p2pSummary && typeof details.p2pSummary === "object") {
    return details.p2pSummary;
  }

  const source =
    details?.summary && typeof details.summary === "object"
      ? details.summary
      : {};

  return {
    totalLoans: source.totalLoans ?? source.totalProjects ?? loans.length,
    activeLoans:
      source.activeLoans ??
      source.activeProjects ??
      loans.filter((loan) => loan?.status !== "repaid").length,
    lateLoans:
      source.lateLoans ??
      source.delayedProjects ??
      loans.filter((loan) => loan?.status === "delayed").length,
    averageInterestRate:
      source.averageInterestRate ?? source.averageInterest ?? 0,
    cash: source.cash ?? 0,
    interestReceived:
      source.interestReceived ?? source.interest ?? 0,
  };
}

function normalizeCashflow(details) {
  if (details?.cashflow && typeof details.cashflow === "object") {
    return details.cashflow;
  }

  const source =
    details?.summary && typeof details.summary === "object"
      ? details.summary
      : {};

  return {
    ...source,
    interest:
      source.interest ??
      source.interestReceived ??
      0,
  };
}

function normalizeMonthlyIncome(details) {
  if (!Array.isArray(details?.history)) {
    return [];
  }

  return [...details.history]
    .map((item) => ({
      ...item,
      netIncome:
        Number(item?.netIncome) ||
        Number(item?.monthlyProfit) ||
        0,
    }))
    .reverse()
    .slice(0, 12);
}

function normalizeForecast(details, loans) {
  if (
    Array.isArray(details?.incomeForecast) &&
    details.incomeForecast.length > 0
  ) {
    return details.incomeForecast.slice(0, 12);
  }

  const months = new Map();

  loans.forEach((loan) => {
    const payments = Array.isArray(loan?.payments)
      ? loan.payments
      : [];

    payments.forEach((payment) => {
      const plannedDate = payment?.plannedDate;

      if (!plannedDate || payment?.actualDate) {
        return;
      }

      const month = plannedDate.slice(0, 7);
      const principal =
        Number(
          payment?.principal ??
            payment?.plannedPrincipal,
        ) || 0;
      const interest =
        Number(
          payment?.interest ??
            payment?.plannedInterest,
        ) || 0;
      const fee =
        Number(
          payment?.fee ??
            payment?.plannedFee,
        ) || 0;

      const current = months.get(month) || {
        month,
        principal: 0,
        interest: 0,
        fees: 0,
        total: 0,
      };

      current.principal += principal;
      current.interest += interest;
      current.fees += fee;
      current.total += principal + interest - fee;

      months.set(month, current);
    });
  });

  return [...months.values()]
    .sort((first, second) =>
      first.month.localeCompare(second.month),
    )
    .slice(0, 12);
}

function P2PProfileModule({
  details,
  platformName = "Platformos",
}) {
  const [showHealthHelp, setShowHealthHelp] = useState(false);

  const loans = useMemo(
    () => normalizeLoans(details),
    [details],
  );

  const summary = useMemo(
    () => normalizeSummary(details, loans),
    [details, loans],
  );

  const cashflow = useMemo(
    () => normalizeCashflow(details),
    [details],
  );

  const health =
    details?.health && typeof details.health === "object"
      ? details.health
      : {};

  const healthMetrics = useMemo(
    () => normalizeHealthMetrics(health),
    [health],
  );

  const monthlyIncome = useMemo(
    () => normalizeMonthlyIncome(details),
    [details],
  );

  const incomeForecast = useMemo(
    () => normalizeForecast(details, loans),
    [details, loans],
  );

  const activeLoans = loans.filter(
    (loan) => loan?.status !== "repaid",
  );

  const totalOutstanding = activeLoans.reduce(
    (sum, loan) =>
      sum + (Number(loan?.outstanding) || 0),
    0,
  );

  const largestLoan = activeLoans.reduce(
    (largest, loan) =>
      (Number(loan?.outstanding) || 0) >
      (Number(largest?.outstanding) || 0)
        ? loan
        : largest,
    null,
  );

  const largestLoanShare =
    totalOutstanding > 0 && largestLoan
      ? ((Number(largestLoan.outstanding) || 0) /
          totalOutstanding) *
        100
      : Number(health?.largestLoanShare) || 0;

  const lateOutstanding = activeLoans
    .filter((loan) => loan?.status === "delayed")
    .reduce(
      (sum, loan) =>
        sum + (Number(loan?.outstanding) || 0),
      0,
    );

  const lateShare =
    totalOutstanding > 0
      ? (lateOutstanding / totalOutstanding) * 100
      : Number(health?.lateShare) || 0;

  const portfolioValue =
    Number(details?.summary?.portfolioValue) ||
    totalOutstanding +
      (Number(summary.cash) || 0);

  const cashShare =
    portfolioValue > 0
      ? ((Number(summary.cash) || 0) /
          portfolioValue) *
        100
      : Number(health?.cashShare) || 0;

  const maxForecast = Math.max(
    ...incomeForecast.map(
      (item) => Number(item.total) || 0,
    ),
    1,
  );

  const maxIncome = Math.max(
    ...monthlyIncome.map((item) =>
      Math.abs(Number(item.netIncome) || 0),
    ),
    1,
  );

  return (
    <div className="p2p-profile-module">
      <div className="p2p-module-title">
        <div>
          <p>P2P PORTFELIS</p>
          <h2>{platformName} paskolų analizė</h2>
          <span>
            Paskolos, pajamos, pinigų srautai ir portfelio būklė.
          </span>
        </div>
      </div>

      <section className="p2p-snapshot-grid">
        <article>
          <span>Visos paskolos</span>
          <strong>
            {summary.totalLoans ?? loans.length}
          </strong>
          <small>
            {summary.activeLoans ?? 0} aktyvios
          </small>
        </article>

        <article>
          <span>Vid. palūkanos</span>
          <strong>
            {formatPercentage(
              summary.averageInterestRate,
            )}
          </strong>
          <small>Svertinė pagal likutį</small>
        </article>

        <article>
          <span>Laisvi pinigai</span>
          <strong>{formatCurrency(summary.cash)}</strong>
          <small>Paruošta reinvestuoti</small>
        </article>

        <article>
          <span>Gautos palūkanos</span>
          <strong className="p2p-positive">
            {formatCurrency(summary.interestReceived)}
          </strong>
          <small>Iki paskutinio atnaujinimo</small>
        </article>

        <article>
          <span>Vėluojančios</span>
          <strong
            className={
              Number(summary.lateLoans) > 0
                ? "p2p-negative"
                : "p2p-positive"
            }
          >
            {summary.lateLoans ?? 0}
          </strong>
          <small>Aktyvios vėluojančios paskolos</small>
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

          <b>{health.label || "Skaičiuojama"}</b>

          <p>
            {health.summary ||
              getHealthMessage(health.score)}
          </p>

          {showHealthHelp && (
            <div className="p2p-health-help">
              Galutinis balas sudedamas iš
              diversifikacijos, paskolų kokybės, LTV,
              mokėjimų drausmės ir laisvų pinigų
              efektyvumo.
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

                {metric.description && (
                  <small>{metric.description}</small>
                )}
              </div>
            );
          })}
        </div>

        <div className="p2p-health-facts">
          <div>
            <span>Didžiausia paskola</span>
            <strong>
              {formatPercentage(largestLoanShare)}
            </strong>
            <div className="p2p-mini-track">
              <i
                style={{
                  width: `${Math.min(
                    100,
                    largestLoanShare,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <span>Vėluojanti dalis</span>
            <strong>{formatPercentage(lateShare)}</strong>
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
            <span>Palūkanos, premijos ir mokesčiai.</span>
          </div>

          <strong>
            {formatCurrency(cashflow.interest)}
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
            <p>INCOME CALENDAR</p>
            <h2>Planuojami mokėjimai</h2>
            <span>
              Preliminari prognozė pagal mokėjimų
              grafiką.
            </span>
          </div>

          <strong>
            {formatCurrency(
              incomeForecast.reduce(
                (sum, item) =>
                  sum +
                  (Number(item.interest) || 0),
                0,
              ),
            )}
            <small> palūkanų</small>
          </strong>
        </div>

        {incomeForecast.length > 0 ? (
          <div className="p2p-forecast-grid">
            {incomeForecast.map((item) => (
              <article key={item.month}>
                <div>
                  <span>{item.month}</span>
                  <strong>
                    {formatCurrency(item.total)}
                  </strong>
                </div>

                <div className="p2p-forecast-track">
                  <i
                    style={{
                      width: `${Math.max(
                        4,
                        (Number(item.total) /
                          maxForecast) *
                          100,
                      )}%`,
                    }}
                  />
                </div>

                <footer>
                  <span>
                    Grąžinama{" "}
                    {formatCurrency(item.principal)}
                  </span>
                  <b>
                    Palūkanos{" "}
                    {formatCurrency(item.interest)}
                  </b>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <div className="p2p-empty">
            Planuojamų mokėjimų nerasta.
          </div>
        )}
      </section>

      <P2PLoanTable
        loans={loans}
        platformName={platformName}
      />
    </div>
  );
}

export default P2PProfileModule;
