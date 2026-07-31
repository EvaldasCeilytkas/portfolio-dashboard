import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import PerformanceChart from "../charts/PerformanceChart";
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

const normalizedStatus = (claim) =>
  claim.status === "repaid" ? "completed" : claim.status || "active";

function StatusBadge({ status }) {
  const normalized = status === "repaid" ? "completed" : status;
  const label =
    normalized === "completed"
      ? "Užbaigta"
      : normalized === "delayed"
        ? "Vėluoja"
        : "Aktyvi";

  return (
    <span className={`indemo-status indemo-status-${normalized}`}>
      {label}
    </span>
  );
}

function DistributionCard({ title, rows = [], total = 0 }) {
  return (
    <article className="indemo-card indemo-distribution">
      <div className="indemo-card-heading">
        <div>
          <span>PORTFELIO SUDĖTIS</span>
          <h2>{title}</h2>
        </div>
      </div>

      <div className="indemo-distribution-list">
        {rows.map((row) => {
          const share = total > 0 ? (numeric(row.value) / total) * 100 : 0;
          return (
            <div className="indemo-distribution-row" key={row.label}>
              <div>
                <strong>{row.label}</strong>
                <span>
                  {money(row.value)} · {row.count} claim'ai · {percent(share)}
                </span>
              </div>
              <div className="indemo-track">
                <i style={{ width: `${Math.max(2, share)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function buildStatusDistribution(claims) {
  const groups = new Map([
    ["Aktyvūs", { label: "Aktyvūs", count: 0, value: 0 }],
    ["Užbaigti", { label: "Užbaigti", count: 0, value: 0 }],
    ["Vėluojantys", { label: "Vėluojantys", count: 0, value: 0 }],
  ]);

  claims.forEach((claim) => {
    const status = normalizedStatus(claim);
    const key =
      status === "completed"
        ? "Užbaigti"
        : status === "delayed"
          ? "Vėluojantys"
          : "Aktyvūs";
    const group = groups.get(key);
    group.count += 1;
    group.value += numeric(
      status === "completed" ? claim.invested : claim.outstanding,
    );
  });

  return [...groups.values()].filter((item) => item.count > 0);
}

function IndemoClaimTable({ claims, platformSlug }) {
  const [filter, setFilter] = useState("active");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("outstanding");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...claims]
      .filter((claim) => {
        const status = normalizedStatus(claim);
        if (filter === "active" && status === "completed") return false;
        if (filter === "completed" && status !== "completed") return false;
        if (!normalizedQuery) return true;

        return [claim.loanCode, claim.name]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedQuery),
          );
      })
      .sort((a, b) => {
        if (sort === "invested") {
          return numeric(b.invested) - numeric(a.invested);
        }
        if (sort === "xirr") {
          return numeric(b.xirr) - numeric(a.xirr);
        }
        return numeric(b.outstanding) - numeric(a.outstanding);
      });
  }, [claims, filter, query, sort]);

  return (
    <section className="indemo-card indemo-claims">
      <div className="indemo-card-heading indemo-table-heading">
        <div>
          <span>CLAIM PORTFELIS</span>
          <h2>Hipoteka užtikrinti reikalavimai</h2>
        </div>
        <strong>{filtered.length}</strong>
      </div>

      <div className="indemo-tools">
        <div className="indemo-tabs">
          <button
            className={filter === "active" ? "active" : ""}
            onClick={() => setFilter("active")}
          >
            Aktyvūs
          </button>
          <button
            className={filter === "completed" ? "active" : ""}
            onClick={() => setFilter("completed")}
          >
            Užbaigti
          </button>
          <button
            className={filter === "all" ? "active" : ""}
            onClick={() => setFilter("all")}
          >
            Visi
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ieškoti pagal kodą ar pavadinimą"
        />

        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="outstanding">Pagal likutį</option>
          <option value="invested">Pagal investuotą sumą</option>
          <option value="xirr">Pagal XIRR</option>
        </select>
      </div>

      <div className="indemo-table-wrap">
        <table className="indemo-table">
          <thead>
            <tr>
              <th>Claim</th>
              <th>PTV</th>
              <th>PDT</th>
              <th>Investuota</th>
              <th>Likutis</th>
              <th>XIRR</th>
              <th>Statusas</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((claim) => (
              <tr key={claim.id}>
                <td className="indemo-claim-cell">
                  <Link
                    className="indemo-claim-link"
                    to={`/platforms/${platformSlug}/projects/${encodeURIComponent(
                      claim.loanCode || claim.id,
                    )}`}
                  >
                    <strong>{claim.name || claim.loanCode}</strong>
                    <span>{claim.loanCode} · Ispanija</span>
                  </Link>
                </td>
                <td>{percent(claim.ptv, 0)}</td>
                <td>{percent(claim.pdt, 0)}</td>
                <td>{money(claim.invested)}</td>
                <td className="indemo-highlight">
                  {money(claim.outstanding)}
                </td>
                <td>{claim.xirr ? percent(claim.xirr) : "—"}</td>
                <td>
                  <StatusBadge status={normalizedStatus(claim)} />
                </td>
                <td>
                  <Link
                    className="indemo-open"
                    to={`/platforms/${platformSlug}/projects/${encodeURIComponent(
                      claim.loanCode || claim.id,
                    )}`}
                  >
                    Atidaryti →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function IndemoPlatformProfile({ data }) {
  const platform = data.platform || {};
  const summary = data.summary || {};
  const claims = Array.isArray(data.investments) ? data.investments : [];
  const activeValue = claims.reduce(
    (sum, claim) => sum + numeric(claim.outstanding),
    0,
  );
  const biggest =
    data.largestProject ||
    [...claims].sort(
      (a, b) => numeric(b.outstanding) - numeric(a.outstanding),
    )[0];

  const statusRows = buildStatusDistribution(claims);

  return (
    <main className="indemo-page">
      <Link className="indemo-back" to="/portfolio">
        ← Grįžti į portfelį
      </Link>

      <section className="indemo-hero">
        <div>
          <span className="indemo-eyebrow">CLAIM INVESTING PLATFORMOS PROFILIS</span>
          <h1>{platform.name}</h1>
          <div className="indemo-badges">
            <span className="indemo-status indemo-status-active">Aktyvi</span>
            <span>{platform.category}</span>
            <span>Nuo {formatDate(platform.startDate)}</span>
          </div>
          <div className="indemo-hero-summary">
            <strong>{summary.activeProjects || 0} aktyvių</strong>
            <span>•</span>
            <strong>{summary.completedProjects || 0} užbaigti</strong>
            <span>•</span>
            <strong>{summary.totalProjects || claims.length} claim'ai</strong>
            <span>•</span>
            <strong>{money(summary.currentValue)}</strong>
          </div>
        </div>

        <div className="indemo-hero-value">
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

      <section className="indemo-metrics">
        <article>
          <span>Investuota</span>
          <strong>{money(summary.invested)}</strong>
          <small>Istoriškai {money(summary.lifetimeInvested)}</small>
        </article>
        <article>
          <span>Pelnas</span>
          <strong className="positive">+{money(summary.profit)}</strong>
          <small>ROI {percent(summary.roi)}</small>
        </article>
        <article>
          <span>XIRR</span>
          <strong className="positive">{percent(summary.xirr)}</strong>
          <small>Metinė grąža</small>
        </article>
        <article>
          <span>Cash</span>
          <strong>{money(summary.cash)}</strong>
          <small>Laisvos lėšos</small>
        </article>
        <article>
          <span>Vidutinis PTV</span>
          <strong>{percent(summary.averagePtv, 1)}</strong>
          <small>Property-to-value</small>
        </article>
        <article>
          <span>Vidutinis PDT</span>
          <strong>{percent(summary.averagePdt, 1)}</strong>
          <small>Price-to-debt</small>
        </article>
      </section>

      <section className="indemo-card indemo-chart">
        <div className="indemo-card-heading">
          <div>
            <span>PORTFELIO ISTORIJA</span>
            <h2>Vertė ir investuotas kapitalas</h2>
          </div>
        </div>
        <PerformanceChart history={data.chartHistory || []} />
      </section>

      <section className="indemo-distribution-grid">
        <DistributionCard
          title="Pagal PTV"
          rows={data.distributions?.ptv || []}
          total={activeValue}
        />
        <DistributionCard
          title="Pagal PDT"
          rows={data.distributions?.pdt || []}
          total={activeValue}
        />
        <DistributionCard
          title="Pagal statusą"
          rows={statusRows}
          total={summary.lifetimeInvested || activeValue}
        />
      </section>

      <section className="indemo-feature-grid">
        <article className="indemo-card">
          <div className="indemo-card-heading">
            <div>
              <span>PORTFELIO SANTRAUKA</span>
              <h2>Pagrindiniai rodikliai</h2>
            </div>
          </div>
          <div className="indemo-details">
            <div><span>Negrąžintas kapitalas</span><strong>{money(summary.outstanding)}</strong></div>
            <div><span>Gautos palūkanos</span><strong>{money(summary.interestReceived)}</strong></div>
            <div><span>Bonusai</span><strong>{money(summary.bonuses)}</strong></div>
            <div><span>Grąžintas kapitalas</span><strong>{money(summary.repaidPrincipal)}</strong></div>
            <div><span>Papildomos pajamos</span><strong>{money(summary.extraReceived)}</strong></div>
            <div><span>Valiuta</span><strong>{platform.currency || "EUR"}</strong></div>
          </div>
        </article>

        <article className="indemo-card">
          <div className="indemo-card-heading">
            <div>
              <span>DIDŽIAUSIA POZICIJA</span>
              <h2>{biggest?.name || "—"}</h2>
            </div>
            <strong>{money(biggest?.outstanding)}</strong>
          </div>

          {biggest && (
            <>
              <div className="indemo-biggest-meta">
                <span>{biggest.loanCode}</span>
                <StatusBadge status={normalizedStatus(biggest)} />
              </div>
              <div className="indemo-details">
                <div><span>PTV</span><strong>{percent(biggest.ptv, 0)}</strong></div>
                <div><span>PDT</span><strong>{percent(biggest.pdt, 0)}</strong></div>
                <div><span>Investuota</span><strong>{money(biggest.invested)}</strong></div>
                <div><span>Portfelio dalis</span><strong>{percent(activeValue ? numeric(biggest.outstanding) / activeValue : 0)}</strong></div>
                <div><span>Investavimo data</span><strong>{formatDate(biggest.investmentDate)}</strong></div>
                <div><span>XIRR</span><strong>{biggest.xirr ? percent(biggest.xirr) : "—"}</strong></div>
              </div>
              <Link
                className="indemo-primary-button"
                to={`/platforms/${platform.slug}/projects/${encodeURIComponent(
                  biggest.loanCode || biggest.id,
                )}`}
              >
                Atidaryti claim →
              </Link>
            </>
          )}
        </article>
      </section>

      <IndemoClaimTable claims={claims} platformSlug={platform.slug} />
    </main>
  );
}
