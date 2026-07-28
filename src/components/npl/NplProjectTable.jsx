import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 %";
  }

  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("lt-LT");
}

function getProjectType(name) {
  const normalized = normalizeText(name);

  if (normalized.includes("apartment") || normalized.includes("flat")) {
    return "Butas";
  }

  if (
    normalized.includes("commercial") ||
    normalized.includes("premises") ||
    normalized.includes("office")
  ) {
    return "Komercinis";
  }

  if (normalized.includes("house") || normalized.includes("villa")) {
    return "Namas";
  }

  if (normalized.includes("land") || normalized.includes("plot")) {
    return "Žemė";
  }

  return "Kita";
}

function getRiskMeta(project) {
  const ptv = Number(project?.ptv) || 0;
  const pdt = Number(project?.pdt) || 0;
  const completed = project?.status === "completed";

  let score = 100;

  if (ptv > 70) score -= 28;
  else if (ptv > 60) score -= 18;
  else if (ptv > 50) score -= 9;

  if (pdt > 75) score -= 25;
  else if (pdt > 65) score -= 15;
  else if (pdt > 55) score -= 7;

  if (completed) score += 4;

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (score >= 85) return { score, label: "A", tone: "excellent" };
  if (score >= 70) return { score, label: "B", tone: "good" };
  if (score >= 55) return { score, label: "C", tone: "medium" };

  return { score, label: "D", tone: "watch" };
}

function getPtvTone(value) {
  const ptv = Number(value) || 0;

  if (ptv <= 50) return "excellent";
  if (ptv <= 60) return "good";
  if (ptv <= 70) return "medium";

  return "watch";
}

function getSortValue(project, sortBy) {
  if (sortBy === "invested") {
    return Number(project.invested) || 0;
  }

  if (sortBy === "remaining") {
    return Number(project.remaining) || 0;
  }

  if (sortBy === "ptv") {
    return Number(project.ptv) || 0;
  }

  if (sortBy === "pdt") {
    return Number(project.pdt) || 0;
  }

  if (sortBy === "risk") {
    return getRiskMeta(project).score;
  }

  return normalizeText(project.id);
}

function PaginationButton({ active, disabled, children, onClick, label }) {
  return (
    <button
      type="button"
      className={`npl-pagination-button ${active ? "active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function NplProjectTable({
  title,
  eyebrow,
  projects = [],
  platformSlug,
  emptyMessage,
}) {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("remaining");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const projectTypes = useMemo(() => {
    return [...new Set(projects.map((project) => getProjectType(project.name)))]
      .sort((first, second) => first.localeCompare(second, "lt"));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    const filtered = projects.filter((project) => {
      const type = getProjectType(project.name);
      const risk = getRiskMeta(project);

      const matchesSearch =
        !normalizedSearch ||
        normalizeText(project.id).includes(normalizedSearch) ||
        normalizeText(project.name).includes(normalizedSearch);

      const matchesType =
        typeFilter === "all" || type === typeFilter;

      const matchesRisk =
        riskFilter === "all" || risk.label === riskFilter;

      return matchesSearch && matchesType && matchesRisk;
    });

    return [...filtered].sort((first, second) => {
      const firstValue = getSortValue(first, sortBy);
      const secondValue = getSortValue(second, sortBy);

      if (typeof firstValue === "string") {
        const result = firstValue.localeCompare(secondValue, "lt");
        return sortDirection === "asc" ? result : -result;
      }

      const result = firstValue - secondValue;
      return sortDirection === "asc" ? result : -result;
    });
  }, [
    projects,
    riskFilter,
    search,
    sortBy,
    sortDirection,
    typeFilter,
  ]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredProjects.length / pageSize),
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, riskFilter, sortBy, sortDirection, pageSize]);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  const visibleProjects = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProjects.slice(startIndex, startIndex + pageSize);
  }, [currentPage, filteredProjects, pageSize]);

  const paginationPages = useMemo(() => {
    const pages = new Set([1, pageCount]);

    for (
      let page = Math.max(1, currentPage - 1);
      page <= Math.min(pageCount, currentPage + 1);
      page += 1
    ) {
      pages.add(page);
    }

    return [...pages].sort((first, second) => first - second);
  }, [currentPage, pageCount]);

  const firstVisible =
    filteredProjects.length > 0
      ? (currentPage - 1) * pageSize + 1
      : 0;

  const lastVisible = Math.min(
    currentPage * pageSize,
    filteredProjects.length,
  );

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setRiskFilter("all");
    setSortBy("remaining");
    setSortDirection("desc");
  };

  if (!projects.length) {
    return (
      <section className="npl-table-card">
        <div className="npl-section-heading">
          <div>
            <p>{eyebrow}</p>
            <h2>{title}</h2>
          </div>
        </div>

        <div className="npl-empty-state">{emptyMessage}</div>
      </section>
    );
  }

  return (
    <section className="npl-table-card">
      <div className="npl-section-heading">
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
          <span>
            Rodoma po {pageSize} projektų. Naudok paiešką ir filtrus.
          </span>
        </div>

        <span className="npl-count-badge">{projects.length}</span>
      </div>

      <div className="npl-table-toolbar">
        <label className="npl-table-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ieškoti pagal ID ar pavadinimą..."
            aria-label="Ieškoti projekto"
          />
        </label>

        <label className="npl-table-select">
          <span>Tipas</span>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="all">Visi tipai</option>
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="npl-table-select">
          <span>Rizika</span>
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="all">Visos klasės</option>
            <option value="A">A klasė</option>
            <option value="B">B klasė</option>
            <option value="C">C klasė</option>
            <option value="D">D klasė</option>
          </select>
        </label>

        <label className="npl-table-select">
          <span>Rūšiuoti</span>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="remaining">Pagal likutį</option>
            <option value="invested">Pagal investuotą</option>
            <option value="ptv">Pagal PTV</option>
            <option value="pdt">Pagal PDT</option>
            <option value="risk">Pagal riziką</option>
            <option value="id">Pagal ID</option>
          </select>
        </label>

        <button
          type="button"
          className="npl-sort-direction"
          onClick={() =>
            setSortDirection((current) =>
              current === "asc" ? "desc" : "asc",
            )
          }
          title={
            sortDirection === "asc"
              ? "Didėjimo tvarka"
              : "Mažėjimo tvarka"
          }
        >
          {sortDirection === "asc" ? "↑" : "↓"}
        </button>

        <label className="npl-table-select npl-page-size-select">
          <span>Rodyti</span>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {filteredProjects.length > 0 ? (
        <>
          <div className="npl-table-wrap">
            <table className="npl-project-table">
              <thead>
                <tr>
                  <th>Projektas</th>
                  <th>Tipas</th>
                  <th>Investuota</th>
                  <th>Likutis</th>
                  <th>Palūkanos</th>
                  <th>PTV</th>
                  <th>PDT</th>
                  <th>Rizika</th>
                  <th>Statusas</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {visibleProjects.map((project) => {
                  const projectId = project.id || project.slug;
                  const risk = getRiskMeta(project);

                  return (
                    <tr
                      key={projectId}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/platforms/${platformSlug}/project/${encodeURIComponent(
                            projectId,
                          )}`,
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          navigate(
                            `/platforms/${platformSlug}/project/${encodeURIComponent(
                              projectId,
                            )}`,
                          );
                        }
                      }}
                    >
                      <td>
                        <div className="npl-project-name">
                          <span>
                            {String(project.id || "?").slice(0, 4)}
                          </span>

                          <div>
                            <strong>{project.id || "—"}</strong>
                            <small>
                              {project.name || "Be pavadinimo"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>{getProjectType(project.name)}</td>
                      <td>{formatCurrency(project.invested)}</td>
                      <td>{formatCurrency(project.remaining)}</td>
                      <td className="npl-positive">
                        {formatCurrency(project.interest)}
                      </td>
                      <td>
                        <span
                          className={`npl-ptv-pill ${getPtvTone(
                            project.ptv,
                          )}`}
                        >
                          {formatPercentage(project.ptv)}
                        </span>
                      </td>
                      <td>{formatPercentage(project.pdt)}</td>
                      <td>
                        <span
                          className={`npl-risk-badge ${risk.tone}`}
                        >
                          <strong>{risk.label}</strong>
                          <small>{risk.score}</small>
                        </span>
                      </td>

                      <td>
                        <span
                          className={`npl-status ${
                            project.status === "completed"
                              ? "completed"
                              : "active"
                          }`}
                        >
                          <span />
                          {project.status === "completed"
                            ? "Užbaigtas"
                            : "Aktyvus"}
                        </span>
                      </td>

                      <td className="npl-row-arrow">→</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="npl-table-footer">
            <div className="npl-table-result-count">
              Rodoma <strong>{firstVisible}–{lastVisible}</strong> iš{" "}
              <strong>{filteredProjects.length}</strong>
              {filteredProjects.length !== projects.length && (
                <span> (iš viso {projects.length})</span>
              )}
            </div>

            {pageCount > 1 && (
              <nav
                className="npl-pagination"
                aria-label="Projektų puslapiai"
              >
                <PaginationButton
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  label="Ankstesnis puslapis"
                >
                  ←
                </PaginationButton>

                {paginationPages.map((page, index) => {
                  const previousPage = paginationPages[index - 1];
                  const showGap =
                    index > 0 && page - previousPage > 1;

                  return (
                    <span key={page} className="npl-pagination-group">
                      {showGap && (
                        <span className="npl-pagination-gap">…</span>
                      )}

                      <PaginationButton
                        active={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                        label={`${page} puslapis`}
                      >
                        {page}
                      </PaginationButton>
                    </span>
                  );
                })}

                <PaginationButton
                  disabled={currentPage === pageCount}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(pageCount, page + 1),
                    )
                  }
                  label="Kitas puslapis"
                >
                  →
                </PaginationButton>
              </nav>
            )}
          </div>
        </>
      ) : (
        <div className="npl-filter-empty-state">
          <strong>Projektų pagal pasirinktus filtrus nerasta.</strong>
          <span>Pakeisk paiešką arba išvalyk filtrus.</span>

          <button type="button" onClick={resetFilters}>
            Išvalyti filtrus
          </button>
        </div>
      )}
    </section>
  );
}

export default NplProjectTable;
