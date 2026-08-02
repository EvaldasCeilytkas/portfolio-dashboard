export default function DataTable({ className = "", tableClassName = "", children, ...props }) {
  return (
    <div className={`ds-table-wrap ${className}`.trim()}>
      <table className={`ds-table ds-motion-table ${tableClassName}`.trim()} {...props}>{children}</table>
    </div>
  );
}
