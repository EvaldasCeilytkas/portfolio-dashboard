import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PerformanceChart from "../charts/PerformanceChart";
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

function ActiveBadge() {
  return <span className="fund-status fund-status-active">Aktyvus</span>;
}

function FundDistribution({ holdings = [] }) {
  return (
    <article className="fund-card">
      <div className="fund-card-heading">
        <div>
          <span>PORTFELIO SUDĖTIS</span>
          <h2>Aktyvūs fondai</h2>
        </div>
      </div>

      <div className="fund-holdings-list">
        {holdings.map((holding) => (
          <div className="fund-holding-row" key={holding.key}>
            <div className="fund-holding-meta">
              <div>
                <strong>{holding.name || holding.label}</strong>
                <span>{holding.label}</span>
              </div>

              <div>
                <strong>{money(holding.value)}</strong>
                <span>{percent(holding.weight)}</span>
              </div>
            </div>

            <div className="fund-track">
              <i style={{ width: `${Math.max(2, num(holding.weight))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function FundTable({ investments, platformSlug }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("value");

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return [...investments]
      .filter((item) => {
        if (!search) return true;

        return [item.ticker, item.name, item.fullName]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(search),
          );
      })
      .sort((a, b) => {
        if (sort === "profit") {
          return num(b.profit) - num(a.profit);
        }
        if (sort === "return") {
          return num(b.returnRate) - num(a.returnRate);
        }
        if (sort === "invested") {
          return num(b.invested) - num(a.invested);
        }
        return num(b.currentValue) - num(a.currentValue);
      });
  }, [investments, query, sort]);

  return (
    <section className="fund-table-card">
      <div className="fund-table-title">
        <div>
          <span>FONDŲ PORTFELIS</span>
          <h2>Synergy fondų pozicijos</h2>
          <p>Abi fondo pozicijos yra aktyvios.</p>
        </div>

        <strong>{rows.length}</strong>
      </div>

      <div className="fund-tools">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ieškoti pagal fondo pavadinimą"
        />

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="value">Pagal dabartinę vertę</option>
          <option value="invested">Pagal investuotą sumą</option>
          <option value="profit">Pagal pelną</option>
          <option value="return">Pagal grąžą</option>
        </select>
      </div>

      <div className="fund-table-wrap">
        <table className="fund-table">
          <thead>
            <tr>
              <th>Fondas</th>
              <th>Vienetai</th>
              <th>Kaina</th>
              <th>Investuota</th>
              <th>Vertė</th>
              <th>Pelnas</th>
              <th>Grąža</th>
              <th>Statusas</th>
              <th />
            </tr>
          </thead>

          <tbody>
            {rows.map((item) => {
              const route = `/platforms/${platformSlug}/projects/${encodeURIComponent(
                item.id || item.slug,
              )}`;

              return (
                <tr key={item.id}>
                  <td className="fund-name-cell">
                    <Link to={route}>
                      <strong>{item.name}</strong>
                      <span>{item.ticker}</span>
                    </Link>
                  </td>

                  <td>{quantity(item.quantity)}</td>
                  <td>{money(item.price)}</td>
                  <td>{money(item.invested)}</td>
                  <td className="fund-value-cell">{money(item.currentValue)}</td>
                  <td className={num(item.profit) >= 0 ? "positive" : "negative"}>
                    {money(item.profit)}
                  </td>
                  <td className={num(item.returnRate) >= 0 ? "positive" : "negative"}>
                    {item.returnRate == null ? "—" : percent(item.returnRate)}
                  </td>
                  <td><ActiveBadge /></td>
                  <td>
                    <Link className="fund-open" to={route}>
                      Atidaryti →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function FundsPlatformProfile({ data }) {
  const platform = data.platform || {};
  const summary = data.summary || {};
  const investments = Array.isArray(data.investments)
    ? data.investments
    : [];

  const active = investments.filter(
    (item) => item.status === "active",
  );

  const biggest =
    investments.find(
      (item) =>
        item.id === data.largestInvestment?.id ||
        item.ticker === data.largestInvestment?.ticker,
    ) ||
    [...active].sort(
      (a, b) => num(b.currentValue) - num(a.currentValue),
    )[0];

  const totalValue = active.reduce(
    (sum, item) => sum + num(item.currentValue),
    0,
  );

  return (
    <main className="fund-page">
      <Link className="fund-back" to="/portfolio">
        ← Grįžti į portfelį
      </Link>

      <section className="fund-hero">
        <div>
          <span className="fund-eyebrow">AKTYVAUS INVESTICINIŲ FONDŲ PORTFELIO PROFILIS</span>
          <h1>{platform.name}</h1>

          <div className="fund-badges">
            <ActiveBadge />
            <span>{platform.category}</span>
            <span>Nuo {formatDate(platform.startDate)}</span>
          </div>

          <div className="fund-hero-summary">
            <strong>{summary.activeInvestments || active.length} aktyvūs fondai</strong>
            <span>•</span>
            <strong>{money(summary.invested)} investuota</strong>
            <span>•</span>
            <strong>{money(summary.currentValue)} dabartinė vertė</strong>
          </div>
        </div>

        <div className="fund-hero-value">
          <span>DABARTINĖ VERTĖ</span>
          <strong>{money(summary.currentValue)}</strong>
          <small>Atnaujinta {formatDate(platform.updatedAt)}</small>
        </div>
      </section>

      <section className="fund-metrics">
        <article>
          <span>Investuota</span>
          <strong>{money(summary.invested)}</strong>
          <small>Grynoji suma {money(summary.netInvested)}</small>
        </article>

        <article>
          <span>Dabartinė vertė</span>
          <strong>{money(summary.currentValue)}</strong>
          <small>Aktyvus portfelis</small>
        </article>

        <article>
          <span>Pelnas</span>
          <strong className={num(summary.profit) >= 0 ? "positive" : "negative"}>
            {money(summary.profit)}
          </strong>
          <small>Grąža {percent(summary.returnRate)}</small>
        </article>

        <article>
          <span>Aktyvūs fondai</span>
          <strong>{summary.activeInvestments || active.length}</strong>
          <small>Parduotų nėra</small>
        </article>

        <article>
          <span>Portfelio grąža</span>
          <strong className={num(summary.returnRate) >= 0 ? "positive" : "negative"}>
            {percent(summary.returnRate)}
          </strong>
          <small>Nuo veiklos pradžios</small>
        </article>

        <article>
          <span>Mokesčiai</span>
          <strong>{money(summary.fees)}</strong>
          <small>Viso</small>
        </article>
      </section>

      <section className="fund-card fund-chart">
        <div className="fund-card-heading">
          <div>
            <span>PORTFELIO ISTORIJA</span>
            <h2>Vertė ir investuotas kapitalas</h2>
          </div>
        </div>

        <PerformanceChart history={data.chartHistory || []} />
      </section>

      <section className="fund-feature-grid">
        <FundDistribution holdings={data.distributions?.holdings || []} />

        <article className="fund-card">
          <div className="fund-card-heading">
            <div>
              <span>DIDŽIAUSIA POZICIJA</span>
              <h2>{biggest?.name || "—"}</h2>
            </div>

            <strong>{money(biggest?.currentValue)}</strong>
          </div>

          {biggest && (
            <>
              <div className="fund-badges">
                <ActiveBadge />
                <span>{biggest.ticker}</span>
              </div>

              <div className="fund-details">
                <div>
                  <span>Investuota</span>
                  <strong>{money(biggest.invested)}</strong>
                </div>

                <div>
                  <span>Dabartinė vertė</span>
                  <strong>{money(biggest.currentValue)}</strong>
                </div>

                <div>
                  <span>Pelnas</span>
                  <strong>{money(biggest.profit)}</strong>
                </div>

                <div>
                  <span>Grąža</span>
                  <strong>{percent(biggest.returnRate)}</strong>
                </div>

                <div>
                  <span>Vienetai</span>
                  <strong>{quantity(biggest.quantity)}</strong>
                </div>

                <div>
                  <span>Portfelio dalis</span>
                  <strong>
                    {percent(
                      totalValue > 0
                        ? (num(biggest.currentValue) / totalValue) * 100
                        : 0,
                    )}
                  </strong>
                </div>
              </div>

              <Link
                className="fund-primary-button"
                to={`/platforms/${platform.slug}/projects/${encodeURIComponent(
                  biggest.id || biggest.slug,
                )}`}
              >
                Atidaryti fondą →
              </Link>
            </>
          )}
        </article>
      </section>

      <FundTable
        investments={investments}
        platformSlug={platform.slug}
      />
    </main>
  );
}
