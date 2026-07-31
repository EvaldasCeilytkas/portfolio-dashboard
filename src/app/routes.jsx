import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import AnalyticsPage from "../pages/AnalyticsPage";
import DashboardPage from "../pages/DashboardPage";
import NotFoundPage from "../pages/NotFoundPage";
import P2PPage from "../pages/P2PPage";
import P2PLoanProfile from "../pages/P2PLoanProfile";
import PlatformPage from "../pages/PlatformPage";
import PortfolioPage from "../pages/PortfolioPage";
import ProjectPage from "../pages/ProjectPage";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="p2p" element={<P2PPage />} />
        <Route
          path="platforms/:platformSlug"
          element={<PlatformPage />}
        />
        <Route
          path="platforms/:slug/loan/:loanId"
          element={<P2PLoanProfile />}
        />
        <Route
          path="platforms/:platformSlug/projects/:projectCode"
          element={<ProjectPage />}
        />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
