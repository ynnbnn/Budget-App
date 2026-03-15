import { useState } from 'react';
import { useBudget } from '../context/BudgetContext';

function fmt(val) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val || 0);
}

export default function MonthlyPlanning() {
  const { state, dispatch, totalExpenses, available } = useBudget();

  const monthLabel = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });

  const totalActual = state.categories
    .filter(c => c.active)
    .reduce((sum, c) => sum + (c.actual || 0), 0);

  const totalPlanned = totalExpenses;
  const remainingActual = state.income - totalActual;
  const diff = totalPlanned - totalActual;

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Monatsplanung</h1>
        <span className="month-label">{monthLabel}</span>
      </div>

      {/* Summary */}
      <div className="card">
        <div className="card-title">Monatsübersicht</div>
        <div className="month-summary-grid">
          <SummaryCell label="Einkommen" value={state.income} color="#27AE60" />
          <SummaryCell label="Geplant" value={totalPlanned} color="#2E86AB" />
          <SummaryCell label="Tatsächlich" value={totalActual} color="#E67E22" />
          <SummaryCell label="Übrig" value={remainingActual} color={remainingActual >= 0 ? '#27AE60' : '#E74C3C'} />
        </div>
        {diff !== 0 && (
          <div className={`diff-note ${diff > 0 ? 'diff-note--positive' : 'diff-note--negative'}`}>
            {diff > 0
              ? `Du hast ${fmt(diff)} weniger ausgegeben als geplant.`
              : `Du hast ${fmt(Math.abs(diff))} mehr ausgegeben als geplant.`}
          </div>
        )}
      </div>

      {/* Per-category actual input */}
      <div className="card">
        <div className="card-title">Tatsächliche Ausgaben erfassen</div>
        <div className="card-sub" style={{ marginBottom: 12 }}>
          Trage hier ein, was du diesen Monat tatsächlich ausgegeben hast.
        </div>
        {state.categories.filter(c => c.active).map(cat => (
          <ActualRow key={cat.id} cat={cat} dispatch={dispatch} />
        ))}
      </div>

      {/* Visual breakdown */}
      <div className="card">
        <div className="card-title">Geplant vs. Tatsächlich</div>
        {state.categories.filter(c => c.active && (c.amount > 0 || (c.actual || 0) > 0)).map(cat => (
          <CompareBar key={cat.id} cat={cat} income={state.income} />
        ))}
      </div>
    </div>
  );
}

function SummaryCell({ label, value, color }) {
  return (
    <div className="month-cell">
      <div className="month-cell-label">{label}</div>
      <div className="month-cell-amount" style={{ color }}>{fmt(value)}</div>
    </div>
  );
}

function ActualRow({ cat, dispatch }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState('');

  function save() {
    const n = parseFloat(val.replace(',', '.'));
    if (!isNaN(n) && n >= 0) {
      dispatch({ type: 'UPDATE_CATEGORY', id: cat.id, updates: { actual: n } });
    }
    setEditing(false);
  }

  const actual = cat.actual || 0;
  const diff = cat.amount - actual;

  return (
    <div className="actual-row">
      <div className="actual-row-left">
        <span className="cat-icon">{cat.icon}</span>
        <span className="cat-name">{cat.name}</span>
      </div>
      <div className="actual-row-right">
        <span className="actual-planned">{fmt(cat.amount)}</span>
        <span className="actual-sep">→</span>
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
          <span
            className="actual-value"
            onClick={() => { setVal(actual.toString()); setEditing(true); }}
          >
            {fmt(actual)} ✏️
          </span>
        )}
        {actual > 0 && (
          <span
            className="actual-diff"
            style={{ color: diff >= 0 ? '#27AE60' : '#E74C3C' }}
          >
            {diff >= 0 ? `-${fmt(diff)}` : `+${fmt(Math.abs(diff))}`}
          </span>
        )}
      </div>
    </div>
  );
}

function CompareBar({ cat, income }) {
  const planned = cat.amount || 0;
  const actual = cat.actual || 0;
  const maxVal = Math.max(planned, actual, 1);
  const plannedPct = Math.round((planned / maxVal) * 100);
  const actualPct = Math.round((actual / maxVal) * 100);
  const over = actual > planned;

  return (
    <div className="compare-row">
      <div className="compare-label">
        <span>{cat.icon} {cat.name}</span>
      </div>
      <div className="compare-bars">
        <div className="compare-bar-wrap">
          <div className="compare-bar-track">
            <div className="compare-bar-fill" style={{ width: `${plannedPct}%`, background: '#2E86AB' }} />
          </div>
          <span className="compare-bar-val">{fmt(planned)}</span>
        </div>
        {actual > 0 && (
          <div className="compare-bar-wrap">
            <div className="compare-bar-track">
              <div
                className="compare-bar-fill"
                style={{ width: `${actualPct}%`, background: over ? '#E74C3C' : '#27AE60' }}
              />
            </div>
            <span className="compare-bar-val" style={{ color: over ? '#E74C3C' : '#27AE60' }}>
              {fmt(actual)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
