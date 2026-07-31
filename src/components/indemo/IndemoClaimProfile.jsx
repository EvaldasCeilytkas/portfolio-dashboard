import { Link } from "react-router-dom";

import "./indemo.css";

const numeric = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
  new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric(value));

const percentValue = (value) => {
  const numericValue = numeric(value);
  return Math.abs(numericValue) <= 1 ? numericValue * 100 : numericValue;
};

const percent = (value, digits = 2) =>
  `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(percentValue(value))} %`;

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

export default function IndemoClaimProfile({ platform, claim }) {
  const invested = numeric(claim.invested);
  const repaid = numeric(claim.repaidPrincipal);
  const progress = invested > 0 ? Math.min(100, (repaid / invested) * 100) : 0;
  const completed = claim.status === "repaid";

  return (
    <main className="indemo-page">
      <Link className="indemo-back" to={`/platforms/${platform.slug}`}>
        ← Grįžti į {platform.name} claim'us
      </Link>

      <section className="indemo-claim-hero">
        <div>
          <span className="indemo-eyebrow">HIPOTEKA UŽTIKRINTAS CLAIM</span>
          <h1>{claim.name}</h1>
          <div className="indemo-badges">
            <span>{claim.loanCode}</span>
            <span className={`indemo-status indemo-status-${completed ? "completed" : "active"}`}>
              {completed ? "Užbaigta" : "Aktyvi"}
            </span>
          </div>
        </div>
        <div className="indemo-hero-value">
          <span>LIKUTIS</span>
          <strong>{money(claim.outstanding)}</strong>
          <small>Investuota {money(claim.invested)}</small>
        </div>
      </section>

      <section className="indemo-metrics indemo-claim-metrics">
        <article><span>Investuota</span><strong>{money(claim.invested)}</strong></article>
        <article><span>Grąžinta</span><strong>{money(claim.repaidPrincipal)}</strong></article>
        <article><span>PTV</span><strong>{percent(claim.ptv, 0)}</strong></article>
        <article><span>PDT</span><strong>{percent(claim.pdt, 0)}</strong></article>
        <article><span>XIRR</span><strong className="positive">{claim.xirr ? percent(claim.xirr) : "—"}</strong></article>
        <article><span>Gautos pajamos</span><strong>{money(claim.interestReceived + claim.extraReceived)}</strong></article>
      </section>

      <section className="indemo-feature-grid">
        <article className="indemo-card indemo-progress-card">
          <div className="indemo-card-heading">
            <div>
              <span>CLAIM PROGRESAS</span>
              <h2>Kapitalo grąžinimas</h2>
            </div>
            <strong>{percent(progress, 0)}</strong>
          </div>
          <div className="indemo-progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="indemo-progress-labels">
            <span>{money(repaid)} grąžinta</span>
            <span>{money(claim.outstanding)} liko</span>
          </div>
        </article>

        <article className="indemo-card">
          <div className="indemo-card-heading">
            <div>
              <span>CLAIM INFORMACIJA</span>
              <h2>Pagrindiniai duomenys</h2>
            </div>
          </div>
          <div className="indemo-details">
            <div><span>Investavimo data</span><strong>{formatDate(claim.investmentDate)}</strong></div>
            <div><span>Paskolos pradžia</span><strong>{formatDate(claim.loanStartDate)}</strong></div>
            <div><span>Faktinis grąžinimas</span><strong>{formatDate(claim.actualRepayment)}</strong></div>
            <div><span>Trukmė</span><strong>{claim.durationDays ? `${claim.durationDays} d.` : "—"}</strong></div>
            <div><span>Gautos palūkanos</span><strong>{money(claim.interestReceived)}</strong></div>
            <div><span>Papildomos pajamos</span><strong>{money(claim.extraReceived)}</strong></div>
          </div>
        </article>
      </section>

      <section className="indemo-card">
        <div className="indemo-card-heading">
          <div>
            <span>INVESTAVIMO OPERACIJOS</span>
            <h2>Claim pirkimai</h2>
          </div>
        </div>
        <div className="indemo-operation-head">
          <span>Nr.</span><span>Data</span><span>Note</span><span>Suma</span>
        </div>
        {(claim.investments || []).map((item, index) => (
          <div className="indemo-operation-row" key={`${item.note}-${index}`}>
            <span>{item.sequence || index + 1}</span>
            <span>{formatDate(item.date)}</span>
            <span>{item.note || "—"}</span>
            <strong>{money(item.amount)}</strong>
          </div>
        ))}
        {!claim.investments?.length && <div className="indemo-empty">Investavimo operacijų nėra.</div>}
      </section>

      <section className="indemo-card">
        <div className="indemo-card-heading">
          <div>
            <span>GRĄŽINIMŲ ISTORIJA</span>
            <h2>Kapitalas ir pajamos</h2>
          </div>
        </div>
        <div className="indemo-repayment-head">
          <span>Data</span><span>Kapitalas</span><span>Palūkanos</span><span>Papildomai</span><span>Dienos</span>
        </div>
        {(claim.repayments || []).map((item, index) => (
          <div className="indemo-repayment-row" key={`${item.date}-${index}`}>
            <span>{formatDate(item.date)}</span>
            <strong>{money(item.principal)}</strong>
            <strong>{money(item.interest)}</strong>
            <strong>{money(item.extra)}</strong>
            <span>{item.days || 0}</span>
          </div>
        ))}
        {!claim.repayments?.length && <div className="indemo-empty">Grąžinimų dar nėra.</div>}
      </section>
    </main>
  );
}
