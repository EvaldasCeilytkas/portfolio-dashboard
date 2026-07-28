export function RatingBadge({ rating = "—" }) {
  const normalized = String(rating || "—").trim().toUpperCase();
  const tone =
    normalized.startsWith("B")
      ? "blue"
      : normalized.startsWith("C")
        ? "amber"
        : normalized.startsWith("D")
          ? "red"
          : "neutral";

  return (
    <span className={`re-badge re-rating re-rating-${tone}`}>
      {normalized}
    </span>
  );
}

export function StatusBadge({ status = "active" }) {
  const normalized = String(status || "active").toLowerCase();

  const tone =
    normalized.includes("delay") || normalized.includes("late")
      ? "delayed"
      : normalized.includes("complete") ||
          normalized.includes("repaid") ||
          normalized.includes("closed")
        ? "completed"
        : "active";

  const label =
    tone === "delayed"
      ? "Vėluoja"
      : tone === "completed"
        ? "Užbaigtas"
        : "Aktyvus";

  return (
    <span className={`re-badge re-status re-status-${tone}`}>
      <span className="re-status-dot" />
      {label}
    </span>
  );
}

export function scoreTone(score) {
  const value = Number(score) || 0;
  if (value >= 85) return "excellent";
  if (value >= 70) return "good";
  if (value >= 50) return "warning";
  return "danger";
}
