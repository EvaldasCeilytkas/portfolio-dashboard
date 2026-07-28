import { Fragment, useMemo, useState } from "react";

import { number } from "../../utils/analyticsHelpers.js";
import {
  formatMonth,
  monthKey,
} from "../../utils/dateUtils.js";

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
}

function formatPercentage(value, showSign = false) {
  const numericValue = number(value);
  const prefix =
    showSign && numericValue > 0
      ? "+"
      : "";

  return `${prefix}${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function getRows(platform) {
  return Array.isArray(platform?.analytics?.monthlyPerformance)
    ? platform.analytics.monthlyPerformance.filter((row) => row?.date)
    : [];
}

function MonthlyPlatformProfit({ platforms = [] }) {
  const availableMonths = useMemo(() => {
    return [
      ...new Set(
        platforms.flatMap((platform) =>
          getRows(platform)
            .map((row) => monthKey(row.date))
            .filter(Boolean),
        ),
      ),
    ].sort((a, b) => b.localeCompare(a));
  }, [platforms]);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [mode, setMode] = useState("profit");

  const activeMonth =
    selectedMonth && availableMonths.includes(selectedMonth)
      ? selectedMonth
      : availableMonths[0] || "";

  const groupedData = useMemo(() => {
    const rows = platforms
      .map((platform) => {
        const matchingRows = getRows(platform).filter(
          (item) => monthKey(item.date) === activeMonth,
        );

        const profit = matchingRows.reduce(
          (sum, item) => sum + number(item.monthlyProfit),
          0,
        );

        const weighted = matchingRows.reduce(
          (result, item) => {
            const weight = Math.max(number(item.previousValue), 0);

            return {
              value:
                result.value +
                number(item.monthlyReturn) * weight,
              weight: result.weight + weight,
            };
          },
          { value: 0, weight: 0 },
        );

        const fallbackReturn = matchingRows.reduce(
          (sum, item) => sum + number(item.monthlyReturn),
          0,
        );

        const returnRate =
          weighted.weight > 0
            ? weighted.value / weighted.weight
            : fallbackReturn;

        return {
          name: platform.name,
          logoUrl: platform.logoUrl,
          active: Boolean(platform.active),
          profit,
          returnRate,
        };
      })
      .filter((item) => item.profit !== 0 || item.returnRate !== 0);

    const sortRows = (items) =>
      [...items].sort((a, b) =>
        mode === "profit"
          ? b.profit - a.profit
          : b.returnRate - a.returnRate,
      );

    return {
      active: sortRows(rows.filter((item) => item.active)),
      inactive: sortRows(rows.filter((item) => !item.active)),
      all: rows,
    };
  }, [platforms, activeMonth, mode]);

  const maxValue = Math.max(
    1,
    ...groupedData.all.map((item) =>
      Math.abs(mode === "profit" ? item.profit : item.returnRate),
    ),
  );

  function renderRows(rows, label) {
    if (!rows.length) return null;

    return (
      <Fragment key={label}>
        <div className="analytics-comparison-group-title">{label}</div>

        {rows.map((item) => {
          const value =
            mode === "profit" ? item.profit : item.returnRate;

          const width = Math.max(
            1.5,
            (Math.abs(value) / maxValue) * 100,
          );

          const formattedValue =
            mode === "profit"
              ? formatCurrency(value)
              : formatPercentage(value);

          return (
            <div className="analytics-diverging-row" key={item.name}>
              <div className="analytics-horizontal-name">
                {item.logoUrl ? (
                  <img src={item.logoUrl} alt="" />
                ) : (
                  <span>{item.name?.[0] || "?"}</span>
                )}

                <strong>{item.name}</strong>
              </div>

              <div className="analytics-diverging-plot">
                <div className="analytics-diverging-value-slot negative">
                  {value < 0 ? (
                    <span>
                      <b>{formattedValue}</b>
                      <small>
                        {mode === "profit"
                          ? formatPercentage(item.returnRate, true)
                          : formatCurrency(item.profit)}
                      </small>
                    </span>
                  ) : null}
                </div>

                <div className="analytics-diverging-half negative">
                  {value < 0 ? (
                    <div
                      className="analytics-diverging-bar negative"
                      style={{ width: `${width}%` }}
                    />
                  ) : null}
                </div>

                <span className="analytics-diverging-center" />

                <div className="analytics-diverging-half positive">
                  {value >= 0 ? (
                    <div
                      className="analytics-diverging-bar positive"
                      style={{ width: `${width}%` }}
                    />
                  ) : null}
                </div>

                <div className="analytics-diverging-value-slot positive">
                  {value >= 0 ? (
                    <span>
                      <b>{formattedValue}</b>
                      <small>
                        {mode === "profit"
                          ? formatPercentage(item.returnRate, true)
                          : formatCurrency(item.profit)}
                      </small>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </Fragment>
    );
  }

  const hasData =
    groupedData.active.length > 0 || groupedData.inactive.length > 0;

  return (
    <article className="analytics-card">
      <header className="analytics-card-header analytics-card-header-controls">
        <div>
          <p>PLATFORM MONTHLY COMPARISON</p>
          <h2>Platformų mėnesinis palyginimas</h2>
          <span>
            Pasirinkto mėnesio pelnas arba grąža pagal platformą.
          </span>
        </div>

        <div className="analytics-control-group">
          <select
            value={activeMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonth(`${month}-15`)}
              </option>
            ))}
          </select>

          <div className="analytics-mode-switch">
            <button
              type="button"
              className={mode === "profit" ? "is-active" : ""}
              onClick={() => setMode("profit")}
            >
              Pelnas €
            </button>

            <button
              type="button"
              className={mode === "return" ? "is-active" : ""}
              onClick={() => setMode("return")}
            >
              Grąža %
            </button>
          </div>
        </div>
      </header>

      {hasData ? (
        <div className="analytics-diverging-chart">
          {renderRows(groupedData.active, "Aktyvios platformos")}
          {renderRows(groupedData.inactive, "Istorinės platformos")}
        </div>
      ) : (
        <div className="analytics-empty">
          Pasirinktam mėnesiui platformų rezultatų nėra.
        </div>
      )}
    </article>
  );
}

export default MonthlyPlatformProfit;
