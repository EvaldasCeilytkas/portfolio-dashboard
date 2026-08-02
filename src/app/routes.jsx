import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import { usePortfolioOwner } from "../context/PortfolioContext";
import AnalyticsPage from "../pages/AnalyticsPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import P2PPage from "../pages/P2PPage";
import P2PLoanProfile from "../pages/P2PLoanProfile";
import PlatformPage from "../pages/PlatformPage";
import PortfolioPage from "../pages/PortfolioPage";
import ProjectPage from "../pages/ProjectPage";

function FullAccessRoute({ children }) {
  const { isFullAccess } = usePortfolioOwner();
  return isFullAccess ? children : <Navigate to="/" replace />;
}

function PortfolioAccessRoute({ children }) {
  const { canViewPortfolio } = usePortfolioOwner();
  return canViewPortfolio ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="portfolio" element={<PortfolioAccessRoute><PortfolioPage /></PortfolioAccessRoute>} />
        <Route path="analytics" element={<FullAccessRoute><AnalyticsPage /></FullAccessRoute>} />
        <Route path="p2p" element={<FullAccessRoute><P2PPage /></FullAccessRoute>} />
        <Route path="platforms/:platformSlug" element={<PortfolioAccessRoute><PlatformPage /></PortfolioAccessRoute>} />
        <Route path="platforms/:slug/loan/:loanId" element={<FullAccessRoute><P2PLoanProfile /></FullAccessRoute>} />
        <Route path="platforms/:platformSlug/projects/:projectCode" element={<PortfolioAccessRoute><ProjectPage /></PortfolioAccessRoute>} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
