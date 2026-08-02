import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import { usePortfolioOwner } from "../context/PortfolioContext";
import AlertsPage from "../pages/AlertsPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import P2PPage from "../pages/P2PPage";
import P2PLoanProfile from "../pages/P2PLoanProfile";
import PlatformPage from "../pages/PlatformPage";
import PortfolioPage from "../pages/PortfolioPage";
import PerformancePage from "../pages/PerformancePage";
import IntelligencePage from "../pages/IntelligencePage";
import GoalsPage from "../pages/GoalsPage";
import SyncPage from "../pages/SyncPage";
import ProjectPage from "../pages/ProjectPage";

function FullAccessRoute({ children }) {
  const { isFullAccess } = usePortfolioOwner();
  return isFullAccess ? children : <Navigate to="/" replace />;
}

function PortfolioAccessRoute({ children }) {
  const { canViewPortfolio } = usePortfolioOwner();
  return canViewPortfolio ? children : <Navigate to="/" replace />;
}

function AnalyticsAccessRoute({ children }) {
  const { canViewAnalytics } = usePortfolioOwner();
  return canViewAnalytics ? children : <Navigate to="/" replace />;
}

function P2PAccessRoute({ children }) {
  const { canViewP2P } = usePortfolioOwner();
  return canViewP2P ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="portfolio" element={<PortfolioAccessRoute><PortfolioPage /></PortfolioAccessRoute>} />
        <Route path="analytics" element={<AnalyticsAccessRoute><AnalyticsPage /></AnalyticsAccessRoute>} />
        <Route path="p2p" element={<P2PAccessRoute><P2PPage /></P2PAccessRoute>} />
        <Route path="performance" element={<PerformancePage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="intelligence" element={<IntelligencePage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="platforms/:platformSlug" element={<PortfolioAccessRoute><PlatformPage /></PortfolioAccessRoute>} />
        <Route path="platforms/:slug/loan/:loanId" element={<P2PAccessRoute><P2PLoanProfile /></P2PAccessRoute>} />
        <Route path="platforms/:platformSlug/projects/:projectCode" element={<PortfolioAccessRoute><ProjectPage /></PortfolioAccessRoute>} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
