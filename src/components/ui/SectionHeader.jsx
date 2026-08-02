export default function SectionHeader({ eyebrow, title, description, action, className = "" }) {
  return (
    <header className={`ds-section-header ${className}`.trim()}>
      <div>
        {eyebrow ? <span className="ds-section-header__eyebrow">{eyebrow}</span> : null}
        <h2 className="ds-section-header__title">{title}</h2>
      </div>
      {description ? <span className="ds-section-header__description">{description}</span> : null}
      {action ? <div className="ds-section-header__action">{action}</div> : null}
    </header>
  );
}
