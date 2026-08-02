import { NavLink } from "react-router-dom";
import { usePortfolioOwner } from "../../context/PortfolioContext";

const navigation = [
  { to: "/", label: "Dashboard", icon: "D", end: true },
  { to: "/portfolio", label: "Portfolio", icon: "P", requiresPortfolioAccess: true },
  { to: "/analytics", label: "Analytics", icon: "A", requiresAnalyticsAccess: true },
  { to: "/p2p", label: "P2P", icon: "2P", requiresP2PAccess: true },
  { to: "/performance", label: "Performance", icon: "PF" },
  { to: "/alerts", label: "Alerts", icon: "!" },
  { to: "/intelligence", label: "Intelligence", icon: "IQ" },
  { to: "/goals", label: "Goals", icon: "G" },
];

function Sidebar() {
  const { owner, isFullAccess, canViewPortfolio, canViewAnalytics, canViewP2P } = usePortfolioOwner();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">V2</div>
        <div>
          <strong>Portfolio</strong>
          <span>Analytics</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Pagrindinė navigacija">
        {navigation.map((item) => {
          const disabled =
            (item.requiresFullAccess && !isFullAccess) ||
            (item.requiresPortfolioAccess && !canViewPortfolio) ||
            (item.requiresAnalyticsAccess && !canViewAnalytics) ||
            (item.requiresP2PAccess && !canViewP2P);

          if (disabled) {
            return (
              <div
                key={item.to}
                className="sidebar-link is-disabled"
                title={`${owner.name}: ši dalis bus aktyvuota prijungus platformų failus`}
                aria-disabled="true"
              >
                <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
                <span className="sidebar-lock" aria-hidden="true">•</span>
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " is-active" : ""}`
              }
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <div>
          <strong>{owner.name}</strong>
          <span>{isFullAccess
            ? "Pilnas portfelis"
            : canViewPortfolio
              ? "Pilnas portfelis"
              : "Dashboard režimas"}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
