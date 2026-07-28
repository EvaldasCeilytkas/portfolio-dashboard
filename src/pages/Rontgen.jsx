import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import RealEstatePlatformProfile from "../components/realestate/RealEstatePlatformProfile";
import { RatingBadge, StatusBadge } from "../components/realestate/RealEstateBadges";

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

const dateLabel = (value) => {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
};

const status = (project) => {
  if (project?.status === "repaid") return "completed";
  if (project?.status === "delayed" || number(project?.delayDays) > 0) {
    return "delayed";
  }
  return "active";
};

function RontgenProject({ data, projectId }) {
  const project = useMemo(
    () =>
      data.projects?.find(
        (item) =>
          String(item.id) === String(projectId) ||
          String(item.slug) === String(projectId) ||
          String(item.loanCode) === String(projectId),
      ),
    [data.projects, projectId],
  );

  if (!project) {
    return (
      <main className="re-page">
        <section className="re-card re-not-found">
          <h2>Projektas nerastas</h2>
          <p>Patikrink projekto nuorodą arba grįžk į Röntgen portfelį.</p>
          <Link className="re-back" to="/platforms/rontgen">
            ← Grįžti į Röntgen
          </Link>
        </section>
      </main>
    );
  }

  const progress = project.invested
    ? Math.min(100, (number(project.repaidPrincipal) / number(project.invested)) * 100)
    : 0;

  return (
    <main className="re-page">
      <section className="re-project-hero">
        <div>
          <Link className="re-back" to="/platforms/rontgen">
            ← Grįžti į Röntgen
          </Link>
          <small>{project.loanCode || "PROFITUS PROJEKTAS"}</small>
          <h1>{project.name}</h1>
          <div className="re-project-badges">
            <RatingBadge rating={project.rating} />
            <StatusBadge status={status(project)} />
          </div>
        </div>

        <div className="re-risk-panel re-score-good">
          <span>Projekto reitingas</span>
          <strong>{project.rating || "—"}</strong>
          <small>{percent(project.interestRate)}</small>
        </div>
      </section>

      <section className="re-project-metrics">
        <div><span>Investuota</span><strong>{money(project.invested)}</strong></div>
        <div><span>Likutis</span><strong>{money(project.outstanding)}</strong></div>
        <div><span>Grąžinta paskolos</span><strong>{money(project.repaidPrincipal)}</strong></div>
        <div><span>Gautos palūkanos</span><strong>{money(project.interestReceived)}</strong></div>
        <div><span>Palūkanos</span><strong>{percent(project.interestRate)}</strong></div>
        <div><span>LTV</span><strong>{percent(project.ltv, 0)}</strong></div>
      </section>

      <section className="re-card">
        <div className="re-card-heading">
          <div>
            <span>REPAYMENT PROGRESS</span>
            <h2>Paskolos grąžinimas</h2>
          </div>
        </div>
        <div className="re-project-progress">
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="re-progress-labels">
          <span>Grąžinta {money(project.repaidPrincipal)}</span>
          <span>{percent(progress, 0)}</span>
          <span>Liko {money(project.outstanding)}</span>
        </div>
      </section>

      <section className="re-feature-grid">
        <article className="re-card">
          <div className="re-card-heading">
            <div><span>PROJECT DETAILS</span><h2>Projekto informacija</h2></div>
          </div>
          <div className="re-details-grid">
            <div><span>Investicijos data</span><strong>{dateLabel(project.investmentDate)}</strong></div>
            <div><span>Palūkanų pradžia</span><strong>{dateLabel(project.interestStart)}</strong></div>
            <div><span>Planuojama pabaiga</span><strong>{dateLabel(project.plannedRepayment)}</strong></div>
            <div><span>Faktinė pabaiga</span><strong>{dateLabel(project.actualRepayment)}</strong></div>
            <div><span>Trukmė</span><strong>{number(project.durationMonths)} mėn.</strong></div>
            <div><span>Mokėjimų dažnis</span><strong>{project.paymentFrequency || "—"}</strong></div>
            <div><span>LTV max.</span><strong>{project.maxLtv == null ? "—" : percent(project.maxLtv, 0)}</strong></div>
            <div><span>Vėlavimas</span><strong>{number(project.delayDays)} d.</strong></div>
          </div>
        </article>

        <article className="re-card">
          <div className="re-card-heading">
            <div><span>RETURNS</span><h2>Grąža</h2></div>
          </div>
          <div className="re-details-grid">
            <div><span>Planuotos palūkanos</span><strong>{money(project.plannedInterest)}</strong></div>
            <div><span>Gautos palūkanos</span><strong>{money(project.interestReceived)}</strong></div>
            <div><span>Papildomai gauta</span><strong>{money(project.extraReceived)}</strong></div>
            <div><span>Paskolos kodas</span><strong>{project.loanCode || "—"}</strong></div>
          </div>
        </article>
      </section>

      <section className="re-card">
        <div className="re-card-heading">
          <div><span>PAYMENT SCHEDULE</span><h2>Mokėjimų grafikas</h2></div>
        </div>

        <div className="re-table-wrap">
          <div className="re-payment-head">
            <span>Planuota data</span>
            <span>Planuota suma</span>
            <span>Faktinė data</span>
            <span>Gauta suma</span>
            <span>Vėlavimas</span>
          </div>

          {(project.payments || []).map((payment, index) => (
            <div className="re-payment-row" key={`${payment.plannedDate}-${index}`}>
              <span>{dateLabel(payment.plannedDate)}</span>
              <span>{money(number(payment.plannedPrincipal) + number(payment.plannedInterest))}</span>
              <span>{dateLabel(payment.actualDate)}</span>
              <span>{money(number(payment.actualPrincipal) + number(payment.actualInterest) + number(payment.actualExtra))}</span>
              <span>{number(payment.delayDays)} d.</span>
            </div>
          ))}

          {!project.payments?.length && (
            <div className="re-empty">Mokėjimų grafiko duomenų nėra.</div>
          )}
        </div>
      </section>
    </main>
  );
}

export default function Rontgen() {
  const { projectId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const response = await fetch("/data/rontgen.json");
        if (!response.ok) {
          throw new Error("Nepavyko užkrauti rontgen.json failo.");
        }
        const result = await response.json();
        if (active) setData(result);
      } catch (loadError) {
        console.error(loadError);
        if (active) setError(loadError.message || "Nepavyko užkrauti Röntgen duomenų.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <main className="re-page"><div className="re-loading">Kraunami Röntgen duomenys...</div></main>;
  }

  if (error || !data) {
    return <main className="re-page"><div className="re-not-found">{error || "Röntgen duomenų nėra."}</div></main>;
  }

  return projectId ? (
    <RontgenProject data={data} projectId={projectId} />
  ) : (
    <RealEstatePlatformProfile data={data} />
  );
}
