export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Übersicht', icon: '📊' },
    { id: 'budget', label: 'Budget', icon: '📝' },
    { id: 'monthly', label: 'Monat', icon: '📅' },
    { id: 'savings', label: 'Sparen', icon: '🏦' },
    { id: 'tools', label: 'Rechner', icon: '🔧' },
  ];

  return (
    <nav className="nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-btn ${activeTab === tab.id ? 'nav-btn--active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
