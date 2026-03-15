import { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import StatusBadge from './StatusBadge';
import ProgressBar from './ProgressBar';

function fmt(val) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val || 0);
}

export default function Dashboard({ setActiveTab }) {
  const { state, dispatch, totalExpenses, available, totalSavings, warnings, budgetStatus } = useBudget();
  const [editingIncome, setEditingIncome] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');

  const { savingsAllocation } = state;
  const afterSavings = available - savingsAllocation.savings - savingsAllocation.buffer;
  const emergencyGoal = state.savingsGoals.find(g => g.id === 'goal1');
  const emergencyTarget = emergencyGoal ? emergencyGoal.targetAmount : 3000;

  function saveIncome() {
    const v = parseFloat(incomeInput.replace(',', '.'));
    if (!isNaN(v) && v > 0) dispatch({ type: 'SET_INCOME', value: v });
    setEditingIncome(false);
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Mein Budget</h1>
        <StatusBadge status={budgetStatus} />
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="warnings">
          {warnings.map((w, i) => (
            <div key={i} className={`warning warning--${w.level}`}>
              {w.level === 'danger' ? '🔴' : w.level === 'warning' ? '⚠️' : 'ℹ️'} {w.msg}
            </div>
          ))}
        </div>
      )}

      {/* Income card */}
      <div className="card card--income">
        <div className="card-label">Monatliches Nettoeinkommen</div>
        {editingIncome ? (
          <div className="inline-edit">
            <input
              className="inline-input"
              value={incomeInput}
              onChange={e => setIncomeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveIncome()}
              autoFocus
              type="number"
              step="0.01"
            />
            <button className="btn btn--sm btn--primary" onClick={saveIncome}>OK</button>
            <button className="btn btn--sm btn--ghost" onClick={() => setEditingIncome(false)}>×</button>
          </div>
        ) : (
          <div className="card-amount" onClick={() => { setIncomeInput(state.income.toString()); setEditingIncome(true); }}>
            {fmt(state.income)}
            <span className="edit-hint"> ✏️</span>
          </div>
        )}
        <div className="card-sub">Kein separater 13. Monatslohn</div>
      </div>

      {/* Summary row */}
      <div className="summary-grid">
        <div className="summary-card summary-card--expense">
          <div className="summary-label">Ausgaben</div>
          <div className="summary-amount">{fmt(totalExpenses)}</div>
        </div>
        <div className={`summary-card summary-card--available ${budgetStatus === 'red' ? 'summary-card--danger' : ''}`}>
          <div className="summary-label">Verfügbar</div>
          <div className="summary-amount">{fmt(available)}</div>
        </div>
      </div>

      {/* Allocation */}
      <div className="card">
        <div className="card-title">Empfohlene Aufteilung</div>
        <AllocationRow
          label="Sparen / Notfallfonds"
          icon="🏦"
          value={savingsAllocation.savings}
          color="#27AE60"
          field="savings"
          dispatch={dispatch}
        />
        <AllocationRow
          label="Puffer / Freizeit"
          icon="🎯"
          value={savingsAllocation.buffer}
          color="#2E86AB"
          field="buffer"
          dispatch={dispatch}
        />
        <div className="allocation-rest">
          <span>Verbleibend</span>
          <strong style={{ color: afterSavings < 0 ? '#E74C3C' : '#555' }}>
            {fmt(afterSavings)}
          </strong>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card">
        <div className="card-title-row">
          <div className="card-title">Ausgaben im Überblick</div>
          <button className="btn btn--sm btn--ghost" onClick={() => setActiveTab('budget')}>
            Bearbeiten →
          </button>
        </div>
        {state.categories.filter(c => c.active && c.amount > 0).map(cat => (
          <CategoryRow key={cat.id} cat={cat} income={state.income} />
        ))}
      </div>

      {/* Emergency fund progress */}
      <div className="card">
        <div className="card-title-row">
          <div className="card-title">Notfallreserve</div>
          <button className="btn btn--sm btn--ghost" onClick={() => setActiveTab('savings')}>
            Details →
          </button>
        </div>
        <ProgressBar value={totalSavings} max={emergencyTarget} color="#27AE60" />
        <div className="card-sub" style={{ marginTop: 8 }}>
          Aktuelles Erspartes: {fmt(totalSavings)} / Ziel: {fmt(emergencyTarget)}
        </div>
      </div>

      {/* Tax reserve note */}
      <div className="card card--tax">
        <div className="card-label">Steuerrückstellung (mental geblockt)</div>
        <div className="card-amount card-amount--sm">
          {fmt(state.categories.find(c => c.id === 'taxes')?.amount || 0)} / Monat
        </div>
        <div className="card-sub">
          Kanton Bern, Gemeinde Ligerz — dieses Geld nicht einplanen!
        </div>
      </div>
    </div>
  );
}

function AllocationRow({ label, icon, value, color, field, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');

  function save() {
    const n = parseFloat(val.replace(',', '.'));
    if (!isNaN(n) && n >= 0) dispatch({ type: 'UPDATE_SAVINGS_ALLOCATION', updates: { [field]: n } });
    setEditing(false);
  }

  return (
    <div className="allocation-row">
      <div className="allocation-icon" style={{ background: color + '22' }}>{icon}</div>
      <div className="allocation-label">{label}</div>
      {editing ? (
        <div className="inline-edit">
          <input
            className="inline-input inline-input--sm"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            autoFocus
            type="number"
          />
          <button className="btn btn--xs btn--primary" onClick={save}>OK</button>
          <button className="btn btn--xs btn--ghost" onClick={() => setEditing(false)}>×</button>
        </div>
      ) : (
        <div
          className="allocation-amount"
          style={{ color }}
          onClick={() => { setVal(value.toString()); setEditing(true); }}
        >
          {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(value)}
          <span className="edit-hint"> ✏️</span>
        </div>
      )}
    </div>
  );
}

function CategoryRow({ cat, income }) {
  const pct = income > 0 ? Math.round((cat.amount / income) * 100) : 0;
  const typeColors = { fixed: '#2E86AB', variable: '#8E44AD', provision: '#E67E22' };
  const color = typeColors[cat.type] || '#888';

  return (
    <div className="cat-row">
      <span className="cat-icon">{cat.icon}</span>
      <div className="cat-info">
        <span className="cat-name">{cat.name}</span>
        {cat.specialLabel && <span className="cat-special">{cat.specialLabel}</span>}
      </div>
      <div className="cat-right">
        <span className="cat-amount">
          {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(cat.amount)}
        </span>
        <span className="cat-pct" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}
