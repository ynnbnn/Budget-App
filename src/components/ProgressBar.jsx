export default function ProgressBar({ value, max, color = '#2E86AB', showLabel = true }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="progress-wrap">
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      {showLabel && (
        <div className="progress-label">
          <span>{formatCHF(value)} / {formatCHF(max)}</span>
          <span>{pct}%</span>
        </div>
      )}
    </div>
  );
}

function formatCHF(val) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val || 0);
}
