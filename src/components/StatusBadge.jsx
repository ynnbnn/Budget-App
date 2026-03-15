export default function StatusBadge({ status }) {
  const config = {
    green: { label: 'Im Rahmen', color: '#27AE60', bg: '#EAFAF1', icon: '✅' },
    yellow: { label: 'Knapp', color: '#F39C12', bg: '#FEF9E7', icon: '⚠️' },
    red: { label: 'Überschritten', color: '#E74C3C', bg: '#FDEDEC', icon: '🔴' },
  };
  const c = config[status] || config.green;

  return (
    <span
      className="status-badge"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.color}` }}
    >
      {c.icon} {c.label}
    </span>
  );
}
