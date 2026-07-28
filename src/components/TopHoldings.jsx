import { useState } from "react";

import "../styles/topholdings.css";

const PLATFORM_DISPLAY_NAMES = {
  "Revolut Brokerage": "Revolut",
};

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
    return "0,0 %";
  }

  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numericValue)} %`;
}

function getHoldingName(holding) {
  return (
    holding.name ||
    holding.platform ||
    holding.title ||
    holding.label ||
    "Nežinoma platforma"
  );
}

function getDisplayName(name) {
  return PLATFORM_DISPLAY_NAMES[name] || name;
}

function getHoldingValue(holding) {
  const possibleValue =
    holding.value ??
    holding.currentValue ??
    holding.current_value ??
    holding.amount ??
    holding.balance ??
    0;

  const numericValue = Number(possibleValue);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function getHoldingLogo(holding) {
  return (
    holding.logoUrl ||
    holding.logo_url ||
    holding.logo ||
    holding.icon ||
    ""
  );
}

function getHoldingInitial(name) {
  const firstCharacter = name?.trim()?.charAt(0);

  return firstCharacter
    ? firstCharacter.toLocaleUpperCase("lt-LT")
    : "?";
}

function HoldingLogo({ holding }) {
  const [imageFailed, setImageFailed] = useState(false);

  const logoUrl = getHoldingLogo(holding);
  const showImage = Boolean(logoUrl) && !imageFailed;

  return (
    <div className="top-holding-logo" aria-hidden="true">
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span>{getHoldingInitial(holding.name)}</span>
      )}
    </div>
  );
}

function TopHoldings({
  holdings = [],
  totalValue = 0,
  onViewAll,
  onHoldingClick,
}) {
  const normalizedHoldings = holdings
    .map((holding, index) => ({
      ...holding,
      originalIndex: index,
      name: getHoldingName(holding),
      value: getHoldingValue(holding),
    }))
    .filter((holding) => holding.value > 0)
    .sort((a, b) => b.value - a.value);

  const calculatedTotal = normalizedHoldings.reduce(
    (sum, holding) => sum + holding.value,
    0,
  );

  const portfolioTotal =
    Number(totalValue) > 0
      ? Number(totalValue)
      : calculatedTotal;

  const topHoldings = normalizedHoldings.slice(0, 5);

  return (
    <section className="top-holdings-card">
      <div className="top-holdings-header">
        <div>
          <p className="top-holdings-label">
            PORTFELIO SUDĖTIS
          </p>

          <h2>Didžiausios pozicijos</h2>
        </div>

        <button
          type="button"
          className="top-holdings-view-all"
          onClick={onViewAll}
        >
          Visos pozicijos
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {topHoldings.length > 0 ? (
        <div className="top-holdings-list">
          {topHoldings.map((holding) => {
            const portfolioPercentage =
              portfolioTotal > 0
                ? (holding.value / portfolioTotal) * 100
                : 0;

            const barWidth = Math.min(
              Math.max(portfolioPercentage, 0),
              100,
            );

            return (
              <button
                key={
                  holding.id ||
                  holding.slug ||
                  `${holding.name}-${holding.originalIndex}`
                }
                type="button"
                className="top-holding-item"
                onClick={() => onHoldingClick?.(holding)}
                aria-label={`Atidaryti platformą ${holding.name}`}
              >
                <HoldingLogo holding={holding} />

                <div className="top-holding-content">
                  <div className="top-holding-row">
                    <div className="top-holding-name">
                      {getDisplayName(holding.name)}
                    </div>

                    <div className="top-holding-values">
                      <strong>
                        {formatCurrency(holding.value)}
                      </strong>

                      <span>
                        {formatPercentage(
                          portfolioPercentage,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="top-holding-bar">
                    <div
                      className="top-holding-bar-fill"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>

                <div
                  className="top-holding-arrow"
                  aria-hidden="true"
                >
                  ›
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="top-holdings-empty">
          <p>
            Didžiausių pozicijų duomenų kol kas nėra.
          </p>
        </div>
      )}
    </section>
  );
}

export default TopHoldings;