import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import "../styles/platformprofile.css";

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

function formatDate(value) {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(parsed);
}

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function normalizeStatus(value, delayDays = 0) {
  const status = String(value || "").trim().toLowerCase();

  if (
    ["completed", "finished", "closed", "repaid", "fully repaid"].includes(
      status,
    )
  ) {
    return "completed";
  }

  if (
    Number(delayDays) > 0 ||
    ["late", "delayed", "overdue"].includes(status)
  ) {
    return "late";
  }

  return "active";
}

function normalizeLoan(loan) {
  const delayDays =
    Number(firstDefined(loan?.delayDays, loan?.lateDays, 0)) || 0;

  const invested =
    Number(
      firstDefined(
        loan?.invested,
        loan?.investedAmount,
        loan?.initialInvestment,
        0,
      ),
    ) || 0;

  const remaining =
    Number(
      firstDefined(
        loan?.outstandingPrincipal,
        loan?.remainingPrincipal,
        loan?.currentValue,
        loan?.remainingAmount,
        0,
      ),
    ) || 0;

  const principalReturned =
    Number(
      firstDefined(
        loan?.principalReturned,
        loan?.principalRepaid,
        Math.max(invested - remaining, 0),
        0,
      ),
    ) || 0;

  return {
    ...loan,
    id: String(
      firstDefined(
        loan?.loanCode,
        loan?.id,
        loan?.loanId,
        loan?.externalId,
        "",
      ),
    ),
    lender: firstDefined(
      loan?.lender,
      loan?.originator,
      loan?.borrower,
      "—",
    ),
    country: firstDefined(loan?.country, loan?.borrowerCountry, "—"),
    type: firstDefined(loan?.loanType, loan?.type, "P2P paskola"),
    rate:
      Number(
        firstDefined(
          loan?.rate,
          loan?.interestRate,
          loan?.annualRate,
          loan?.apr,
          0,
        ),
      ) || 0,
    invested,
    remaining,
    principalReturned,
    interestReceived:
      Number(firstDefined(loan?.interestReceived, loan?.interest, 0)) || 0,
    fees: Number(firstDefined(loan?.fees, loan?.fee, 0)) || 0,
    investmentDate: firstDefined(
      loan?.investmentDate,
      loan?.investedDate,
      loan?.startDate,
      null,
    ),
    plannedEndDate: firstDefined(
      loan?.plannedEndDate,
      loan?.endDate,
      loan?.maturityDate,
      null,
    ),
    actualEndDate: firstDefined(loan?.actualEndDate, null),
    delayDays,
    status: normalizeStatus(loan?.status, delayDays),
    schedule: Array.isArray(loan?.schedule)
      ? loan.schedule
      : Array.isArray(loan?.payments)
        ? loan.payments
        : [],
  };
}

const STATUS_LABELS = {
  active: "Aktyvi paskola",
  late: "Vėluojanti paskola",
  completed: "Užbaigta paskola",
};

function P2PLoanProfile() {
  const { slug, loanId } = useParams();
  const [payload, setPayload] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadLoan() {
      try {
        setPayload(null);
        setErrorMessage("");

        const response = await fetch(
          `${import.meta.env.BASE_URL}data/platforms/${slug}.json`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Platformos JSON: HTTP ${response.status}`);
        }

        setPayload(await response.json());
      } catch (error) {
        if (error?.name !== "AbortError") {
          setErrorMessage(
            error?.message || "Nepavyko įkelti paskolos duomenų.",
          );
        }
      }
    }

    loadLoan();
    return () => controller.abort();
  }, [slug]);

  const platform = payload?.platform || {};
  const loans = Array.isArray(payload?.investments)
    ? payload.investments
    : [];

  const loan = useMemo(() => {
    const decodedLoanId = decodeURIComponent(String(loanId || ""));

    return loans
      .map(normalizeLoan)
      .find((item) => item.id === decodedLoanId);
  }, [loans, loanId]);

  if (!payload && !errorMessage) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state">
          Kraunami paskolos duomenys...
        </section>
      </main>
    );
  }

  if (errorMessage || !loan) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state error">
          <h2>Paskola nerasta</h2>
          <p>
            {errorMessage ||
              "Patikrink adresą arba grįžk į platformos paskolų sąrašą."}
          </p>
          <Link to={`/platforms/${slug}`}>Grįžti į platformą</Link>
        </section>
      </main>
    );
  }

  const repaymentProgress =
    loan.invested > 0
      ? Math.min(100, (loan.principalReturned / loan.invested) * 100)
      : 0;

  return (
    <main className="platform-profile-page p2p-loan-profile-page">
      <Link className="platform-profile-back" to={`/platforms/${slug}`}>
        <span aria-hidden="true">←</span>
        Grįžti į {platform.name || slug}
      </Link>

      <section className="p2p-loan-hero">
        <div>
          <p>P2P PASKOLOS PROFILIS</p>

          <div className="p2p-loan-title-row">
            <h1>{loan.id}</h1>
            <span className={`p2p-status ${loan.status}`}>
              <i />
              {STATUS_LABELS[loan.status]}
            </span>
          </div>

          <span>
            {loan.lender} · {loan.country} · {loan.type}
          </span>
        </div>

        <div className="p2p-loan-hero-value">
          <span>Likęs pagrindas</span>
          <strong>{formatCurrency(loan.remaining)}</strong>
          <b>{formatPercentage(loan.rate)} metinių palūkanų</b>
        </div>
      </section>

      <section className="p2p-loan-kpis">
        <article>
          <span>Investuota</span>
          <strong>{formatCurrency(loan.invested)}</strong>
          <small>{formatDate(loan.investmentDate)}</small>
        </article>

        <article>
          <span>Grąžinta pagrindo</span>
          <strong>{formatCurrency(loan.principalReturned)}</strong>
          <small>
            {repaymentProgress.toFixed(2).replace(".", ",")} % investicijos
          </small>
        </article>

        <article>
          <span>Gautos palūkanos</span>
          <strong className="p2p-positive">
            {formatCurrency(loan.interestReceived)}
          </strong>
          <small>Mokesčiai {formatCurrency(loan.fees)}</small>
        </article>

        <article>
          <span>Planuojama pabaiga</span>
          <strong>{formatDate(loan.plannedEndDate)}</strong>
          <small>
            {loan.status === "completed"
              ? "Užbaigta"
              : loan.delayDays > 0
                ? `${loan.delayDays} d. vėlavimas`
                : "Pagal grafiką"}
          </small>
        </article>
      </section>

      <section className="p2p-loan-grid">
        <article className="p2p-loan-card">
          <div className="p2p-module-header">
            <div>
              <p>GRĄŽINIMAS</p>
              <h2>Pagrindo progresas</h2>
            </div>
            <strong>{repaymentProgress.toFixed(0)} %</strong>
          </div>

          <div className="p2p-loan-progress">
            <i style={{ width: `${repaymentProgress}%` }} />
          </div>

          <div className="p2p-loan-progress-labels">
            <span>{formatCurrency(loan.principalReturned)} grąžinta</span>
            <strong>{formatCurrency(loan.remaining)} liko</strong>
          </div>
        </article>

        <article className="p2p-loan-card">
          <div className="p2p-module-header">
            <div>
              <p>INFORMACIJA</p>
              <h2>Paskolos duomenys</h2>
            </div>
          </div>

          <dl className="p2p-loan-details">
            <div>
              <dt>Platforma</dt>
              <dd>{platform.name || slug}</dd>
            </div>
            <div>
              <dt>Skolintojas</dt>
              <dd>{loan.lender}</dd>
            </div>
            <div>
              <dt>Šalis</dt>
              <dd>{loan.country}</dd>
            </div>
            <div>
              <dt>Paskolos tipas</dt>
              <dd>{loan.type}</dd>
            </div>
            <div>
              <dt>Palūkanos</dt>
              <dd>{formatPercentage(loan.rate)}</dd>
            </div>
            <div>
              <dt>Faktinė pabaiga</dt>
              <dd>{formatDate(loan.actualEndDate)}</dd>
            </div>
          </dl>
        </article>
      </section>

      {loan.schedule.length > 0 && (
        <section className="p2p-loans-card p2p-payment-card">
          <div className="p2p-module-header">
            <div>
              <p>MOKĖJIMŲ GRAFIKAS</p>
              <h2>Planuoti ir atlikti mokėjimai</h2>
            </div>
            <strong>{loan.schedule.length}</strong>
          </div>

          <div className="p2p-loan-table-wrap">
            <table className="p2p-payment-table">
              <thead>
                <tr>
                  <th>Planuota data</th>
                  <th>Faktinė data</th>
                  <th>Statusas</th>
                  <th>Pagrindas</th>
                  <th>Palūkanos</th>
                  <th>Mokestis</th>
                </tr>
              </thead>
              <tbody>
                {loan.schedule.map((payment, index) => {
                  const paid =
                    payment?.paid === true || Boolean(payment?.actualDate);

                  return (
                    <tr key={`${payment?.plannedDate || "payment"}-${index}`}>
                      <td>{formatDate(payment?.plannedDate)}</td>
                      <td>{formatDate(payment?.actualDate)}</td>
                      <td>
                        <span
                          className={`p2p-payment-status ${
                            paid ? "paid" : "scheduled"
                          }`}
                        >
                          <i />
                          {paid ? "Apmokėta" : "Planuojama"}
                        </span>
                      </td>
                      <td>{formatCurrency(payment?.principal)}</td>
                      <td>{formatCurrency(payment?.interest)}</td>
                      <td>{formatCurrency(payment?.fee)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

export default P2PLoanProfile;
