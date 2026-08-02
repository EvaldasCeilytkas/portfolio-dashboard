import { useEffect, useMemo, useState } from "react";
import usePortfolioData from "./usePortfolioData";
import { usePortfolioOwner } from "../context/PortfolioContext";

async function fetchOptional(path, signal) {
  try {
    const response = await fetch(path, { cache: "no-store", signal });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return null;
  }
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthLabel(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? dateValue
    : new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "long" }).format(date);
}

function yearOf(dateValue) {
  return String(dateValue || "").slice(0, 4);
}

function calculatePeriod(rows) {
  if (!rows?.length) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  const valueChange = number(last.value) - number(first.value);
  const investedChange = number(last.invested) - number(first.invested);
  const profitChange = number(last.profit) - number(first.profit);
  const startValue = number(first.value);
  return {
    first,
    last,
    valueChange,
    investedChange,
    profitChange,
    changeRate: startValue > 0 ? (valueChange / startValue) * 100 : 0,
  };
}

function createFamilyPortfolio(evaldas, rima) {
  const platforms = [...(evaldas?.platforms || []), ...(rima?.platforms || []).map((item) => ({ ...item, id: `rima-${item.id}`, name: `${item.name} · Rima` }))];
  return { platforms };
}

export default function useReportData() {
  const { dashboard, loading: dashboardLoading, errorMessage } = usePortfolioData();
  const { ownerId, dataPath } = usePortfolioOwner();
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setPortfolioLoading(true);
      try {
        if (ownerId === "family") {
          const [evaldas, rima] = await Promise.all([
            fetchOptional(`${import.meta.env.BASE_URL}data/portfolio.json`, controller.signal),
            fetchOptional(`${import.meta.env.BASE_URL}data/rima/portfolio.json`, controller.signal),
          ]);
          if (!controller.signal.aborted) setPortfolioFile(createFamilyPortfolio(evaldas, rima));
        } else {
          const data = await fetchOptional(dataPath("portfolio.json"), controller.signal);
          if (!controller.signal.aborted) setPortfolioFile(data);
        }
      } finally {
        if (!controller.signal.aborted) setPortfolioLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [ownerId, dataPath]);

  const report = useMemo(() => {
    if (!dashboard) return null;
    const history = dashboard.history || [];
    const latest = history.at(-1);
    const previous = history.at(-2) || latest;
    const monthly = calculatePeriod([previous, latest].filter(Boolean));
    const latestYear = yearOf(latest?.date);
    const yearlyRows = history.filter((row) => yearOf(row.date) === latestYear);
    const yearly = calculatePeriod(yearlyRows);
    const years = [...new Set(history.map((row) => yearOf(row.date)).filter(Boolean))].sort().reverse();
    const platforms = (portfolioFile?.platforms || []).map((platform) => ({
      id: platform.id || platform.slug || platform.name,
      name: platform.name || platform.id,
      value: number(platform.summary?.currentValue ?? platform.currentValue),
      invested: number(platform.summary?.invested ?? platform.invested),
      profit: number(platform.summary?.profit ?? platform.profit),
      roi: number(platform.summary?.returnRate ?? platform.returnRate),
      delayed: number(platform.summary?.delayedInvestments),
      active: number(platform.summary?.activeInvestments),
      group: platform.group || platform.type || "other",
    })).sort((a, b) => b.value - a.value);

    const best = [...platforms].filter((item) => item.invested > 0).sort((a, b) => b.roi - a.roi)[0] || null;
    const weakest = [...platforms].filter((item) => item.invested > 0).sort((a, b) => a.roi - b.roi)[0] || null;
    const delayedTotal = platforms.reduce((sum, item) => sum + item.delayed, 0);

    return {
      ...dashboard,
      latest,
      previous,
      latestYear,
      years,
      monthly,
      yearly,
      yearlyRows,
      platforms,
      best,
      weakest,
      delayedTotal,
      monthLabel: monthLabel(latest?.date),
    };
  }, [dashboard, portfolioFile]);

  return { report, loading: dashboardLoading || portfolioLoading, errorMessage };
}
