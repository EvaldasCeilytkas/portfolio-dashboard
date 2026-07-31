import { Link } from "react-router-dom";

import "./brokerage.css";

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

const quantity = (value) =>
  new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(number(value));

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

export default function BrokerageInvestmentProfile({
  platform,
  investment,
  summary = {},
}) {
  const active = investment.status === "active";
  const portfolioValue = number(summary.currentValue);
  const portfolioShare =
    active && portfolioValue > 0
      ? Math.min(100, (number(investment.currentValue) / portfolioValue) * 100)
      : 0;
  const progress = active ? portfolioShare : 100;

  return (
    <main className="broker-page">
      <Link className="broker-back" to={`/platforms/${platform.slug}`}>
        ← Grįžti į {platform.name} ETF
      </Link>

      <section className="broker-investment-hero">
        <div>
          <span className="broker-eyebrow">ETF POZICIJOS PROFILIS</span>
          <h1>{investment.ticker}</h1>
          <p>{investment.name}</p>
          <div className="broker-badges">
            <span
              className={`broker-status ${
                active
                  ? "broker-status-active"
                  : "broker-status-completed"
              }`}
            >
              {active ? "Aktyvi" : "Parduota"}
            </span>
            <span>{investment.type}</span>
            <span>{investment.currency}</span>
          </div>
        </div>

        <div className="broker-hero-value">
          <span>DABARTINĖ VERTĖ</span>
          <strong>{money(investment.currentValue)}</strong>
          <small>Investuota {money(investment.invested)}</small>
        </div>
      </section>

      <section className="broker-metrics broker-investment-metrics">
        <article><span>Investuota</span><strong>{money(investment.invested)}</strong></article>
        <article><span>Dabartinė vertė</span><strong>{money(investment.currentValue)}</strong></article>
        <article><span>Pelnas</span><strong className={number(investment.profit) >= 0 ? "positive" : "negative"}>{money(investment.profit)}</strong></article>
        <article><span>Grąža</span><strong className={number(investment.returnRate) >= 0 ? "positive" : "negative"}>{investment.returnRate == null ? "—" : percent(investment.returnRate)}</strong></article>
        <article><span>Dividendai</span><strong>{money(investment.dividends)}</strong></article>
        <article><span>Mokesčiai</span><strong>{money(investment.fees)}</strong></article>
      </section>

      <section className="broker-feature-grid">
        <article className="broker-card broker-progress-card">
          <div className="broker-card-heading">
            <div>
              <span>{active ? "PORTFELIO DALIS" : "POZICIJOS BŪSENA"}</span>
              <h2>{active ? "Pozicijos svoris portfelyje" : "Pozicija realizuota"}</h2>
            </div>
            <strong>{active ? percent(portfolioShare) : "100 %"}</strong>
          </div>
          <div className="broker-progress-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          <div className="broker-progress-labels">
            {active ? (
              <>
                <span>{money(investment.currentValue)} pozicijos vertė</span>
                <span>{money(portfolioValue)} visas aktyvus portfelis</span>
              </>
            ) : (
              <>
                <span>{money(investment.realizedProceeds)} realizuota</span>
                <span>Pozicija uždaryta</span>
              </>
            )}
          </div>
        </article>

        <article className="broker-card">
          <div className="broker-card-heading">
            <div>
              <span>ETF INFORMACIJA</span>
              <h2>Pagrindiniai duomenys</h2>
            </div>
          </div>
          <div className="broker-details">
            <div><span>Tickeris</span><strong>{investment.ticker}</strong></div>
            <div><span>Tipas</span><strong>{investment.type}</strong></div>
            <div><span>Pradžia</span><strong>{formatDate(investment.startDate)}</strong></div>
            <div><span>Pabaiga</span><strong>{formatDate(investment.endDate)}</strong></div>
            <div><span>Kiekis</span><strong>{active ? quantity(investment.quantity) : "—"}</strong></div>
            <div><span>Vieneto kaina</span><strong>{active ? money(investment.price) : "—"}</strong></div>
          </div>
        </article>
      </section>

      <section className="broker-feature-grid">
        <article className="broker-card">
          <div className="broker-card-heading">
            <div>
              <span>KAPITALAS</span>
              <h2>Investicijos suvestinė</h2>
            </div>
          </div>
          <div className="broker-details">
            <div><span>Bendra investuota</span><strong>{money(investment.invested)}</strong></div>
            <div><span>Grynoji investuota</span><strong>{money(investment.netInvested)}</strong></div>
            <div><span>Realizuotos pajamos</span><strong>{money(investment.realizedProceeds)}</strong></div>
            <div><span>Dabartinė vertė</span><strong>{money(investment.currentValue)}</strong></div>
          </div>
        </article>

        <article className="broker-card">
          <div className="broker-card-heading">
            <div>
              <span>PAJAMOS IR MOKESČIAI</span>
              <h2>Rezultato detalės</h2>
            </div>
          </div>
          <div className="broker-details">
            <div><span>Pelnas</span><strong>{money(investment.profit)}</strong></div>
            <div><span>Dividendai</span><strong>{money(investment.dividends)}</strong></div>
            <div><span>Pirkimo mokesčiai</span><strong>{money(investment.purchaseFees)}</strong></div>
            <div><span>Pardavimo mokesčiai</span><strong>{money(investment.saleFees)}</strong></div>
          </div>
        </article>
      </section>
    </main>
  );
}
