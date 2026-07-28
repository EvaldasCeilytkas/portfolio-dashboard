import { useEffect, useMemo, useState } from "react";
import "../../styles/realestateprofile.css";

const money = new Intl.NumberFormat("lt-LT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

const value = new Intl.NumberFormat("lt-LT", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const STATUS = {
  active: "Aktyvi",
  delayed: "Vėluoja",
  repaid: "Grąžinta",
};

function SummaryCard({ label, amount, note, positive = false }) {
  return (
    <article className="re-summary-card">
      <span>{label}</span>
      <strong className={positive ? "positive" : ""}>{amount}</strong>
      <small>{note}</small>
    </article>
  );
}

function HealthItem({ label, amount, warning = false }) {
  return (
    <div className={`re-health-item ${warning ? "warning" : ""}`}>
      <strong>{amount}</strong>
      <span>{label}</span>
    </div>
  );
}

function RatingAllocation({ items }) {
  const total = items.reduce((sum, item) => sum + Number(item.value || 0), 0);

  return (
    <section className="re-panel">
      <div className="re-panel-heading">
        <div>
          <span className="re-kicker">PORTFELIO STRUKTŪRA</span>
          <h2>Reitingų paskirstymas</h2>
        </div>
      </div>

      <div className="re-rating-list">
        {items.map((item) => {
          const percent = total ? (item.value / total) * 100 : 0;
          return (
            <div className="re-rating-row" key={item.name}>
              <span className={`re-rating rating-${item.name.toLowerCase()}`}>
                {item.name}
              </span>
              <div className="re-rating-content">
                <div>
                  <strong>{money.format(item.value)}</strong>
                  <small>{value.format(percent)} %</small>
                </div>
                <div className="re-track">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PortfolioHealth({ summary }) {
  return (
    <section className="re-panel re-health-panel">
      <div className="re-panel-heading">
        <div>
          <span className="re-kicker">PORTFELIO BŪKLĖ</span>
          <h2>Portfolio Health</h2>
        </div>
      </div>

      <div className="re-health-grid">
        <HealthItem label="Aktyvios paskolos" amount={summary.activeLoans} />
        <HealthItem label="Grąžintos paskolos" amount={summary.repaidLoans} />
        <HealthItem
          label="Vėluojančios paskolos"
          amount={summary.delayedLoans}
          warning={summary.delayedLoans > 0}
        />
        <HealthItem
          label="Vid. palūkanos"
          amount={`${value.format(summary.averageInterest)} %`}
        />
        <HealthItem
          label="Vid. LTV"
          amount={`${value.format(summary.averageLtv)} %`}
        />
        <HealthItem
          label="Vid. terminas"
          amount={`${value.format(summary.averageDuration)} mėn.`}
        />
      </div>
    </section>
  );
}

function ProjectTable({ loans }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState({ key: "investmentDate", direction: "desc" });
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const result = loans.filter((loan) => {
      const text = `${loan.name} ${loan.loanCode} ${loan.rating}`.toLowerCase();
      const matchesQuery = text.includes(query.trim().toLowerCase());
      const matchesStatus = status === "all" || loan.status === status;
      return matchesQuery && matchesStatus;
    });

    return [...result].sort((a, b) => {
      const left = a[sort.key] ?? "";
      const right = b[sort.key] ?? "";
      const order = left === right ? 0 : left > right ? 1 : -1;
      return sort.direction === "asc" ? order : -order;
    });
  }, [loans, query, status, sort]);

  const visible = expanded ? filtered : filtered.slice(0, 8);

  function setSorting(key) {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  }

  return (
    <section className="re-panel re-projects-panel">
      <div className="re-panel-heading re-projects-heading">
        <div>
          <span className="re-kicker">PASKOLŲ PORTFELIS</span>
          <h2>Projektai</h2>
          <p>{filtered.length} projektai pagal pasirinktus filtrus</p>
        </div>

        <div className="re-project-tools">
          <input
            type="search"
            placeholder="Ieškoti projekto..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Visi statusai</option>
            <option value="active">Aktyvios</option>
            <option value="delayed">Vėluojančios</option>
            <option value="repaid">Grąžintos</option>
          </select>
        </div>
      </div>

      <div className="re-table-wrap">
        <table className="re-project-table">
          <thead>
            <tr>
              <th onClick={() => setSorting("name")}>Projektas</th>
              <th onClick={() => setSorting("rating")}>Reitingas</th>
              <th onClick={() => setSorting("ltv")}>LTV</th>
              <th onClick={() => setSorting("interestRate")}>Palūkanos</th>
              <th onClick={() => setSorting("invested")}>Investuota</th>
              <th onClick={() => setSorting("outstanding")}>Likutis</th>
              <th onClick={() => setSorting("plannedRepayment")}>Pabaiga</th>
              <th onClick={() => setSorting("status")}>Statusas</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((loan) => (
              <tr key={loan.id}>
                <td>
                  <div className="re-project-name">
                    <strong>{loan.name}</strong>
                    <small>
                      {loan.loanCode || `#${loan.id}`} · {loan.durationMonths} mėn.
                    </small>
                  </div>
                </td>
                <td>
                  <span className={`re-rating rating-${loan.rating.toLowerCase()}`}>
                    {loan.rating}
                  </span>
                </td>
                <td>{value.format(loan.ltv)} %</td>
                <td>{value.format(loan.interestRate)} %</td>
                <td>{money.format(loan.invested)}</td>
                <td>{money.format(loan.outstanding)}</td>
                <td>{loan.actualRepayment || loan.plannedRepayment || "—"}</td>
                <td>
                  <span className={`re-status re-status-${loan.status}`}>
                    {STATUS[loan.status]}
                    {loan.status === "delayed" && loan.delayedDays > 0
                      ? ` · ${loan.delayedDays} d.`
                      : ""}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > 8 && (
        <button
          type="button"
          className="re-show-button"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Rodyti trumpiau" : `Rodyti visas (${filtered.length})`}
        </button>
      )}
    </section>
  );
}

export default function RealEstateProfile({ dataUrl }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    fetch(dataUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Nepavyko įkelti Crowdpear duomenų.");
        }
        return response.json();
      })
      .then((result) => mounted && setData(result))
      .catch((requestError) => mounted && setError(requestError.message));

    return () => {
      mounted = false;
    };
  }, [dataUrl]);

  if (error) return <div className="re-state re-state-error">{error}</div>;
  if (!data) return <div className="re-state">Kraunami Crowdpear duomenys...</div>;

  const { platform, summary, ratingAllocation, loans } = data;

  return (
    <main className="re-profile">
      <header className="re-hero">
        <div className="re-hero-main">
          <div className="re-brand-row">
            <div className="re-logo">C</div>
            <div>
              <span className="re-kicker">PLATFORM PROFILE</span>
              <h1>{platform.name}</h1>
              <p>
                {platform.type}
                <span className="re-platform-status">● Aktyvi platforma</span>
              </p>
            </div>
          </div>
        </div>

        <div className="re-hero-value">
          <span>Dabartinė vertė</span>
          <strong>{money.format(summary.portfolioValue)}</strong>
          <small className="positive">
            +{money.format(summary.profit)} · +{value.format(summary.roi)} %
          </small>
          <a href={platform.website} target="_blank" rel="noreferrer">
            Atidaryti svetainę ↗
          </a>
        </div>
      </header>

      <section className="re-summary-grid">
        <SummaryCard
          label="Investuota"
          amount={money.format(summary.invested)}
          note="Bendra investuota suma"
        />
        <SummaryCard
          label="Pelnas"
          amount={`+${money.format(summary.profit)}`}
          note="Vertė minus įnešta"
          positive
        />
        <SummaryCard
          label="Grąža"
          amount={`+${value.format(summary.roi)} %`}
          note="Bendra platformos grąža"
          positive
        />
        <SummaryCard
          label="XIRR"
          amount={`${value.format(summary.xirr)} %`}
          note="Metinė svertinė grąža"
          positive
        />
      </section>

      <section className="re-insight-grid">
        <article>
          <span>AKTYVIOS PASKOLOS</span>
          <strong>{summary.activeLoans}</strong>
          <small>Dabar generuoja pajamas</small>
        </article>
        <article>
          <span>GRĄŽINTOS PASKOLOS</span>
          <strong>{summary.repaidLoans}</strong>
          <small>Pilnai užbaigti projektai</small>
        </article>
        <article className={summary.delayedLoans ? "warning" : ""}>
          <span>VĖLUOJANČIOS</span>
          <strong>{summary.delayedLoans}</strong>
          <small>Projektai su vėlavimu</small>
        </article>
        <article>
          <span>GRYNIEJI</span>
          <strong>{money.format(summary.cash)}</strong>
          <small>Laisvos lėšos platformoje</small>
        </article>
      </section>

      <PortfolioHealth summary={summary} />

      <section className="re-two-columns">
        <RatingAllocation items={ratingAllocation} />

        <section className="re-panel">
          <div className="re-panel-heading">
            <div>
              <span className="re-kicker">PINIGŲ SRAUTAI</span>
              <h2>Portfelio suvestinė</h2>
            </div>
          </div>
          <div className="re-cash-list">
            <div><span>Įnešta</span><strong>{money.format(summary.deposited)}</strong></div>
            <div><span>Investuota</span><strong>{money.format(summary.invested)}</strong></div>
            <div><span>Grąžinta paskolos</span><strong>{money.format(summary.repaidPrincipal)}</strong></div>
            <div><span>Gauta palūkanų</span><strong className="positive">{money.format(summary.interestReceived)}</strong></div>
            <div><span>Negrąžintas likutis</span><strong>{money.format(summary.outstandingPrincipal)}</strong></div>
            <div className="re-cash-total"><span>Dabartinė vertė</span><strong>{money.format(summary.portfolioValue)}</strong></div>
          </div>
        </section>
      </section>

      <ProjectTable loans={loans} />
    </main>
  );
}
