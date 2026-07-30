import AllocationPanel from "../components/dashboard/AllocationPanel";
import DashboardHero from "../components/dashboard/DashboardHero";
import MetricCards from "../components/dashboard/MetricCards";
import PortfolioGrowthChart from "../components/dashboard/PortfolioGrowthChart";
import PortfolioHealth from "../components/dashboard/PortfolioHealth";
import TopPlatforms from "../components/dashboard/TopPlatforms";
import usePortfolioData from "../hooks/usePortfolioData";
import "../styles/dashboard.css";

export default function DashboardPage() {
  const { dashboard, loading, errorMessage } = usePortfolioData();
  if (loading) return <main className="dashboard-page"><section className="dashboard-state"><span className="dashboard-loader"/><h2>Kraunami portfelio duomenys...</h2></section></main>;
  if (errorMessage || !dashboard) return <main className="dashboard-page"><section className="dashboard-state dashboard-state-error"><h2>Nepavyko atidaryti Dashboard</h2><p>{errorMessage || "Portfolio duomenų nėra."}</p></section></main>;
  return (
    <main className="dashboard-page">
      <DashboardHero data={dashboard}/>
      <MetricCards data={dashboard}/>
      <section className="dashboard-primary-grid"><PortfolioGrowthChart data={dashboard}/><AllocationPanel data={dashboard}/></section>
      <section className="dashboard-secondary-grid"><TopPlatforms data={dashboard}/><PortfolioHealth data={dashboard}/></section>
    </main>
  );
}
