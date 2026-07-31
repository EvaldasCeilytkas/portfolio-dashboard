import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PerformanceChart from "../components/charts/PerformanceChart";
import P2PLoanTable from "../components/p2p/P2PLoanTable";
import { buildPlatformChartHistory, findPlatformHistory } from "../utils/platformHistory";
import "../styles/p2pPlatformPage.css";

const money = (value) => new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0);
const percent = (value) => `${new Intl.NumberFormat("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)} %`;
const date = (value) => value ? new Intl.DateTimeFormat("lt-LT", { year: "numeric", month: "short", day: "2-digit" }).format(new Date(value)) : "—";

function Distribution({ title, items = [], total = 0 }) {
  return (
    <section className="p2pp-card">
      <div className="p2pp-card-head"><div><p>PORTFELIO SUDĖTIS</p><h2>{title}</h2></div></div>
      <div className="p2pp-bars">
        {items.map((item) => {
          const share = total > 0 ? (Number(item.value) / total) * 100 : 0;
          return <div className="p2pp-bar-row" key={item.label}>
            <div className="p2pp-bar-label"><span>{item.label}</span><b>{money(item.value)}</b></div>
            <div className="p2pp-bar-track"><i style={{ width: `${Math.max(2, share)}%` }} /></div>
            <small>{item.count} pask. · {percent(share)}</small>
          </div>;
        })}
      </div>
    </section>
  );
}

function PlatformPage() {
  const { platformSlug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPlatform() {
      try {
        setData(null);
        setError("");

        const [platformResponse, historyResponse] = await Promise.all([
          fetch(
            `${import.meta.env.BASE_URL}data/platforms/${platformSlug}.json`,
            { cache: "no-store", signal: controller.signal },
          ),
          fetch(`${import.meta.env.BASE_URL}data/platform_history.json`, {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);

        if (!platformResponse.ok) {
          throw new Error(`Platformos JSON: HTTP ${platformResponse.status}`);
        }

        if (!historyResponse.ok) {
          throw new Error(`platform_history.json: HTTP ${historyResponse.status}`);
        }

        const [platformPayload, historyPayload] = await Promise.all([
          platformResponse.json(),
          historyResponse.json(),
        ]);

        const historicalHistory = findPlatformHistory(
          historyPayload,
          platformSlug,
          platformPayload?.platform?.name,
        );

        const chartHistory = buildPlatformChartHistory(
          historicalHistory,
          platformPayload,
        );

        setData({
          ...platformPayload,
          chartHistory,
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          setError(
            err?.message || "Nepavyko įkelti platformos duomenų.",
          );
        }
      }
    }

    loadPlatform();

    return () => controller.abort();
  }, [platformSlug]);

  if (error) return <div className="p2pp-state"><h1>Platformos duomenys nerasti</h1><p>{error}</p><Link to="/portfolio">Grįžti į portfelį</Link></div>;
  if (!data) return <div className="p2pp-state"><p>Kraunami platformos duomenys…</p></div>;

  const platform = data.platform || {};
  const summary = data.summary || {};
  const investments = Array.isArray(data.investments) ? data.investments : [];
  const total = Number(summary.currentValue) || 0;
  const biggest = data.largestInvestment;

  return <div className="p2pp-page">
    <Link className="p2pp-back" to="/portfolio">← Grįžti į portfelį</Link>

    <section className="p2pp-hero">
      <div className="p2pp-brand">
        <div className="p2pp-logo">D</div>
        <div><p>P2P PLATFORMOS PROFILIS</p><h1>{platform.name}</h1><div className="p2pp-meta"><span className="active">● Aktyvi</span><span>{platform.category}</span><span>Nuo {date(platform.startDate)}</span></div></div>
      </div>
      <div className="p2pp-value"><span>DABARTINĖ VERTĖ</span><strong>{money(summary.currentValue)}</strong><small>Atnaujinta {date(platform.updatedAt)}</small></div>
    </section>

    <section className="p2pp-metrics">
      <article><span>Investuota</span><strong>{money(summary.invested)}</strong><small>Įnešta {money(summary.deposited)}</small></article>
      <article><span>Pelnas</span><strong className="positive">+{money(summary.profit)}</strong><small>ROI {percent(summary.returnRate)}</small></article>
      <article><span>XIRR</span><strong className="positive">{percent(summary.xirr)}</strong><small>Vid. palūkanos {percent(summary.averageRate)}</small></article>
      <article><span>Aktyvios paskolos</span><strong>{summary.activeInvestments}</strong><small>{summary.delayedInvestments} vėluojančių</small></article>
      <article><span>Gautos palūkanos</span><strong>{money(summary.interestReceived)}</strong><small>Premijos {money(summary.bonuses)}</small></article>
      <article><span>Grąžintas kapitalas</span><strong>{money(summary.principalReturned)}</strong><small>{summary.completedInvestments} užbaigtos</small></article>
    </section>

    <section className="p2pp-card p2pp-chart">
      <div className="p2pp-card-head"><div><p>PORTFELIO ISTORIJA</p><h2>Vertė ir investuotas kapitalas</h2></div></div>
      <PerformanceChart history={data.chartHistory || []} />
    </section>

    <section className="p2pp-grid">
      <Distribution title="Pagal paskolų davėją" items={data.distributions?.lender} total={total} />
      <Distribution title="Pagal paskolos tipą" items={data.distributions?.loanType} total={total} />
    </section>

    <section className="p2pp-grid">
      <section className="p2pp-card">
        <div className="p2pp-card-head"><div><p>PORTFELIO SANTRAUKA</p><h2>Pagrindiniai rodikliai</h2></div></div>
        <dl className="p2pp-details">
          <div><dt>Negrąžintas kapitalas</dt><dd>{money(summary.outstandingPrincipal)}</dd></div>
          <div><dt>Visos investicijos</dt><dd>{summary.totalInvestments}</dd></div>
          <div><dt>Laisvi pinigai</dt><dd>{money(summary.cash)}</dd></div>
          <div><dt>Mokesčiai</dt><dd>{money(summary.fees)}</dd></div>
          <div><dt>Platformos valiuta</dt><dd>{platform.currency}</dd></div>
        </dl>
      </section>
      <section className="p2pp-card">
        <div className="p2pp-card-head"><div><p>DIDŽIAUSIA POZICIJA</p><h2>{biggest?.lender || "—"}</h2></div><strong>{money(biggest?.currentValue)}</strong></div>
        <dl className="p2pp-details">
          <div><dt>Paskolos kodas</dt><dd>{biggest?.loanCode || "—"}</dd></div>
          <div><dt>Palūkanos</dt><dd>{percent(biggest?.rate)}</dd></div>
          <div><dt>Reitingas</dt><dd>{biggest?.trustScore || "—"}</dd></div>
          <div><dt>Planuojama pabaiga</dt><dd>{date(biggest?.plannedEndDate)}</dd></div>
          <div><dt>Portfelio dalis</dt><dd>{percent(total ? (Number(biggest?.currentValue) / total) * 100 : 0)}</dd></div>
        </dl>
      </section>
    </section>

    <P2PLoanTable loans={investments} platformName={platform.name} />
  </div>;
}

export default PlatformPage;
