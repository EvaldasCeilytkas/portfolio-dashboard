const TONE_MAP = {
  ok: "success",
  success: "success",
  warning: "warning",
  error: "danger",
  danger: "danger",
  info: "info",
  analytics: "analytics",
};

export default function Badge({ tone = "info", className = "", children, ...props }) {
  const normalized = TONE_MAP[tone] || tone;
  return <span className={`ds-badge ds-badge--${normalized} ${className}`.trim()} {...props}>{children}</span>;
}
