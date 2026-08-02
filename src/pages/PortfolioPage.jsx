import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePortfolioOwner } from "../context/PortfolioContext";
import AllocationChart from "../components/AllocationChart";
import PortfolioChart from "../components/PortfolioChart";

import {
  loadPortfolioPlatforms,
  loadPortfolioHistory,
  PORTFOLIO_GROUP_LABELS,
  PORTFOLIO_GROUP_ORDER,
} from "../services/portfolioService";

import "../styles/portfolio.css";

const STATUS_FILTERS = [
  { value: "active", label: "Aktyvios" },
  { value: "inactive", label: "Užbaigtos" },
  { value: "all", label: "Visos" },
];

const SORT_OPTIONS = [
  { value: "value-desc", label: "Vertė: didžiausia" },
  { value: "value-asc", label: "Vertė: mažiausia" },
  { value: "profit-desc", label: "Pelnas: didžiausias" },
  { value: "return-desc", label: "Grąža: didžiausia" },
  { value: "name-asc", label: "Pavadinimas: A–Ž" },
];

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value, signed = false) {
  const numericValue = number(value);
  const prefix = signed && numericValue > 0 ? "+" : "";

  return `${prefix}${new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)}`;
}

function formatPercent(value, signed = false) {
  const numericValue = number(value);
  const prefix = signed && numericValue > 0 ? "+" : "";

  return `${prefix}${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function comparePlatforms(first, second, sortBy) {
  switch (sortBy) {
    case "value-asc":
      return first.currentValue - second.currentValue;
    case "profit-desc":
      return second.profit - first.profit;
    case "return-desc":
      return second.returnRate - first.returnRate;
    case "name-asc":
      return first.name.localeCompare(second.name, "lt");
    case "value-desc":
    default:
      return second.currentValue - first.currentValue;
  }
}

function getGroupOrder(group) {
  const index = PORTFOLIO_GROUP_ORDER.indexOf(group);
  return index === -1 ? PORTFOLIO_GROUP_ORDER.length : index;
}

function PortfolioPage() {
  const navigate = useNavigate();
  const { ownerId, owner } = usePortfolioOwner();

  const [platforms, setPlatforms] = useState([]);
  const [portfolioHistory, setPortfolioHistory] = useState([]);
  const [historyLatest, setHistoryLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("active");
  const [groupFilter, setGroupFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("value-desc");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [loadedPlatforms, loadedHistory] = await Promise.all([
          loadPortfolioPlatforms(ownerId),
          loadPortfolioHistory(ownerId),
        ]);

        if (!cancelled) {
          setPlatforms(loadedPlatforms);
          setPortfolioHistory(loadedHistory.history);
          setHistoryLatest(loadedHistory.latest);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setErrorMessage(
            error?.message || "Nepavyko įkelti platformų JSON duomenų.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const counts = useMemo(() => {
    const active = platforms.filter((platform) => platform.isActive).length;

    return {
      active,
      inactive: platforms.length - active,
      all: platforms.length,
    };
  }, [platforms]);

  const availableGroups = useMemo(() => {
    return [...new Set(platforms.map((platform) => platform.group))]
      .filter(Boolean)
      .sort((first, second) => getGroupOrder(first) - getGroupOrder(second));
  }, [platforms]);

  const filteredPlatforms = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("lt-LT");

    return platforms
      .filter((platform) => {
        if (statusFilter === "active" && !platform.isActive) return false;
        if (statusFilter === "inactive" && platform.isActive) return false;
        if (groupFilter !== "all" && platform.group !== groupFilter) return false;

        if (!normalizedSearch) return true;

        return [
          platform.name,
          platform.category,
          PORTFOLIO_GROUP_LABELS[platform.group],
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLocaleLowerCase("lt-LT")
              .includes(normalizedSearch),
          );
      })
      .sort((first, second) => comparePlatforms(first, second, sortBy));
  }, [platforms, statusFilter, groupFilter, search, sortBy]);

  const groupedPlatforms = useMemo(() => {
    if (groupFilter !== "all") {
      return [
        {
          group: groupFilter,
          platforms: filteredPlatforms,
        },
      ];
    }

    const groups = new Map();

    filteredPlatforms.forEach((platform) => {
      if (!groups.has(platform.group)) {
        groups.set(platform.group, []);
      }

      groups.get(platform.group).push(platform);
    });

    return [...groups.entries()]
      .sort(([first], [second]) => getGroupOrder(first) - getGroupOrder(second))
      .map(([group, groupPlatforms]) => ({
        group,
        platforms: groupPlatforms,
      }));
  }, [filteredPlatforms, groupFilter]);

  const summary = useMemo(() => {
    const activePlatforms = platforms.filter((platform) => platform.isActive);

    const currentValue = activePlatforms.reduce(
      (total, platform) => total + platform.currentValue,
      0,
    );

    const invested = activePlatforms.reduce(
      (total, platform) => total + platform.invested,
      0,
    );

    const profit = activePlatforms.reduce(
      (total, platform) => total + platform.profit,
      0,
    );

    return {
      currentValue,
      invested,
      profit,
      returnRate: invested > 0 ? (profit / invested) * 100 : 0,
    };
  }, [platforms]);

  const allocation = useMemo(() => {
    const activePlatforms = platforms.filter((platform) => platform.isActive);
    const groups = new Map();

    activePlatforms.forEach((platform) => {
      const group = platform.group || "other";
      groups.set(group, (groups.get(group) || 0) + platform.currentValue);
    });

    return [...groups.entries()]
      .map(([group, value]) => ({
        name: PORTFOLIO_GROUP_LABELS[group] || group,
        value,
      }))
      .filter((item) => item.value > 0)
      .sort((first, second) => second.value - first.value);
  }, [platforms]);

  const historicalCurrentValue = number(historyLatest?.value);

  const openPlatform = (slug) => {
    navigate(`/platforms/${slug}`);
  };

  if (loading) {
    return (
      <main className="portfolio-page">
        <section className="portfolio-state">
          <div className="portfolio-loader" />
          <h2>Kraunami Portfolio duomenys</h2>
          <p>Nuskaitomi platformų JSON failai.</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="portfolio-page">
        <section className="portfolio-state portfolio-state-error">
          <h2>Nepavyko įkelti Portfolio</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portfolio-page">
      <section className="portfolio-hero">
        <div>
          <span className="portfolio-eyebrow">
            {ownerId === "rima" ? "RIMOS PORTFOLIO OVERVIEW" : "PORTFOLIO OVERVIEW"}
          </span>
          <h1>{ownerId === "rima" ? "Rimos portfelis" : "Portfelis"}</h1>
        </div>

        <div className="portfolio-hero-total">
          <span>Aktyvaus portfelio vertė</span>
          <strong>{formatCurrency(summary.currentValue)}</strong>
          <small>
            {counts.active} aktyvių platformų · {counts.inactive} užbaigtų
            platformų
          </small>
        </div>
      </section>

      <section className="portfolio-stat-grid">
        <article>
          <span>Investuota</span>
          <strong>{formatCurrency(summary.invested)}</strong>
          <small>Aktyvus investuotas kapitalas</small>
        </article>

        <article>
          <span>Pelnas</span>
          <strong
            className={
              summary.profit >= 0 ? "portfolio-positive" : "portfolio-negative"
            }
          >
            {formatCurrency(summary.profit, true)}
          </strong>
          <small>Bendras aktyvių platformų rezultatas</small>
        </article>

        <article>
          <span>Grąža</span>
          <strong
            className={
              summary.returnRate >= 0
                ? "portfolio-positive"
                : "portfolio-negative"
            }
          >
            {formatPercent(summary.returnRate, true)}
          </strong>
          <small>Pelnas nuo investuoto kapitalo</small>
        </article>

      </section>

      <section className="portfolio-visual-grid">
        <AllocationChart
          allocation={allocation}
          portfolioValue={summary.currentValue}
        />

        <PortfolioChart
          history={portfolioHistory}
          currentValue={historicalCurrentValue || summary.currentValue}
        />
      </section>

      <section className="portfolio-content">
        <header className="portfolio-content-header">
          <div>
            <span className="portfolio-section-label">PLATFORMOS</span>
            <h2>Investicijų sąrašas</h2>
            <p>
              {ownerId === "rima" ? `${owner.name} · ` : ""}
              {statusFilter === "active"
                ? `Rodomos ${filteredPlatforms.length} aktyvios platformos iš ${counts.all}`
                : statusFilter === "inactive"
                  ? `Rodomos ${filteredPlatforms.length} užbaigtos platformos iš ${counts.all}`
                  : `Rodomos visos ${filteredPlatforms.length} platformos`}
            </p>
          </div>

          <div className="portfolio-status-tabs">
            {STATUS_FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.value}
                className={statusFilter === filter.value ? "is-active" : ""}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
                <span>{counts[filter.value]}</span>
              </button>
            ))}
          </div>
        </header>

        <div className="portfolio-controls">
          <label className="portfolio-search">
            <span>Paieška</span>
            <input
              type="search"
              value={search}
              placeholder="Platforma arba kategorija..."
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <label>
            <span>Turto grupė</span>
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
            >
              <option value="all">Visos grupės</option>
              {availableGroups.map((group) => (
                <option value={group} key={group}>
                  {PORTFOLIO_GROUP_LABELS[group] || group}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Rūšiavimas</span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredPlatforms.length === 0 ? (
          <div className="portfolio-empty">
            Pagal pasirinktus filtrus platformų nerasta.
          </div>
        ) : (
          <div className="portfolio-table-wrapper">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Platforma</th>
                  <th>Statusas</th>
                  <th className="portfolio-number">Investuota</th>
                  <th className="portfolio-number">Vertė</th>
                  <th className="portfolio-number">Pelnas</th>
                  <th className="portfolio-number">Grąža</th>
                  <th className="portfolio-number">Pozicijos</th>
                  <th>Atnaujinta</th>
                  <th aria-label="Atidaryti" />
                </tr>
              </thead>

              <tbody>
                {groupedPlatforms.map(({ group, platforms: groupItems }) => (
                  <>
                    <tr className="portfolio-group-row" key={`${group}-header`}>
                      <td colSpan="9">
                        <span>{PORTFOLIO_GROUP_LABELS[group] || group}</span>
                        <b>{groupItems.length}</b>
                      </td>
                    </tr>

                    {groupItems.map((platform) => (
                      <tr
                        className="portfolio-data-row"
                        key={platform.slug}
                        tabIndex={0}
                        role="link"
                        onClick={() => openPlatform(platform.slug)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            openPlatform(platform.slug);
                          }
                        }}
                      >
                        <td>
                          <div className="portfolio-platform">
                            <div
                              className="portfolio-platform-mark"
                              style={{
                                "--brand-color": platform.brandColor,
                                "--brand-color-soft": platform.brandColorSoft,
                              }}
                            >
                              {platform.logoUrl && (
                                <img
                                  src={platform.logoUrl}
                                  alt={`${platform.name} logotipas`}
                                  loading="lazy"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                    event.currentTarget.nextElementSibling.style.display =
                                      "grid";
                                  }}
                                />
                              )}
                              <span
                                className="portfolio-platform-fallback"
                                style={{ display: platform.logoUrl ? "none" : "grid" }}
                              >
                                {platform.logoText}
                              </span>
                            </div>

                            <div>
                              <strong>{platform.name}</strong>
                              <span>{platform.category}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`portfolio-status ${
                              platform.isActive ? "is-active" : "is-inactive"
                            }`}
                          >
                            <i />
                            {platform.isActive ? "Aktyvi" : "Užbaigta"}
                          </span>
                        </td>

                        <td className="portfolio-number">
                          {formatCurrency(platform.invested)}
                        </td>

                        <td className="portfolio-number portfolio-main-value">
                          {formatCurrency(platform.currentValue)}
                        </td>

                        <td
                          className={`portfolio-number ${
                            platform.profit >= 0
                              ? "portfolio-positive"
                              : "portfolio-negative"
                          }`}
                        >
                          {formatCurrency(platform.profit, true)}
                        </td>

                        <td
                          className={`portfolio-number ${
                            platform.returnRate >= 0
                              ? "portfolio-positive"
                              : "portfolio-negative"
                          }`}
                        >
                          {formatPercent(platform.returnRate, true)}
                        </td>

                        <td className="portfolio-number">
                          {platform.isActive
                            ? platform.activeInvestments
                            : platform.completedInvestments}
                        </td>

                        <td>{formatDate(platform.updatedAt)}</td>

                        <td className="portfolio-open-cell">
                          <span className="portfolio-open-action">
                            Atidaryti <b>→</b>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default PortfolioPage;
