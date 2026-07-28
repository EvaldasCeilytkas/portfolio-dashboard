import {
  compareMonth,
  monthKey,
  normalizeMonth,
} from "./dateUtils.js";

export function number(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function getMonthlyRows(platform) {
  const rows = Array.isArray(platform?.analytics?.monthlyPerformance)
    ? platform.analytics.monthlyPerformance
    : [];

  return rows
    .filter((row) => row?.date)
    .map((row) => ({
      date: normalizeMonth(row.date),
      month: monthKey(row.date),
      profit: number(row.monthlyProfit),
      returnRate: number(row.monthlyReturn),
      previousValue: number(row.previousValue),
      invested: number(
        row.invested ??
          row.investedValue ??
          row.currentInvested ??
          row.endingInvested,
      ),
      value: number(
        row.value ??
          row.currentValue ??
          row.endingValue ??
          row.endValue,
      ),
    }))
    .filter((row) => row.month)
    .sort((a, b) => compareMonth(a.date, b.date));
}

export function mergeMonthlyHistory(rows = [], strategy = "last") {
  const monthlyMap = new Map();

  rows.forEach((row) => {
    if (!row?.date) return;

    const key = monthKey(row.date);

    if (!key) return;

    const normalized = {
      date: `${key}-01`,
      value: number(
        row.value ??
          row.currentValue ??
          row.endingValue ??
          row.endValue,
      ),
      invested: number(
        row.invested ??
          row.investedValue ??
          row.currentInvested ??
          row.endingInvested,
      ),
      profit: number(row.profit ?? row.monthlyProfit),
      returnRate: number(row.returnRate ?? row.monthlyReturn),
      previousValue: number(row.previousValue),
    };

    if (strategy === "sum") {
      const current = monthlyMap.get(key) || {
        date: normalized.date,
        value: 0,
        invested: 0,
        profit: 0,
        weightedReturn: 0,
        weight: 0,
      };

      current.value += normalized.value;
      current.invested += normalized.invested;
      current.profit += normalized.profit;
      current.weightedReturn +=
        normalized.returnRate * Math.max(normalized.previousValue, 0);
      current.weight += Math.max(normalized.previousValue, 0);

      monthlyMap.set(key, current);
      return;
    }

    monthlyMap.set(key, normalized);
  });

  return [...monthlyMap.values()]
    .map((item) => ({
      ...item,
      returnRate:
        item.weight > 0
          ? item.weightedReturn / item.weight
          : number(item.returnRate),
    }))
    .sort((a, b) => compareMonth(a.date, b.date));
}

export function buildPortfolioMonthlyPerformance(platforms = []) {
  const allRows = platforms.flatMap((platform) =>
    getMonthlyRows(platform),
  );

  return mergeMonthlyHistory(allRows, "sum").map((item) => ({
    date: item.date,
    profit: item.profit,
    returnRate: item.returnRate,
    invested: item.invested,
    value: item.value,
  }));
}

export function calculateMonthlyProfit(current, previous) {
  if (!current || !previous) return 0;

  const cashFlow =
    number(current.invested) - number(previous.invested);

  return (
    number(current.value) -
    number(previous.value) -
    cashFlow
  );
}

export function calculateMonthlyReturn(current, previous) {
  if (!current || !previous) return 0;

  const previousValue = number(previous.value);

  if (previousValue <= 0) return 0;

  return (
    calculateMonthlyProfit(current, previous) /
    previousValue *
    100
  );
}

export function buildMonthlyPerformanceFromHistory(history = []) {
  const normalizedHistory = mergeMonthlyHistory(history, "last");

  return normalizedHistory.slice(1).map((current, index) => {
    const previous = normalizedHistory[index];

    return {
      date: current.date,
      profit: calculateMonthlyProfit(current, previous),
      returnRate: calculateMonthlyReturn(current, previous),
      invested: current.invested,
      value: current.value,
    };
  });
}

export function buildFilteredHistory(
  portfolio,
  platforms = [],
  usePortfolioHistory = false,
) {
  if (usePortfolioHistory) {
    return mergeMonthlyHistory(
      Array.isArray(portfolio?.history) ? portfolio.history : [],
      "last",
    ).map((item) => ({
      date: item.date,
      value: item.value,
      invested: item.invested,
    }));
  }

  const platformHistory = platforms.flatMap((platform) => {
    const directHistory = Array.isArray(platform?.history)
      ? platform.history
      : [];

    if (directHistory.length > 0) {
      return mergeMonthlyHistory(directHistory, "last");
    }

    return getMonthlyRows(platform);
  });

  return mergeMonthlyHistory(platformHistory, "sum").map((item) => ({
    date: item.date,
    value: item.value,
    invested: item.invested,
  }));
}
