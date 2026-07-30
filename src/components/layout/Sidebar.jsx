import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/", label: "Dashboard", icon: "D", end: true },
  { to: "/portfolio", label: "Portfolio", icon: "P" },
  { to: "/analytics", label: "Analytics", icon: "A" },
  { to: "/p2p", label: "P2P", icon: "2P" },
];

function Sidebar() {
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
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar-link${isActive ? " is-active" : ""}`
            }
          >
            <span className="sidebar-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <div>
          <strong>V2.0</strong>
          <span>Projekto karkasas</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
