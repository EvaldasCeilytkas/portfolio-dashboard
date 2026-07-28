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

  return Math.sqrt(
    values.reduce(
      (sum, value) => sum + Math.pow(value - average, 2),
      0,
    ) / values.length,
  );
}

function PortfolioSummary({ analysis, platforms = [] }) {
  const insights = useMemo(() => {
    const monthly = Array.isArray(analysis?.monthlyPerformance)
      ? analysis.monthlyPerformance
      : [];

    const positiveMonths = monthly.filter(
      (item) => number(item.profit) > 0,
    ).length;

    const bestMonth =
      [...monthly].sort(
        (a, b) => number(b.profit) - number(a.profit),
      )[0] || null;

    const worstMonth =
      [...monthly].sort(
        (a, b) => number(a.profit) - number(b.profit),
      )[0] || null;

    const platformTotals = platforms
      .map((platform) => ({
        name: platform.name,
        income: getMonthlyRows(platform).reduce(
          (sum, row) => sum + number(row.monthlyProfit),
          0,
        ),
        deviation: standardDeviation(
          getMonthlyRows(platform).map((row) =>
            number(row.monthlyProfit),
          ),
        ),
        months: getMonthlyRows(platform).length,
      }))
      .filter((item) => item.months > 0);

    const topPlatform =
      [...platformTotals].sort((a, b) => b.income - a.income)[0] || null;

    const stablePlatform =
      [...platformTotals]
        .filter((item) => item.months >= 3)
        .sort((a, b) => a.deviation - b.deviation)[0] || null;

    return {
      monthsCount: monthly.length,
      positiveMonths,
      bestMonth,
      worstMonth,
      topPlatform,
      stablePlatform,
    };
  }, [analysis, platforms]);

  return (
    <article className="analytics-card analytics-portfolio-summary">
      <header className="analytics-card-header">
        <div>
          <p>PORTFOLIO SUMMARY</p>
          <h2>Portfelio santrauka</h2>
          <span>
            Automatiškai suformuotos svarbiausios išvados pagal pasirinktą
            analizės sritį.
          </span>
        </div>
      </header>

      <div className="analytics-summary-insights">
        <div>
          <span>✓</span>
          <p>
            Teigiami buvo{" "}
            <strong>
              {insights.positiveMonths} iš {insights.monthsCount}
            </strong>{" "}
            apskaičiuotų mėnesių.
          </p>
        </div>

        <div>
          <span>✓</span>
          <p>
            Geriausias mėnuo –{" "}
            <strong>{formatMonth(insights.bestMonth?.date)}</strong>, pelnas{" "}
            <strong>{formatCurrency(insights.bestMonth?.profit)}</strong>.
          </p>
        </div>

        <div>
          <span>!</span>
          <p>
            Didžiausias nuostolis –{" "}
            <strong>{formatMonth(insights.worstMonth?.date)}</strong>, rezultatas{" "}
            <strong>{formatCurrency(insights.worstMonth?.profit)}</strong>.
          </p>
        </div>

        <div>
          <span>✓</span>
          <p>
            Daugiausiai pajamų sugeneravo{" "}
            <strong>{insights.topPlatform?.name || "–"}</strong> –{" "}
            <strong>{formatCurrency(insights.topPlatform?.income)}</strong>.
          </p>
        </div>

        <div>
          <span>✓</span>
          <p>
            Stabiliausias rezultatas priklauso platformai{" "}
            <strong>{insights.stablePlatform?.name || "–"}</strong>.
          </p>
        </div>
      </div>
    </article>
  );
}

export default PortfolioSummary;