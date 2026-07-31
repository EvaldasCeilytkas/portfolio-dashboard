import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import "../../styles/P2PLoanTable.css";

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatPercentage(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0)} %`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

const STATUS_LABELS = {
  active: "Aktyvi",
  late: "Vėluoja",
  completed: "Užbaigta",
};

const FILTERS = [
  { key: "active", label: "Aktyvios" },
  { key: "late", label: "Vėluojančios" },
  { key: "completed", label: "Užbaigtos" },
  { key: "all", label: "Visos" },
];

function normalizeStatus(value, delayDays = 0) {
  const status = String(value || "")
    .trim()
    .toLocaleLowerCase("lt-LT");

  if (
    [
      "completed",
      "finished",
      "closed",
      "repaid",
      "fully repaid",
      "užbaigta",
      "uzbaigta",
      "grąžinta",
      "grazinta",
    ].includes(status)
  ) {
    return "completed";
  }

  if (
    Number(delayDays) > 0 ||
    [
      "late",
      "delayed",
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

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null && value !== "",
  );
}

function normalizeLoan(loan, index) {
  const id = firstDefined(
    loan?.loanCode,
    loan?.id,
    loan?.loanId,
    loan?.externalId,
    `loan-${index + 1}`,
  );

  const delayDays = Number(
    firstDefined(loan?.delayDays, loan?.lateDays, 0),
  ) || 0;

  return {
    ...loan,
    _id: String(id),
    _type: firstDefined(
      loan?.loanType,
      loan?.type,
      loan?.category,
      "P2P paskola",
    ),
    _lender: firstDefined(
      loan?.lender,
      loan?.originator,
      loan?.borrower,
      loan?.loanOriginator,
      "—",
    ),
    _country: firstDefined(
      loan?.country,
      loan?.borrowerCountry,
      loan?.originatorCountry,
      "—",
    ),
    _rate: Number(
      firstDefined(
        loan?.rate,
        loan?.interestRate,
        loan?.annualRate,
        loan?.apr,
        0,
      ),
    ) || 0,
    _invested: Number(
      firstDefined(
        loan?.invested,
        loan?.investedAmount,
        loan?.initialInvestment,
        0,
      ),
    ) || 0,
    _remaining: Number(
      firstDefined(
        loan?.outstandingPrincipal,
        loan?.remainingPrincipal,
        loan?.currentValue,
        loan?.remainingAmount,
        0,
      ),
    ) || 0,
    _endDate: firstDefined(
      loan?.plannedEndDate,
      loan?.endDate,
      loan?.maturityDate,
      loan?.actualEndDate,
      null,
    ),
    _status: normalizeStatus(loan?.status, delayDays),
  };
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1,
    );
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

function P2PLoanTable({
  loans,
  platformName = "Platformos",
}) {
  const items = Array.isArray(loans) ? loans : [];
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
    platformsIndex >= 0
      ? pathParts[platformsIndex + 1]
      : "";

  const slug = routeSlug || pathSlug;

  const preparedItems = useMemo(
    () => items.map((loan, index) => normalizeLoan(loan, index)),
    [items],
  );

  const counts = useMemo(
    () => ({
      active: preparedItems.filter(
        (loan) => loan._status === "active",
      ).length,
      late: preparedItems.filter(
        (loan) => loan._status === "late",
      ).length,
      completed: preparedItems.filter(
        (loan) => loan._status === "completed",
      ).length,
      all: preparedItems.length,
    }),
    [preparedItems],
  );

  const filteredItems = useMemo(() => {
    const query = search
      .trim()
      .toLocaleLowerCase("lt-LT");

    return preparedItems.filter((loan) => {
      const matchesStatus =
        statusFilter === "all" ||
        loan._status === statusFilter;

      const searchableText = [
        loan?._id,
        loan?.externalId,
        loan?._lender,
        loan?._country,
        loan?._type,
        loan?.trustScore,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("lt-LT");

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesStatus && matchesSearch;
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

  function openLoan(loanId) {
    if (!slug) {
      console.error(
        "Nepavyko nustatyti P2P platformos slug.",
      );
      return;
    }

    navigate(
      `/platforms/${slug}/loan/${encodeURIComponent(
        loanId,
      )}`,
    );
  }

  function selectFilter(filterKey) {
    setStatusFilter(filterKey);
  }

  return (
    <section className="p2p-loans-card">
      <div className="p2p-module-header">
        <div>
          <p>PASKOLŲ PORTFELIS</p>
          <h2>{platformName} paskolos</h2>
          <span>
            Aktyvios ir užbaigtos paskolos pateikiamos
            atskirai.
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
              aria-label="Paskolų statusas"
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
                      selectFilter(filter.key)
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
                  Ieškoti paskolos
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Ieškoti ID, skolintojo ar šalies..."
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
                      <th>Paskola</th>
                      <th>Skolintojas</th>
                      <th>Šalis</th>
                      <th>Palūkanos</th>
                      <th>Investuota</th>
                      <th>Likutis</th>
                      <th>Pabaiga</th>
                      <th>Statusas</th>
                      <th aria-label="Veiksmas" />
                    </tr>
                  </thead>

                  <tbody>
                    {visibleItems.map((loan) => (
                      <tr
                        key={loan._id}
                        className="p2p-loan-row"
                        tabIndex={0}
                        role="link"
                        onClick={() =>
                          openLoan(loan._id)
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            openLoan(loan._id);
                          }
                        }}
                      >
                        <td>
                          <strong>{loan._id}</strong>
                          <span>
                            {loan._type}
                          </span>
                        </td>

                        <td>
                          {loan._lender}
                        </td>

                        <td>{loan._country}</td>

                        <td className="p2p-number p2p-positive">
                          {formatPercentage(
                            loan._rate,
                          )}
                        </td>

                        <td className="p2p-number">
                          {formatCurrency(
                            loan._invested,
                          )}
                        </td>

                        <td className="p2p-number">
                          {formatCurrency(
                            loan._remaining,
                          )}
                        </td>

                        <td>
                          {formatDate(
                            loan._endDate,
                          )}
                        </td>

                        <td>
                          <span
                            className={`p2p-status ${loan._status}`}
                          >
                            <i />
                            {STATUS_LABELS[
                              loan._status
                            ]}
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
                  <div
                    className="p2p-pagination-buttons"
                    aria-label="Paskolų puslapiai"
                  >
                    <button
                      type="button"
                      disabled={safeCurrentPage === 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1),
                        )
                      }
                    >
                      ←
                      <span>Ankstesnis</span>
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
                      <span>Kitas</span>
                      →
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p2p-empty p2p-filter-empty">
              Pagal pasirinktą statusą arba paiešką
              paskolų nerasta.
            </div>
          )}
        </>
      ) : (
        <div className="p2p-empty">
          Paskolų duomenų nėra.
        </div>
      )}
    </section>
  );
}

export default P2PLoanTable;
