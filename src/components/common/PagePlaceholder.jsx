function PagePlaceholder({
  label,
  title,
  description,
  testId,
  children,
}) {
  return (
    <section className="placeholder-page" data-testid={testId}>
      <div className="placeholder-card">
        <p className="section-label">{label}</p>
        <h2>{title}</h2>
        <p>{description}</p>

        {children}
      </div>
    </section>
  );
}

export default PagePlaceholder;
