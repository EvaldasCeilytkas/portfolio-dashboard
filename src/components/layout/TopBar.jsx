import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePortfolioOwner } from "../../context/PortfolioContext";

const titles = {
  "/": { eyebrow: "PORTFELIO APŽVALGA", title: "Dashboard" },
  "/portfolio": { eyebrow: "VISOS INVESTICIJOS", title: "Portfolio" },
  "/analytics": { eyebrow: "REZULTATŲ ANALIZĖ", title: "Analytics" },
  "/p2p": { eyebrow: "P2P INVESTICIJOS", title: "P2P" },
};

function resolveTitle(pathname) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.includes("/projects/")) return { eyebrow: "PROJEKTO INFORMACIJA", title: "Projektas" };
  if (pathname.startsWith("/platforms/")) return { eyebrow: "PLATFORMOS INFORMACIJA", title: "Platforma" };
  return { eyebrow: "PORTFOLIO ANALYTICS", title: "Puslapis" };
}

function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { owner, owners, selectOwner } = usePortfolioOwner();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null);
  const page = resolveTitle(location.pathname);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  function handleOwnerChange(nextOwnerId) {
    selectOwner(nextOwnerId);
    setIsOpen(false);

    if (nextOwnerId === "rima" && location.pathname !== "/") {
      navigate("/");
    }
  }

  return (
    <header className="topbar">
      <div>
        <p className="topbar-eyebrow">{page.eyebrow}</p>
        <h1>{page.title}</h1>
      </div>

      <div className="topbar-meta">
        <span className="topbar-status">
          <span className="status-dot" />
          Sistema veikia
        </span>

        <div className="owner-selector" ref={selectorRef}>
          <button
            className="owner-selector-button"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((current) => !current)}
          >
            <span className="user-badge" aria-hidden="true">{owner.initials}</span>
            <span className="owner-selector-copy">
              <strong>{owner.name}</strong>
              <small>Portfelio savininkas</small>
            </span>
            <span className={`owner-chevron${isOpen ? " is-open" : ""}`}>⌄</span>
          </button>

          {isOpen && (
            <div className="owner-menu" role="listbox" aria-label="Pasirinkti portfelį">
              {owners.map((item) => (
                <button
                  key={item.id}
                  className={`owner-menu-item${item.id === owner.id ? " is-active" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={item.id === owner.id}
                  onClick={() => handleOwnerChange(item.id)}
                >
                  <span className="owner-menu-avatar">{item.initials}</span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.fullAccess ? "Visas dashboardas" : "Dashboard"}</small>
                  </span>
                  {item.id === owner.id && <span className="owner-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
