import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import "../styles/platformallocationcard.css";

function number(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
}

function formatPercentage(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value))} %`;
}

function getInitials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

const SEGMENT_COLORS = [
  "#60a5fa",
  "#38d0e8",
  "#7c8df2",
  "#9b7ce8",
  "#48c9a9",
  "#42c7b8",
  "#f7c343",
  "#fb9141",
  "#eb65a8",
  "#94a3b8",
  "#38bdf8",
  "#4ade80",
  "#c084fc",
  "#facc15",
  "#67e8f9",
  "#a3e635",
];

function PlatformLogo({ platform }) {
  const [failed, setFailed] = useState(false);

  if (!platform?.logoUrl || failed) {
    return (
      <span className="platform-allocation-logo platform-allocation-logo-fallback">
        {getInitials(platform?.name)}
      </span>
    );
  }

  return (
    <img
      src={platform.logoUrl}
      alt=""
      className="platform-allocation-logo"
      onError={() => setFailed(true)}
    />
  );
}

function PlatformAllocationCard({
  platforms = [],
  totalValue = 0,
  portfolioShare = 0,
  title = "Alternatyvių investicijų paskirstymas",
  eyebrow = "PLATFORMŲ PASKIRSTYMAS",
  description = "Aktyvios alternatyvaus finansavimo platformos pagal dabartinę vertę.",
}) {
  const [activeIndex, setActiveIndex] = useState(null);

  const allocation = useMemo(() => {
    const activePlatforms = platforms
      .filter((platform) => platform?.active && number(platform?.value) > 0)
      .sort((a, b) => number(b.value) - number(a.value));

    const safeTotal =
      number(totalValue) > 0
        ? number(totalValue)
        : activePlatforms.reduce(
            (sum, platform) => sum + number(platform.value),
            0,
          );

    let currentDegree = 0;

    const rows = activePlatforms.map((platform, index) => {
      const share =
        safeTotal > 0 ? (number(platform.value) / safeTotal) * 100 : 0;

      const startDegree = currentDegree;
      const endDegree =
        index === activePlatforms.length - 1
          ? 360
          : currentDegree + share * 3.6;

      currentDegree = endDegree;

      return {
        ...platform,
        share,
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        startDegree,
        endDegree,
      };
    });

    const separatorColor = "#08101f";

    const gradient = rows.length
      ? rows
          .flatMap((platform) => {
            const segmentSize =
              platform.endDegree - platform.startDegree;

            const separatorSize = Math.min(
              0.34,
              Math.max(0.08, segmentSize * 0.055),
            );

            const visibleStart =
              platform.startDegree + separatorSize / 2;

            const visibleEnd =
              platform.endDegree - separatorSize / 2;

            return [
              `${separatorColor} ${platform.startDegree}deg ${visibleStart}deg`,
              `${platform.color} ${visibleStart}deg ${visibleEnd}deg`,
              `${separatorColor} ${visibleEnd}deg ${platform.endDegree}deg`,
            ];
          })
          .join(", ")
      : "rgba(148, 163, 184, 0.14) 0deg 360deg";

    return {
      rows,
      safeTotal,
      gradient,
    };
  }, [platforms, totalValue]);

  const highlightedPlatform =
    activeIndex !== null ? allocation.rows[activeIndex] : null;

  const donutBackground = highlightedPlatform
    ? allocation.rows
        .flatMap((platform, index) => {
          const segmentSize =
            platform.endDegree - platform.startDegree;

          const separatorSize = Math.min(
            0.34,
            Math.max(0.08, segmentSize * 0.055),
          );

          const visibleStart =
            platform.startDegree + separatorSize / 2;

          const visibleEnd =
            platform.endDegree - separatorSize / 2;

          const color =
            index === activeIndex
              ? platform.color
              : "rgba(71, 85, 105, 0.2)";

          return [
            `#08101f ${platform.startDegree}deg ${visibleStart}deg`,
            `${color} ${visibleStart}deg ${visibleEnd}deg`,
            `#08101f ${visibleEnd}deg ${platform.endDegree}deg`,
          ];
        })
        .join(", ")
    : allocation.gradient;

  return (
    <article className="platform-allocation-card">
      <header className="platform-allocation-header">
        <div>
          <p className="platform-allocation-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="platform-allocation-count">
          <strong>{allocation.rows.length}</strong>
          <span>aktyvių platformų</span>
        </div>
      </header>

      <div className="platform-allocation-content">
        <section className="platform-allocation-visual">
          <div
            className={`platform-allocation-donut ${
              highlightedPlatform ? "has-highlight" : ""
            }`}
            style={{
              background: `conic-gradient(${donutBackground})`,
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className="platform-allocation-donut-core">
              <span className="platform-allocation-center-label">
                {highlightedPlatform ? (
                  highlightedPlatform.name
                ) : (
                  <>
                    Alternatyvios
                    <br />
                    investicijos
                  </>
                )}
              </span>

              <strong>
                {highlightedPlatform
                  ? formatCurrency(highlightedPlatform.value)
                  : formatCurrency(allocation.safeTotal)}
              </strong>

              <span className="platform-allocation-center-share">
                {highlightedPlatform
                  ? formatPercentage(highlightedPlatform.share)
                  : `${formatPercentage(portfolioShare)} portfelio`}
              </span>
            </div>

            {allocation.rows.map((platform, index) => {
              const middleDegree =
                (platform.startDegree + platform.endDegree) / 2;
              const angle = middleDegree - 90;
              const radius = 48;
              const x =
                50 + Math.cos((angle * Math.PI) / 180) * radius;
              const y =
                50 + Math.sin((angle * Math.PI) / 180) * radius;

              return (
                <button
                  key={platform.slug || platform.name}
                  type="button"
                  aria-label={`${platform.name}: ${formatPercentage(
                    platform.share,
                  )}`}
                  className="platform-allocation-segment-target"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    borderColor: platform.color,
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onBlur={() => setActiveIndex(null)}
                />
              );
            })}
          </div>

          <div className="platform-allocation-summary">
            <div>
              <span>Bendra vertė</span>
              <strong>{formatCurrency(allocation.safeTotal)}</strong>
            </div>

            <div>
              <span>Dalis portfelyje</span>
              <strong>{formatPercentage(portfolioShare)}</strong>
            </div>
          </div>
        </section>

        <section className="platform-allocation-list">
          {allocation.rows.map((platform, index) => (
            <Link
              key={platform.slug || platform.name}
              to={`/portfolio/${platform.slug}`}
              className={`platform-allocation-row ${
                activeIndex === index ? "is-active" : ""
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(null)}
            >
              <PlatformLogo platform={platform} />

              <div className="platform-allocation-row-main">
                <div className="platform-allocation-row-top">
                  <div className="platform-allocation-platform-name">
                    <span
                      className="platform-allocation-color-bar"
                      style={{ background: platform.color }}
                    />
                    <div>
                      <strong>{platform.name}</strong>
                      <span>
                        {platform.category || platform.assetClass || "–"}
                      </span>
                    </div>
                  </div>

                  <div className="platform-allocation-row-values">
                    <strong>{formatCurrency(platform.value)}</strong>
                    <span>{formatPercentage(platform.share)}</span>
                  </div>
                </div>

                <div className="platform-allocation-track">
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, platform.share))}%`,
                      background: platform.color,
                    }}
                  />
                </div>
              </div>

            </Link>
          ))}
        </section>
      </div>
    </article>
  );
}

export default PlatformAllocationCard;