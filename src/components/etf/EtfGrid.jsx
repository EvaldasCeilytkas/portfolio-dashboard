import EtfCard from "./EtfCard";

function EtfGrid({
  title,
  eyebrow,
  holdings,
  sold = false,
  emptyMessage,
}) {
  const items = Array.isArray(holdings) ? holdings : [];

  return (
    <section className="platform-profile-etf-section">
      <div className="platform-profile-etf-header">
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>

        <span className={`platform-profile-etf-count ${sold ? "sold" : ""}`}>
          {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="platform-profile-etf-grid">
          {items.map((holding, index) => (
            <EtfCard
              key={holding?.id ?? holding?.ticker ?? index}
              holding={holding}
              sold={sold}
            />
          ))}
        </div>
      ) : (
        <div className="platform-profile-etf-empty">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

export default EtfGrid;