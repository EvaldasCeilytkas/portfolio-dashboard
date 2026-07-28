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

function formatPercentage(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value))} %`;
}

function formatMonth(value) {
  if (!value) return "–";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "long",
  }).format(date);
}

function getMonthlyRows(platform) {
  return Array.isArray(platform?.analytics?.monthlyPerformance)
    ? platform.analytics.monthlyPerformance.filter((row) => row?.date)
    : [];
}

function standardDeviation(values) {
  if (!values.length) return 0;

  const average =
    values.reduce((sum, value) => sum + value, 0) / values.length;

  const variance =
    values.reduce(
      (sum, value) => sum + Math.pow(value - average, 2),
      0,
    ) / values.length;

  return Math.sqrt(variance);
}

function AnalyticsHighlights({ platforms = [] }) {
  const highlights = useMemo(() => {
    const monthlyEntries = platforms.flatMap((platform) =>
      getMonthlyRows(platform).map((row) => ({
        platform: platform.name,
        date: row.date,
        profit: number(row.monthlyProfit),
      })),
    );

    const biggestMonth =
      [...monthlyEntries].sort((a, b) => b.profit - a.profit)[0] || null;

    const biggestLoss =
      [...monthlyEntries].sort((a, b) => a.profit - b.profit)[0] || null;

    const stablePlatforms = platforms
      .map((platform) => {
        const values = getMonthlyRows(platform)
          .map((row) => number(row.monthlyProfit))
          .filter((value) => Number.isFinite(value));

        return {
          name: platform.name,
          deviation: standardDeviation(values),
          months: values.length,
        };
      })
      .filter((item) => item.months >= 3)
      .sort((a, b) => a.deviation - b.deviation);

    const topIncome = platforms
      .map((platform) => ({
        name: platform.name,
        income: getMonthlyRows(platform).reduce(
          (sum, row) => sum + number(row.monthlyProfit),
          0,
        ),
        returnRate: number(platform.returnRate),
      }))
      .sort((a, b) => b.income - a.income)
      .slice(0, 3);

    return {
      biggestMonth,
      biggestLoss,
      stablePlatform: stablePlatforms[0] || null,
      topIncome,
    };
  }, [platforms]);

  return (
    <div className="analytics-insight-grid">
      <article className="analytics-insight-card positive">
        <span>Didžiausias mėnuo</span>
        <strong>
          {highlights.biggestMonth
            ? formatCurrency(highlights.biggestMonth.profit)
            : "–"}
        </strong>

        <div className="analytics-insight-details">
          <b>{highlights.biggestMonth?.platform || "–"}</b>
          <small>
            {highlights.biggestMonth
              ? formatMonth(highlights.biggestMonth.date)
              : "Duomenų nėra"}
          </small>
        </div>
      </article>

      <article className="analytics-insight-card negative">
        <span>Didžiausias nuostolis</span>
        <strong>
          {highlights.biggestLoss
            ? formatCurrency(highlights.biggestLoss.profit)
            : "–"}
        </strong>

        <div className="analytics-insight-details">
          <b>{highlights.biggestLoss?.platform || "–"}</b>
          <small>
            {highlights.biggestLoss
              ? formatMonth(highlights.biggestLoss.date)
              : "Duomenų nėra"}
          </small>
        </div>
      </article>

      <article className="analytics-insight-card stable">
        <span>Stabiliausias rezultatas</span>
        <strong>{highlights.stablePlatform?.name || "–"}</strong>
        <small>
          {highlights.stablePlatform
            ? `Mažiausias standartinis nuokrypis: ${formatCurrency(
                highlights.stablePlatform.deviation,
              )}`
            : "Duomenų nepakanka"}
        </small>
      </article>

      <article className="analytics-insight-card analytics-top-income-card">
        <span>TOP 3 pajamų generatoriai</span>

        <div className="analytics-top-income-list">
          {highlights.topIncome.map((item, index) => {
            const maxIncome = Math.max(
              1,
              ...highlights.topIncome.map((entry) => entry.income),
            );

            return (
              <div className="analytics-top-income-item" key={item.name}>
                <b>{["🥇", "🥈", "🥉"][index] || index + 1}</b>

                <div className="analytics-top-income-main">
                  <strong>{item.name}</strong>
                  <span className="analytics-top-income-progress">
                    <span
                      style={{
                        width: `${Math.max(
                          8,
                          (item.income / maxIncome) * 100,
                        )}%`,
                      }}
                    />
                  </span>
                </div>

                <span className="analytics-top-income-values">
                  <small>{formatCurrency(item.income)}</small>
                  <em>{formatPercentage(item.returnRate)}</em>
                </span>
              </div>
            );
          })}
        </div>
      </article>
    </div>
  );
}

export default AnalyticsHighlights;