import { useMemo, useRef, useState } from "react";
import { formatChartDate, formatCurrency } from "../../utils/portfolioFormatters";

const PERIODS = [{ key: "6M", months: 6 }, { key: "1Y", months: 12 }, { key: "2Y", months: 24 }, { key: "ALL", months: 0 }];

export default function PortfolioGrowthChart({ data }) {
  const [period, setPeriod] = useState("1Y");
  const [hoverIndex, setHoverIndex] = useState(null);
  const chartRef = useRef(null);
  const history = useMemo(() => {
    const rows = Array.isArray(data.history) ? data.history : [];
    const months = PERIODS.find((item) => item.key === period)?.months ?? 12;
    return months ? rows.slice(-months) : rows;
  }, [data.history, period]);

  const values = history.flatMap((item) => [Number(item.value) || 0, Number(item.invested) || 0]);
  const min = Math.min(...values, 0), max = Math.max(...values, 1), spread = Math.max(max - min, 1);
  const points = history.map((item, index) => ({
    item,
    x: history.length <= 1 ? 50 : (index / (history.length - 1)) * 100,
    y: 88 - (((Number(item.value) || 0) - min) / spread) * 72,
    investedY: 88 - (((Number(item.invested) || 0) - min) / spread) * 72,
  }));
  const valueLine = points.map((p) => `${p.x},${p.y}`).join(" ");
  const investedLine = points.map((p) => `${p.x},${p.investedY}`).join(" ");
  const hovered = hoverIndex === null ? null : points[hoverIndex];

  function move(event) {
    if (!chartRef.current || !points.length) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    setHoverIndex(points.length <= 1 ? 0 : Math.round((x / rect.width) * (points.length - 1)));
  }

  return (
    <article className="dashboard-card dashboard-growth-card">
      <header className="dashboard-card-header">
        <div><span>PORTFOLIO GROWTH</span><h2>Portfelio augimas</h2><p>Bendra viso portfelio vertė. Paskutinis taškas sutampa su Hero verte.</p></div>
        <div className="dashboard-periods">{PERIODS.map((item) => <button key={item.key} type="button" className={period === item.key ? "is-active" : ""} onClick={() => setPeriod(item.key)}>{item.key}</button>)}</div>
      </header>
      <div className="dashboard-growth-summary"><div><span>Dabartinė vertė</span><strong>{formatCurrency(data.currentValue, data.currency)}</strong></div><div><span>Investuota</span><strong>{formatCurrency(data.invested, data.currency)}</strong></div></div>
      {points.length >= 2 ? (
        <div className="dashboard-chart" ref={chartRef} onPointerMove={move} onPointerLeave={() => setHoverIndex(null)}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs><linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#42a4ff" stopOpacity=".32"/><stop offset="100%" stopColor="#42a4ff" stopOpacity="0"/></linearGradient></defs>
            {[22,40,58,76,94].map((y) => <line key={y} className="dashboard-chart-grid" x1="0" x2="100" y1={y} y2={y}/>) }
            <polygon className="dashboard-value-area" points={`0,94 ${valueLine} 100,94`} />
            <polyline className="dashboard-invested-line" points={investedLine}/>
            <polyline className="dashboard-value-line" points={valueLine}/>
            {hovered && <><line className="dashboard-chart-cursor" x1={hovered.x} x2={hovered.x} y1="10" y2="94"/><circle className="dashboard-chart-point" cx={hovered.x} cy={hovered.y} r="1.5"/></>}
          </svg>
          {hovered && <div className="dashboard-chart-tooltip" style={{ left: `${Math.max(10, Math.min(90, hovered.x))}%` }}><span>{formatChartDate(hovered.item.date)}</span><strong>{formatCurrency(hovered.item.value, data.currency)}</strong><small>Investuota {formatCurrency(hovered.item.invested, data.currency)}</small></div>}
          <div className="dashboard-chart-dates"><span>{formatChartDate(history[0]?.date)}</span><span>{formatChartDate(history.at(-1)?.date)}</span></div>
        </div>
      ) : <div className="dashboard-empty">Portfelio istorijos grafiko duomenų dar nepakanka.</div>}
    </article>
  );
}
