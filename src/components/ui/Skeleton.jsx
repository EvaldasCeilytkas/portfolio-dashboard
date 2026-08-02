export default function Skeleton({ lines = 3, className = "" }) {
  return <div className={`ds-skeleton ${className}`.trim()} aria-hidden="true">{Array.from({ length: lines }, (_, index) => <span key={index} style={{ width: `${92 - index * 11}%` }} />)}</div>;
}
