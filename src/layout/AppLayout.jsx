import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "../components/TopBar";

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="content-wrapper">
        <TopBar />

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;