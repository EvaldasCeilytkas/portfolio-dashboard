import { useContext, useMemo, useState } from "react";

import { PortfolioContext } from "../context/PortfolioContext";
import AnalyticsFilters from "../components/analytics/AnalyticsFilters";
import AnalyticsSummary from "../components/analytics/AnalyticsSummary";
import PortfolioGrowthChart from "../components/analytics/PortfolioGrowthChart";
import MonthlyPlatformProfit from "../components/analytics/MonthlyPlatformProfit";
import MonthlyReturnChart from "../components/analytics/MonthlyReturnChart";
import IncomeHeatmap from "../components/analytics/IncomeHeatmap";
import AnalyticsHighlights from "../components/analytics/AnalyticsHighlights";
import PortfolioSummary from "../components/analytics/PortfolioSummary";
import IncomeHistoryTable from "../components/analytics/IncomeHistoryTable";

import {
  buildFilteredHistory,
  buildMonthlyPerformanceFromHistory,
  buildPortfolioMonthlyPerformance,
  number,
} from "../utils/analyticsHelpers.js";
import { formatFullDate } from "../utils/dateUtils.js";

import "../styles/analytics.css";

function matchesFilter(platform, filter) {
  if (filter === "all") return true;

  const assetClass = String(platform?.assetClass || "").toLowerCase();
  const category = String(platform?.category || "").toLowerCase();
  const name = String(platform?.name || "").toLowerCase();

  if (filter === "alternative") {
    return (
      ["p2p", "real_estate", "private_credit", "npl"].includes(assetClass) ||
      category.includes("p2p") ||
      category.includes("sutelkt") ||
      category.includes("npl") ||
      category.includes("verslo finans")
    );
  }

  if (filter === "market") {
    return (
      ["fund", "broker", "robo"].includes(assetClass) ||
      category.includes("fond") ||
      category.includes("akcij") ||
      category.includes("etf") ||
      category.includes("robo") ||
      [
        "seb fondai",
        "seb mikro",
        "seb robo",
        "revolut brokerage",
        "revolut robo",
        "synergy",
      ].includes(name)
    );
  }

  return true;
}

function Analytics() {
  const context = useContext(PortfolioContext);
  const portfolio = context?.portfolio;
  const loading = context?.loading;
  const errorMessage = context?.errorMessage;

  const [filter, setFilter] = useState("all");
  const [showInactive, setShowInactive] = useState(false);

  const analysis = useMemo(() => {
    if (!portfolio) return null;

    const allPlatforms = Array.isArray(portfolio.platforms)
      ? portfolio.platforms
      : [];

    const platforms = allPlatforms.filter((platform) =>
      matchesFilter(platform, filter),
    );

    const activePlatforms = platforms.filter(
      (platform) => platform?.active && number(platform?.value) > 0,
    );

    const inactivePlatforms = platforms.filter(
      (platform) => !platform?.active,
    );

    const analysisPlatforms = showInactive
      ? platforms
      : activePlatforms;

    const portfolioValue =
      filter === "all"
        ? number(portfolio.portfolioValue)
        : activePlatforms.reduce(
            (sum, platform) => sum + number(platform.value),
            0,
          );

    const invested =
      filter === "all"
        ? number(portfolio.invested)
        : activePlatforms.reduce(
            (sum, platform) => sum + number(platform.invested),
            0,
          );

    const profit =
      filter === "all"
        ? number(portfolio.profit)
        : activePlatforms.reduce(
            (sum, platform) => sum + number(platform.profit),
            0,
          );

    const returnRate =
      invested > 0 ? (profit / invested) * 100 : 0;

    const usePortfolioHistory =
      filter === "all" && showInactive;

    const monthlyPerformance = usePortfolioHistory
      ? buildMonthlyPerformanceFromHistory(portfolio.history)
      : buildPortfolioMonthlyPerformance(analysisPlatforms);

    const averageMonthlyReturn =
      monthlyPerformance.length > 0
        ? monthlyPerformance.reduce(
            (sum, item) => sum + number(item.returnRate),
            0,
          ) / monthlyPerformance.length
        : 0;

    const positiveMonths = monthlyPerformance.filter(
      (item) => number(item.returnRate) > 0,
    ).length;

    const winningRate =
      monthlyPerformance.length > 0
        ? (positiveMonths / monthlyPerformance.length) * 100
        : 0;

    const bestPlatform =
      [...activePlatforms]
        .filter((platform) => number(platform.invested) > 0)
        .sort(
          (a, b) => number(b.returnRate) - number(a.returnRate),
        )[0] || null;

    const worstPlatform =
      [...activePlatforms]
        .filter((platform) => number(platform.invested) > 0)
        .sort(
          (a, b) => number(a.returnRate) - number(b.returnRate),
        )[0] || null;

    return {
      platforms,
      activePlatforms,
      inactivePlatforms,
      analysisPlatforms,
      portfolioValue,
      invested,
      profit,
      returnRate,
      monthlyPerformance,
      averageMonthlyReturn,
      winningRate,
      bestPlatform,
      worstPlatform,
      growthHistory: buildFilteredHistory(
        portfolio,
        analysisPlatforms,
        usePortfolioHistory,
      ),
    };
  }, [portfolio, filter, showInactive]);

  if (loading) {
    return (
      <section className="analytics-page">
        <div className="analytics-state">
          Kraunami analitikos duomenys...
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="analytics-page">
        <div className="analytics-state analytics-state-error">
          Nepavyko užkrauti analitikos duomenų: {errorMessage}
        </div>
      </section>
    );
  }

  if (!analysis) {
    return (
      <section className="analytics-page">
        <div className="analytics-state">
          Analitikos duomenų nėra.
        </div>
      </section>
    );
  }

  return (
    <section className="analytics-page">
      <header className="analytics-header">
        <div>
          <p className="analytics-eyebrow">PORTFOLIO INTELLIGENCE</p>
          <h1>Analizė</h1>
          <p className="analytics-subtitle">
            Portfelio istorija, mėnesiniai rezultatai ir platformų
            palyginimai vienoje vietoje.
          </p>
        </div>

        <div className="analytics-updated">
          <span>Duomenys atnaujinti</span>
          <strong>{formatFullDate(portfolio?.updatedAt)}</strong>
        </div>
      </header>

      <AnalyticsFilters
        value={filter}
        onChange={setFilter}
        showInactive={showInactive}
        onShowInactiveChange={setShowInactive}
        inactiveCount={analysis.inactivePlatforms.length}
      />

      <AnalyticsSummary
        analysis={analysis}
        showInactive={showInactive}
      />

      <PortfolioGrowthChart
        history={analysis.growthHistory}
        invested={analysis.invested}
        portfolioValue={analysis.portfolioValue}
        returnRate={analysis.returnRate}
        xirr={number(portfolio?.xirr)}
      />

      <div className="analytics-grid-two">
        <MonthlyPlatformProfit
          platforms={analysis.analysisPlatforms}
        />

        <MonthlyReturnChart
          data={analysis.monthlyPerformance}
        />
      </div>

      <IncomeHeatmap
        platforms={analysis.analysisPlatforms}
      />

      <IncomeHistoryTable
        platforms={analysis.analysisPlatforms}
      />

      <AnalyticsHighlights
        analysis={analysis}
        platforms={analysis.analysisPlatforms}
      />

      <PortfolioSummary
        analysis={analysis}
        platforms={analysis.analysisPlatforms}
      />
    </section>
  );
}

export default Analytics;
