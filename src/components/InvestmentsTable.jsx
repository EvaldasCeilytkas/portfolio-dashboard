import { useMemo, useState } from "react";

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatPercent(value) {
  const number = Number(value) || 0;
  const sign = number > 0 ? "+" : "";

  return `${sign}${number.toFixed(2)} %`;
}

function normalizeInvestment(item, index) {
  const platform =
    item.platform ??
    item.name ??
    item.title ??
    `Platforma ${index + 1}`;

  const type =
    item.type ??
    item.category ??
    item.group ??
    item.assetType ??
    "Kita";

  const invested = Number(
    item.invested ??
      item.investment ??
      item.investedAmount ??
      item.totalInvested ??
      0
  );

  const currentValue = Number(
    item.currentValue ??
      item.value ??
      item.portfolioValue ??
      item.balance ??
      0
  );

  const calculatedProfit = currentValue - invested;

  const profit = Number(
    item.profit ??
      item.gain ??
      item.earnings ??
      calculatedProfit
  );

  const calculatedReturn =
    invested !== 0 ? (profit / invested) * 100 : 0;

  const returnPercent = Number(
    item.returnPercent ??
      item.returnRate ??
      item.return ??
      item.percent ??
      calculatedReturn
  );

  return {
    id: `${platform}-${type}-${index}`,
    platform,
    type,
    invested,
    currentValue,
    profit,
    returnPercent,
  };
}

function InvestmentsTable({ portfolio }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("currentValue");
  const [sortDirection, setSortDirection] = useState("desc");

  const investments = useMemo(() => {
    const platforms = portfolio?.platforms ?? [];

    return platforms.map(normalizeInvestment);
  }, [portfolio]);

  const visibleInvestments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = investments.filter((investment) => {
      return (
        investment.platform.toLowerCase().includes(normalizedSearch) ||
        investment.type.toLowerCase().includes(normalizedSearch)
      );
    });

    return [...filtered].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];

      if (typeof first === "string") {
        const result = first.localeCompare(second, "lt");

        return sortDirection === "asc" ? result : -result;
      }

      return sortDirection === "asc"
        ? first - second
        : second - first;
    });
  }, [investments, search, sortKey, sortDirection]);

  function handleSort(key) {
    if (sortKey === key) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
      return;
    }

    setSortKey(key);
    setSortDirection(key === "platform" || key === "type" ? "asc" : "desc");
  }

  function getSortSymbol(key) {
    if (sortKey !== key) {
      return "↕";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  }

  function getValueClass(value) {
    if (value > 0) {
      return "positive-value";
    }

    if (value < 0) {
      return "negative-value";
    }

    return "neutral-value";
  }

  function renderSignedCurrency(value) {
    const sign = value > 0 ? "+" : "";

    return `${sign}${formatCurrency(value)}`;
  }

  return (
    <section className="investments-card">
      <div className="investments-header">
        <div>
          <p className="chart-eyebrow">Investicijų sąrašas</p>
          <h2>Portfelio pozicijos</h2>
        </div>

        <span className="investments-count">
          {visibleInvestments.length} iš {investments.length}
        </span>
      </div>

      <div className="investments-toolbar">
        <label className="investments-search">
          <span>Paieška</span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ieškoti platformos arba tipo..."
          />
        </label>
      </div>

      {visibleInvestments.length > 0 ? (
        <div className="table-wrapper">
          <table className="investments-table">
            <thead>
              <tr>
                <th>
                  <button
                    type="button"
                    className="table-sort-button"
                    onClick={() => handleSort("platform")}
                  >
                    Platforma
                    <span>{getSortSymbol("platform")}</span>
                  </button>
                </th>

                <th>
                  <button
                    type="button"
                    className="table-sort-button"
                    onClick={() => handleSort("type")}
                  >
                    Tipas
                    <span>{getSortSymbol("type")}</span>
                  </button>
                </th>

                <th className="numeric-column">
                  <button
                    type="button"
                    className="table-sort-button numeric-sort"
                    onClick={() => handleSort("invested")}
                  >
                    Investuota
                    <span>{getSortSymbol("invested")}</span>
                  </button>
                </th>

                <th className="numeric-column">
                  <button
                    type="button"
                    className="table-sort-button numeric-sort"
                    onClick={() => handleSort("currentValue")}
                  >
                    Dabartinė vertė
                    <span>{getSortSymbol("currentValue")}</span>
                  </button>
                </th>

                <th className="numeric-column">
                  <button
                    type="button"
                    className="table-sort-button numeric-sort"
                    onClick={() => handleSort("profit")}
                  >
                    Pelnas
                    <span>{getSortSymbol("profit")}</span>
                  </button>
                </th>

                <th className="numeric-column">
                  <button
                    type="button"
                    className="table-sort-button numeric-sort"
                    onClick={() => handleSort("returnPercent")}
                  >
                    Grąža
                    <span>{getSortSymbol("returnPercent")}</span>
                  </button>
                </th>
              </tr>
            </thead>

            <tbody>
              {visibleInvestments.map((investment) => (
                <tr key={investment.id}>
                  <td>
                    <strong className="platform-name">
                      {investment.platform}
                    </strong>
                  </td>

                  <td>
                    <span className="investment-type">
                      {investment.type}
                    </span>
                  </td>

                  <td className="numeric-column">
                    {formatCurrency(investment.invested)}
                  </td>

                  <td className="numeric-column current-value">
                    {formatCurrency(investment.currentValue)}
                  </td>

                  <td
                    className={`numeric-column ${getValueClass(
                      investment.profit
                    )}`}
                  >
                    {renderSignedCurrency(investment.profit)}
                  </td>

                  <td
                    className={`numeric-column ${getValueClass(
                      investment.returnPercent
                    )}`}
                  >
                    {formatPercent(investment.returnPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="investments-empty">
          <strong>Pozicijų nerasta</strong>
          <span>Pakeisk paieškos tekstą ir bandyk dar kartą.</span>
        </div>
      )}
    </section>
  );
}

export default InvestmentsTable;