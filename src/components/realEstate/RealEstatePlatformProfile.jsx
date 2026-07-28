import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RatingBadge, StatusBadge, scoreTone } from "./RealEstateBadges";
import "../../styles/realestatev35.css";

const CHART_PERIODS = [
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "6M", label: "6M" },
  { key: "YTD", label: "YTD" },
  { key: "1Y", label: "1Y" },
  { key: "ALL", label: "All" },
];

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

const parseDate = (value) => {
  if (!value) return null;

  const normalized =
    /^\d{4}-\d{2}$/.test(String(value))
      ? `${value}-01T12:00:00`
      : `${String(value).slice(0, 10)}T12:00:00`;

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dateLabel = (value) => {
  const date = parseDate(value);
  if (!date) return value || "—";

  return new Intl.DateTimeFormat("lt-LT", {
    year: "2-digit",
    month: "short",
  }).format(date);
};

const formatStartMonth = (value) => {
  const date = parseDate(value);
  if (!date) return "—";

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "2-digit",
  })
    .format(date)
    .replace("-", ".");
};

const monthsBetween = (startValue, endValue) => {
  const start = parseDate(startValue);
  const end = parseDate(endValue) || new Date();

  if (!start) return 0;

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  return Math.max(1, months + (end.getDate() >= start.getDate() ? 1 : 0));
};

const normalizeHistory = (history) =>
  history
    .map((item, index) => {
      const date = parseDate(item?.date);

      return {
        ...item,
        _index: index,
        _date: date,
        value: number(item?.value ?? item?.currentValue),
        invested: number(
          item?.invested ??
            item?.currentInvested ??
            item?.deposited,
        ),
      };
    })
    .filter((item) => item._date)
    .sort((a, b) => a._date - b._date);

const filterHistory = (history, period) => {
  if (!history.length || period === "ALL") {
    return history;
  }

  const lastDate = history[history.length - 1]._date;
  const cutoff = new Date(lastDate);

  if (period === "YTD") {
    cutoff.setMonth(0, 1);
    cutoff.setHours(0, 0, 0, 0);
  } else {
    const months = {
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
    }[period];

    cutoff.setMonth(cutoff.getMonth() - months);
  }

  const filtered = history.filter((item) => item._date >= cutoff);

  // Kai istorija mėnesinė, paliekame bent du taškus,
  // kad 1M laikotarpyje grafiko linija išliktų matoma.
  if (filtered.length === 1 && history.length > 1) {
    const index = history.indexOf(filtered[0]);
    return history.slice(Math.max(0, index - 1), index + 1);
  }

  return filtered;
};

const projectStatus = (project) => {
  const rawStatus = String(project?.status || "")
    .trim()
    .toLocaleLowerCase("lt-LT");

  const completedStatuses = [
    "completed",
    "finished",
    "closed",
    "repaid",
    "fully repaid",
    "užbaigtas",
    "uzbaigtas",
    "grąžintas",
    "grazintas",
    "pilnai grąžintas",
    "pilnai grazintas",
  ];

  const delayedStatuses = [
    "delayed",
    "late",
    "overdue",
    "vėluoja",
    "veluoja",
    "pradelstas",
  ];

  const activeStatuses = [
    "active",
    "current",
    "ongoing",
    "aktyvus",
    "vykdomas",
  ];

  if (completedStatuses.includes(rawStatus)) {
    return "completed";
  }

  if (
    delayedStatuses.includes(rawStatus) ||
    number(project?.delayDays) > 0
  ) {
    return "delayed";
  }

  if (activeStatuses.includes(rawStatus)) {
    return "active";
  }

  const invested = number(project?.invested);
  const repaid = number(
    project?.repaid ??
      project?.returned ??
      project?.principalRepaid,
  );
  const outstandingValue = project?.outstanding;
  const hasOutstanding =
    outstandingValue !== undefined &&
    outstandingValue !== null &&
    outstandingValue !== "";

  if (
    (hasOutstanding && number(outstandingValue) <= 0) ||
    (invested > 0 && repaid >= invested)
  ) {
    return "completed";
  }

  return "active";
};

const projectName = (project) =>
  project?.name ||
  project?.title ||
  project?.projectName ||
  project?.code ||
  "Projektas";

const projectId = (project) =>
  project?.id ||
  project?.slug ||
  project?.code ||
  encodeURIComponent(projectName(project));

function MetricCard({ label, value, helper, tone = "neutral" }) {
  return (
    <article className={`re-metric re-tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper && <small>{helper}</small>}
    </article>
  );
}

function DistributionCard({ title, rows = [], tone }) {
  const max = Math.max(...rows.map((row) => number(row.value)), 1);

  return (
    <article
      className={`re-card re-distribution re-distribution-${tone}`}
    >
      <div className="re-card-heading">
        <div>
          <span>DISTRIBUTION</span>
          <h3>{title}</h3>
        </div>
      </div>

      <div className="re-distribution-list">
        {rows.map((row) => (
          <div className="re-distribution-row" key={row.label}>
            <div className="re-distribution-meta">
              <strong>{row.label}</strong>
              <span>{row.display ?? row.value}</span>
            </div>
            <div className="re-track">
              <div
                style={{
                  width: `${Math.max(
                    4,
                    (number(row.value) / max) * 100,
                  )}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HealthItem({ label, score, helper }) {
  const tone = scoreTone(score);

  return (
    <div className="re-health-item">
      <div className="re-health-label">
        <div>
          <strong>{label}</strong>
          {helper && <small>{helper}</small>}
        </div>
        <span className={`re-health-score re-score-${tone}`}>
          {Math.round(number(score))}
        </span>
      </div>
      <div className={`re-track re-score-track re-score-${tone}`}>
        <div
          style={{
            width: `${Math.max(
              2,
              Math.min(100, number(score)),
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function ProjectTable({
  title,
  subtitle,
  projects,
  platformSlug,
  completed = false,
}) {
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState("all");

  const ratings = useMemo(
    () => [
      ...new Set(
        projects.map((item) => item.rating).filter(Boolean),
      ),
    ],
    [projects],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("lt-LT");

    return projects
      .filter((project) => {
        const matchesSearch =
          !query ||
          projectName(project)
            .toLocaleLowerCase("lt-LT")
            .includes(query) ||
          String(project.code || "")
            .toLocaleLowerCase("lt-LT")
            .includes(query);

        const matchesRating =
          rating === "all" ||
          String(project.rating || "") === rating;

        return matchesSearch && matchesRating;
      })
      .sort(
        (a, b) =>
          number(b.outstanding ?? b.invested) -
          number(a.outstanding ?? a.invested),
      );
  }, [projects, rating, search]);

  return (
    <section className="re-card re-projects">
      <div className="re-projects-header">
        <div>
          <span>{completed ? "HISTORY" : "PORTFOLIO"}</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <div className="re-project-filters">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ieškoti projekto..."
          />
          <select
            value={rating}
            onChange={(event) => setRating(event.target.value)}
          >
            <option value="all">Visi reitingai</option>
            {ratings.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="re-table-wrap">
        <div className="re-table-head">
          <span>Projektas</span>
          <span>Reitingas</span>
          <span>Investuota</span>
          <span>{completed ? "Grąžinta" : "Likutis"}</span>
          <span>Palūkanos</span>
          <span>LTV</span>
          <span>Trukmė</span>
          <span>Statusas</span>
          <span />
        </div>

        {rows.map((project) => (
          <Link
            key={projectId(project)}
            className="re-table-row"
            to={`/platforms/${platformSlug}/project/${projectId(
              project,
            )}`}
          >
            <span className="re-project-name">
              <strong>{projectName(project)}</strong>
              <small>
                {project.loanCode ||
                  project.code ||
                  project.location ||
                  `${platformSlug === "profitus" ? "Profitus" : "Crowdpear"} projektas`}
              </small>
            </span>
            <span>
              <RatingBadge rating={project.rating} />
            </span>
            <span>{money(project.invested)}</span>
            <span>
              {money(
                completed
                  ? project.repaidPrincipal ?? project.repaid ?? project.invested
                  : project.outstanding,
              )}
            </span>
            <span>
              {percent(
                project.interestRate ?? project.interest,
              )}
            </span>
            <span>{percent(project.ltv, 0)}</span>
            <span>
              {number(
                project.durationMonths ?? project.duration,
              )}{" "}
              mėn.
            </span>
            <span>
              <StatusBadge status={projectStatus(project)} />
            </span>
            <span className="re-row-arrow">→</span>
          </Link>
        ))}

        {!rows.length && (
          <div className="re-empty">
            Pagal pasirinktus filtrus projektų nerasta.
          </div>
        )}
      </div>
    </section>
  );
}

export default function RealEstatePlatformProfile({ data }) {
  const [chartPeriod, setChartPeriod] = useState("ALL");

  const root = data || {};
  const platform = root.platform || root || {};
  const summary = root.summary || platform.summary || {};

  const projects = Array.isArray(root.projects)
    ? root.projects
    : Array.isArray(platform.projects)
      ? platform.projects
      : [];

  const history = Array.isArray(root.history)
    ? root.history
    : Array.isArray(platform.history)
      ? platform.history
      : [];

  const health =
    root.health ||
    root.portfolioHealth ||
    platform.health ||
    platform.portfolioHealth ||
    platform.healthParts ||
    {};

  const normalizedHistory = useMemo(
    () => normalizeHistory(history),
    [history],
  );

  const visibleHistory = useMemo(
    () => filterHistory(normalizedHistory, chartPeriod),
    [normalizedHistory, chartPeriod],
  );

  const activeProjects = projects.filter(
    (item) => projectStatus(item) !== "completed",
  );
  const completedProjects = projects.filter(
    (item) => projectStatus(item) === "completed",
  );
  const delayedProjects = activeProjects.filter(
    (item) => projectStatus(item) === "delayed",
  );

  const currentValue = number(
    summary.portfolioValue ??
      summary.currentValue ??
      root.currentValue ??
      root.value ??
      platform.currentValue ??
      platform.value,
  );
  const invested = number(
    summary.invested ??
      root.invested ??
      platform.invested,
  );
  const xirr = number(
    summary.xirr ?? root.xirr ?? platform.xirr,
  );
  const roi = number(
    summary.roi ??
      root.roi ??
      root.returnRate ??
      platform.roi ??
      platform.returnRate,
  );
  const cash = number(
    summary.cash ?? root.cash ?? platform.cash,
  );
  const interestReceived = number(
    summary.interestReceived ??
      root.interestReceived ??
      platform.interestReceived,
  );
  const healthScore = number(
    health.score ??
      root.healthScore ??
      platform.healthScore ??
      80,
  );

  const platformStartDate =
    platform.startDate ?? root.startDate ?? summary.startDate;
  const platformMonths = number(
    platform.months ??
      root.months ??
      summary.months ??
      monthsBetween(platformStartDate, platform.updatedAt),
  );
  const platformCurrency =
    platform.currency ?? root.currency ?? "EUR";

  const biggest =
    root.largestProject ||
    platform.largestProject ||
    [...projects].sort(
      (a, b) => number(b.invested) - number(a.invested),
    )[0];

  const distribution =
    root.distributions || platform.distributions || {};

  const fallbackRating = [
    ...new Set(
      projects.map((item) => item.rating).filter(Boolean),
    ),
  ].map((label) => ({
    label,
    value: projects.filter(
      (item) => item.rating === label,
    ).length,
  }));

  const rawTimeline = Array.isArray(root.repaymentTimeline)
    ? root.repaymentTimeline
    : Array.isArray(root.timeline)
      ? root.timeline
      : Array.isArray(platform.repaymentTimeline)
        ? platform.repaymentTimeline
        : Array.isArray(platform.timeline)
          ? platform.timeline
          : [];

  const timeline = rawTimeline.map((item) => ({
    ...item,
    date: item.date ?? item.month,
    projects: item.projects ?? item.count,
  }));

  const chartControlStyle = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px",
    border: "1px solid rgba(148, 163, 184, 0.14)",
    borderRadius: "14px",
    background: "rgba(2, 8, 23, 0.34)",
  };

  const chartButtonStyle = (active) => ({
    minWidth: "46px",
    height: "36px",
    padding: "0 12px",
    border: "0",
    borderRadius: "10px",
    background: active
      ? "linear-gradient(135deg, #f97316, #fb923c)"
      : "transparent",
    color: active ? "#ffffff" : "#8eabd0",
    boxShadow: active
      ? "0 8px 22px rgba(249, 115, 22, 0.24)"
      : "none",
    fontSize: "12px",
    fontWeight: 900,
    cursor: "pointer",
    transition:
      "background 0.18s ease, color 0.18s ease, transform 0.18s ease",
  });

  return (
    <main className="re-page">
      <section className="re-hero">
        <div className="re-hero-glow re-hero-glow-one" />
        <div className="re-hero-glow re-hero-glow-two" />

        <Link className="re-back-button" to="/portfolio">
          <span aria-hidden="true">←</span>
          <strong>Grįžti į portfelį</strong>
        </Link>

        <div className="re-hero-copy">
          <span className="re-eyebrow">
            REAL ESTATE PLATFORM PROFILE
          </span>
          <div className="re-brand-row">
            {platform.logoUrl && (
              <img src={platform.logoUrl} alt="" />
            )}
            <div>
              <h1>{platform.name || "Crowdpear"}</h1>
              <p>
                {platform.category ||
                  "NT sutelktinis finansavimas"}
              </p>
            </div>
          </div>

          <div className="re-hero-status">
            <StatusBadge
              status={
                platform.status ||
                (platform.active === false
                  ? "completed"
                  : "active")
              }
            />

            <span className="re-meta-badge">
              <small>Nuo</small>
              <strong>{formatStartMonth(platformStartDate)}</strong>
            </span>

            <span className="re-meta-badge">
              <small>Naudojama</small>
              <strong>{Math.round(platformMonths)} mėn.</strong>
            </span>

            <span className="re-meta-badge">
              <small>Valiuta</small>
              <strong>{platformCurrency}</strong>
            </span>
          </div>

        </div>

        <div className="re-health-orb">
          <span>Portfolio Health</span>
          <strong>{Math.round(healthScore)}</strong>
          <small>/100</small>
        </div>

        <div className="re-hero-side">
          <div className="re-hero-values">
            <div>
              <span>Dabartinė vertė</span>
              <strong>{money(currentValue)}</strong>
            </div>
            <div>
              <span>Investuota</span>
              <strong>{money(invested)}</strong>
            </div>
            <div>
              <span>ROI</span>
              <strong>{percent(roi)}</strong>
            </div>
            <div>
              <span>XIRR</span>
              <strong>{percent(xirr)}</strong>
            </div>
          </div>

          <div className="re-hero-actions">
            {platform.website && (
              <a
                className="re-website-button"
                href={platform.website}
                target="_blank"
                rel="noreferrer"
              >
                Atidaryti svetainę
                <span aria-hidden="true">↗</span>
              </a>
            )}

            <div className="re-hero-updated">
              <span>Atnaujinta</span>
              <strong>{platform.updatedAt || "pagal Excel failą"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="re-card re-performance">
        <div className="re-card-heading re-chart-heading">
          <div>
            <span>PERFORMANCE</span>
            <h2>Portfelio vertės istorija</h2>
            <p>
              Portfelio vertės ir investuoto kapitalo pokytis.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: "22px",
            }}
          >
            <div
              style={chartControlStyle}
              role="group"
              aria-label="Grafiko laikotarpis"
            >
              {CHART_PERIODS.map((item) => {
                const active = chartPeriod === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    style={chartButtonStyle(active)}
                    onClick={() =>
                      setChartPeriod(item.key)
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="re-current-value">
              <span>Dabartinė vertė</span>
              <strong>{money(currentValue)}</strong>
            </div>
          </div>
        </div>

        <div className="re-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={visibleHistory}
              margin={{
                top: 10,
                right: 16,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient
                  id="reValueFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#f97316"
                    stopOpacity={0.42}
                  />
                  <stop
                    offset="100%"
                    stopColor="#f97316"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(148,163,184,.10)"
                vertical={false}
              />

              <XAxis
                dataKey="date"
                tickFormatter={dateLabel}
                tickLine={false}
                axisLine={false}
                stroke="#607493"
                minTickGap={28}
              />

              <YAxis
                tickFormatter={(value) =>
                  `${Math.round(value)} €`
                }
                tickLine={false}
                axisLine={false}
                stroke="#607493"
                width={62}
              />

              <Tooltip
                contentStyle={{
                  background: "#0c1728",
                  border:
                    "1px solid rgba(249,115,22,.25)",
                  borderRadius: 14,
                }}
                labelFormatter={dateLabel}
                formatter={(value, name) => [
                  money(value),
                  name === "invested"
                    ? "Investuota"
                    : "Vertė",
                ]}
              />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#fb923c"
                strokeWidth={3}
                fill="url(#reValueFill)"
              />

              <Area
                type="monotone"
                dataKey="invested"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="7 7"
                fill="transparent"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="re-metrics-grid">
        <MetricCard
          label="Aktyvūs projektai"
          value={activeProjects.length}
          helper={`Aktyviame portfelyje • ${delayedProjects.length} vėluoja`}
          tone="positive"
        />
        <MetricCard
          label="Vėluoja"
          value={delayedProjects.length}
          helper="Iš aktyvių projektų"
          tone={
            delayedProjects.length
              ? "warning"
              : "positive"
          }
        />
        <MetricCard
          label="Užbaigti"
          value={completedProjects.length}
          helper="Pilnai grąžinti"
          tone="info"
        />
        <MetricCard
          label="Viso projektų"
          value={projects.length}
          helper="Visa istorija"
        />
        <MetricCard
          label="Vidutinis LTV"
          value={percent(
            platform.averageLtv ?? summary.averageLtv,
            0,
          )}
          helper="Aktyvių projektų"
        />
        <MetricCard
          label="Gautos palūkanos"
          value={money(interestReceived)}
          helper="Tik faktiškai gautos"
          tone="positive"
        />
        <MetricCard
          label="Laisvi pinigai"
          value={money(cash)}
          helper="Neinvestuotas likutis"
        />
      </section>

      <section className="re-feature-grid">
        <article className="re-card re-biggest">
          <div className="re-card-heading">
            <div>
              <span>PORTFOLIO CONCENTRATION</span>
              <h2>Didžiausias projektas</h2>
            </div>
          </div>

          {biggest ? (
            <>
              <div className="re-biggest-title">
                <div>
                  <small>
                    {biggest.code ||
                      "Crowdpear projektas"}
                  </small>
                  <h3>{projectName(biggest)}</h3>
                </div>
                <RatingBadge rating={biggest.rating} />
              </div>

              <div className="re-biggest-stats">
                <div>
                  <span>Investuota</span>
                  <strong>
                    {money(biggest.invested)}
                  </strong>
                </div>
                <div>
                  <span>Portfelio dalis</span>
                  <strong>
                    {percent(
                      invested
                        ? (number(biggest.invested) /
                            invested) *
                            100
                        : 0,
                      1,
                    )}
                  </strong>
                </div>
                <div>
                  <span>LTV</span>
                  <strong>
                    {percent(biggest.ltv, 0)}
                  </strong>
                </div>
                <div>
                  <span>Palūkanos</span>
                  <strong>
                    {percent(
                      biggest.interestRate ??
                        biggest.interest,
                    )}
                  </strong>
                </div>
              </div>

              <div className="re-concentration-track">
                <div
                  style={{
                    width: `${Math.min(
                      100,
                      invested
                        ? (number(biggest.invested) /
                            invested) *
                            100
                        : 0,
                    )}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="re-empty">
              Projektų duomenų nėra.
            </div>
          )}
        </article>

        <article className="re-card re-health-card">
          <div className="re-card-heading">
            <div>
              <span>RISK PROFILE</span>
              <h2>Portfolio Health</h2>
            </div>
            <div
              className={`re-health-total re-score-${scoreTone(
                healthScore,
              )}`}
            >
              {Math.round(healthScore)}
            </div>
          </div>

          <div className="re-health-list">
            <HealthItem
              label="Diversifikacija"
              score={health.diversification ?? 82}
            />
            <HealthItem
              label="Reitingai"
              score={health.ratings ?? health.rating ?? 76}
            />
            <HealthItem
              label="LTV"
              score={health.ltv ?? 88}
            />
            <HealthItem
              label="Vėlavimai"
              score={
                health.delays ??
                (delayedProjects.length ? 58 : 95)
              }
            />
            <HealthItem
              label="Pinigų panaudojimas"
              score={health.cash ?? 91}
            />
          </div>
        </article>
      </section>

      <section className="re-distribution-grid">
        <DistributionCard
          title="Reitingai"
          rows={
            distribution.ratings ||
            distribution.rating ||
            fallbackRating
          }
          tone="orange"
        />
        <DistributionCard
          title="LTV"
          rows={distribution.ltv || []}
          tone="blue"
        />
        <DistributionCard
          title="Palūkanos"
          rows={distribution.interest || []}
          tone="green"
        />
        <DistributionCard
          title="Trukmė"
          rows={distribution.duration || []}
          tone="violet"
        />
      </section>

      {!!timeline.length && (
        <section className="re-card re-timeline">
          <div className="re-card-heading">
            <div>
              <span>REPAYMENT FORECAST</span>
              <h2>Grąžinimų laiko juosta</h2>
              <p>
                Planuojami grąžinimai pagal mėnesius.
              </p>
            </div>
          </div>

          <div className="re-timeline-list">
            {timeline.map((item) => (
              <div
                className="re-timeline-item"
                key={`${item.date}-${item.amount}`}
              >
                <span>{item.date}</span>
                <strong>
                  {number(item.projects ?? item.count)}{" "}
                  projektai
                </strong>
                <b>{money(item.amount)}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProjectTable
        title="Aktyvūs projektai"
        subtitle="Dabartinis NT paskolų portfelis."
        projects={activeProjects}
        platformSlug={platform.slug || "crowdpear"}
      />

      {!!completedProjects.length && (
        <ProjectTable
          title="Užbaigti projektai"
          subtitle="Pilnai grąžintų investicijų istorija."
          projects={completedProjects}
          platformSlug={platform.slug || "crowdpear"}
          completed
        />
      )}
    </main>
  );
}
