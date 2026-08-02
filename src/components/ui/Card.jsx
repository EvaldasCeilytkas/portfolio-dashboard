export default function Card({ as: Component = "article", variant = "default", padded = false, className = "", children, ...props }) {
  const variantClass = variant === "data" ? "ds-card--data" : "";
  return <Component className={`ds-card ds-motion-card ${variantClass} ${padded ? "ds-card--padded" : ""} ${className}`.trim()} {...props}>{children}</Component>;
}
