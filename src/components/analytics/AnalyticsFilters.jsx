const FILTERS = [
  { value: "all", label: "Visas portfelis" },
  { value: "market", label: "Fondai / Brokeriai" },
  { value: "alternative", label: "P2P ir alternatyvos" },
];

function AnalyticsFilters({
  value,
  onChange,
  showInactive,
  onShowInactiveChange,
  inactiveCount = 0,
}) {
  return (
    <div className="analytics-filter-bar">
      <div>
        <span className="analytics-filter-label">Analizės sritis</span>
        <strong>
          Pasirinkus sritį, perskaičiuojami visi žemiau esantys moduliai.
        </strong>
      </div>

      <div className="analytics-filter-actions">
        <div className="analytics-filter-options">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`analytics-filter-button ${
                value === filter.value ? "is-active" : ""
              }`}
              onClick={() => onChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="analytics-history-toggle">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) =>
              onShowInactiveChange(event.target.checked)
            }
          />

          <span className="analytics-history-switch" aria-hidden="true">
            <span />
          </span>

          <span className="analytics-history-copy">
            <strong>Įtraukti neaktyvias</strong>
            <small>{inactiveCount} istorinės platformos</small>
          </span>
        </label>
      </div>
    </div>
  );
}

export default AnalyticsFilters;