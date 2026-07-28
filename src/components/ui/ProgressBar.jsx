import "../../styles/progressbar.css";

function ProgressBar({
  value = 0,
  height = 8,
  showLabel = true,
}) {
  const numericValue = Number(value);

  const percentage = Number.isFinite(numericValue)
    ? Math.max(0, Math.min(100, numericValue))
    : 0;

  return (
    <div className="ui-progress">
      <div
        className="ui-progress__track"
        style={{ height: `${height}px` }}
      >
        <div
          className="ui-progress__fill"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && (
        <span className="ui-progress__label">
          {percentage.toFixed(1)} %
        </span>
      )}
    </div>
  );
}

export default ProgressBar;