import EtfTableRow from "./EtfTableRow";

function EtfTable({
  title,
  eyebrow,
  holdings,
  sold = false,
  emptyMessage,
}) {
  const items = Array.isArray(holdings) ? holdings : [];

  const totalValue = items.reduce(
    (sum, item) => sum + Number(item?.value ?? 0),
    0,
  );

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
        <div className="etf-table-scroll">
          <table className="etf-table">
            <thead>
              <tr>
                <th>ETF</th>
                <th>Statusas</th>
                <th>Investuota</th>
                <th>{sold ? "Parduota" : "Vertė"}</th>
                <th>Pelnas</th>
                <th>Grąža</th>
                <th>XIRR</th>
                {!sold && <th>Dalis</th>}
                <th aria-label="Veiksmas" />
              </tr>
            </thead>

            <tbody>
              {items.map((holding, index) => (
                <EtfTableRow
                  key={holding?.id ?? holding?.ticker ?? index}
                  holding={holding}
                  sold={sold}
                  totalValue={totalValue}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="platform-profile-etf-empty">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}

export default EtfTable;