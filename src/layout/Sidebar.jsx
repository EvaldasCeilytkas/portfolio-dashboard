import { NavLink } from "react-router-dom";

const menuItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/portfolio", label: "Portfelis", icon: "💼" },
  { to: "/analytics", label: "Analizė", icon: "📈" },
  { to: "/p2p", label: "P2P", icon: "🏦" },
  { to: "/dividends", label: "Dividendai", icon: "💰" },
  { to: "/calendar", label: "Kalendorius", icon: "📅" },
  { to: "/reports", label: "Ataskaitos", icon: "📑" },
  { to: "/settings", label: "Nustatymai", icon: "⚙️" },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">PA</div>

<div>
  <strong>Portfolio Analytics</strong>
  <span>Investment Dashboard</span>
</div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
            }
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Portfolio Analytics</span>
        <small>2026</small>
      </div>
    </aside>
  );
}

export default Sidebar;