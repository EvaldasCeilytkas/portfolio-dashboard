function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("lt-LT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value));
}

function formatPercent(value) {
  return `${new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number(value))} %`;
}

export default function AllocationPanel({ data }) {
  const allocation = Array.isArray(data?.allocation) ? data.allocation : [];

  let cursor = 0;

  const segments = allocation.map((item, index) => {
    const start = cursor;
    cursor += number(item.share);

    return `hsl(${202 + index * 28} 82% 58%) ${start}% ${cursor}%`;
  });

  const background = segments.length
    ? `conic-gradient(${segments.join(", ")})`
    : "conic-gradient(rgba(148,163,184,.14) 0 100%)";

  return (
    <article className="dashboard-card dashboard-allocation-card">
      <header className="dashboard-card-header">
        <div>
          <span>ALLOCATION</span>
          <h2>Turto paskirstymas</h2>
          <p>Portfelio struktūra pagal pagrindines turto grupes.</p>
        </div>
      </header>

      <div className="dashboard-allocation-content">
        <div className="dashboard-donut" style={{ background }}>
          <div>
            <span>Portfelis</span>
            <strong>{formatCurrency(data?.currentValue)}</strong>
            <small>{allocation.length} turto grupės</small>
          </div>
        </div>

        <div className="dashboard-allocation-list">
          {allocation.map((item, index) => (
            <div
              className="dashboard-allocation-row"
              key={item.key || item.label}
              style={{ "--hue": 202 + index * 28 }}
            >
              <i />

              <div className="dashboard-allocation-name">
                <strong>{item.label}</strong>
                <small>Investuota</small>
                <b>{formatCurrency(item.invested)}</b>
              </div>

              <div className="dashboard-allocation-value">
                <strong>{formatCurrency(item.value)}</strong>
                <small>{formatPercent(item.share)}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
