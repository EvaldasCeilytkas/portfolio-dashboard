import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { usePortfolio } from "../hooks/usePortfolio";
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
}

function createSlug(value) {
  return String(value || "").trim().toLocaleLowerCase("lt-LT").replaceAll(" ", "-");
}

const STATUS_LABELS = {
  active: "Aktyvi paskola",
  late: "Vėluojanti paskola",
  completed: "Užbaigta paskola",
};

function P2PLoanProfile() {
  const { slug, loanId } = useParams();
  const { portfolio, loading, errorMessage } = usePortfolio();

  const platform = useMemo(() => {
    const platforms = Array.isArray(portfolio?.platforms) ? portfolio.platforms : [];
    return platforms.find((item) => (item?.slug || createSlug(item?.name)) === slug);
  }, [portfolio, slug]);

  const details = useMemo(() => {
    if (platform?.details && typeof platform.details === "object") {
      return platform.details;
    }

    if (portfolio?.[slug] && typeof portfolio[slug] === "object") {
      return portfolio[slug];
    }

    const camelKey = String(slug || "").replace(
      /-([a-z])/g,
      (_, letter) => letter.toUpperCase(),
    );

    if (portfolio?.[camelKey] && typeof portfolio[camelKey] === "object") {
      return portfolio[camelKey];
    }

    return null;
  }, [platform, portfolio, slug]);

  const loan = useMemo(() => {
    const loans = Array.isArray(details?.loans) ? details.loans : [];
    return loans.find((item) => String(item?.id) === String(loanId) || String(item?.loanId) === String(loanId));
  }, [details, loanId]);

  if (loading) {
    return <main className="platform-profile-page"><section className="platform-profile-state">Kraunami paskolos duomenys...</section></main>;
  }

  if (errorMessage || !platform || !loan) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state error">
          <h2>Paskola nerasta</h2>
          <p>{errorMessage || "Patikrink adresą arba grįžk į platformos paskolų sąrašą."}</p>
          <Link to={`/platforms/${slug}`}>Grįžti į platformą</Link>
        </section>
      </main>
    );
  }

  const payments = Array.isArray(loan.payments) ? loan.payments : [];
  const paidPayments = payments.filter((item) => item.status === "paid");
  const scheduledPayments = payments.filter((item) => item.status === "scheduled");
  const repaymentProgress = Number(loan.invested) > 0
    ? Math.min(100, (Number(loan.principalRepaid) / Number(loan.invested)) * 100)
    : 0;

  return (
    <main className="platform-profile-page p2p-loan-profile-page">
      <Link className="platform-profile-back" to={`/platforms/${slug}`}>
        <span aria-hidden="true">←</span>
        Grįžti į {platform.name}
      </Link>

      <section className="p2p-loan-hero">
        <div>
          <p>P2P LOAN PROFILE</p>
          <div className="p2p-loan-title-row">
            <h1>{loan.id}</h1>
            <span className={`p2p-status ${loan.status || "active"}`}><i />{STATUS_LABELS[loan.status] || "Aktyvi paskola"}</span>
          </div>
          <span>{loan.originator || "—"} · {loan.country || "—"} · {loan.type || "P2P paskola"}</span>
        </div>
        <div className="p2p-loan-hero-value">
          <span>Likęs pagrindas</span>
          <strong>{formatCurrency(loan.remainingPrincipal)}</strong>
          <b>{formatPercentage(loan.interestRate)} metinių palūkanų</b>
        </div>
      </section>

      <section className="p2p-loan-kpis">
        <article><span>Investuota</span><strong>{formatCurrency(loan.invested)}</strong><small>{formatDate(loan.investedDate)}</small></article>
        <article><span>Grąžinta pagrindo</span><strong>{formatCurrency(loan.principalRepaid)}</strong><small>{repaymentProgress.toFixed(2).replace(".", ",")} % investicijos</small></article>
        <article><span>Gautos palūkanos</span><strong className="p2p-positive">{formatCurrency(loan.interestReceived)}</strong><small>Grynosios {formatCurrency(loan.netIncome)}</small></article>
        <article><span>Planuojama pabaiga</span><strong>{formatDate(loan.plannedEndDate)}</strong><small>{loan.daysRemaining > 0 ? `${loan.daysRemaining} d. liko` : loan.status === "completed" ? "Užbaigta" : "Terminas pasibaigęs"}</small></article>
      </section>

      <section className="p2p-loan-grid">
        <article className="p2p-loan-card">
          <div className="p2p-module-header"><div><p>GRĄŽINIMAS</p><h2>Pagrindo progresas</h2></div><strong>{repaymentProgress.toFixed(0)} %</strong></div>
          <div className="p2p-loan-progress"><i style={{ width: `${repaymentProgress}%` }} /></div>
          <div className="p2p-loan-progress-labels"><span>{formatCurrency(loan.principalRepaid)} grąžinta</span><strong>{formatCurrency(loan.remainingPrincipal)} liko</strong></div>
        </article>

        <article className="p2p-loan-card">
          <div className="p2p-module-header"><div><p>INFORMACIJA</p><h2>Paskolos duomenys</h2></div></div>
          <dl className="p2p-loan-details">
            <div><dt>Skolintojas</dt><dd>{loan.originator || "—"}</dd></div>
            <div><dt>Šalis</dt><dd>{loan.country || "—"}</dd></div>
            <div><dt>Tipas</dt><dd>{loan.type || "—"}</dd></div>
            <div><dt>Terminas</dt><dd>{loan.term || "—"}</dd></div>
            <div><dt>Pradžia</dt><dd>{formatDate(loan.startDate)}</dd></div>
            <div><dt>Mokesčiai</dt><dd>{formatCurrency(loan.fees)}</dd></div>
          </dl>
        </article>
      </section>

      <section className="p2p-loans-card p2p-payment-card">
        <div className="p2p-module-header">
          <div><p>MOKĖJIMŲ ISTORIJA</p><h2>Faktiniai ir planuojami mokėjimai</h2><span>{paidPayments.length} gauti · {scheduledPayments.length} suplanuoti</span></div>
          <strong>{payments.length}</strong>
        </div>
        <div className="p2p-loan-table-wrap">
          <table className="p2p-payment-table">
            <thead><tr><th>Planuota data</th><th>Faktinė data</th><th>Vėlavimas</th><th>Pagrindas</th><th>Palūkanos</th><th>Mokestis</th><th>Grynosios pajamos</th><th>Statusas</th></tr></thead>
            <tbody>
              {payments.map((payment, index) => (
                <tr key={`${payment.plannedDate}-${index}`}>
                  <td>{formatDate(payment.plannedDate)}</td>
                  <td>{formatDate(payment.actualDate)}</td>
                  <td className={Number(payment.delayDays) > 0 ? "p2p-negative" : ""}>{Number(payment.delayDays) > 0 ? `${payment.delayDays} d.` : "—"}</td>
                  <td className="p2p-number">{formatCurrency(payment.principal)}</td>
                  <td className="p2p-number p2p-positive">{formatCurrency(payment.interest)}</td>
                  <td className="p2p-number">{formatCurrency(payment.fee)}</td>
                  <td className="p2p-number p2p-positive">{formatCurrency(payment.netIncome)}</td>
                  <td><span className={`p2p-payment-status ${payment.status}`}><i />{payment.status === "paid" ? "Gauta" : "Suplanuota"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default P2PLoanProfile;
