import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import "../../styles/P2PLoanTable.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatPercentage(value, digits = 2) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0)} %`;
}

function formatDate(value) {
  if (!value) return "—";

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsedDate);
}

function normalizeStatus(value, delayDays = 0) {
  const status = String(value || "")
    .trim()
    .toLocaleLowerCase("lt-LT");

  if (
    [
      "repaid",
      "completed",
      "finished",
      "closed",
      "fully repaid",
      "užbaigta",
      "grąžinta",
      "grazinta",
    ].includes(status)
  ) {
    return "completed";
  }

  if (
    Number(delayDays) > 0 ||
    [
      "delayed",
      "late",
      "overdue",
      "vėluoja",
      "veluoja",
      "pradelsta",
    ].includes(status)
  ) {
    return "late";
  }

  return "active";
}

const STATUS_LABELS = {
  active: "Aktyvus",
  late: "Vėluoja",
  completed: "Užbaigtas",
};

const FILTERS = [
  { key: "active", label: "Aktyvūs" },
  { key: "late", label: "Vėluojantys" },
  { key: "completed", label: "Užbaigti" },
  { key: "all", label: "Visi" },
];

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];

  if (currentPage > 4) {
    pages.push("left-ellipsis");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (currentPage < totalPages - 3) {
    pages.push("right-ellipsis");
  }

  pages.push(totalPages);

  return pages;
}

function getProjectIdentifier(project) {
  return (
    project?.slug ??
    project?.loanCode ??
    project?.code ??
    project?.id ??
    ""
  );
}

export default function RealEstateProjectTable({
  projects,
  platformName = "Platformos",
}) {
  const items = Array.isArray(projects) ? projects : [];
  const { slug: routeSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState("active");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const pathParts = String(location.pathname || "")
    .split("/")
    .filter(Boolean);

  const platformsIndex = pathParts.indexOf("platforms");
  const pathSlug =
    platformsIndex >= 0 ? pathParts[platformsIndex + 1] : "";

  const slug = routeSlug || pathSlug;

  const preparedItems = useMemo(
    () =>
      items.map((project) => ({
        ...project,
        _status: normalizeStatus(
          project?.status,
          project?.delayDays,
        ),
        _identifier: getProjectIdentifier(project),
      })),
    [items],
  );

  const counts = useMemo(
    () => ({
      active: preparedItems.filter(
        (project) => project._status === "active",
      ).length,
      late: preparedItems.filter(
        (project) => project._status === "late",
      ).length,
      completed: preparedItems.filter(
        (project) => project._status === "completed",
      ).length,
      all: preparedItems.length,
    }),
    [preparedItems],
  );

  const filteredItems = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("lt-LT");

    return preparedItems.filter((project) => {
      const matchesStatus =
        statusFilter === "all" ||
        project._status === statusFilter;

      const searchableText = [
        project?.loanCode,
        project?.code,
        project?.name,
        project?.borrower,
        project?.originator,
        project?.country,
        project?.rating,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("lt-LT");

      return (
        matchesStatus &&
        (!query || searchableText.includes(query))
      );
    });
  }, [preparedItems, search, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / pageSize),
  );

  const safeCurrentPage = Math.min(
    currentPage,
    totalPages,
  );

  const visibleItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, pageSize, safeCurrentPage]);

  const pageNumbers = getPageNumbers(
    safeCurrentPage,
    totalPages,
  );

  const firstVisible = filteredItems.length
    ? (safeCurrentPage - 1) * pageSize + 1
    : 0;

  const lastVisible = Math.min(
    safeCurrentPage * pageSize,
    filteredItems.length,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, search, pageSize]);

  function openProject(project) {
    if (!slug) return;

    const identifier = project?._identifier;

    if (!identifier) return;

    navigate(
      `/platforms/${slug}/loan/${encodeURIComponent(
        identifier,
      )}`,
    );
  }

  return (
    <section className="p2p-loans-card">
      <div className="p2p-module-header">
        <div>
          <p>NT PROJEKTŲ PORTFELIS</p>
          <h2>{platformName} projektai</h2>
          <span>
            Aktyvūs, vėluojantys ir užbaigti NT projektai
            pateikiami atskirai.
          </span>
        </div>

        <strong>{items.length}</strong>
      </div>

      {items.length > 0 ? (
        <>
          <div className="p2p-loan-controls">
            <div
              className="p2p-loan-tabs"
              role="tablist"
              aria-label="Projektų statusas"
            >
              {FILTERS.map((filter) => {
                const active =
                  statusFilter === filter.key;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={
                      active
                        ? "p2p-loan-tab active"
                        : "p2p-loan-tab"
                    }
                    onClick={() =>
                      setStatusFilter(filter.key)
                    }
                  >
                    <span>{filter.label}</span>
                    <b>{counts[filter.key]}</b>
                  </button>
                );
              })}
            </div>

            <div className="p2p-loan-tools">
              <label className="p2p-loan-search">
                <span className="sr-only">
                  Ieškoti projekto
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Ieškoti kodo, projekto ar reitingo..."
                />
              </label>

              <label className="p2p-page-size">
                <span>Rodyti</span>
                <select
                  value={pageSize}
                  onChange={(event) =>
                    setPageSize(
                      Number(event.target.value),
                    )
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <>
              <div className="p2p-loan-table-wrap">
                <table className="p2p-loan-table">
                  <thead>
                    <tr>
                      <th>Projektas</th>
                      <th>Reitingas</th>
                      <th>LTV</th>
                      <th>Palūkanos</th>
                      <th>Investuota</th>
                      <th>Likutis</th>
                      <th>Pabaiga</th>
                      <th>Statusas</th>
                      <th aria-label="Veiksmas" />
                    </tr>
                  </thead>

                  <tbody>
                    {visibleItems.map((project) => (
                      <tr
                        key={`${project._identifier}-${project.id}`}
                        className="p2p-loan-row"
                        tabIndex={0}
                        role="link"
                        onClick={() =>
                          openProject(project)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            openProject(project);
                          }
                        }}
                      >
                        <td>
                          <strong>
                            {project.loanCode ||
                              project.code ||
                              project._identifier}
                          </strong>
                          <span>
                            {project.name || "NT projektas"}
                          </span>
                        </td>

                        <td>
                          {project.rating || "—"}
                        </td>

                        <td className="p2p-number">
                          {formatPercentage(project.ltv, 0)}
                        </td>

                        <td className="p2p-number p2p-positive">
                          {formatPercentage(
                            project.interestRate,
                          )}
                        </td>

                        <td className="p2p-number">
                          {formatCurrency(
                            project.invested,
                          )}
                        </td>

                        <td className="p2p-number">
                          {formatCurrency(
                            project.outstanding,
                          )}
                        </td>

                        <td>
                          {formatDate(
                            project.plannedRepayment,
                          )}
                        </td>

                        <td>
                          <span
                            className={`p2p-status ${project._status}`}
                          >
                            <i />
                            {STATUS_LABELS[
                              project._status
                            ]}
                            {project._status === "late" &&
                            Number(project.delayDays) > 0
                              ? ` ${project.delayDays} d.`
                              : ""}
                          </span>
                        </td>

                        <td className="p2p-loan-action">
                          <span>Atidaryti</span>
                          <b aria-hidden="true">→</b>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p2p-pagination">
                <span className="p2p-pagination-summary">
                  Rodoma {firstVisible}–{lastVisible} iš{" "}
                  {filteredItems.length}
                </span>

                {totalPages > 1 && (
                  <div className="p2p-pagination-buttons">
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1),
                        )
                      }
                    >
                      ← <span>Ankstesnis</span>
                    </button>

                    {pageNumbers.map((page) => {
                      if (
                        page === "left-ellipsis" ||
                        page === "right-ellipsis"
                      ) {
                        return (
                          <span
                            key={page}
                            className="p2p-page-ellipsis"
                          >
                            …
                          </span>
                        );
                      }

                      return (
                        <button
                          key={page}
                          type="button"
                          aria-current={
                            safeCurrentPage === page
                              ? "page"
                              : undefined
                          }
                          className={
                            safeCurrentPage === page
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setCurrentPage(page)
                          }
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={
                        safeCurrentPage === totalPages
                      }
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.min(
                            totalPages,
                            page + 1,
                          ),
                        )
                      }
                    >
                      <span>Kitas</span> →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p2p-empty p2p-filter-empty">
              Pagal pasirinktą statusą arba paiešką
              projektų nerasta.
            </div>
          )}
        </>
      ) : (
        <div className="p2p-empty">
          Projektų duomenų nėra.
        </div>
      )}
    </section>
  );
}
