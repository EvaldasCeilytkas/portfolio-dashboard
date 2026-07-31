import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PerformanceChart from "../charts/PerformanceChart";
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

function StatusBadge({ status }) {
  const active = status === "active";
  return (
    <span
      className={`broker-status ${
        active ? "broker-status-active" : "broker-status-completed"
      }`}
    >
      {active ? "Aktyvi" : "Parduota"}
    </span>
  );
}

function HoldingsCard({ holdings = [] }) {
  return (
    <article className="broker-card broker-holdings-card">
      <div className="broker-card-heading">
        <div>
          <span>PORTFELIO SUDĖTIS</span>
          <h2>Aktyvios ETF pozicijos</h2>
        </div>
      </div>

      <div className="broker-holdings-list">
        {holdings.map((holding) => (
          <div className="broker-holding-row" key={holding.key}>
            <div className="broker-holding-meta">
              <div>
                <strong>{holding.label}</strong>
                <span>{holding.name}</span>
              </div>
              <div>
                <strong>{money(holding.value)}</strong>
                <span>{percent(holding.weight)}</span>
              </div>
            </div>
            <div className="broker-track">
              <i style={{ width: `${Math.max(2, number(holding.weight))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function StatusCard({ rows = [], total = 0 }) {
  return (
    <article className="broker-card">
      <div className="broker-card-heading">
        <div>
          <span>PORTFELIO BŪSENA</span>
          <h2>Aktyvios ir parduotos</h2>
        </div>
      </div>

      <div className="broker-status-summary">
        {rows.map((row) => {
          const share = total > 0 ? (number(row.value) / total) * 100 : 0;
          return (
            <div key={row.key}>
              <div>
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </div>
              <small>
                {row.key === "completed" ? "Realizuota" : "Dabartinė vertė"}{" "}
                {money(row.value)} · {percent(share)}
              </small>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function InvestmentTable({ investments, platformSlug, platformName }) {
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("value");

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return [...investments]
      .filter((item) => {
        if (filter !== "all" && item.status !== filter) return false;
        if (!search) return true;

        return [item.ticker, item.name, item.fullName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(search));
      })
      .sort((a, b) => {
        if (sort === "profit") return number(b.profit) - number(a.profit);
        if (sort === "return") {
          return number(b.returnRate) - number(a.returnRate);
        }
        if (sort === "invested") {
          return number(b.invested) - number(a.invested);
        }
        return number(b.currentValue) - number(a.currentValue);
      });
  }, [investments, filter, query, sort]);

  return (
    <section className="broker-table-card">
      <div className="broker-table-title">
        <div>
          <span>ETF PORTFELIS</span>
          <h2>{platformName} pozicijos</h2>
          <p>Aktyvios ir parduotos ETF pozicijos pateikiamos atskirai.</p>
        </div>
        <strong>{filtered.length}</strong>
      </div>

      <div className="broker-tools">
        <div className="broker-tabs">
          <button
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            Aktyvios
          </button>
          <button
            className={filter === "completed" ? "active" : ""}
            onClick={() => setFilter("completed")}
          >
            Parduotos
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Visos
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ieškoti pagal ETF arba tickerį"
        />

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="value">Pagal dabartinę vertę</option>
          <option value="invested">Pagal investuotą sumą</option>
          <option value="profit">Pagal pelną</option>
          <option value="return">Pagal grąžą</option>
        </select>
      </div>

      <div className="broker-table-wrap">
        <table className="broker-table">
          <thead>
            <tr>
              <th>ETF</th>
              <th>Kiekis</th>
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
            {filtered.map((item) => {
              const route = `/platforms/${platformSlug}/projects/${encodeURIComponent(
                item.id || item.slug,
              )}`;

              return (
                <tr key={item.id}>
                  <td className="broker-name-cell">
                    <Link to={route}>
                      <strong>{item.ticker}</strong>
                      <span>{item.name}</span>
                    </Link>
                  </td>
                  <td>{item.status === "active" ? quantity(item.quantity) : "—"}</td>
                  <td>{item.status === "active" ? money(item.price) : "—"}</td>
                  <td>{money(item.invested)}</td>
                  <td className="broker-value-cell">
                    {money(item.currentValue)}
                  </td>
                  <td className={number(item.profit) >= 0 ? "positive" : "negative"}>
                    {money(item.profit)}
                  </td>
                  <td className={number(item.returnRate) >= 0 ? "positive" : "negative"}>
                    {item.returnRate == null ? "—" : percent(item.returnRate)}
                  </td>
                  <td><StatusBadge status={item.status} /></td>
                  <td>
                    <Link className="broker-open" to={route}>
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

export default function BrokeragePlatformProfile({ data }) {
  const platform = data.platform || {};
  const summary = data.summary || {};
  const investments = Array.isArray(data.investments)
    ? data.investments
    : [];
  const active = investments.filter((item) => item.status === "active");
  const biggest =
    investments.find(
      (item) =>
        item.id === data.largestInvestment?.id ||
        item.ticker === data.largestInvestment?.ticker,
    ) ||
    [...active].sort(
      (a, b) => number(b.currentValue) - number(a.currentValue),
    )[0];

  const totalActiveValue = active.reduce(
    (sum, item) => sum + number(item.currentValue),
    0,
  );

  return (
    <main className="broker-page">
      <Link className="broker-back" to="/portfolio">
        ← Grįžti į portfelį
      </Link>

      <section className="broker-hero">
        <div>
          <span className="broker-eyebrow">BROKERIO IR ETF PORTFELIO PROFILIS</span>
          <h1>{platform.name}</h1>
          <div className="broker-badges">
            <StatusBadge status="active" />
            <span>{platform.category}</span>
            <span>Nuo {formatDate(platform.startDate)}</span>
          </div>
          <div className="broker-hero-summary">
            <strong>{summary.activeInvestments || 0} aktyvios</strong>
            <span>•</span>
            <strong>{summary.completedInvestments || 0} parduotos</strong>
            <span>•</span>
            <strong>{summary.totalInvestments || investments.length} ETF</strong>
            <span>•</span>
            <strong>{money(summary.currentValue)}</strong>
          </div>
        </div>

        <div className="broker-hero-value">
          <span>DABARTINĖ VERTĖ</span>
          <strong>{money(summary.currentValue)}</strong>
          <small>Atnaujinta {formatDate(platform.updatedAt)}</small>
          {platform.website && (
            <a href={platform.website} target="_blank" rel="noreferrer">
              Atidaryti platformą ↗
            </a>
          )}
        </div>
      </section>

      <section className="broker-metrics">
        <article>
          <span>Investuota</span>
          <strong>{money(summary.invested)}</strong>
          <small>Bendras kapitalas</small>
        </article>
        <article>
          <span>Pelnas</span>
          <strong className={number(summary.profit) >= 0 ? "positive" : "negative"}>
            {money(summary.profit)}
          </strong>
          <small>ROI {percent(summary.returnRate)}</small>
        </article>
        <article>
          <span>XIRR</span>
          <strong className="positive">{percent(summary.xirr)}</strong>
          <small>Metinė grąža</small>
        </article>
        <article>
          <span>Aktyvios pozicijos</span>
          <strong>{summary.activeInvestments || 0}</strong>
          <small>{summary.completedInvestments || 0} parduotos</small>
        </article>
        <article>
          <span>Dividendai</span>
          <strong>{money(summary.incomeReceived)}</strong>
          <small>Gautos pajamos</small>
        </article>
        <article>
          <span>Mokesčiai</span>
          <strong>{money(summary.fees)}</strong>
          <small>Pirkimo, pardavimo ir saugojimo</small>
        </article>
      </section>

      <section className="broker-card broker-chart">
        <div className="broker-card-heading">
          <div>
            <span>PORTFELIO ISTORIJA</span>
            <h2>Vertė ir investuotas kapitalas</h2>
          </div>
        </div>
        <PerformanceChart history={data.chartHistory || []} />
      </section>

      <section className="broker-distribution-grid">
        <HoldingsCard holdings={data.distributions?.holdings || []} />
        <StatusCard
          rows={data.distributions?.status || []}
          total={
            (data.distributions?.status || []).reduce(
              (sum, row) => sum + number(row.value),
              0,
            )
          }
        />
      </section>

      <section className="broker-feature-grid">
        <article className="broker-card">
          <div className="broker-card-heading">
            <div>
              <span>PORTFELIO SANTRAUKA</span>
              <h2>Pagrindiniai rodikliai</h2>
            </div>
          </div>
          <div className="broker-details">
            <div><span>Aktyvių ETF vertė</span><strong>{money(totalActiveValue)}</strong></div>
            <div><span>Visos pozicijos</span><strong>{investments.length}</strong></div>
            <div><span>Realizuotos pajamos</span><strong>{money(investments.reduce((sum, item) => sum + number(item.realizedProceeds), 0))}</strong></div>
            <div><span>Dividendai</span><strong>{money(summary.incomeReceived)}</strong></div>
            <div><span>Mokesčiai</span><strong>{money(summary.fees)}</strong></div>
            <div><span>Valiuta</span><strong>{platform.currency || "EUR"}</strong></div>
          </div>
        </article>

        <article className="broker-card">
          <div className="broker-card-heading">
            <div>
              <span>DIDŽIAUSIA POZICIJA</span>
              <h2>{biggest?.ticker || "—"}</h2>
            </div>
            <strong>{money(biggest?.currentValue)}</strong>
          </div>

          {biggest && (
            <>
              <p className="broker-largest-name">{biggest.name}</p>
              <div className="broker-badges">
                <StatusBadge status={biggest.status} />
                <span>{biggest.type}</span>
              </div>
              <div className="broker-details">
                <div><span>Investuota</span><strong>{money(biggest.invested)}</strong></div>
                <div><span>Pelnas</span><strong>{money(biggest.profit)}</strong></div>
                <div><span>Grąža</span><strong>{percent(biggest.returnRate)}</strong></div>
                <div><span>Kiekis</span><strong>{quantity(biggest.quantity)}</strong></div>
                <div><span>Kaina</span><strong>{money(biggest.price)}</strong></div>
                <div><span>Portfelio dalis</span><strong>{percent(totalActiveValue ? number(biggest.currentValue) / totalActiveValue * 100 : 0)}</strong></div>
              </div>
              <Link
                className="broker-primary-button"
                to={`/platforms/${platform.slug}/projects/${encodeURIComponent(
                  biggest.id || biggest.slug,
                )}`}
              >
                Atidaryti ETF →
              </Link>
            </>
          )}
        </article>
      </section>

      <InvestmentTable
        investments={investments}
        platformSlug={platform.slug}
        platformName={platform.name}
      />
    </main>
  );
}
