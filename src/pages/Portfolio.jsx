import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import ProgressBar from "../components/ui/ProgressBar";
import { usePortfolio } from "../hooks/usePortfolio";

import "../styles/portfolio.css";

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
    platform?.profit ??
      platform?.totalProfit ??
      platform?.gain,
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

function isPlatformActive(platform) {
  return platform?.active !== false;
}

function createPlatformSlug(platformName) {
  return String(platformName || "")
    .trim()
    .toLocaleLowerCase("lt-LT")
    .replaceAll(" ", "-");
}

function Portfolio() {
  const navigate = useNavigate();
  const { portfolio, loading, errorMessage } = usePortfolio();
  const [statusFilter, setStatusFilter] = useState("active");

  const platforms = useMemo(() => {
    if (!Array.isArray(portfolio?.platforms)) {
      return [];
    }

    return portfolio.platforms;
  }, [portfolio]);

  const activePlatformsCount = useMemo(
    () => platforms.filter(isPlatformActive).length,
    [platforms],
  );

  const inactivePlatformsCount = useMemo(
    () => platforms.filter((platform) => !isPlatformActive(platform)).length,
    [platforms],
  );

  const filteredPlatforms = useMemo(() => {
    if (statusFilter === "active") {
      return platforms.filter(isPlatformActive);
    }

    if (statusFilter === "inactive") {
      return platforms.filter((platform) => !isPlatformActive(platform));
    }

    return platforms;
  }, [platforms, statusFilter]);

  const sortedPlatforms = useMemo(() => {
    return [...filteredPlatforms].sort(
      (firstPlatform, secondPlatform) =>
        getCurrentValue(secondPlatform) -
        getCurrentValue(firstPlatform),
    );
  }, [filteredPlatforms]);

  const totalPortfolioValue = useMemo(() => {
    const explicitPortfolioValue = Number(portfolio?.portfolioValue);

    if (Number.isFinite(explicitPortfolioValue)) {
      return explicitPortfolioValue;
    }

    return platforms.reduce(
      (total, platform) => total + getCurrentValue(platform),
      0,
    );
  }, [portfolio, platforms]);

  const filteredPortfolioValue = useMemo(() => {
    return sortedPlatforms.reduce(
      (total, platform) => total + getCurrentValue(platform),
      0,
    );
  }, [sortedPlatforms]);

  const totalInvested = useMemo(() => {
    return sortedPlatforms.reduce(
      (total, platform) => total + getInvestedValue(platform),
      0,
    );
  }, [sortedPlatforms]);

  const totalProfit = filteredPortfolioValue - totalInvested;

  const totalReturnPercentage =
    totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  if (loading) {
    return (
      <main className="portfolio-page">
        <section className="portfolio-loading">
          Kraunami portfelio duomenys...
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="portfolio-page">
        <section className="portfolio-error">
          <h2>Nepavyko įkelti portfelio</h2>
          <p>{errorMessage}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="portfolio-page">
      <section className="portfolio-header">
        <div>
          <p className="portfolio-eyebrow">
            PORTFOLIO ANALYTICS
          </p>

          <h1>Portfelis</h1>

          <p className="portfolio-description">
            Visų investavimo platformų vertė, rezultatai ir portfelio dalis.
          </p>
        </div>

        <div className="portfolio-summary-card">
          <span className="portfolio-summary-label">
            Bendra portfelio vertė
          </span>

          <strong className="portfolio-summary-value">
            {formatCurrency(totalPortfolioValue)}
          </strong>

          <span className="portfolio-summary-platforms">
            {activePlatformsCount} aktyvių ·{" "}
            {inactivePlatformsCount} neaktyvių
          </span>
        </div>
      </section>

      <section className="portfolio-statistics">
        <article className="portfolio-stat-card">
          <span>Rodoma vertė</span>
          <strong>{formatCurrency(filteredPortfolioValue)}</strong>
        </article>

        <article className="portfolio-stat-card">
          <span>Investuota</span>
          <strong>{formatCurrency(totalInvested)}</strong>
        </article>

        <article className="portfolio-stat-card">
          <span>Pelnas</span>

          <strong
            className={
              totalProfit >= 0
                ? "portfolio-positive"
                : "portfolio-negative"
            }
          >
            {formatCurrency(totalProfit)}
          </strong>
        </article>

        <article className="portfolio-stat-card">
          <span>Grąža</span>

          <strong
            className={
              totalReturnPercentage >= 0
                ? "portfolio-positive"
                : "portfolio-negative"
            }
          >
            {formatPercentage(totalReturnPercentage)}
          </strong>
        </article>
      </section>

      <section className="portfolio-content-card">
        <div className="portfolio-toolbar">
          <div>
            <h2>Investavimo platformos</h2>

            <p>
              Rodoma platformų: {sortedPlatforms.length}
            </p>
          </div>

          <div
            className="portfolio-filter"
            role="group"
            aria-label="Platformų filtras"
          >
            <button
              type="button"
              className={
                statusFilter === "active"
                  ? "portfolio-filter-button active"
                  : "portfolio-filter-button"
              }
              onClick={() => setStatusFilter("active")}
            >
              Aktyvios
              <span>{activePlatformsCount}</span>
            </button>

            <button
              type="button"
              className={
                statusFilter === "inactive"
                  ? "portfolio-filter-button active"
                  : "portfolio-filter-button"
              }
              onClick={() => setStatusFilter("inactive")}
            >
              Neaktyvios
              <span>{inactivePlatformsCount}</span>
            </button>

            <button
              type="button"
              className={
                statusFilter === "all"
                  ? "portfolio-filter-button active"
                  : "portfolio-filter-button"
              }
              onClick={() => setStatusFilter("all")}
            >
              Visos
              <span>{platforms.length}</span>
            </button>
          </div>
        </div>

        {sortedPlatforms.length === 0 ? (
          <div className="portfolio-empty">
            Šiame filtre platformų nėra.
          </div>
        ) : (
          <div className="portfolio-table-wrapper">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Platforma</th>
                  <th>Statusas</th>
                  <th className="portfolio-number-column">
                    Investuota
                  </th>
                  <th className="portfolio-number-column">
                    Vertė
                  </th>
                  <th className="portfolio-number-column">
                    Pelnas
                  </th>
                  <th className="portfolio-number-column">
                    Grąža
                  </th>
                  <th>Dalis</th>
                </tr>
              </thead>

              <tbody>
                {sortedPlatforms.map((platform, index) => {
                  const name = getPlatformName(platform);
                  const invested = getInvestedValue(platform);
                  const currentValue = getCurrentValue(platform);
                  const profit = getProfitValue(platform);
                  const returnPercentage =
                    getReturnPercentage(platform);

                  const portfolioShare =
                    totalPortfolioValue > 0
                      ? (currentValue / totalPortfolioValue) * 100
                      : 0;

                  const active = isPlatformActive(platform);

                  return (
                    <tr
                      key={
                        platform?.id ??
                        platform?.slug ??
                        `${name}-${index}`
                      }
                      className="portfolio-clickable-row"
                      role="link"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/platforms/${createPlatformSlug(name)}`,
                        )
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" ||
                          event.key === " "
                        ) {
                          event.preventDefault();

                          navigate(
                            `/platforms/${createPlatformSlug(name)}`,
                          );
                        }
                      }}
                    >
                      <td>
                        <div className="portfolio-platform">
                          <div className="portfolio-platform-icon">
                            {name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <strong>{name}</strong>

                            <span>
                              {platform?.category ??
                                platform?.type ??
                                platform?.investmentType ??
                                "Investicija"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            active
                              ? "portfolio-status active"
                              : "portfolio-status inactive"
                          }
                        >
                          <span className="portfolio-status-dot" />
                          {active ? "Aktyvi" : "Neaktyvi"}
                        </span>
                      </td>

                      <td className="portfolio-number-column">
                        {formatCurrency(invested)}
                      </td>

                      <td className="portfolio-number-column">
                        <strong>
                          {formatCurrency(currentValue)}
                        </strong>
                      </td>

                      <td
                        className={`portfolio-number-column ${
                          profit >= 0
                            ? "portfolio-positive"
                            : "portfolio-negative"
                        }`}
                      >
                        {formatCurrency(profit)}
                      </td>

                      <td
                        className={`portfolio-number-column ${
                          returnPercentage >= 0
                            ? "portfolio-positive"
                            : "portfolio-negative"
                        }`}
                      >
                        {formatPercentage(returnPercentage)}
                      </td>

                      <td>
                        <div className="portfolio-share">
                          <ProgressBar
                            value={portfolioShare}
                            showLabel={false}
                          />

                          <span>
                            {formatPercentage(portfolioShare)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Portfolio;