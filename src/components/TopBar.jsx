import { useLocation } from "react-router-dom";

function TopBar() {
  const location = useLocation();

  const pageTitles = {
    "/": "Dashboard",
    "/portfolio": "Portfolio",
    "/analytics": "Analytics",
    "/p2p": "P2P",
    "/dividends": "Dividends",
    "/calendar": "Calendar",
    "/reports": "Reports",
    "/settings": "Settings",
  };

  const currentPage = pageTitles[location.pathname] || "Dashboard";

  const now = new Date();

  const formattedDate = now.toLocaleDateString("lt-LT", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });

  const formattedTime = now.toLocaleTimeString("lt-LT", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-heading">
          <p className="topbar-brand">Portfolio Analytics</p>
          <h1>{currentPage}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <div className="sync-status">
          <span className="status-dot"></span>

          <div>
            <strong>Portfolio synchronized</strong>
            <span>
              {formattedDate} · {formattedTime}
            </span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            className="topbar-icon-button"
            type="button"
            title="Pranešimai"
          >
            🔔
          </button>

          <button
            className="topbar-icon-button"
            type="button"
            title="Keisti temą"
          >
            🌙
          </button>

          <button
            className="sync-button"
            type="button"
          >
            <span className="sync-icon">↻</span>
            Sync
          </button>

          <button
            className="profile-button"
            type="button"
          >
            <span className="profile-avatar">E</span>

            <span className="profile-text">
              <strong>Evaldas</strong>
              <small>Portfolio owner</small>
            </span>

            
          </button>
        </div>
      </div>
    </header>
  );
}

export default TopBar;