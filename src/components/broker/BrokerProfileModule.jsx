import { useMemo } from "react";

const money = (value) => new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
const percent = (value) => `${new Intl.NumberFormat("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} %`;
const tone = (value) => Number(value) > 0 ? "positive" : Number(value) < 0 ? "negative" : "";

function BrokerProfileModule({ platform, details }) {
  const active = useMemo(() => Array.isArray(details?.positions?.active) ? [...details.positions.active].sort((a,b) => Number(b?.value || 0) - Number(a?.value || 0)) : [], [details]);
  const sold = Array.isArray(details?.positions?.sold) ? details.positions.sold : [];
  if (!details?.modules?.broker) return null;

  const positions = active.length ? active : sold;
  const summary = details?.summary || {};
  const isFund = details?.type === "fund";
  const totalValue = Number(summary.currentValue ?? platform?.value) || 0;

  return (
    <div className="broker-module">
      <header className="broker-module-title">
        <div><p>INVESTICIJŲ SUDĖTIS</p><h2>{platform?.name} {isFund ? "fondai" : "portfelis"}</h2><span>Bendra visų brokerių puslapiams pritaikoma struktūra.</span></div>
        <strong>{positions.length}</strong>
      </header>

      {positions.length > 0 && (
        <section className="broker-module-grid">
          <article className="broker-allocation">
            <div className="broker-card-title"><div><p>PASKIRSTYMAS</p><h3>{isFund ? "Fondų paskirstymas" : "Robo paskirstymas"}</h3></div><strong>{money(totalValue)}</strong></div>
            <div className="broker-allocation-rows">
              {positions.map((position) => (
                <div className="broker-allocation-row" key={position.id}>
                  <div><strong>{position.ticker || position.name}</strong><span>{position.name}</span></div>
                  <div className="broker-track"><i style={{ width: `${Math.max(1, Number(position.share) || 0)}%` }} /></div>
                  <div><strong>{percent(position.share)}</strong><span>{money(position.value)}</span></div>
                </div>
              ))}
            </div>
          </article>

          <aside className="broker-summary">
            <p>STATISTIKA</p><h3>Portfelio statistika</h3>
            <div>
              <span>Aktyvios pozicijos</span><strong>{active.length}</strong>
              <span>Investuota</span><strong>{money(summary.invested ?? platform?.invested)}</strong>
              <span>Dabartinė vertė</span><strong>{money(totalValue)}</strong>
              <span>Bendra grąža</span><strong className={tone(summary.returnRate ?? platform?.returnRate)}>{percent(summary.returnRate ?? platform?.returnRate)}</strong>
            </div>
          </aside>
        </section>
      )}

      <section className="broker-table-card">
        <div className="broker-card-title"><div><p>{active.length ? "AKTYVIOS POZICIJOS" : "REALIZUOTOS POZICIJOS"}</p><h3>{isFund ? "Fondai" : "Robo pozicijos"}</h3></div><strong>{positions.length}</strong></div>
        <div className="broker-table-scroll">
          <table className="broker-table">
            <thead><tr><th>Pozicija</th><th>Statusas</th><th>Investuota</th><th>Vertė</th><th>Pelnas</th><th>Grąža</th><th>Dalis</th></tr></thead>
            <tbody>
              {positions.map((position) => (
                <tr key={position.id}>
                  <td><b>{position.ticker || position.name}</b><small>{position.name}</small></td>
                  <td className={active.length ? "positive" : ""}>{active.length ? "● Aktyvus" : "Parduotas"}</td>
                  <td>{money(position.invested)}</td><td>{money(position.value)}</td>
                  <td className={tone(position.profit)}>{money(position.profit)}</td>
                  <td className={tone(position.returnRate)}>{percent(position.returnRate)}</td>
                  <td>{percent(position.share)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
export default BrokerProfileModule;
