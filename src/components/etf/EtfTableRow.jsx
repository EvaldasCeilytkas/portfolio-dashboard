import { useNavigate, useParams } from "react-router-dom";

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

function EtfTableRow({ holding, sold = false, totalValue = 0 }) {
  const navigate = useNavigate();
  const { slug } = useParams();

  const ticker = holding?.ticker ?? holding?.symbol ?? holding?.id ?? "ETF";
  const name = holding?.name ?? ticker;

  const invested = Number(holding?.invested ?? 0);
  const value = Number(holding?.value ?? holding?.currentValue ?? 0);
  const soldValue = Number(holding?.soldValue ?? 0);
  const profit = Number(holding?.profit ?? 0);
  const returnRate = Number(holding?.returnRate ?? 0);
  const xirr = Number(holding?.xirr);

  const share =
    !sold && totalValue > 0
      ? (value / totalValue) * 100
      : 0;

  const openProfile = () => {
    navigate(
      `/platforms/${encodeURIComponent(slug)}/position/${encodeURIComponent(
        String(ticker).toUpperCase(),
      )}`,
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProfile();
    }
  };

  return (
    <tr
      className="etf-table-row"
      onClick={openProfile}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`Atidaryti ${ticker} pozicijos profilį`}
    >
      <td>
        <div className="etf-table-name-cell">
          <div className="etf-table-symbol">
            {String(ticker).toUpperCase()}
          </div>

          <div>
            <strong>{ticker}</strong>
            <span>{name}</span>
          </div>
        </div>
      </td>

      <td>
        <span className={`etf-table-status ${sold ? "sold" : "active"}`}>
          <span className="etf-table-status-dot" />
          {sold ? "Parduotas" : "Aktyvus"}
        </span>
      </td>

      <td className="etf-table-number">
        {formatCurrency(invested)}
      </td>

      <td className="etf-table-number">
        {formatCurrency(sold ? soldValue : value)}
      </td>

      <td
        className={`etf-table-number ${
          profit >= 0
            ? "platform-profile-positive"
            : "platform-profile-negative"
        }`}
      >
        {formatCurrency(profit)}
      </td>

      <td
        className={`etf-table-number ${
          returnRate >= 0
            ? "platform-profile-positive"
            : "platform-profile-negative"
        }`}
      >
        {formatPercentage(returnRate)}
      </td>

      <td className="etf-table-number">
        {Number.isFinite(xirr)
          ? formatPercentage(xirr)
          : "—"}
      </td>

      {!sold && (
        <td>
          <div className="etf-table-share">
            <span>{formatPercentage(share)}</span>

            <div className="etf-table-share-track">
              <div
                className="etf-table-share-fill"
                style={{ width: `${Math.min(Math.max(share, 0), 100)}%` }}
              />
            </div>
          </div>
        </td>
      )}

      <td className="etf-table-action">
        <span className="etf-table-action-label">ETF profilis</span>
        <span aria-hidden="true">→</span>
      </td>
    </tr>
  );
}

export default EtfTableRow;
