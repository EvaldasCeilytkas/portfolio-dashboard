export default function Button({
  variant = "secondary",
  className = "",
  type = "button",
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`ds-button ds-motion-button ds-button--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
