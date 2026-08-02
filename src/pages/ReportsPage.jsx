import { useMemo, useState } from "react";
import useReportData from "../hooks/useReportData";
import Skeleton from "../components/ui/Skeleton";
import "../styles/report-center.css";

const money = (value) => new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number(value) || 0);
const percent = (value, signed = false) => `${signed && Number(value) > 0 ? "+" : ""}${new Intl.NumberFormat("lt-LT", { maximumFractionDigits: 2 }).format(Number(value) || 0)} %`;
const compact = (value) => new Intl.NumberFormat("lt-LT", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value) || 0);

function ToneValue({ value, format = money }) {
  const tone = Number(value) > 0 ? "positive" : Number(value) < 0 ? "negative" : "neutral";
  return <strong className={`report-tone ${tone}`}>{format(value)}</strong>;
}

function ReportCenter() {
  const { report, loading, errorMessage } = useReportData();
  const [view, setView] = useState("monthly");
  const [compareMode, setCompareMode] = useState("month");

  const chartRows = useMemo(() => {
    if (!report) return [];
    return view === "yearly" ? report.yearlyRows : report.history.slice(-12);
  }, [report, view]);

  if (loading) return <div className="report-loading">{Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} height={index === 0 ? "180px" : "110px"} />)}</div>;
  if (errorMessage || !report) return <section className="report-error"><h2>Nepavyko paruošti ataskaitos</h2><p>{errorMessage || "Trūksta istorinių duomenų."}</p></section>;

  const period = view === "yearly" ? report.yearly : report.monthly;
  const maxChart = Math.max(...chartRows.map((row) => Number(row.value) || 0), 1);
  const previousYearRows = report.history.filter((row) => String(row.date).startsWith(String(Number(report.latestYear) - 1)));
  const previousYearEnd = previousYearRows.at(-1);
  const compareBase = compareMode === "year" ? previousYearEnd : report.previous;
  const compareValue = report.latest.value - (compareBase?.value || report.latest.value);
  const compareInvested = report.latest.invested - (compareBase?.invested || report.latest.invested);
  const compareProfit = report.latest.profit - (compareBase?.profit || report.latest.profit);

  return (
    <div className="report-center ds-page-enter">
      <section className="report-hero">
        <div>
          <p>PORTFOLIO REPORTING HUB</p>
          <h2>{report.portfolioName}</h2>
          <span>Automatinė mėnesio, metų ir dabartinės portfelio būklės ataskaita pagal naujausius sinchronizuotus duomenis.</span>
          <div className="report-view-switch">
            <button className={view === "monthly" ? "is-active" : ""} onClick={() => setView("monthly")}>Mėnesio ataskaita</button>
            <button className={view === "yearly" ? "is-active" : ""} onClick={() => setView("yearly")}>Metų ataskaita</button>
            <button className={view === "snapshot" ? "is-active" : ""} onClick={() => setView("snapshot")}>Portfolio Snapshot</button>
          </div>
        </div>
        <div className="report-date-card"><small>ATASKAITOS DATA</small><strong>{report.generatedAt}</strong><span>{view === "yearly" ? report.latestYear : report.monthLabel}</span></div>
      </section>

      <section className="report-kpi-grid">
        <article><span>Portfelio vertė</span><strong>{money(report.currentValue)}</strong><small>Dabartinė vertė</small></article>
        <article><span>Investuota</span><strong>{money(report.invested)}</strong><small>Kapitalas</small></article>
        <article><span>Bendras pelnas</span><ToneValue value={report.profit} /><small>{percent(report.returnRate)} ROI</small></article>
        <article><span>{view === "yearly" ? "Metų pokytis" : "Mėnesio pokytis"}</span><ToneValue value={period?.valueChange} /><small>{percent(period?.changeRate, true)}</small></article>
      </section>

      {view !== "snapshot" && (
        <>
          <section className="report-main-grid">
            <article className="report-panel report-performance-panel">
              <header><div><p>{view === "yearly" ? "METŲ REZULTATAS" : "MĖNESIO REZULTATAS"}</p><h3>{view === "yearly" ? report.latestYear : report.monthLabel}</h3></div><span className={period?.valueChange >= 0 ? "good" : "bad"}>{percent(period?.changeRate, true)}</span></header>
              <div className="report-result-grid">
                <div><span>Vertės pokytis</span><ToneValue value={period?.valueChange} /></div>
                <div><span>Naujas kapitalas</span><strong>{money(period?.investedChange)}</strong></div>
                <div><span>Pelno pokytis</span><ToneValue value={period?.profitChange} /></div>
                <div><span>Laikotarpio pabaiga</span><strong>{money(period?.last?.value)}</strong></div>
              </div>
              <div className="report-narrative">
                <b>Automatinė santrauka</b>
                <p>{period?.valueChange >= 0 ? "Portfelio vertė per pasirinktą laikotarpį padidėjo." : "Portfelio vertė per pasirinktą laikotarpį sumažėjo."} {period?.investedChange > 0 ? `Papildomai investuota ${money(period.investedChange)}.` : "Papildomų įnašų neužfiksuota."} {report.delayedTotal > 0 ? `Stebimos ${report.delayedTotal} vėluojančios investicijos.` : "Vėluojančių investicijų neužfiksuota."}</p>
              </div>
            </article>

            <article className="report-panel report-chart-panel">
              <header><div><p>PORTFELIO DINAMIKA</p><h3>{view === "yearly" ? `${report.latestYear} mėnesiai` : "Paskutiniai 12 mėnesių"}</h3></div><span>{chartRows.length} taškai</span></header>
              <div className="report-bars">
                {chartRows.map((row) => <div className="report-bar-column" key={row.date} title={`${row.date}: ${money(row.value)}`}><span style={{ height: `${Math.max(5, (row.value / maxChart) * 100)}%` }} /><small>{row.date.slice(5, 7) || row.date.slice(0, 4)}</small></div>)}
              </div>
            </article>
          </section>

          <section className="report-secondary-grid">
            <article className="report-panel">
              <header><div><p>PERFORMERIAI</p><h3>Platformų rezultatai</h3></div></header>
              <div className="report-performers">
                <div className="winner"><span>Geriausias ROI</span><strong>{report.best?.name || "Nėra duomenų"}</strong><b>{report.best ? percent(report.best.roi) : "—"}</b></div>
                <div className="attention"><span>Reikia dėmesio</span><strong>{report.weakest?.name || "Nėra duomenų"}</strong><b>{report.weakest ? percent(report.weakest.roi) : "—"}</b></div>
              </div>
              <div className="report-platform-list">
                {report.platforms.slice(0, 6).map((item) => <div key={item.id}><span><b>{item.name}</b><small>{item.active} aktyvios · {item.delayed} vėluoja</small></span><strong>{money(item.value)}</strong><em>{percent(item.roi)}</em></div>)}
                {!report.platforms.length && <p className="report-muted">Šiam portfeliui platformų suvestinė dar nesugeneruota.</p>}
              </div>
            </article>

            <article className="report-panel">
              <header><div><p>LAIKOTARPIŲ PALYGINIMAS</p><h3>Dabartinė būklė prieš ankstesnį laikotarpį</h3></div></header>
              <div className="report-compare-switch"><button className={compareMode === "month" ? "is-active" : ""} onClick={() => setCompareMode("month")}>Praėjęs mėnuo</button><button className={compareMode === "year" ? "is-active" : ""} onClick={() => setCompareMode("year")}>Praėję metai</button></div>
              <div className="report-compare-list">
                <div><span>Portfelio vertė</span><ToneValue value={compareValue} /><small>{money(compareBase?.value)}</small></div>
                <div><span>Investuota</span><ToneValue value={compareInvested} /><small>{money(compareBase?.invested)}</small></div>
                <div><span>Pelnas</span><ToneValue value={compareProfit} /><small>{money(compareBase?.profit)}</small></div>
              </div>
            </article>
          </section>
        </>
      )}

      {view === "snapshot" && (
        <section className="report-snapshot">
          <article className="report-panel snapshot-allocation"><header><div><p>PORTFOLIO SNAPSHOT</p><h3>Turto paskirstymas</h3></div></header>{report.allocation.map((item) => <div className="snapshot-allocation-row" key={item.key}><span><b>{item.label}</b><small>{money(item.value)}</small></span><div><i style={{ width: `${Math.min(100, item.share)}%` }} /></div><strong>{percent(item.share)}</strong></div>)}</article>
          <article className="report-panel snapshot-insights"><header><div><p>PAGRINDINĖS ĮŽVALGOS</p><h3>Vieno puslapio santrauka</h3></div></header><ul><li>Portfelio vertė: <b>{money(report.currentValue)}</b>.</li><li>Bendras rezultatas: <b>{money(report.profit)} ({percent(report.returnRate)})</b>.</li><li>Didžiausia turto klasė: <b>{report.largestAssetClass?.label || "—"}</b>.</li><li>{report.best ? `Geriausią ROI rodo ${report.best.name}: ${percent(report.best.roi)}.` : "Platformų ROI duomenų nepakanka."}</li><li>{report.delayedTotal ? `Vėluojančių investicijų skaičius: ${report.delayedTotal}.` : "Vėluojančių investicijų neužfiksuota."}</li></ul></article>
          <article className="report-panel snapshot-top"><header><div><p>DIDŽIAUSIOS POZICIJOS</p><h3>Top platformos</h3></div></header>{report.platforms.slice(0, 8).map((item, index) => <div key={item.id}><span>{index + 1}</span><b>{item.name}</b><strong>{compact(item.value)} €</strong></div>)}{!report.platforms.length && <p className="report-muted">Platformų duomenų nėra.</p>}</article>
        </section>
      )}

      <section className="report-export-note"><div><p>EXPORT CENTER</p><h3>PDF, Excel ir CSV eksportas</h3><span>Ataskaitų peržiūros struktūra paruošta. Eksporto funkcijos bus prijungtos Report Center v1.1 etape.</span></div><button type="button" disabled>Eksportas · v1.1</button></section>
    </div>
  );
}

export default ReportCenter;
