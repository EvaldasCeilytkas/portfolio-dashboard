import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePortfolioOwner } from "../../context/PortfolioContext";

const titles = {
  "/": { eyebrow: "PORTFELIO APŽVALGA", title: "Dashboard" },
  "/portfolio": { eyebrow: "VISOS INVESTICIJOS", title: "Portfolio" },
  "/analytics": { eyebrow: "REZULTATŲ ANALIZĖ", title: "Analytics" },
  "/p2p": { eyebrow: "P2P INVESTICIJOS", title: "P2P" },
  "/performance": { eyebrow: "INVESTICIJŲ EFEKTYVUMAS", title: "Performance" },
  "/alerts": { eyebrow: "PORTFELIO STEBĖJIMAS", title: "Alerts Center" },
  "/intelligence": { eyebrow: "IŠMANIOJI PORTFELIO ANALIZĖ", title: "Portfolio Intelligence" },
  "/goals": { eyebrow: "FINANSINIAI TIKSLAI", title: "Goals Center" },
  "/sync": { eyebrow: "PORTFOLIO SYNCHRONIZATION HUB", title: "Sync Center" },
  "/search": { eyebrow: "GLOBALI INVESTICIJŲ PAIEŠKA", title: "Search Center" },
  "/reports": { eyebrow: "PORTFELIO ATASKAITOS", title: "Report Center" },
  "/ai-insights": { eyebrow: "IŠMANIOSIOS ĮŽVALGOS", title: "AI Insights" },
  "/system": { eyebrow: "STABLE RELEASE VALDYMAS", title: "System Info" },
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
  const isSystemPage = location.pathname === "/sync" || location.pathname === "/system";

  useEffect(() => {
    function openSearch(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        navigate("/search");
      }
    }
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, [navigate]);

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

    const nextOwner = owners.find((item) => item.id === nextOwnerId);

    if (!nextOwner) return;

    const isPortfolioPath = location.pathname === "/portfolio" || location.pathname.startsWith("/platforms/");
    const isAnalyticsPath = location.pathname === "/analytics";
    const isP2PPath = location.pathname === "/p2p" || location.pathname.includes("/loan/");
    const isUniversalPath = location.pathname === "/performance" || location.pathname === "/alerts" || location.pathname === "/intelligence" || location.pathname === "/goals" || location.pathname === "/search" || location.pathname === "/reports" || location.pathname === "/ai-insights" || location.pathname === "/system" || location.pathname === "/sync";
    const canStay =
      location.pathname === "/" ||
      (isPortfolioPath && nextOwner.portfolioAccess) ||
      (isAnalyticsPath && nextOwner.analyticsAccess) ||
      (isP2PPath && nextOwner.p2pAccess) ||
      isUniversalPath ||
      nextOwner.fullAccess;

    if (!canStay) {
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
        <button className="search-quick-button" type="button" onClick={() => navigate("/search")}><span>⌕</span> Paieška <kbd>Ctrl K</kbd></button>

        <span className="topbar-status">
          <span className="status-dot" />
          Sistema veikia
        </span>

        {isSystemPage ? (
          <div className="owner-selector owner-selector-system">
            <div className="owner-selector-button system-profile-card">
              <span className="user-badge" aria-hidden="true">SYS</span>
              <span className="owner-selector-copy">
                <strong>Sistema</strong>
                <small>Visi portfeliai</small>
              </span>
            </div>
          </div>
        ) : (
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
                      <small>{item.fullAccess ? "Visas dashboardas" : item.isCombined ? "Bendras Dashboard" : "Dashboard"}</small>
                    </span>
                    {item.id === owner.id && <span className="owner-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default TopBar;
