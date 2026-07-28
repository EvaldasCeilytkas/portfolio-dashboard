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

function formatQuantity(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("lt-LT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6,
  }).format(numericValue);
}

function EtfCard({ holding, sold = false }) {
  const ticker = holding?.ticker ?? holding?.id ?? "ETF";
  const name = holding?.name ?? ticker;
  const invested = Number(holding?.invested ?? 0);
  const value = Number(holding?.value ?? 0);
  const soldValue = Number(holding?.soldValue ?? 0);
  const profit = Number(holding?.profit ?? 0);
  const returnRate = Number(holding?.returnRate ?? 0);
  const quantity = Number(holding?.quantity ?? 0);
  const xirr = Number(holding?.xirr);
  const dividends = Number(holding?.dividends ?? 0);

  return (
    <article className={`etf-card ${sold ? "sold" : "active"}`}>
      <div className="etf-card-top">
        <div>
          <div className="etf-card-title-row">
            <span className="etf-card-ticker">{ticker}</span>

            <span className={`etf-card-status ${sold ? "sold" : "active"}`}>
              <span className="etf-card-status-dot" />
              {sold ? "Parduotas" : "Aktyvus"}
            </span>
          </div>

          <h3>{name}</h3>
        </div>

        <strong
          className={
            returnRate >= 0
              ? "platform-profile-positive"
              : "platform-profile-negative"
          }
        >
          {formatPercentage(returnRate)}
        </strong>
      </div>

      <div className="etf-card-main-value">
        <span>{sold ? "Pardavimo vertė" : "Dabartinė vertė"}</span>
        <strong>{formatCurrency(sold ? soldValue : value)}</strong>
      </div>

      <dl className="etf-card-details">
        <div>
          <dt>Investuota</dt>
          <dd>{formatCurrency(invested)}</dd>
        </div>

        <div>
          <dt>Pelnas</dt>
          <dd
            className={
              profit >= 0
                ? "platform-profile-positive"
                : "platform-profile-negative"
            }
          >
            {formatCurrency(profit)}
          </dd>
        </div>

        {!sold && (
          <div>
            <dt>Vienetai</dt>
            <dd>{formatQuantity(quantity)}</dd>
          </div>
        )}

        <div>
          <dt>Dividendai</dt>
          <dd>{formatCurrency(dividends)}</dd>
        </div>

        <div>
          <dt>XIRR</dt>
          <dd>
            {Number.isFinite(xirr) ? formatPercentage(xirr) : "—"}
          </dd>
        </div>
      </dl>

      <div className="etf-card-footer">
        <span>ETF profilis</span>
        <span aria-hidden="true">→</span>
      </div>
    </article>
  );
}

export default EtfCard;