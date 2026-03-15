import { useState } from 'react';
import { BudgetProvider } from './context/BudgetContext';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import BudgetCategories from './components/BudgetCategories';
import MonthlyPlanning from './components/MonthlyPlanning';
import SavingsView from './components/SavingsView';
import ToolsView from './components/ToolsView';
import './App.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const views = {
    dashboard: <Dashboard setActiveTab={setActiveTab} />,
    budget: <BudgetCategories />,
    monthly: <MonthlyPlanning />,
    savings: <SavingsView />,
    tools: <ToolsView />,
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">💼</span>
          <div>
            <div className="app-title">Mein Budget</div>
            <div className="app-subtitle">Persönliche Finanzübersicht</div>
          </div>
        </div>
      </header>
      <main className="app-main">
        {views[activeTab]}
      </main>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <BudgetProvider>
      <AppContent />
    </BudgetProvider>
  );
}
