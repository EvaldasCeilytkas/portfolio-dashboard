import { Link } from "react-router-dom";
import "./funds.css";

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const money = (value) =>
  new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num(value));

const percent = (value, digits = 2) =>
  `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(num(value))} %`;

const quantity = (value) =>
  new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(num(value));

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

export default function FundInvestmentProfile({
  platform,
  investment,
}) {
  return (
    <main className="fund-page">
      <Link className="fund-back" to={`/platforms/${platform.slug}`}>
        ← Grįžti į {platform.name}
      </Link>

      <section className="fund-investment-hero">
        <div>
          <span className="fund-eyebrow">AKTYVAUS INVESTICINIO FONDO PROFILIS</span>
          <h1>{investment.name}</h1>

          <div className="fund-badges">
            <span className="fund-status fund-status-active">Aktyvus</span>
            <span>{investment.ticker}</span>
            <span>{investment.currency}</span>
          </div>
        </div>

        <div className="fund-hero-value">
          <span>DABARTINĖ VERTĖ</span>
          <strong>{money(investment.currentValue)}</strong>
          <small>Investuota {money(investment.invested)}</small>
        </div>
      </section>

      <section className="fund-metrics">
        <article>
          <span>Investuota</span>
          <strong>{money(investment.invested)}</strong>
        </article>

        <article>
          <span>Dabartinė vertė</span>
          <strong>{money(investment.currentValue)}</strong>
        </article>

        <article>
          <span>Pelnas</span>
          <strong className={num(investment.profit) >= 0 ? "positive" : "negative"}>
            {money(investment.profit)}
          </strong>
        </article>

        <article>
          <span>Grąža</span>
          <strong className={num(investment.returnRate) >= 0 ? "positive" : "negative"}>
            {investment.returnRate == null
              ? "—"
              : percent(investment.returnRate)}
          </strong>
        </article>

        <article>
          <span>Vienetai</span>
          <strong>{quantity(investment.quantity)}</strong>
        </article>

        <article>
          <span>Vieneto kaina</span>
          <strong>{money(investment.price)}</strong>
        </article>
      </section>

      <section className="fund-feature-grid">
        <article className="fund-card">
          <div className="fund-card-heading">
            <div>
              <span>POZICIJOS BŪSENA</span>
              <h2>Aktyvi fondo pozicija</h2>
            </div>

            <strong className="positive">
              {percent(investment.returnRate)}
            </strong>
          </div>

          <div className="fund-active-summary">
            <div>
              <span>Investuota</span>
              <strong>{money(investment.invested)}</strong>
            </div>

            <div>
              <span>Dabartinė vertė</span>
              <strong>{money(investment.currentValue)}</strong>
            </div>

            <div>
              <span>Pelnas</span>
              <strong>{money(investment.profit)}</strong>
            </div>
          </div>
        </article>

        <article className="fund-card">
          <div className="fund-card-heading">
            <div>
              <span>FONDO INFORMACIJA</span>
              <h2>Pagrindiniai duomenys</h2>
            </div>
          </div>

          <div className="fund-details">
            <div>
              <span>Fondo kodas</span>
              <strong>{investment.ticker}</strong>
            </div>

            <div>
              <span>Tipas</span>
              <strong>Investicinis fondas</strong>
            </div>

            <div>
              <span>Pradžia</span>
              <strong>{formatDate(investment.startDate)}</strong>
            </div>

            <div>
              <span>Statusas</span>
              <strong>Aktyvus</strong>
            </div>

            <div>
              <span>Grynoji investuota suma</span>
              <strong>{money(investment.netInvested)}</strong>
            </div>

            <div>
              <span>Mokesčiai</span>
              <strong>{money(investment.fees)}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
