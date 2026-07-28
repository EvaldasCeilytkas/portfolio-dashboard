import { useMemo } from "react";

function number(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
}

function getRows(platform) {
  return Array.isArray(platform?.analytics?.monthlyPerformance)
    ? platform.analytics.monthlyPerformance.filter((row) => row?.date)
    : [];
}

function standardDeviation(values) {
  if (!values.length) return 0;

  const average =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  return Math.sqrt(
    values.reduce(
      (sum, value) => sum + Math.pow(value - average, 2),
      0,
    ) / values.length,
  );
}

function stabilityScore(values) {
  if (values.length < 2) return 0;

  const deviation = standardDeviation(values);
  const averageAbsolute =
    values.reduce((sum, value) => sum + Math.abs(value), 0) /
    values.length;

  if (averageAbsolute <= 0) return 0;

  return Math.max(
    0,
    Math.min(100, 100 - (deviation / averageAbsolute) * 45),
  );
}

function IncomeHistoryTable({ platforms = [] }) {
  const rows = useMemo(() => {
    return platforms
      .map((platform) => {
        const monthlyRows = getRows(platform);
        const profits = monthlyRows.map((row) =>
          number(row.monthlyProfit),
        );

        const totalIncome = profits.reduce(
          (sum, value) => sum + value,
          0,
        );

        const bestMonth =
          [...monthlyRows].sort(
            (a, b) =>
              number(b.monthlyProfit) - number(a.monthlyProfit),
          )[0] || null;

        const worstMonth =
          [...monthlyRows].sort(
            (a, b) =>
              number(a.monthlyProfit) - number(b.monthlyProfit),
          )[0] || null;

        return {
          name: platform.name,
          active: Boolean(platform.active),
          months: monthlyRows.length,
          totalIncome,
          averageIncome:
            monthlyRows.length > 0
              ? totalIncome / monthlyRows.length
              : 0,
          bestMonth: number(bestMonth?.monthlyProfit),
          worstMonth: number(worstMonth?.monthlyProfit),
          stability: stabilityScore(profits),
        };
      })
      .filter((row) => row.months > 0)
      .sort((a, b) => b.totalIncome - a.totalIncome);
  }, [platforms]);

  return (
    <article className="analytics-card">
      <header className="analytics-card-header">
        <div>
          <p>INCOME HISTORY</p>
          <h2>Pajamų istorija</h2>
          <span>
            Platformų pajamų, vidutinio mėnesio rezultato ir stabilumo
            palyginimas.
          </span>
        </div>
      </header>

      {rows.length > 0 ? (
        <div className="analytics-income-table-wrap">
          <table className="analytics-income-table">
            <thead>
              <tr>
                <th>Platforma</th>
                <th>Iš viso uždirbta</th>
                <th>Vid. / mėn.</th>
                <th>Geriausias mėnuo</th>
                <th>Blogiausias mėnuo</th>
                <th>Stabilumas</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td>
                    <strong>{row.name}</strong>
                    {!row.active ? <small>Istorinė</small> : null}
                  </td>
                  <td>{formatCurrency(row.totalIncome)}</td>
                  <td>{formatCurrency(row.averageIncome)}</td>
                  <td className="analytics-positive">
                    {formatCurrency(row.bestMonth)}
                  </td>
                  <td
                    className={
                      row.worstMonth < 0
                        ? "analytics-negative"
                        : ""
                    }
                  >
                    {formatCurrency(row.worstMonth)}
                  </td>
                  <td>
                    <div className="analytics-stability-cell">
                      <span>
                        <span
                          style={{ width: `${row.stability}%` }}
                        />
                      </span>
                      <strong>{Math.round(row.stability)} balai</strong>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="analytics-empty">
          Pajamų istorijos duomenų nėra.
        </div>
      )}
    </article>
  );
}

export default IncomeHistoryTable;