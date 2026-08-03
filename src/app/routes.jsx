import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import { usePortfolioOwner } from "../context/PortfolioContext";

const AlertsPage = lazy(() => import("../pages/AlertsPage"));
const AnalyticsPage = lazy(() => import("../pages/AnalyticsPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const P2PPage = lazy(() => import("../pages/P2PPage"));
const P2PLoanProfile = lazy(() => import("../pages/P2PLoanProfile"));
const PlatformPage = lazy(() => import("../pages/PlatformPage"));
const PortfolioPage = lazy(() => import("../pages/PortfolioPage"));
const PerformancePage = lazy(() => import("../pages/PerformancePage"));
const IntelligencePage = lazy(() => import("../pages/IntelligencePage"));
const GoalsPage = lazy(() => import("../pages/GoalsPage"));
const SyncPage = lazy(() => import("../pages/SyncPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const AIInsightsPage = lazy(() => import("../pages/AIInsightsPage"));
const ProjectPage = lazy(() => import("../pages/ProjectPage"));
const SystemInfoPage = lazy(() => import("../pages/SystemInfoPage"));

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
          <Route path="search" element={<SearchPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="ai-insights" element={<AIInsightsPage />} />
          <Route path="system" element={<SystemInfoPage />} />
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
