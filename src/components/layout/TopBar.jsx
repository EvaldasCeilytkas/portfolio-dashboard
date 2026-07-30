import { useLocation } from "react-router-dom";

const titles = {
  "/": {
    eyebrow: "PORTFELIO APŽVALGA",
    title: "Dashboard",
  },
  "/portfolio": {
    eyebrow: "VISOS INVESTICIJOS",
    title: "Portfolio",
  },
  "/analytics": {
    eyebrow: "REZULTATŲ ANALIZĖ",
    title: "Analytics",
  },
  "/p2p": {
    eyebrow: "P2P INVESTICIJOS",
    title: "P2P",
  },
};

function resolveTitle(pathname) {
  if (titles[pathname]) {
    return titles[pathname];
  }

  if (pathname.includes("/projects/")) {
    return {
      eyebrow: "PROJEKTO INFORMACIJA",
      title: "Projektas",
    };
  }

  if (pathname.startsWith("/platforms/")) {
    return {
      eyebrow: "PLATFORMOS INFORMACIJA",
      title: "Platforma",
    };
  }

  return {
    eyebrow: "PORTFOLIO ANALYTICS",
    title: "Puslapis",
  };
}

function TopBar() {
  const location = useLocation();
  const page = resolveTitle(location.pathname);

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

        <div className="user-badge" aria-label="Naudotojas">
          EČ
        </div>
      </div>
    </header>
  );
}

export default TopBar;
