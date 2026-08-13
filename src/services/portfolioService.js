import { getOwnerPlatforms } from "../data/platformRegistry";
import { requestJson } from "./jsonClient";

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
  twino: ["TW", "#ef6c35"],
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
  twino: "twino.eu",
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

  const ownerPrefix = ownerId === "evaldas" ? "" : `${ownerId}/`;

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

function normalizePlatform(registryItem, payload, ownerId = "evaldas") {
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

  const explicitXirr = summary.xirr;
  const parsedXirr = Number(explicitXirr);
  const xirr = explicitXirr !== null && explicitXirr !== undefined && explicitXirr !== "" && Number.isFinite(parsedXirr)
    ? parsedXirr
    : null;

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
    xirr,
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
    ownerId,
    ownerName: ownerId === "rima" ? "Rima" : ownerId === "gerda" ? "Gerda" : "Evaldas",
    ...getBrandStyle(slug, name),
  };
}

async function fetchPlatform(registryItem, ownerId) {
  try {
    const payload = await requestJson(resolveDataUrl(registryItem.dataFile, ownerId));
    return normalizePlatform(registryItem, payload, ownerId);
  } catch (error) {
    throw new Error(
      `${registryItem.name}: nepavyko įkelti ${registryItem.dataFile}.`,
      { cause: error },
    );
  }
}

export async function loadPortfolioPlatforms(ownerId = "evaldas") {
  if (ownerId === "family") {
    const [evaldasPlatforms, rimaPlatforms] = await Promise.all([
      loadPortfolioPlatforms("evaldas"),
      loadPortfolioPlatforms("rima"),
    ]);

    // Savininkas nustatomas pagal duomenų šaltinį, o ne JSON turinį.
    // Taip žyma rodoma prie kiekvienos šeimos portfelio platformos.
    const withOwner = (items, id, name) =>
      items.map((platform) => ({
        ...platform,
        ownerId: id,
        ownerName: name,
      }));

    return [
      ...withOwner(evaldasPlatforms, "evaldas", "Evaldas"),
      ...withOwner(rimaPlatforms, "rima", "Rima"),
    ];
  }

  const enabledPlatforms = getOwnerPlatforms(ownerId).filter(
    (platform) => platform.dataFile,
  );

  const results = await Promise.allSettled(
    enabledPlatforms.map((platform) => fetchPlatform(platform, ownerId)),
  );

  const loadedPlatforms = [];
  const failedPlatforms = [];

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      loadedPlatforms.push({
        ...result.value,
        ownerId,
        ownerName: ownerId === "rima" ? "Rima" : ownerId === "gerda" ? "Gerda" : "Evaldas",
      });
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

function combineHistorySeries(firstHistory = [], secondHistory = []) {
  const first = [...firstHistory].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const second = [...secondHistory].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const dates = [...new Set([...first, ...second].map((item) => item.date))].sort();
  const firstByDate = new Map(first.map((item) => [item.date, item]));
  const secondByDate = new Map(second.map((item) => [item.date, item]));

  let firstLatest = null;
  let secondLatest = null;
  let firstIndex = 0;
  let secondIndex = 0;

  return dates.map((date) => {
    while (firstIndex < first.length && first[firstIndex].date <= date) {
      firstLatest = first[firstIndex];
      firstIndex += 1;
    }

    while (secondIndex < second.length && second[secondIndex].date <= date) {
      secondLatest = second[secondIndex];
      secondIndex += 1;
    }

    const invested = number(firstLatest?.invested) + number(secondLatest?.invested);
    const value = number(firstLatest?.value) + number(secondLatest?.value);
    const profit = value - invested;
    const firstExact = firstByDate.get(date);
    const secondExact = secondByDate.get(date);

    return {
      date,
      invested,
      monthlyContribution:
        number(firstExact?.monthlyContribution) + number(secondExact?.monthlyContribution),
      value,
      profit,
      returnRate: invested > 0 ? (profit / invested) * 100 : 0,
      monthlyResult: number(firstExact?.monthlyResult) + number(secondExact?.monthlyResult),
    };
  });
}

async function loadSinglePortfolioHistory(ownerId) {
  const ownerPrefix = ownerId === "evaldas" ? "" : `${ownerId}/`;
  const url = `${import.meta.env.BASE_URL}data/${ownerPrefix}portfolio_history.json`;
  let payload;
  try {
    payload = await requestJson(url);
  } catch (error) {
    throw new Error("Nepavyko įkelti istorinio portfelio failo.", { cause: error });
  }

  return {
    history: Array.isArray(payload?.history) ? payload.history : [],
    latest: payload?.latest || null,
    period: payload?.period || null,
  };
}

export async function loadPortfolioHistory(ownerId = "evaldas") {
  if (ownerId !== "family") {
    return loadSinglePortfolioHistory(ownerId);
  }

  const [evaldasHistory, rimaHistory] = await Promise.all([
    loadSinglePortfolioHistory("evaldas"),
    loadSinglePortfolioHistory("rima"),
  ]);

  const history = combineHistorySeries(evaldasHistory.history, rimaHistory.history);
  const latest = history.at(-1) || null;

  return {
    history,
    latest,
    period: history.length
      ? { start: history[0].date, end: history.at(-1).date, months: history.length }
      : null,
  };
}
