import AnimatedValue from "./AnimatedValue";
export default function StatCard({ label, value, note, tone = "default", trend, className = "", children }) {
  return (
    <article className={`ds-stat-card ds-motion-card ds-stat-card--${tone} ${className}`.trim()}>
      <span className="ds-stat-card__label">{label}</span>
      <div className="ds-stat-card__value-row">
        <strong className="ds-stat-card__value"><AnimatedValue value={value} /></strong>
        {trend ? <span className="ds-stat-card__trend">{trend}</span> : null}
      </div>
      {note ? <small className="ds-stat-card__note">{note}</small> : null}
      {children}
    </article>
  );
}
