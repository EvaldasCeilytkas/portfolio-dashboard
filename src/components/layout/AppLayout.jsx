import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import Skeleton from "../ui/Skeleton";

function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <TopBar />

        <main className="page-content">
          <Suspense fallback={<div style={{ padding: 24 }}><Skeleton lines={7} /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
