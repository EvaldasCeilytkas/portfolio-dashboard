import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PerformanceChart from "../components/charts/PerformanceChart";
import EtfTable from "../components/etf/EtfTable";
import P2PProfileModule from "../components/p2p/P2PProfileModule";
import RealEstateProfileModule from "../components/realEstate/RealEstateProfileModule";
import NplProfileModule from "../components/npl/NplProfileModule";
import BrokerProfileModule from "../components/broker/BrokerProfileModule";
import ProgressBar from "../components/ui/ProgressBar";
import { usePortfolio } from "../hooks/usePortfolio";

import "../styles/platformprofile.css";
import "../styles/npl.css";
import "../styles/brokerprofile.css";

function formatCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 €";
  }

  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 %";
  }

  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)} %`;
}

function formatSignedPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 %";
  }

  const formattedValue = new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(numericValue));

  if (numericValue > 0) {
    return `+${formattedValue} %`;
  }

  if (numericValue < 0) {
    return `−${formattedValue} %`;
  }

  return `${formattedValue} %`;
}

function formatSignedCurrency(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0,00 €";
  }

  const formattedValue = new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(numericValue));

  if (numericValue > 0) {
    return `+${formattedValue}`;
  }

  if (numericValue < 0) {
    return `−${formattedValue}`;
  }

  return formattedValue;
}

function formatMonth(value) {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
  }).format(parsedDate);
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("lt-LT", {
    year: "numeric",
    month: "short",
  }).format(parsedDate);
}

function formatMonths(value) {
  const months = Number(value);

  if (!Number.isFinite(months) || months <= 0) {
    return "—";
  }

  if (months === 1) {
    return "1 mėnuo";
  }

  if (months < 10 || months % 10 === 0) {
    return `${months} mėn.`;
  }

  return `${months} mėn.`;
}

function getPlatformBrand(platform) {
  const name = getPlatformName(platform).toLocaleLowerCase("lt-LT");

  const brands = [
    { words: ["seb"], accent: "#22c55e", soft: "rgba(34, 197, 94, 0.16)" },
    { words: ["revolut"], accent: "#f8fafc", soft: "rgba(248, 250, 252, 0.14)" },
    { words: ["peerberry"], accent: "#fb923c", soft: "rgba(251, 146, 60, 0.16)" },
    { words: ["twino"], accent: "#f97316", soft: "rgba(249, 115, 22, 0.16)" },
    { words: ["debitum"], accent: "#38bdf8", soft: "rgba(56, 189, 248, 0.16)" },
    { words: ["nectaro"], accent: "#84cc16", soft: "rgba(132, 204, 22, 0.16)" },
    { words: ["viainvest"], accent: "#a78bfa", soft: "rgba(167, 139, 250, 0.16)" },
    { words: ["rontgen"], accent: "#f59e0b", soft: "rgba(245, 158, 11, 0.16)" },
    { words: ["afranga"], accent: "#c084fc", soft: "rgba(192, 132, 252, 0.16)" },
    { words: ["lande"], accent: "#4ade80", soft: "rgba(74, 222, 128, 0.16)" },
    { words: ["profitus"], accent: "#60a5fa", soft: "rgba(96, 165, 250, 0.16)" },
    { words: ["crowdpear"], accent: "#f97316", soft: "rgba(249, 115, 22, 0.16)" },
    { words: ["nordstreet"], accent: "#2dd4bf", soft: "rgba(45, 212, 191, 0.16)" },
    { words: ["indemo"], accent: "#e879f9", soft: "rgba(232, 121, 249, 0.16)" },
    { words: ["fintown"], accent: "#fb7185", soft: "rgba(251, 113, 133, 0.16)" },
    { words: ["income"], accent: "#facc15", soft: "rgba(250, 204, 21, 0.16)" },
    { words: ["lendermarket"], accent: "#818cf8", soft: "rgba(129, 140, 248, 0.16)" },
    { words: ["loanch"], accent: "#22d3ee", soft: "rgba(34, 211, 238, 0.16)" },
    { words: ["synergy"], accent: "#f472b6", soft: "rgba(244, 114, 182, 0.16)" },
    { words: ["scramble"], accent: "#fbbf24", soft: "rgba(251, 191, 36, 0.16)" },
  ];

  return (
    brands.find((brand) =>
      brand.words.some((word) => name.includes(word)),
    ) ?? {
      accent: "#60a5fa",
      soft: "rgba(96, 165, 250, 0.16)",
    }
  );
}

function getPlatformAnalytics(history) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      startDate: "",
      months: 0,
      highestValue: 0,
      averageMonthlyReturn: 0,
      maxDrawdown: 0,
    };
  }

  const sortedHistory = [...history].sort(
    (first, second) =>
      new Date(first.date).getTime() - new Date(second.date).getTime(),
  );

  const validValues = sortedHistory
    .map((item) => Number(item.value))
    .filter(Number.isFinite);

  let peak = 0;
  let maxDrawdown = 0;
  const monthlyReturns = [];

  sortedHistory.forEach((item, index) => {
    const value = Number(item.value);

    if (Number.isFinite(value)) {
      peak = Math.max(peak, value);

      if (peak > 0) {
        const drawdown = ((value - peak) / peak) * 100;
        maxDrawdown = Math.min(maxDrawdown, drawdown);
      }
    }

    if (index === 0) {
      return;
    }

    const previousValue = Number(sortedHistory[index - 1]?.value);

    if (
      Number.isFinite(value) &&
      Number.isFinite(previousValue) &&
      previousValue > 0
    ) {
      monthlyReturns.push(((value - previousValue) / previousValue) * 100);
    }
  });

  const averageMonthlyReturn =
    monthlyReturns.length > 0
      ? monthlyReturns.reduce((sum, value) => sum + value, 0) /
        monthlyReturns.length
      : 0;

  return {
    startDate: sortedHistory[0]?.date ?? "",
    months: sortedHistory.length,
    highestValue:
      validValues.length > 0 ? Math.max(...validValues) : 0,
    averageMonthlyReturn,
    maxDrawdown,
  };
}

function getPlatformName(platform) {
  return (
    platform?.name ??
    platform?.platformName ??
    platform?.platform ??
    platform?.title ??
    "Nežinoma platforma"
  );
}

function getInvestedValue(platform) {
  return Number(
    platform?.invested ??
      platform?.investedAmount ??
      platform?.amountInvested ??
      0,
  );
}

function getCurrentValue(platform) {
  return Number(
    platform?.value ??
      platform?.currentValue ??
      platform?.portfolioValue ??
      platform?.balance ??
      0,
  );
}

function getProfitValue(platform) {
  const explicitProfit = Number(
    platform?.profit ?? platform?.totalProfit ?? platform?.gain,
  );

  if (Number.isFinite(explicitProfit)) {
    return explicitProfit;
  }

  return getCurrentValue(platform) - getInvestedValue(platform);
}

function getReturnPercentage(platform) {
  const explicitPercentage = Number(
    platform?.returnPercentage ??
      platform?.profitPercentage ??
      platform?.returnPercent ??
      platform?.percentage ??
      platform?.returnRate ??
      platform?.xirr,
  );

  if (Number.isFinite(explicitPercentage)) {
    return explicitPercentage;
  }

  const invested = getInvestedValue(platform);

  if (invested === 0) {
    return 0;
  }

  return (getProfitValue(platform) / invested) * 100;
}

function createPlatformSlug(platformName) {
  return String(platformName || "")
    .trim()
    .toLocaleLowerCase("lt-LT")
    .replaceAll(" ", "-");
}

function isPlatformActive(platform) {
  return platform?.active !== false;
}

function inferPlatformCategory(platform) {
  const explicitCategory =
    platform?.category ??
    platform?.type ??
    platform?.investmentType;

  if (explicitCategory) {
    return explicitCategory;
  }

  const name = getPlatformName(platform).toLocaleLowerCase("lt-LT");

  const categoryRules = [
    { words: ["seb fondai"], category: "Investiciniai fondai" },
    { words: ["seb mikro"], category: "Investiciniai fondai" },
    { words: ["seb robo", "revolut robo"], category: "Robo Advisor" },
    {
      words: ["revolut brokerage", "brokerage"],
      category: "Akcijos ir ETF",
    },
    {
      words: ["profitus", "nordstreet", "crowdpear", "estateguru"],
      category: "NT sutelktinis finansavimas",
    },
    { words: ["indemo"], category: "NPL investicijos" },
    {
      words: [
        "peerberry",
        "fintown",
        "income",
        "mintos",
        "twino",
        "esketing",
        "esketit",
        "robocash",
        "lendermarket",
        "loanch",
        "nectaro",
        "viainvest",
        "afranga",
      ],
      category: "P2P paskolos",
    },
    { words: ["debitum"], category: "Verslo paskolos" },
    { words: ["rontgen"], category: "Sutelktinis finansavimas" },
    { words: ["lande"], category: "Žemės ūkio paskolos" },
    { words: ["synergy"], category: "Privatus kreditas" },
    { words: ["scramble"], category: "Verslo finansavimas" },
  ];

  const matchedRule = categoryRules.find((rule) =>
    rule.words.some((word) => name.includes(word)),
  );

  return matchedRule?.category ?? "Kita investicija";
}

function getPlatformLogo(platform) {
  if (platform?.logoUrl || platform?.logo) {
    return platform.logoUrl ?? platform.logo;
  }

  const name = getPlatformName(platform).toLocaleLowerCase("lt-LT");

  const logoDomains = [
    { words: ["seb"], domain: "seb.lt" },
    { words: ["revolut"], domain: "revolut.com" },
    { words: ["crowdpear"], domain: "crowdpear.com" },
    { words: ["profitus"], domain: "profitus.lt" },
    { words: ["nordstreet"], domain: "nordstreet.com" },
    { words: ["indemo"], domain: "indemo.eu" },
    { words: ["peerberry"], domain: "peerberry.com" },
    { words: ["fintown"], domain: "fintown.eu" },
    { words: ["income"], domain: "getincome.com" },
    { words: ["mintos"], domain: "mintos.com" },
    { words: ["twino"], domain: "twino.eu" },
    { words: ["esketit"], domain: "esketit.com" },
    { words: ["robocash"], domain: "robo.cash" },
    { words: ["lendermarket"], domain: "lendermarket.com" },
    { words: ["loanch"], domain: "loanch.com" },
    { words: ["synergy"], domain: "synergy.finance" },
    { words: ["scramble"], domain: "scrambleup.com" },
    { words: ["nectaro"], domain: "nectaro.eu" },
    { words: ["debitum"], domain: "debitum.investments" },
    { words: ["viainvest"], domain: "viainvest.com" },
    { words: ["rontgen"], domain: "rontgen.lt" },
    { words: ["afranga"], domain: "afranga.com" },
    { words: ["lande"], domain: "lande.finance" },
  ];

  const matchedLogo = logoDomains.find((item) =>
    item.words.some((word) => name.includes(word)),
  );

  if (!matchedLogo) {
    return "";
  }

  return `https://www.google.com/s2/favicons?domain=${matchedLogo.domain}&sz=128`;
}

function getPlatformHistory(platform) {
  const possibleHistory =
    platform?.history ??
    platform?.valueHistory ??
    platform?.portfolioHistory ??
    platform?.monthlyHistory;

  if (!Array.isArray(possibleHistory)) {
    return [];
  }

  return possibleHistory
    .map((item) => ({
      date: item?.date ?? item?.month ?? item?.period ?? "",
      value: Number(
        item?.value ??
          item?.currentValue ??
          item?.portfolioValue ??
          item?.balance,
      ),
      invested: Number(
        item?.invested ??
          item?.investedAmount ??
          item?.amountInvested,
      ),
    }))
    .filter(
      (item) =>
        item.date &&
        (Number.isFinite(item.value) ||
          Number.isFinite(item.invested)),
    );
}

function getPlatformDetails(portfolio, platform) {
  if (platform?.details && typeof platform.details === "object") {
    return platform.details;
  }

  // Laikinas suderinamumas su senesniu portfolio.json.
  const platformSlug = createPlatformSlug(
    getPlatformName(platform),
  );

  if (platformSlug === "seb-mikro" && portfolio?.sebMikro) {
    return portfolio.sebMikro;
  }

  if (
    platformSlug === "revolut-brokerage" &&
    portfolio?.revolutBrokerage
  ) {
    return portfolio.revolutBrokerage;
  }

  return null;
}


function getPerformanceBadge
(analytics) {
  const averageReturn = Number(analytics?.averageMonthlyReturn) || 0;
  const winningRate = Number(analytics?.winningRate) || 0;
  const volatility = Math.abs(Number(analytics?.volatility) || 0);
  const drawdown = Math.abs(Number(analytics?.maxDrawdown) || 0);

  const returnScore = Math.max(0, Math.min(40, averageReturn * 12));
  const winningScore = Math.max(0, Math.min(30, winningRate * 0.3));
  const volatilityScore = Math.max(0, 20 - volatility * 4);
  const drawdownScore = Math.max(0, 10 - drawdown);

  const score = Math.round(
    Math.max(0, Math.min(100, returnScore + winningScore + volatilityScore + drawdownScore)),
  );

  if (score >= 85) {
    return { score, label: "Puikus rezultatas", tone: "excellent" };
  }

  if (score >= 70) {
    return { score, label: "Stabili platforma", tone: "good" };
  }

  if (score >= 55) {
    return { score, label: "Subalansuota", tone: "neutral" };
  }

  return { score, label: "Reikia stebėti", tone: "watch" };
}

function PlatformProfile({ slugOverride = "" }) {
  const routeParams = useParams();
  const slug = slugOverride || routeParams.slug;
  const { portfolio, loading, errorMessage } = usePortfolio();
  const [logoFailed, setLogoFailed] = useState(false);

  const platforms = useMemo(() => {
    if (!Array.isArray(portfolio?.platforms)) {
      return [];
    }

    return portfolio.platforms;
  }, [portfolio]);

  const platform = useMemo(() => {
    return platforms.find((item) => {
      const itemSlug =
        item?.slug ?? createPlatformSlug(getPlatformName(item));

      return itemSlug === slug;
    });
  }, [platforms, slug]);

  const totalPortfolioValue = useMemo(() => {
    const explicitPortfolioValue = Number(portfolio?.portfolioValue);

    if (Number.isFinite(explicitPortfolioValue)) {
      return explicitPortfolioValue;
    }

    return platforms.reduce(
      (total, item) => total + getCurrentValue(item),
      0,
    );
  }, [portfolio, platforms]);

  if (loading) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state">
          Kraunami platformos duomenys...
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state error">
          <h2>Nepavyko įkelti platformos</h2>
          <p>{errorMessage}</p>
          <Link to="/portfolio">Grįžti į portfelį</Link>
        </section>
      </main>
    );
  }

  if (!platform) {
    return (
      <main className="platform-profile-page">
        <section className="platform-profile-state">
          <h2>Platforma nerasta</h2>
          <p>
            Patikrink adresą arba pasirink platformą iš portfelio
            sąrašo.
          </p>
          <Link to="/portfolio">Grįžti į portfelį</Link>
        </section>
      </main>
    );
  }

  const name = getPlatformName(platform);
  const invested = getInvestedValue(platform);
  const currentValue = getCurrentValue(platform);
  const profit = getProfitValue(platform);
  const returnPercentage = getReturnPercentage(platform);
  const active = isPlatformActive(platform);
  const category = inferPlatformCategory(platform);
  const logoUrl = getPlatformLogo(platform);
  const platformHistory = getPlatformHistory(platform);
  const analytics =
    platform?.analytics && typeof platform.analytics === "object"
      ? platform.analytics
      : getPlatformAnalytics(platformHistory);
  const brand = getPlatformBrand(platform);
  const details = getPlatformDetails(portfolio, platform);
  const activeEtfs = Array.isArray(details?.positions?.active)
    ? details.positions.active
    : Array.isArray(details?.holdings)
      ? details.holdings
      : [];
  const soldEtfs = Array.isArray(details?.positions?.sold)
    ? details.positions.sold
    : Array.isArray(details?.sold)
      ? details.sold
      : [];
  const hasInvestmentModule =
    details?.modules?.positions === true ||
    activeEtfs.length > 0 ||
    soldEtfs.length > 0;
  const isBrokerageModule = details?.type === "brokerage";
  const isBrokerModule = details?.modules?.broker === true;
  const isP2PModule = details?.type === "p2p" || details?.modules?.loans === true;
  const isRealEstateModule =
    Array.isArray(details?.projects) &&
    (
      category.toLocaleLowerCase("lt-LT").includes("nt") ||
      category.toLocaleLowerCase("lt-LT").includes("sutelktinis finansavimas")
    );
  const isNplModule = details?.type === "npl" || details?.modules?.projects === true;
  const platformCashflow =
    details?.cashflow && typeof details.cashflow === "object"
      ? details.cashflow
      : details?.summary || {};
  const isRoboModule = details?.type === "robo";
  const isFundModule = details?.type === "fund";

  const investmentModuleTitle = isBrokerageModule
    ? `${name} pozicijos`
    : isRoboModule
      ? `${name} portfelis`
      : isFundModule
        ? `${name} fondai`
        : `${name} ETF`;

  const investmentModuleDescription = isBrokerageModule
    ? "Aktyvios ir jau realizuotos brokerio pozicijos."
    : isRoboModule
      ? "Aktyvios ir jau realizuotos Robo Advisor pozicijos."
      : isFundModule
        ? "Aktyvios ir jau realizuotos fondo pozicijos."
        : "Aktyvios ir jau realizuotos ETF pozicijos.";

  const portfolioShare =
    totalPortfolioValue > 0
      ? (currentValue / totalPortfolioValue) * 100
      : 0;

  const currency = platform?.currency ?? "EUR";
  const xirr = Number(platform?.xirr);
  const monthlyPerformance = Array.isArray(analytics?.monthlyPerformance)
    ? [...analytics.monthlyPerformance].reverse()
    : [];
  const latestMonthlyPerformance = monthlyPerformance[0] ?? null;
  const performanceBadge = isP2PModule && details?.health
    ? {
        score: Number(details.health.score) || 0,
        label: details.health.label || "Portfolio Health",
        tone:
          Number(details.health.score) >= 85
            ? "excellent"
            : Number(details.health.score) >= 70
              ? "good"
              : Number(details.health.score) >= 55
                ? "neutral"
                : "watch",
      }
    : getPerformanceBadge(analytics);
  const completedMonths =
    Number(analytics?.winningMonths || 0) +
    Number(analytics?.losingMonths || 0) +
    Number(analytics?.flatMonths || 0);
  const historyProfit = monthlyPerformance.reduce(
    (total, point) => total + (Number(point?.monthlyProfit) || 0),
    0,
  );

  const brokerageAllocation = activeEtfs
    .map((position) => ({
      ticker: position?.ticker ?? position?.symbol ?? "—",
      name: position?.name ?? position?.ticker ?? "Pozicija",
      value: Number(position?.value ?? position?.currentValue ?? 0) || 0,
    }))
    .filter((position) => position.value > 0)
    .sort((first, second) => second.value - first.value);

  const brokerageAllocationTotal = brokerageAllocation.reduce(
    (total, position) => total + position.value,
    0,
  );

  const rankedActivePositions = [...activeEtfs]
    .map((position) => ({
      ...position,
      calculatedReturn: Number(position?.returnRate) || 0,
    }))
    .sort(
      (first, second) =>
        second.calculatedReturn - first.calculatedReturn,
    );

  const topGainer = rankedActivePositions[0] ?? null;
  const weakestPosition =
    rankedActivePositions[rankedActivePositions.length - 1] ?? null;
  const averagePositionValue =
    activeEtfs.length > 0
      ? activeEtfs.reduce(
          (total, position) =>
            total + Number(position?.value ?? position?.currentValue ?? 0),
          0,
        ) / activeEtfs.length
      : 0;

  const activePositionsValue = activeEtfs.reduce(
    (total, position) =>
      total + Number(position?.value ?? position?.currentValue ?? 0),
    0,
  );

  const averageActiveReturn =
    activeEtfs.length > 0
      ? activeEtfs.reduce(
          (total, position) =>
            total + (Number(position?.returnRate) || 0),
          0,
        ) / activeEtfs.length
      : 0;

  return (
    <main
      className="platform-profile-page"
      style={{
        "--platform-accent": brand.accent,
        "--platform-accent-soft": brand.soft,
      }}
    >
      <Link className="platform-profile-back" to="/portfolio">
        <span aria-hidden="true">←</span>
        Grįžti į portfelį
      </Link>

      <section className="platform-profile-hero">
        <div className="platform-profile-heading">
          <div className="platform-profile-logo">
            {logoUrl && !logoFailed ? (
              <img
                src={logoUrl}
                alt={`${name} logotipas`}
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span>{name.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <p className="platform-profile-eyebrow">
              PLATFORM PROFILE
            </p>

            <div className="platform-profile-title-row">
              <h1>{name}</h1>

              <div
                className={`platform-profile-score-badge ${performanceBadge.tone}`}
                title="Automatinis platformos rezultatų įvertinimas"
              >
                <span>{performanceBadge.label}</span>
                <strong>{performanceBadge.score} / 100</strong>
              </div>
            </div>

            <div className="platform-profile-meta">
              <span>{category}</span>

              <span
                className={
                  active
                    ? "platform-profile-status active"
                    : "platform-profile-status inactive"
                }
              >
                <span className="platform-profile-status-dot" />
                {active ? "Aktyvi platforma" : "Neaktyvi platforma"}
              </span>
            </div>

            <div className="platform-profile-quick-meta">
              <span>Nuo {formatDate(analytics.startDate)}</span>
              <span>{formatMonths(analytics.months)}</span>
              <span>{currency}</span>
            </div>
          </div>
        </div>

        <div className="platform-profile-hero-side">
          <div className="platform-profile-value">
            <span>Dabartinė vertė</span>
            <strong>{formatCurrency(currentValue)}</strong>
            <div className="platform-profile-hero-return">
              <b className={profit >= 0 ? "platform-profile-positive" : "platform-profile-negative"}>
                {formatSignedCurrency(profit)}
              </b>
              <small className={returnPercentage >= 0 ? "platform-profile-positive" : "platform-profile-negative"}>
                {formatSignedPercentage(returnPercentage)}
              </small>
            </div>
          </div>

          {platform?.website && (
            <a
              className="platform-profile-website-button"
              href={platform.website}
              target="_blank"
              rel="noreferrer"
            >
              Atidaryti svetainę
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>

      <section className="platform-profile-stats">
        <article className="platform-profile-stat-card">
          <span>Investuota</span>
          <strong>{formatCurrency(invested)}</strong>
          <small>Bendra investuota suma</small>
        </article>

        <article className="platform-profile-stat-card">
          <span>Pelnas</span>
          <strong
            className={
              profit >= 0
                ? "platform-profile-positive"
                : "platform-profile-negative"
            }
          >
            {formatSignedCurrency(profit)}
          </strong>
          <small>Vertė minus investuota</small>
        </article>

        <article className="platform-profile-stat-card">
          <span>Grąža</span>
          <strong
            className={
              returnPercentage >= 0
                ? "platform-profile-positive"
                : "platform-profile-negative"
            }
          >
            {formatSignedPercentage(returnPercentage)}
          </strong>
          <small>Bendra platformos grąža</small>
        </article>

        <article className="platform-profile-stat-card">
          <span>XIRR</span>
          <strong
            className={
              Number.isFinite(xirr) && xirr < 0
                ? "platform-profile-negative"
                : "platform-profile-positive"
            }
          >
            {Number.isFinite(xirr)
              ? formatSignedPercentage(xirr)
              : "Skaičiuojama…"}
          </strong>
          <small>Metinė svertinė grąža</small>
        </article>
      </section>

      <section className="platform-profile-insights">
        <article>
          <span>Investavimo pradžia</span>
          <strong>{formatDate(analytics.startDate)}</strong>
          <small>{formatMonths(analytics.months)} istorijos</small>
        </article>

        <article>
          <span>Didžiausia vertė</span>
          <strong>{formatCurrency(analytics.highestValue)}</strong>
          <small>Aukščiausias istorinis taškas</small>
        </article>

        <article>
          <span>Vid. mėnesio grąža</span>
          <strong
            className={
              analytics.averageMonthlyReturn >= 0
                ? "platform-profile-positive"
                : "platform-profile-negative"
            }
          >
            {formatSignedPercentage(analytics.averageMonthlyReturn)}
          </strong>
          <small>Eliminavus įnašų ir išėmimų įtaką</small>
        </article>

        <article>
          <span>Didžiausias nuosmukis</span>
          <strong
            className={
              analytics.maxDrawdown < 0
                ? "platform-profile-negative"
                : ""
            }
          >
            {Number(analytics.maxDrawdown) < 0
              ? formatSignedPercentage(analytics.maxDrawdown)
              : "Nebuvo"}
          </strong>
          <small>Nuo ankstesnės aukščiausios vertės</small>
        </article>
      </section>

      <section className="platform-profile-analysis">
        <div className="platform-profile-analysis-header">
          <div>
            <p>PERFORMANCE</p>
            <h2>Investicinė analizė</h2>
            <span>
              Rodikliai apskaičiuoti eliminuojant papildomų įnašų ir
              išėmimų įtaką.
            </span>
          </div>

          {latestMonthlyPerformance && (
            <div className="platform-profile-latest-month">
              <span>Paskutinis mėnuo</span>
              <strong>{formatMonth(latestMonthlyPerformance.date)}</strong>
              <b
                className={
                  Number(latestMonthlyPerformance.monthlyProfit) >= 0
                    ? "platform-profile-positive"
                    : "platform-profile-negative"
                }
              >
                {formatSignedCurrency(
                  latestMonthlyPerformance.monthlyProfit,
                )}
              </b>
              <small
                className={
                  Number(latestMonthlyPerformance.monthlyReturn) >= 0
                    ? "platform-profile-positive"
                    : "platform-profile-negative"
                }
              >
                {formatSignedPercentage(
                  latestMonthlyPerformance.monthlyReturn,
                )}
              </small>
            </div>
          )}
        </div>

        <div className="platform-profile-performance-metrics">
          <article>
            <span>Vid. mėnesio grąža</span>
            <strong
              className={
                Number(analytics.averageMonthlyReturn) >= 0
                  ? "platform-profile-positive"
                  : "platform-profile-negative"
              }
            >
              {formatSignedPercentage(analytics.averageMonthlyReturn)}
            </strong>
          </article>

          <article>
            <span>Geriausias mėnuo</span>
            <strong className="platform-profile-positive">
              {formatSignedPercentage(analytics.bestMonth)}
            </strong>
          </article>

          <article>
            <span>Blogiausias mėnuo</span>
            <strong
              className={
                Number(analytics.worstMonth) < 0
                  ? "platform-profile-negative"
                  : ""
              }
            >
              {formatSignedPercentage(analytics.worstMonth)}
            </strong>
          </article>

          <article>
            <span>Augusių mėnesių dalis</span>
            <strong>{formatPercentage(analytics.winningRate)}</strong>
            <div className="platform-profile-winning-track">
              <span
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, Number(analytics.winningRate) || 0)
                  )}%`,
                }}
              />
            </div>
            <small>
              {analytics.winningMonths ?? 0} / {completedMonths || 0} mėnesių
            </small>
          </article>

          <article>
            <span>Svyravimas</span>
            <strong>{formatPercentage(analytics.volatility)}</strong>
            <small>Mėnesinių rezultatų standartinis nuokrypis</small>
          </article>

          <article>
            <span>Didžiausias nuosmukis</span>
            <strong
              className={
                Number(analytics.maxDrawdown) < 0
                  ? "platform-profile-negative"
                  : ""
              }
            >
              {Number(analytics.maxDrawdown) < 0
              ? formatSignedPercentage(analytics.maxDrawdown)
              : "Nebuvo"}
            </strong>
            <small>Faktinės portfelio vertės nuosmukis nuo piko</small>
          </article>
        </div>
      </section>

      <section className="platform-profile-monthly-card">
        <div className="platform-profile-analysis-header">
          <div>
            <p>MĖNESINIAI REZULTATAI</p>
            <h2>Įnašai, pelnas ir grąža</h2>
            <span>
              Naujausi mėnesiai pateikiami pirmiausia.
            </span>
          </div>
        </div>

        {monthlyPerformance.length > 0 ? (
          <>
            <div className="platform-profile-monthly-table-wrap">
            <table className="platform-profile-monthly-table">
              <thead>
                <tr>
                  <th>Mėnuo</th>
                  <th>Ankstesnė vertė</th>
                  <th>Įnašas / išėmimas</th>
                  <th>Mėnesio pelnas</th>
                  <th>Mėnesio grąža</th>
                  <th>Dabartinė vertė</th>
                </tr>
              </thead>

              <tbody>
                {monthlyPerformance.map((point) => {
                  const monthlyReturn = Number(point.monthlyReturn);
                  const monthlyProfit = Number(point.monthlyProfit);
                  const cashFlow = Number(point.cashFlow);

                  return (
                    <tr
                      key={point.date}
                      className={
                        point.date === latestMonthlyPerformance?.date
                          ? "platform-profile-latest-row"
                          : ""
                      }
                    >
                      <td>
                        <strong>{formatMonth(point.date)}</strong>
                      </td>
                      <td>{formatCurrency(point.previousValue)}</td>
                      <td
                        className={
                          cashFlow > 0
                            ? "platform-profile-cashflow-positive"
                            : cashFlow < 0
                              ? "platform-profile-cashflow-negative"
                              : ""
                        }
                      >
                        {formatSignedCurrency(cashFlow)}
                      </td>
                      <td
                        className={
                          monthlyProfit >= 0
                            ? "platform-profile-positive"
                            : "platform-profile-negative"
                        }
                      >
                        {formatSignedCurrency(monthlyProfit)}
                      </td>
                      <td
                        className={
                          monthlyReturn >= 0
                            ? "platform-profile-positive"
                            : "platform-profile-negative"
                        }
                      >
                        {formatSignedPercentage(monthlyReturn)}
                      </td>
                      <td>{formatCurrency(point.currentValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="platform-profile-investment-summary">
            <div>
              <span>Istorija</span>
              <strong>{formatMonths(analytics.months)}</strong>
            </div>

            <div>
              <span>Vidutinė grąža</span>
              <strong
                className={
                  Number(analytics.averageMonthlyReturn) >= 0
                    ? "platform-profile-positive"
                    : "platform-profile-negative"
                }
              >
                {formatSignedPercentage(analytics.averageMonthlyReturn)}
              </strong>
            </div>

            <div>
              <span>Geriausias mėnuo</span>
              <strong className="platform-profile-positive">
                {formatSignedPercentage(analytics.bestMonth)}
              </strong>
            </div>

            <div>
              <span>Blogiausias mėnuo</span>
              <strong
                className={
                  Number(analytics.worstMonth) < 0
                    ? "platform-profile-negative"
                    : "platform-profile-positive"
                }
              >
                {formatSignedPercentage(analytics.worstMonth)}
              </strong>
            </div>

            <div>
              <span>Bendras mėnesių pelnas</span>
              <strong
                className={
                  historyProfit >= 0
                    ? "platform-profile-positive"
                    : "platform-profile-negative"
                }
              >
                {formatSignedCurrency(historyProfit)}
              </strong>
            </div>
            </div>
          </>
        ) : (
          <div className="platform-profile-monthly-empty">
            Mėnesinei analizei dar nepakanka istorinių duomenų.
          </div>
        )}
      </section>

      {isBrokerageModule && platformCashflow && (
        <section className="platform-profile-brokerage-cashflow">
          <div className="platform-profile-analysis-header">
            <div>
              <p>BROKERIO PINIGŲ SRAUTAI</p>
              <h2>Revolut Brokerage suvestinė</h2>
              <span>
                Įnašai, dividendai, mokesčiai ir laisvų pinigų likutis.
              </span>
            </div>
          </div>

          <div className="platform-profile-brokerage-grid">
            <article>
              <span>Įnešta</span>
              <strong>{formatCurrency(platformCashflow.deposited)}</strong>
              <small>Bendra į brokerį pervesta suma</small>
            </article>

            <article>
              <span>Išvesta</span>
              <strong>{formatCurrency(platformCashflow.withdrawn)}</strong>
              <small>Bendra iš brokerio išvesta suma</small>
            </article>

            <article>
              <span>Dividendai</span>
              <strong className="platform-profile-positive">
                {formatCurrency(platformCashflow.dividends)}
              </strong>
              <small>Visa gauta dividendų suma</small>
            </article>

            <article>
              <span>Mokesčiai</span>
              <strong
                className={
                  Number(platformCashflow.fees) > 0
                    ? "platform-profile-negative"
                    : ""
                }
              >
                {formatCurrency(platformCashflow.fees)}
              </strong>
              <small>Pirkimo ir pardavimo mokesčiai</small>
            </article>

            <article>
              <span>Grynieji</span>
              <strong>{formatCurrency(platformCashflow.cash)}</strong>
              <small>Neinvestuotas brokerio likutis</small>
            </article>
          </div>
        </section>
      )}

      <section className="platform-profile-grid">
        <article className="platform-profile-card platform-profile-share-card">
          <div className="platform-profile-card-header">
            <div>
              <p>PORTFELIO STRUKTŪRA</p>
              <h2>Portfelio dalis</h2>
            </div>

            <strong>{formatPercentage(portfolioShare)}</strong>
          </div>

          <ProgressBar value={portfolioShare} showLabel={false} />

          <div className="platform-profile-share-footer">
            <span>{name}</span>
            <span>{formatCurrency(currentValue)}</span>
          </div>
        </article>

        <article className="platform-profile-card">
          <div className="platform-profile-card-header">
            <div>
              <p>INFORMACIJA</p>
              <h2>Platformos duomenys</h2>
            </div>
          </div>

          <dl className="platform-profile-details">
            <div>
              <dt>Statusas</dt>
              <dd>{active ? "Aktyvi" : "Neaktyvi"}</dd>
            </div>

            <div>
              <dt>Kategorija</dt>
              <dd>{category}</dd>
            </div>

            <div>
              <dt>Valiuta</dt>
              <dd>{currency}</dd>
            </div>

            <div>
              <dt>Portfelio dalis</dt>
              <dd>{formatPercentage(portfolioShare)}</dd>
            </div>

            <div>
              <dt>Investuojama nuo</dt>
              <dd>{formatDate(analytics.startDate)}</dd>
            </div>

            <div>
              <dt>Istorijos ilgis</dt>
              <dd>{formatMonths(analytics.months)}</dd>
            </div>
          </dl>
        </article>

        <PerformanceChart
          history={platformHistory}
          currentValue={currentValue}
          eyebrow="Platformos rezultatas"
          title="Platformos vertės istorija"
          description="Platformos vertės ir investuotos sumos pokytis pagal pasirinktą laikotarpį."
          valueLabel="Platformos vertė"
          investedLabel="Investuota"
          totalLabel="Dabartinė vertė"
          showPeriodResult
          className="platform-profile-performance-chart"
          height={420}
        />

        <article className="platform-profile-card platform-profile-notes-card">
          <div className="platform-profile-card-header">
            <div>
              <p>PASTABOS</p>
              <h2>Papildoma informacija</h2>
            </div>
          </div>

          <p className="platform-profile-notes">
            {platform?.notes ??
              platform?.description ??
              "Papildomų pastabų apie šią platformą kol kas nėra."}
          </p>

          {platform?.website && (
            <a
              className="platform-profile-link"
              href={platform.website}
              target="_blank"
              rel="noreferrer"
            >
              Atidaryti platformos svetainę
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </article>
      </section>

      {isBrokerModule && (
        <BrokerProfileModule
          platform={platform}
          details={details}
        />
      )}

      {isRealEstateModule && (
        <RealEstateProfileModule
          details={details}
          platformName={name}
        />
      )}

      {isP2PModule && !isRealEstateModule && (
        <P2PProfileModule
          details={details}
          platformName={name}
        />
      )}

      {isNplModule && (
        <NplProfileModule
          details={details}
          platformName={name}
          platformSlug={slug}
        />
      )}

      {hasInvestmentModule &&
        !isBrokerModule &&
        !isP2PModule &&
        !isRealEstateModule &&
        !isNplModule && (
        <div className="platform-profile-etf-module">
          <div className="platform-profile-etf-module-heading">
            <div>
              <p>INVESTICIJŲ SUDĖTIS</p>
              <h2>{investmentModuleTitle}</h2>
              <span>
                {investmentModuleDescription}
              </span>
            </div>

            <div className="platform-profile-etf-summary">
              <div>
                <span>Aktyvūs</span>
                <strong>{activeEtfs.length}</strong>
              </div>

              <div>
                <span>Parduoti</span>
                <strong>{soldEtfs.length}</strong>
              </div>
            </div>
          </div>

          <section className="platform-profile-brokerage-overview">
              <article className="platform-profile-allocation-card">
                <div className="platform-profile-brokerage-card-header">
                  <div>
                    <p>
                      {isBrokerageModule
                        ? "PORTFELIO ALLOCATION"
                        : "ETF PASKIRSTYMAS"}
                    </p>
                    <h3>
                      {isBrokerageModule
                        ? "Aktyvių pozicijų paskirstymas"
                        : "Aktyvių ETF paskirstymas"}
                    </h3>
                  </div>
                  <strong>{formatCurrency(brokerageAllocationTotal)}</strong>
                </div>

                <div className="platform-profile-allocation-list">
                  {brokerageAllocation.map((position) => {
                    const share =
                      brokerageAllocationTotal > 0
                        ? (position.value / brokerageAllocationTotal) * 100
                        : 0;

                    return (
                      <div
                        className="platform-profile-allocation-row"
                        key={`${position.ticker}-${position.name}`}
                      >
                        <div className="platform-profile-allocation-label">
                          <span>{position.ticker}</span>
                          <small title={position.name}>{position.name}</small>
                        </div>

                        <div className="platform-profile-allocation-bar">
                          <span style={{ width: `${Math.min(100, share)}%` }}>
                            {share >= 18 && (
                              <b>{formatPercentage(share)}</b>
                            )}
                          </span>
                        </div>

                        <div className="platform-profile-allocation-value">
                          <strong>{formatPercentage(share)}</strong>
                          <small>{formatCurrency(position.value)}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="platform-profile-allocation-footer">
                  <div>
                    <span>
                      {isBrokerageModule ? "Aktyvios pozicijos" : "Aktyvūs ETF"}
                    </span>
                    <strong>{activeEtfs.length}</strong>
                  </div>

                  <div>
                    <span>Bendra vertė</span>
                    <strong>{formatCurrency(activePositionsValue)}</strong>
                  </div>

                  <div>
                    <span>Vid. grąža</span>
                    <strong
                      className={
                        averageActiveReturn >= 0
                          ? "platform-profile-positive"
                          : "platform-profile-negative"
                      }
                    >
                      {formatSignedPercentage(averageActiveReturn)}
                    </strong>
                  </div>
                </div>
              </article>

              <article className="platform-profile-broker-stats-card">
                <div className="platform-profile-brokerage-card-header">
                  <div>
                    <p>
                      {isBrokerageModule ? "BROKER STATISTICS" : "ETF STATISTIKA"}
                    </p>
                    <h3>
                      {isBrokerageModule ? "Brokerio statistika" : "ETF statistika"}
                    </h3>
                  </div>
                </div>

                <div className="platform-profile-broker-stats-grid">
                  <div>
                    <i aria-hidden="true">●</i>
                    <span>
                      {isBrokerageModule ? "Aktyvios pozicijos" : "Aktyvūs ETF"}
                    </span>
                    <strong>{activeEtfs.length}</strong>
                  </div>
                  <div>
                    <i aria-hidden="true">✓</i>
                    <span>
                      {isBrokerageModule ? "Parduotos pozicijos" : "Parduoti ETF"}
                    </span>
                    <strong>{soldEtfs.length}</strong>
                  </div>

                  {isBrokerageModule ? (
                    <>
                      <div>
                        <i aria-hidden="true">€</i>
                        <span>Dividendai</span>
                        <strong className="platform-profile-positive">
                          {formatCurrency(platformCashflow.dividends)}
                        </strong>
                      </div>
                      <div>
                        <i aria-hidden="true">−</i>
                        <span>Komisiniai</span>
                        <strong
                          className={
                            Number(platformCashflow.fees) > 0
                              ? "platform-profile-negative"
                              : ""
                          }
                        >
                          {formatCurrency(platformCashflow.fees)}
                        </strong>
                      </div>
                      <div>
                        <i aria-hidden="true">◇</i>
                        <span>Laisvi pinigai</span>
                        <strong>{formatCurrency(platformCashflow.cash)}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <i aria-hidden="true">€</i>
                        <span>Investuota</span>
                        <strong>{formatCurrency(invested)}</strong>
                      </div>
                      <div>
                        <i aria-hidden="true">◇</i>
                        <span>Dabartinė vertė</span>
                        <strong>{formatCurrency(currentValue)}</strong>
                      </div>
                      <div>
                        <i aria-hidden="true">%</i>
                        <span>Vid. aktyvių ETF grąža</span>
                        <strong
                          className={
                            averageActiveReturn >= 0
                              ? "platform-profile-positive"
                              : "platform-profile-negative"
                          }
                        >
                          {formatSignedPercentage(averageActiveReturn)}
                        </strong>
                      </div>
                    </>
                  )}

                  <div>
                    <i aria-hidden="true">↔</i>
                    <span>
                      {isBrokerageModule
                        ? "Vid. pozicijos dydis"
                        : "Vid. ETF pozicijos dydis"}
                    </span>
                    <strong>{formatCurrency(averagePositionValue)}</strong>
                  </div>
                </div>
              </article>

              <article className="platform-profile-position-highlight winner">
                <span className="platform-profile-position-highlight-icon">↗</span>
                <div>
                  <p>{isBrokerageModule ? "TOP GAINER" : "GERIAUSIAS ETF"}</p>
                  <h3>{topGainer?.ticker ?? topGainer?.symbol ?? "—"}</h3>
                  <small>{topGainer?.name ?? "Aktyvi pozicija"}</small>
                </div>
                <div className="platform-profile-position-highlight-result">
                  <strong className="platform-profile-positive">
                    {topGainer
                      ? formatSignedPercentage(topGainer.calculatedReturn)
                      : "—"}
                  </strong>
                  <small>
                    {topGainer
                      ? formatCurrency(
                          topGainer.value ?? topGainer.currentValue,
                        )
                      : "—"}
                  </small>
                </div>
              </article>

              <article className="platform-profile-position-highlight weakest">
                <span className="platform-profile-position-highlight-icon">↘</span>
                <div>
                  <p>
                    {isBrokerageModule ? "WEAKEST POSITION" : "SILPNIAUSIAS ETF"}
                  </p>
                  <h3>
                    {weakestPosition?.ticker ?? weakestPosition?.symbol ?? "—"}
                  </h3>
                  <small>{weakestPosition?.name ?? "Aktyvi pozicija"}</small>
                </div>
                <div className="platform-profile-position-highlight-result">
                  <strong
                    className={
                      Number(weakestPosition?.calculatedReturn) >= 0
                        ? "platform-profile-positive"
                        : "platform-profile-negative"
                    }
                  >
                    {weakestPosition
                      ? formatSignedPercentage(
                          weakestPosition.calculatedReturn,
                        )
                      : "—"}
                  </strong>
                  <small>
                    {weakestPosition
                      ? formatCurrency(
                          weakestPosition.value ??
                            weakestPosition.currentValue,
                        )
                      : "—"}
                  </small>
                </div>
              </article>
            </section>

          <EtfTable
            eyebrow="AKTYVIOS POZICIJOS"
            title={isBrokerageModule ? "Aktyvios pozicijos" : "Aktyvūs ETF"}
            holdings={activeEtfs}
            emptyMessage={
              isBrokerageModule
                ? "Aktyvių pozicijų nerasta."
                : "Aktyvių ETF pozicijų nerasta."
            }
          />

          <EtfTable
            eyebrow="REALIZUOTOS POZICIJOS"
            title={isBrokerageModule ? "Parduotos pozicijos" : "Parduoti ETF"}
            holdings={soldEtfs}
            sold
            emptyMessage={
              isBrokerageModule
                ? "Parduotų pozicijų nerasta."
                : "Parduotų ETF pozicijų nerasta."
            }
          />
        </div>
      )}
    </main>
  );
}

export default PlatformProfile;