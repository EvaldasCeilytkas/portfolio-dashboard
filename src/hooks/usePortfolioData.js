import { useEffect, useMemo, useState } from "react";
import { usePortfolioOwner } from "../context/PortfolioContext";

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toISOString().slice(0, 10);
}

function normalizeHistory(source) {
  const rows = Array.isArray(source)
    ? source
    : Array.isArray(source?.history)
      ? source.history
      : Array.isArray(source?.data)
        ? source.data
        : [];

  return rows
    .map((item) => {
      const invested = toNumber(
        item?.invested ??
          item?.contributed ??
          item?.contributions ??
          item?.capital,
      );

      const value = toNumber(
        item?.value ??
          item?.currentValue ??
          item?.portfolioValue ??
          item?.balance,
      );

      const profit = toNumber(item?.profit, value - invested);

      const returnRate = toNumber(
        item?.returnRate ??
          item?.return ??
          item?.roi,
        invested > 0 ? (profit / invested) * 100 : 0,
      );

      return {
        date: normalizeDate(
          item?.date ??
            item?.month ??
            item?.period,
        ),
        invested,
        value,
        profit,
        returnRate,
        monthlyContribution: toNumber(
          item?.monthlyContribution ??
            item?.contribution ??
            item?.cashFlow,
        ),
        monthlyResult: toNumber(
          item?.monthlyResult ??
            item?.monthlyProfit ??
            item?.result,
        ),
      };
    })
    .filter((item) => item.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getLastItem(items) {
  return items.length > 0 ? items[items.length - 1] : null;
}

function createAllocationItem(key, label, item, totalValue) {
  const value = toNumber(item?.value);
  const invested = toNumber(item?.invested);
  const profit = toNumber(item?.profit, value - invested);

  return {
    key,
    label,
    value,
    invested,
    profit,
    share: totalValue > 0 ? (value / totalValue) * 100 : 0,
    activeCount: 0,
    archivedCount: 0,
  };
}

async function fetchJson(path, signal) {
  const response = await fetch(path, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `${path.split("/").pop()} nepavyko įkelti (${response.status}).`,
    );
  }

  return response.json();
}

export default function usePortfolioData() {
  const { ownerId, dataPath } = usePortfolioOwner();
  const [historyFiles, setHistoryFiles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboardData() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          portfolioHistory,
          fundsHistory,
          p2pHistory,
        ] = await Promise.all([
          fetchJson(dataPath("portfolio_history.json"), controller.signal),
          fetchJson(dataPath("funds_history.json"), controller.signal),
          fetchJson(dataPath("p2p_history.json"), controller.signal),
        ]);

        if (!controller.signal.aborted) {
          setHistoryFiles({
            portfolioHistory,
            fundsHistory,
            p2pHistory,
          });
        }
      } catch (error) {
        if (
          !controller.signal.aborted &&
          error?.name !== "AbortError"
        ) {
          setErrorMessage(
            error?.message ??
              "Nepavyko įkelti istorinių portfelio duomenų.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => controller.abort();
  }, [ownerId, dataPath]);

  const dashboard = useMemo(() => {
    if (!historyFiles) return null;

    const history = normalizeHistory(
      historyFiles.portfolioHistory,
    );
    const fundsHistory = normalizeHistory(
      historyFiles.fundsHistory,
    );
    const p2pHistory = normalizeHistory(
      historyFiles.p2pHistory,
    );

    const latest = getLastItem(history);

    if (!latest) {
      return null;
    }

    const latestFunds = getLastItem(fundsHistory);
    const latestP2p = getLastItem(p2pHistory);

    const currentValue = latest.value;
    const invested = latest.invested;
    const profit = latest.profit;
    const returnRate = latest.returnRate;

    const allocation = [
      createAllocationItem(
        "funds",
        "Fondai ir brokeriai",
        latestFunds,
        currentValue,
      ),
      createAllocationItem(
        "p2p",
        "P2P ir NT finansavimas",
        latestP2p,
        currentValue,
      ),
    ]
      .filter((item) => item.value > 0 || item.invested > 0)
      .sort((a, b) => b.value - a.value);

    return {
      currency: "EUR",
      generatedAt: latest.date,

      currentValue,
      invested,
      profit,
      returnRate,

      // Šių rodiklių istorinis Excel šiuo metu nepateikia.
      // Jie sąmoningai nėra skaičiuojami iš platformų JSON.
      cash: 0,
      passiveIncome: 0,
      xirr: null,
      activePlatformCount: 0,
      archivedPlatformCount: 0,

      history,
      allocation,
      topPlatforms: [],

      largestPlatform: null,
      largestAssetClass: allocation[0] ?? null,

      latestMonthlyContribution:
        latest.monthlyContribution,
      latestMonthlyResult:
        latest.monthlyResult,
    };
  }, [historyFiles]);

  return {
    portfolio: historyFiles,
    dashboard,
    loading,
    errorMessage,
  };
}
