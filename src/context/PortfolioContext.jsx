import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "portfolio-dashboard-owner";

const OWNERS = {
  evaldas: {
    id: "evaldas",
    name: "Evaldas",
    initials: "EČ",
    dataFolder: "",
    fullAccess: true,
    portfolioAccess: true,
    analyticsAccess: true,
    p2pAccess: true,
  },
  rima: {
    id: "rima",
    name: "Rima",
    initials: "R",
    dataFolder: "rima",
    fullAccess: false,
    portfolioAccess: true,
    analyticsAccess: true,
    p2pAccess: true,
  },
  gerda: {
    id: "gerda",
    name: "Gerda",
    initials: "G",
    dataFolder: "gerda",
    fullAccess: false,
    portfolioAccess: true,
    analyticsAccess: true,
    p2pAccess: true,
  },
  family: {
    id: "family",
    name: "Šeimos portfelis",
    initials: "Š",
    dataFolder: null,
    fullAccess: false,
    portfolioAccess: true,
    analyticsAccess: true,
    p2pAccess: true,
    isCombined: true,
  },
};

export const PortfolioContext = createContext(null);

function getInitialOwner() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return OWNERS[saved] ? saved : "evaldas";
  } catch {
    return "evaldas";
  }
}

export function PortfolioProvider({ children }) {
  const [ownerId, setOwnerId] = useState(getInitialOwner);

  function selectOwner(nextOwnerId) {
    if (!OWNERS[nextOwnerId]) return;

    setOwnerId(nextOwnerId);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextOwnerId);
    } catch {
      // Dashboard veiks ir tada, kai localStorage naršyklėje išjungtas.
    }
  }

  const value = useMemo(() => {
    const owner = OWNERS[ownerId];
    const folderPrefix = owner.dataFolder ? `${owner.dataFolder}/` : "";

    return {
      ownerId,
      owner,
      owners: Object.values(OWNERS),
      selectOwner,
      dataPath: (fileName) =>
        `${import.meta.env.BASE_URL}data/${folderPrefix}${fileName}`,
      isFullAccess: owner.fullAccess,
      canViewPortfolio: owner.portfolioAccess === true,
      canViewAnalytics: owner.analyticsAccess === true,
      canViewP2P: owner.p2pAccess === true,
    };
  }, [ownerId]);

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolioOwner() {
  const context = useContext(PortfolioContext);

  if (!context) {
    throw new Error("usePortfolioOwner turi būti naudojamas PortfolioProvider viduje.");
  }

  return context;
}
