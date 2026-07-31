import { Link } from "react-router-dom";

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

function normalizeStatus(project) {
  const value = String(project?.status || "").toLowerCase();
  if (["completed", "repaid", "closed", "finished"].includes(value)) {
    return "completed";
  }
  if (["delayed", "late", "overdue"].includes(value) || number(project?.delayDays) > 0) {
    return "delayed";
  }
  return "active";
}

function paymentStatus(payment) {
  const actual =
    number(payment.actualPrincipal) +
    number(payment.actualInterest) +
    number(payment.actualExtra);

  if (payment.actualDate || actual > 0) return "completed";
  if (!payment.plannedDate) return "completed";

  const date = new Date(payment.plannedDate);
  if (!Number.isNaN(date.getTime()) && date < new Date()) {
    return "delayed";
  }

  return "active";
}

export default function RealEstateProjectProfile({
  platform,
  project,
}) {
  const invested = number(project.invested);
  const repaid = number(
    project.repaidPrincipal ??
      project.repaidPrincipalTotal ??
      Math.max(invested - number(project.outstanding), 0),
  );
  const outstanding = number(
    project.outstanding ?? project.currentValue,
  );
  const progress =
    invested > 0 ? Math.min(100, (repaid / invested) * 100) : 0;

  const schedule = Array.isArray(project.paymentSchedule)
    ? project.paymentSchedule.filter(
        (item) => item.plannedDate || item.actualDate,
      )
    : [];

  return (
    <main className="re-page">
      <Link
        className="re-back"
        to={`/platforms/${platform.slug}`}
      >
        ← Grįžti į {platform.name} projektus
      </Link>

      <section className="re-project-hero">
        <div>
          <span className="re-eyebrow">NT PROJEKTAS</span>
          <h1 className="re-project-name">{project.name}</h1>
          <div className="re-project-badges">
            <span className="re-meta-badge">
              {project.code || project.id}
            </span>
            <RatingBadge rating={project.rating} />
            <StatusBadge status={normalizeStatus(project)} />
          </div>
        </div>

        <div className="re-current-value">
          <span>DABARTINĖ VERTĖ</span>
          <strong>{money(project.currentValue)}</strong>
          <small>Investuota {money(project.invested)}</small>
        </div>
      </section>

      <section className="re-project-metrics">
        <article className="re-metric re-tone-info">
          <span>Investuota</span>
          <strong>{money(project.invested)}</strong>
        </article>
        <article className="re-metric re-tone-positive">
          <span>Gautas pelnas</span>
          <strong>{money(project.profit)}</strong>
        </article>
        <article className="re-metric re-tone-positive">
          <span>Palūkanos</span>
          <strong>{percent(project.interestRate)}</strong>
        </article>
        <article className="re-metric re-tone-info">
          <span>LTV</span>
          <strong>{percent(project.ltv, 0)}</strong>
        </article>
        <article className="re-metric re-tone-info">
          <span>Terminas</span>
          <strong>
            {project.durationMonths
              ? `${project.durationMonths} mėn.`
              : "—"}
          </strong>
        </article>
        <article className="re-metric re-tone-warning">
          <span>Vėlavimas</span>
          <strong>{number(project.delayDays)} d.</strong>
        </article>
      </section>

      <section className="re-feature-grid">
        <article className="re-card re-progress-card">
          <div className="re-card-heading">
            <div>
              <span>PROJEKTO PROGRESAS</span>
              <h2>Kapitalo grąžinimas</h2>
            </div>
            <strong>{percent(progress, 0)}</strong>
          </div>

          <div className="re-progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="re-progress-labels">
            <span>{money(repaid)} grąžinta</span>
            <span>{money(outstanding)} liko</span>
          </div>
        </article>

        <article className="re-card">
          <div className="re-card-heading">
            <div>
              <span>PROJEKTO INFORMACIJA</span>
              <h2>Pagrindiniai duomenys</h2>
            </div>
          </div>

          <div className="re-details-grid">
            <div>
              <span>Investavimo data</span>
              <strong>{formatDate(project.investmentDate)}</strong>
            </div>
            <div>
              <span>Palūkanų pradžia</span>
              <strong>{formatDate(project.interestStartDate)}</strong>
            </div>
            <div>
              <span>Planuojama pabaiga</span>
              <strong>{formatDate(project.maturityDate)}</strong>
            </div>
            <div>
              <span>Faktinė pabaiga</span>
              <strong>{formatDate(project.completionDate)}</strong>
            </div>
            <div>
              <span>Mokėjimų dažnis</span>
              <strong>{project.paymentFrequency || "—"}</strong>
            </div>
            <div>
              <span>Maksimalus LTV</span>
              <strong>{percent(project.maxLtv, 0)}</strong>
            </div>
            <div>
              <span>Gautos pajamos</span>
              <strong>{money(project.incomeReceived)}</strong>
            </div>
            <div>
              <span>Planuotos palūkanos</span>
              <strong>{money(project.plannedInterest)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="re-card re-payments">
        <div className="re-card-heading">
          <div>
            <span>MOKĖJIMŲ GRAFIKAS</span>
            <h2>Planuoti ir faktiniai mokėjimai</h2>
          </div>
        </div>

        <div className="re-payment-head">
          <span>Planuota data</span>
          <span>Faktinė data</span>
          <span>Planuota</span>
          <span>Gauta</span>
          <span>Statusas</span>
        </div>

        {schedule.map((payment, index) => {
          const planned =
            number(payment.plannedPrincipal) +
            number(payment.plannedInterest);
          const actual =
            number(payment.actualPrincipal) +
            number(payment.actualInterest) +
            number(payment.actualExtra);

          return (
            <div
              className="re-payment-row"
              key={`${payment.plannedDate || payment.actualDate}-${index}`}
            >
              <span>{formatDate(payment.plannedDate)}</span>
              <span>{formatDate(payment.actualDate)}</span>
              <span>{money(planned)}</span>
              <span>{money(actual)}</span>
              <span>
                <StatusBadge status={paymentStatus(payment)} />
              </span>
            </div>
          );
        })}

        {!schedule.length && (
          <div className="re-empty">
            Šiam projektui mokėjimų grafikas dar nepateiktas.
          </div>
        )}
      </section>
    </main>
  );
}
