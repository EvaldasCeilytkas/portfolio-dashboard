import { Link, useParams } from "react-router-dom";

import { RatingBadge, StatusBadge, scoreTone } from "./RealEstateBadges";
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
};

const normalizedStatus = (status, delayDays = 0) => {
  const value = String(status || "").toLowerCase();
  if (value === "repaid" || value === "completed" || value === "closed") {
    return "completed";
  }
  if (value === "delayed" || number(delayDays) > 0) {
    return "delayed";
  }
  return "active";
};

function paymentStatus(payment) {
  const plannedPrincipal = number(payment.plannedPrincipal);
  const plannedInterest = number(payment.plannedInterest);
  const actualPrincipal = number(payment.actualPrincipal);
  const actualInterest = number(payment.actualInterest);
  const actualExtra = number(payment.actualExtra);

  const planned = plannedPrincipal + plannedInterest;
  const actual = actualPrincipal + actualInterest + actualExtra;

  if (payment.actualDate || actual > 0) return "completed";
  if (!payment.plannedDate) return "completed";

  const plannedDate = new Date(payment.plannedDate);
  if (!Number.isNaN(plannedDate.getTime()) && plannedDate < new Date()) {
    return "delayed";
  }

  return "active";
}

export default function RealEstateProjectProfile({ data }) {
  const { projectId } = useParams();
  const platform = data?.platform || {};
  const projects = Array.isArray(data?.projects) ? data.projects : [];

  const project = projects.find((item) =>
    [item.id, item.slug, item.code, item.loanCode]
      .filter(Boolean)
      .map(String)
      .includes(String(projectId)),
  );

  if (!project) {
    return (
      <main className="re-page">
        <section className="re-card re-not-found">
          <h1>Projektas nerastas</h1>
          <p>Patikrink projekto nuorodą arba Crowdpear duomenų failą.</p>
          <Link to={`/platforms/${platform.slug || "crowdpear"}`}>
            ← Grįžti į platformą
          </Link>
        </section>
      </main>
    );
  }

  const invested = number(project.invested);
  const repaidPrincipal = number(project.repaidPrincipal);
  const outstanding = number(project.outstanding);
  const progress = invested > 0
    ? Math.min(100, repaidPrincipal / invested * 100)
    : 0;

  const riskScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100
        - Math.max(0, number(project.ltv) - 45) * 0.9
        - Math.max(0, number(project.delayDays)) * 0.8
        - (String(project.rating || "").toUpperCase().startsWith("C") ? 12 : 0)
        - (String(project.rating || "").toUpperCase().startsWith("D") ? 25 : 0),
      ),
    ),
  );

  const payments = Array.isArray(project.payments)
    ? project.payments.filter((payment) => payment.plannedDate || payment.actualDate)
    : [];

  return (
    <main className="re-page">
      <Link className="re-back" to={`/platforms/${platform.slug || "crowdpear"}`}>
        ← Grįžti į {platform.name || "Crowdpear"}
      </Link>

      <section className="re-project-hero">
        <div>
          <span className="re-eyebrow">REAL ESTATE PROJECT PROFILE</span>
          <small>{project.loanCode || project.code || "NT projektas"}</small>
          <h1>{project.name || "Projektas"}</h1>
          <p>
            {project.rating ? `${project.rating} reitingas` : "NT projektas"}
            {" · "}
            {percent(project.interestRate)} palūkanos
            {" · "}
            {number(project.durationMonths)} mėn.
          </p>

          <div className="re-project-badges">
            <RatingBadge rating={project.rating} />
            <StatusBadge status={normalizedStatus(project.status, project.delayDays)} />
          </div>
        </div>

        <div className={`re-risk-panel re-score-${scoreTone(riskScore)}`}>
          <span>Project Risk Score</span>
          <strong>{riskScore}</strong>
          <small>/100</small>
        </div>
      </section>

      <section className="re-project-metrics">
        <div><span>Investuota</span><strong>{money(invested)}</strong></div>
        <div><span>Grąžinta</span><strong>{money(repaidPrincipal)}</strong></div>
        <div><span>Likutis</span><strong>{money(outstanding)}</strong></div>
        <div><span>Gautos palūkanos</span><strong>{money(project.interestReceived)}</strong></div>
        <div><span>Palūkanos</span><strong>{percent(project.interestRate)}</strong></div>
        <div><span>LTV</span><strong>{percent(project.ltv, 0)}</strong></div>
      </section>

      <section className="re-feature-grid">
        <article className="re-card">
          <div className="re-card-heading">
            <div>
              <span>REPAYMENT PROGRESS</span>
              <h2>Grąžinimo progresas</h2>
            </div>
            <strong>{percent(progress, 1)}</strong>
          </div>

          <div className="re-project-progress">
            <div style={{ width: `${progress}%` }} />
          </div>

          <div className="re-progress-labels">
            <span>{money(repaidPrincipal)} grąžinta</span>
            <span>{money(outstanding)} liko</span>
          </div>
        </article>

        <article className="re-card">
          <div className="re-card-heading">
            <div>
              <span>PROJECT DETAILS</span>
              <h2>Projekto informacija</h2>
            </div>
          </div>

          <div className="re-details-grid">
            <div><span>Investavimo data</span><strong>{formatDate(project.investmentDate)}</strong></div>
            <div><span>Palūkanų pradžia</span><strong>{formatDate(project.interestStart)}</strong></div>
            <div><span>Planuojamas grąžinimas</span><strong>{formatDate(project.plannedRepayment)}</strong></div>
            <div><span>Faktinis grąžinimas</span><strong>{formatDate(project.actualRepayment)}</strong></div>
            <div><span>Mokėjimų dažnis</span><strong>{project.paymentFrequency || "—"}</strong></div>
            <div><span>Maksimalus LTV</span><strong>{percent(project.maxLtv, 0)}</strong></div>
            <div><span>Vėlavimas</span><strong>{number(project.delayDays)} d.</strong></div>
            <div><span>Papildomai gauta</span><strong>{money(project.extraReceived)}</strong></div>
          </div>
        </article>
      </section>

      <section className="re-card re-payments">
        <div className="re-card-heading">
          <div>
            <span>PAYMENT HISTORY</span>
            <h2>Mokėjimų istorija</h2>
          </div>
        </div>

        <div className="re-payment-head">
          <span>Planuota data</span>
          <span>Faktinė data</span>
          <span>Planuota</span>
          <span>Gauta</span>
          <span>Statusas</span>
        </div>

        {payments.map((payment, index) => {
          const planned =
            number(payment.plannedPrincipal) + number(payment.plannedInterest);
          const actual =
            number(payment.actualPrincipal) +
            number(payment.actualInterest) +
            number(payment.actualExtra);

          return (
            <div className="re-payment-row" key={`${payment.plannedDate}-${index}`}>
              <span>{formatDate(payment.plannedDate)}</span>
              <span>{formatDate(payment.actualDate)}</span>
              <span>{money(planned)}</span>
              <span>{money(actual)}</span>
              <span><StatusBadge status={paymentStatus(payment)} /></span>
            </div>
          );
        })}

        {!payments.length && (
          <div className="re-empty">Mokėjimų istorijos duomenų nėra.</div>
        )}
      </section>
    </main>
  );
}
