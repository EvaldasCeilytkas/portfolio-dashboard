import { useNavigate } from "react-router-dom";

import PerformanceBar from "../components/PerformanceBar";
import PortfolioChart from "../components/PortfolioChart";
import AllocationChart from "../components/AllocationChart";
import TopHoldings from "../components/TopHoldings";

import { usePortfolio } from "../hooks/usePortfolio";
import { calculatePortfolioMetrics } from "../utils/portfolioMetrics";

function createPlatformSlug(platform) {
  if (platform?.slug) {
    return platform.slug;
  }

  const name =
    platform?.name ||
    platform?.platform ||
    platform?.title ||
    platform?.label ||
    "";

  return name
    .toString()
    .trim()
    .toLocaleLowerCase("lt-LT")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function Dashboard() {
  const navigate = useNavigate();

  const { portfolio, loading, errorMessage } = usePortfolio();

  if (loading) {
    return (
      <main className="app-content">
        <div className="dashboard-container">
          <p>Kraunami portfelio duomenys...</p>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="app-content">
        <div className="dashboard-container">
          <p>{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (!portfolio) {
    return (
      <main className="app-content">
        <div className="dashboard-container">
          <p>Portfelio duomenų nėra.</p>
        </div>
      </main>
    );
  }

  const metrics = calculatePortfolioMetrics(portfolio);

  function handleHoldingClick(holding) {
    const slug = createPlatformSlug(holding);

    if (!slug) {
      return;
    }

    navigate(`/platforms/${slug}`);
  }

  return (
    <main className="app-content">
      <div className="dashboard-container">
        <PerformanceBar metrics={metrics} />

        <div className="dashboard-charts">
          <PortfolioChart
            history={portfolio.history || []}
            currentValue={metrics.value}
          />

          <AllocationChart
            allocation={portfolio.allocation || []}
            portfolioValue={metrics.value}
          />
        </div>

        <TopHoldings
          holdings={portfolio.platforms || []}
          totalValue={portfolio.portfolioValue || metrics.value}
          onViewAll={() => navigate("/portfolio")}
          onHoldingClick={handleHoldingClick}
        />
      </div>
    </main>
  );
}

export default Dashboard;
