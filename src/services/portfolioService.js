import platformRegistry from "../data/platforms.json";

export const PORTFOLIO_GROUP_LABELS = Object.freeze({
  brokerage: "Brokeriai",
  funds: "Fondai",
  robo: "Robo investavimas",
  real_estate: "NT finansavimas",
  p2p: "P2P",
});

export const PORTFOLIO_GROUP_ORDER = Object.freeze([
  "brokerage",
  "funds",
  "robo",
  "real_estate",
  "p2p",
]);

const BRAND_STYLES = Object.freeze({
  "seb-fondai": ["SEB", "#16a06b"],
  "seb-mikro": ["SEB", "#16a06b"],
  "seb-robo": ["SEB", "#16a06b"],
  "revolut-brokerage": ["R", "#5874ff"],
  "revolut-robo": ["R", "#5874ff"],
  synergy: ["SY", "#9b6cff"],
  crowdpear: ["CP", "#34a8df"],
  profitus: ["P", "#ee744b"],
  nordstreet: ["NS", "#3479da"],
  rontgen: ["RÖ", "#43b6a5"],
  indemo: ["IN", "#735ee8"],
  afranga: ["A", "#f1843b"],
  debitum: ["D", "#2da4d8"],
  income: ["I", "#755ee8"],
  lande: ["L", "#60aa4c"],
  lendermarket: ["LM", "#3d91de"],
  loanch: ["LC", "#7857df"],
  nectaro: ["N", "#ef7a40"],
  peerberry: ["PB", "#ef5e68"],
  scramble: ["S", "#f2b244"],
  viainvest: ["VI", "#42a2c7"],
});
const PLATFORM_DOMAINS = Object.freeze({
  "seb-fondai": "seb.lt",
  "seb-mikro": "seb.lt",
  "seb-robo": "seb.lt",
  "revolut-brokerage": "revolut.com",
  "revolut-robo": "revolut.com",
  synergy: "synergyfinance.com",
  crowdpear: "crowdpear.com",
  profitus: "profitus.lt",
  nordstreet: "nordstreet.com",
  rontgen: "rontgen.lt",
  indemo: "indemo.eu",
  afranga: "afranga.com",
  debitum: "debitum.network",
  income: "getincome.com",
  lande: "lande.finance",
  lendermarket: "lendermarket.com",
  loanch: "loanch.com",
  nectaro: "nectaro.eu",
  peerberry: "peerberry.com",
  scramble: "scrambleup.com",
  viainvest: "viainvest.com",
});


function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex).replace("#", "");
  const parsed = Number.parseInt(normalized, 16);

  if (!Number.isFinite(parsed)) {
    return `rgba(66, 164, 255, ${alpha})`;
  }

  const red = (parsed >> 16) & 255;
  const green = (parsed >> 8) & 255;
  const blue = parsed & 255;

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function resolveDataUrl(dataFile, ownerId = "evaldas") {
  const relativePath = String(dataFile || "")
    .replace(/^\/+/, "")
    .replace(/^data\//, "");

  const ownerPrefix = ownerId === "rima" ? "rima/" : "";

  return `${import.meta.env.BASE_URL}data/${ownerPrefix}${relativePath}`;
}

function getBrandStyle(slug, name) {
  const registered = BRAND_STYLES[slug];

  if (registered) {
    return {
      logoText: registered[0],
      brandColor: registered[1],
      brandColorSoft: hexToRgba(registered[1], 0.14),
    };
  }

  const logoText = String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return {
    logoText,
    brandColor: "#42a4ff",
    brandColorSoft: "rgba(66, 164, 255, 0.14)",
  };
}


function getLogoUrl(slug, website) {
  let domain = PLATFORM_DOMAINS[slug] || "";

  if (!domain && website) {
    try {
      domain = new URL(website).hostname;
    } catch {
      domain = String(website)
        .replace(/^https?:\/\//, "")
        .split("/")[0];
    }
  }

  if (!domain) return "";

  return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(
    domain,
  )}&sz=128`;
}

function normalizePlatform(registryItem, payload) {
  const platform = payload?.platform || {};
  const summary = payload?.summary || {};

  const invested = number(summary.invested);
  const currentValue = number(summary.currentValue);
  const profit = Number.isFinite(Number(summary.profit))
    ? number(summary.profit)
    : currentValue - invested;

  const activeInvestments = number(summary.activeInvestments);
  const completedInvestments = number(summary.completedInvestments);

  const isActive =
    platform.active !== false &&
    (currentValue > 0 || invested > 0 || activeInvestments > 0);

  const explicitReturnRate = Number(summary.returnRate);
  const returnRate = Number.isFinite(explicitReturnRate)
    ? explicitReturnRate
    : invested > 0
      ? (profit / invested) * 100
      : 0;

  const slug = platform.slug || registryItem.slug;
  const name = platform.name || registryItem.name;
  const website = platform.website || registryItem.website || "";
  const group = slug === "indemo"
    ? "real_estate"
    : platform.group || registryItem.group;

  return {
    id: platform.id || registryItem.id,
    slug,
    name,
    group,
    type: platform.type || registryItem.type,
    category: platform.category || registryItem.category || "Investicija",
    currency: platform.currency || registryItem.currency || "EUR",
    website,
    updatedAt:
      platform.updatedAt ||
      payload?.generatedAt ||
      registryItem.updatedAt ||
      null,

    invested,
    currentValue,
    profit,
    returnRate,
    cash: number(summary.cash),
    incomeReceived: number(summary.incomeReceived),
    activeInvestments,
    delayedInvestments: number(summary.delayedInvestments),
    completedInvestments,
    totalInvestments:
      number(summary.totalInvestments) ||
      activeInvestments + completedInvestments,

    isActive,
    logoUrl: getLogoUrl(slug, website),
    ...getBrandStyle(slug, name),
  };
}

async function fetchPlatform(registryItem, ownerId) {
  const response = await fetch(resolveDataUrl(registryItem.dataFile, ownerId), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `${registryItem.name}: nepavyko įkelti ${registryItem.dataFile}.`,
    );
  }

  const payload = await response.json();

  return normalizePlatform(registryItem, payload);
}

export async function loadPortfolioPlatforms(ownerId = "evaldas") {
  const enabledPlatforms = platformRegistry.filter(
    (platform) => platform.enabled !== false && platform.dataFile,
  );

  const results = await Promise.allSettled(
    enabledPlatforms.map((platform) => fetchPlatform(platform, ownerId)),
  );

  const loadedPlatforms = [];
  const failedPlatforms = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      loadedPlatforms.push(result.value);
    } else {
      failedPlatforms.push({
        name: enabledPlatforms[index].name,
        error: result.reason,
      });
    }
  });

  failedPlatforms.forEach(({ name, error }) => {
    console.warn(`Portfolio: ${name} JSON neįkeltas.`, error);
  });

  if (!loadedPlatforms.length) {
    throw new Error("Nepavyko įkelti nė vieno platformos JSON failo.");
  }

  return loadedPlatforms;
}

export async function loadPortfolioHistory(ownerId = "evaldas") {
  const ownerPrefix = ownerId === "rima" ? "rima/" : "";
  const url = `${import.meta.env.BASE_URL}data/${ownerPrefix}portfolio_history.json`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Nepavyko įkelti istorinio portfelio failo.");
  }

  const payload = await response.json();

  return {
    history: Array.isArray(payload?.history) ? payload.history : [],
    latest: payload?.latest || null,
    period: payload?.period || null,
  };
}
