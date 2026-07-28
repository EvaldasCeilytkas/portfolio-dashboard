import { Fragment, useMemo, useState } from "react";

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

const MONTH_NAMES = [
  "Sau",
  "Vas",
  "Kov",
  "Bal",
  "Geg",
  "Bir",
  "Lie",
  "Rgp",
  "Rgs",
  "Spa",
  "Lap",
  "Gru",
];

const RANGES = [
  { value: 12, label: "12 mėn." },
  { value: 24, label: "24 mėn." },
  { value: 0, label: "Visa istorija" },
];

function shortMonth(value) {
  if (!value) return "–";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return MONTH_NAMES[date.getMonth()];
}

function yearOf(value) {
  if (!value) return "–";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "–";
  }

  return String(date.getFullYear());
}

function longMonth(value) {
  if (!value) return "–";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

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

function IncomeHeatmap({ platforms = [] }) {
  const [range, setRange] = useState(12);

  const {
    months,
    yearGroups,
    activeRows,
    inactiveRows,
    maxProfit,
  } = useMemo(() => {
    const allMonths = [
      ...new Set(
        platforms.flatMap((platform) =>
          getMonthlyRows(platform).map((item) => item.date),
        ),
      ),
    ].sort((a, b) => String(a).localeCompare(String(b)));

    const months =
      range > 0 ? allMonths.slice(-range) : allMonths;

    const allRows = platforms
      .map((platform) => {
        const monthlyMap = new Map(
          getMonthlyRows(platform).map((item) => [
            item.date,
            number(item.monthlyProfit),
          ]),
        );

        const values = months.map(
          (month) => monthlyMap.get(month) || 0,
        );

        return {
          name: platform.name,
          active: Boolean(platform.active),
          values,
          totalIncome: values.reduce(
            (sum, value) => sum + value,
            0,
          ),
        };
      })
      .filter((row) =>
        row.values.some((value) => value !== 0),
      );

    const sortByIncome = (rows) =>
      [...rows].sort(
        (a, b) => b.totalIncome - a.totalIncome,
      );

    const activeRows = sortByIncome(
      allRows.filter((row) => row.active),
    );

    const inactiveRows = sortByIncome(
      allRows.filter((row) => !row.active),
    );

    const maxProfit = Math.max(
      1,
      ...allRows.flatMap((row) =>
        row.values.map((value) => Math.abs(value)),
      ),
    );

    const yearGroups = [];

    months.forEach((month, index) => {
      const year = yearOf(month);
      const previous = yearGroups[yearGroups.length - 1];

      if (previous?.year === year) {
        previous.count += 1;
      } else {
        yearGroups.push({
          year,
          count: 1,
          start: index + 2,
        });
      }
    });

    return {
      months,
      yearGroups,
      activeRows,
      inactiveRows,
      maxProfit,
    };
  }, [platforms, range]);

  function renderRows(rows, label) {
    if (!rows.length) {
      return null;
    }

    return (
      <>
        <div
          className="analytics-heatmap-group"
          style={{
            gridColumn: `1 / span ${months.length + 1}`,
          }}
        >
          {label}
        </div>

        {rows.map((row) => (
          <Fragment key={row.name}>
            <div className="analytics-heatmap-platform">
              <span>{row.name}</span>
              <small>{formatCurrency(row.totalIncome)}</small>
            </div>

            {row.values.map((value, index) => {
              const intensity =
                Math.abs(value) / maxProfit;

              const background =
                value > 0
                  ? `rgba(74, 222, 128, ${
                      0.12 + intensity * 0.72
                    })`
                  : value < 0
                    ? `rgba(251, 113, 133, ${
                        0.12 + intensity * 0.72
                      })`
                    : "rgba(148, 163, 184, 0.08)";

              return (
                <div
                  key={`${row.name}-${months[index]}`}
                  className="analytics-heatmap-cell"
                  style={{ background }}
                >
                  {value !== 0
                    ? formatCurrency(value)
                    : "–"}

                  <span className="analytics-heatmap-tooltip">
                    <strong>{row.name}</strong>
                    <small>
                      {longMonth(months[index])}
                    </small>
                    <b>{formatCurrency(value)}</b>
                  </span>
                </div>
              );
            })}
          </Fragment>
        ))}
      </>
    );
  }

  const hasRows =
    activeRows.length > 0 || inactiveRows.length > 0;

  const minimumWidth =
    months.length > 12
      ? `${190 + months.length * 86}px`
      : "940px";

  return (
    <article className="analytics-card">
      <header className="analytics-card-header analytics-card-header-controls">
        <div>
          <p>INCOME HEATMAP</p>
          <h2>Platformų pajamų žemėlapis</h2>
          <span>
            Platformos kiekvienoje grupėje rikiuojamos pagal
            pasirinkto laikotarpio uždirbtą sumą.
          </span>
        </div>

        <div className="analytics-range-switch">
          {RANGES.map((item) => (
            <button
              key={item.label}
              type="button"
              className={
                range === item.value ? "is-active" : ""
              }
              onClick={() => setRange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {hasRows && months.length > 0 ? (
        <div className="analytics-heatmap-wrap">
          <div
            className="analytics-heatmap"
            style={{
              gridTemplateColumns: `190px repeat(${months.length}, minmax(76px, 1fr))`,
              minWidth: minimumWidth,
            }}
          >
            <div className="analytics-heatmap-corner analytics-heatmap-year-corner">
              Metai
            </div>

            {yearGroups.map((group) => (
              <div
                key={`${group.year}-${group.start}`}
                className="analytics-heatmap-year"
                style={{
                  gridColumn: `${group.start} / span ${group.count}`,
                }}
              >
                {group.year}
              </div>
            ))}

            <div className="analytics-heatmap-corner">
              Platforma
            </div>

            {months.map((month) => (
              <div
                className="analytics-heatmap-month"
                key={month}
              >
                {shortMonth(month)}
              </div>
            ))}

            {renderRows(
              activeRows,
              "Aktyvios platformos",
            )}

            {renderRows(
              inactiveRows,
              "Istorinės platformos",
            )}
          </div>
        </div>
      ) : (
        <div className="analytics-empty">
          Heatmap duomenų pasirinktai sričiai nėra.
        </div>
      )}
    </article>
  );
}

export default IncomeHeatmap;