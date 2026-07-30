import { useEffect, useMemo, useState } from "react";
import {
  getAssetClass, getAssetClassLabel, getPlatformInvested, getPlatformName,
  getPlatformValue, isPlatformActive, toNumber,
} from "../utils/portfolioFormatters";

function normalizeHistory(history, currentValue, invested) {
  const rows = Array.isArray(history)
    ? history.map((item) => ({
        date: item?.date ?? item?.month ?? item?.period ?? "",
        value: toNumber(item?.value ?? item?.currentValue ?? item?.portfolioValue ?? item?.balance),
        invested: toNumber(item?.invested ?? item?.investedAmount ?? item?.capital),
        profit: toNumber(item?.profit),
      })).filter((item) => item.date).sort((a, b) => String(a.date).localeCompare(String(b.date)))
    : [];

  if (!rows.length) return rows;
  const result = [...rows];
  const last = result.length - 1;
  result[last] = { ...result[last], value: currentValue, invested, profit: currentValue - invested };
  return result;
}

function buildAllocation(platforms, currentValue) {
  const groups = new Map();
  platforms.forEach((platform) => {
    const label = getAssetClassLabel(getAssetClass(platform));
    const active = isPlatformActive(platform);
    const current = groups.get(label) ?? {
      key: label.toLocaleLowerCase("lt-LT").replaceAll(" ", "-"),
      label, value: 0, activeCount: 0, archivedCount: 0,
    };
    if (active) {
      current.value += getPlatformValue(platform);
      current.activeCount += 1;
    } else {
      current.archivedCount += 1;
    }
    groups.set(label, current);
  });

  return [...groups.values()].map((group) => ({
    ...group,
    share: currentValue > 0 ? (group.value / currentValue) * 100 : 0,
  })).filter((group) => group.value > 0 || group.activeCount > 0 || group.archivedCount > 0)
    .sort((a, b) => b.value - a.value);
}

export default function usePortfolioData() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/portfolio.json`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`portfolio.json nepavyko įkelti (${response.status}).`);
        return response.json();
      })
      .then(setPortfolio)
      .catch((error) => {
        if (error?.name !== "AbortError") setErrorMessage(error?.message ?? "Nepavyko įkelti duomenų.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  const dashboard = useMemo(() => {
    if (!portfolio) return null;
    const platforms = Array.isArray(portfolio.platforms) ? portfolio.platforms : [];
    const summary = portfolio.summary && typeof portfolio.summary === "object" ? portfolio.summary : {};
    const activePlatforms = platforms.filter(isPlatformActive);
    const archivedPlatforms = platforms.filter((item) => !isPlatformActive(item));
    const currentValue = toNumber(summary.currentValue ?? summary.portfolioValue ?? portfolio.portfolioValue,
      activePlatforms.reduce((sum, item) => sum + getPlatformValue(item), 0));
    const invested = toNumber(summary.invested ?? portfolio.invested,
      activePlatforms.reduce((sum, item) => sum + getPlatformInvested(item), 0));
    const profit = toNumber(summary.profit ?? portfolio.profit, currentValue - invested);
    const returnRate = toNumber(summary.returnRate ?? portfolio.returnRate, invested > 0 ? (profit / invested) * 100 : 0);
    const cash = toNumber(summary.cash ?? summary.availableCash ?? summary.freeCash ?? portfolio.cash);
    const passiveIncome = toNumber(summary.passiveIncome ?? summary.income ?? portfolio.passiveIncome);
    const xirr = toNumber(summary.xirr ?? portfolio.xirr);
    const allocation = buildAllocation(platforms, currentValue);
    const topPlatforms = activePlatforms.map((platform) => {
      const value = getPlatformValue(platform);
      return {
        name: getPlatformName(platform), slug: platform?.slug ?? "",
        category: getAssetClassLabel(getAssetClass(platform)), value,
        share: currentValue > 0 ? (value / currentValue) * 100 : 0,
        logoUrl: platform?.logoUrl ?? platform?.logo ?? "",
      };
    }).sort((a, b) => b.value - a.value).slice(0, 6);

    return {
      currency: portfolio.currency ?? "EUR",
      generatedAt: portfolio.generatedAt ?? summary.updatedAt ?? portfolio.updatedAt ?? "",
      currentValue, invested, profit, returnRate, cash, passiveIncome, xirr,
      activePlatformCount: activePlatforms.length,
      archivedPlatformCount: archivedPlatforms.length,
      allocation, topPlatforms,
      largestPlatform: topPlatforms[0] ?? null,
      largestAssetClass: allocation.filter((item) => item.activeCount > 0).sort((a, b) => b.value - a.value)[0] ?? null,
      history: normalizeHistory(portfolio.history, currentValue, invested),
    };
  }, [portfolio]);

  return { portfolio, dashboard, loading, errorMessage };
}
