import { useState } from 'react';
import { useBudget } from '../context/BudgetContext';
import ProgressBar from './ProgressBar';

function fmt(val) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val || 0);
}

const GOAL_COLORS = ['#2E86AB', '#27AE60', '#8E44AD', '#E67E22', '#E74C3C'];

export default function SavingsView() {
  const { state, dispatch, totalSavings } = useBudget();
  const { savingsGoals, savingsAccounts, savingsAllocation } = state;

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Sparen & Ziele</h1>
      </div>

      {/* Savings accounts */}
      <div className="card">
        <div className="card-title">Meine Sparkonten</div>
        {savingsAccounts.map(acc => (
          <AccountItem key={acc.id} account={acc} dispatch={dispatch} />
        ))}
        <div className="total-savings-row">
          <span>Total Erspartes</span>
          <strong>{fmt(totalSavings)}</strong>
        </div>
        <button
          className="btn btn--outline btn--full"
          style={{ marginTop: 12 }}
          onClick={() => dispatch({ type: 'ADD_SAVINGS_ACCOUNT' })}
        >
          + Konto hinzufügen
        </button>
      </div>

      {/* Savings goals */}
      <div className="card">
        <div className="card-title">Sparziele</div>
        <div className="card-sub" style={{ marginBottom: 12 }}>
          Monatlicher Sparbetrag: <strong>{fmt(savingsAllocation.savings)}</strong>
        </div>
        {savingsGoals.map((goal, idx) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            currentSavings={totalSavings}
            monthlySavings={savingsAllocation.savings}
            dispatch={dispatch}
            color={goal.color || GOAL_COLORS[idx % GOAL_COLORS.length]}
          />
        ))}
        <button
          className="btn btn--outline btn--full"
          style={{ marginTop: 12 }}
          onClick={() => dispatch({ type: 'ADD_SAVINGS_GOAL' })}
        >
          + Ziel hinzufügen
        </button>
      </div>

      {/* Savings scenarios */}
      <div className="card">
        <div className="card-title">Szenarien-Vergleich</div>
        <div className="card-sub" style={{ marginBottom: 12 }}>
          Wie lange bis zu deinen Zielen bei verschiedenen Sparraten?
        </div>
        <SavingsScenarios savingsGoals={savingsGoals} currentSavings={totalSavings} />
      </div>
    </div>
  );
}

function AccountItem({ account, dispatch }) {
  const [editName, setEditName] = useState(false);
  const [editBalance, setEditBalance] = useState(false);
  const [nameVal, setNameVal] = useState(account.name);
  const [balVal, setBalVal] = useState('');

  function saveName() {
    if (nameVal.trim()) dispatch({ type: 'UPDATE_SAVINGS_ACCOUNT', id: account.id, updates: { name: nameVal.trim() } });
    setEditName(false);
  }

  function saveBalance() {
    const n = parseFloat(balVal.replace(',', '.'));
    if (!isNaN(n) && n >= 0) dispatch({ type: 'UPDATE_SAVINGS_ACCOUNT', id: account.id, updates: { balance: n } });
    setEditBalance(false);
  }

  return (
    <div className="account-row">
      <div className="account-left">
        <span className="account-icon">💰</span>
        {editName ? (
          <div className="inline-edit">
            <input
              className="inline-input"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              autoFocus
            />
            <button className="btn btn--xs btn--primary" onClick={saveName}>OK</button>
          </div>
        ) : (
          <span className="account-name" onDoubleClick={() => setEditName(true)}>
            {account.name} <span className="edit-hint">✏️</span>
          </span>
        )}
      </div>
      {editBalance ? (
        <div className="inline-edit">
          <input
            className="inline-input inline-input--sm"
            value={balVal}
            onChange={e => setBalVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveBalance()}
            autoFocus
            type="number"
          />
          <button className="btn btn--xs btn--primary" onClick={saveBalance}>OK</button>
          <button className="btn btn--xs btn--ghost" onClick={() => setEditBalance(false)}>×</button>
        </div>
      ) : (
        <span
          className="account-balance"
          onClick={() => { setBalVal(account.balance.toString()); setEditBalance(true); }}
        >
          {fmt(account.balance)} ✏️
        </span>
      )}
    </div>
  );
}

function GoalItem({ goal, currentSavings, monthlySavings, dispatch, color }) {
  const [expanded, setExpanded] = useState(false);
  const [editName, setEditName] = useState(false);
  const [editTarget, setEditTarget] = useState(false);
  const [editNote, setEditNote] = useState(false);
  const [nameVal, setNameVal] = useState(goal.name);
  const [targetVal, setTargetVal] = useState('');
  const [noteVal, setNoteVal] = useState(goal.note || '');

  const remaining = Math.max(0, goal.targetAmount - currentSavings);
  const monthsNeeded = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : null;

  function saveName() {
    if (nameVal.trim()) dispatch({ type: 'UPDATE_SAVINGS_GOAL', id: goal.id, updates: { name: nameVal.trim() } });
    setEditName(false);
  }

  function saveTarget() {
    const n = parseFloat(targetVal.replace(',', '.'));
    if (!isNaN(n) && n > 0) dispatch({ type: 'UPDATE_SAVINGS_GOAL', id: goal.id, updates: { targetAmount: n } });
    setEditTarget(false);
  }

  function saveNote() {
    dispatch({ type: 'UPDATE_SAVINGS_GOAL', id: goal.id, updates: { note: noteVal } });
    setEditNote(false);
  }

  return (
    <div className="goal-item">
      <div className="goal-header" onClick={() => setExpanded(!expanded)}>
        <div className="goal-left">
          <div className="goal-dot" style={{ background: color }} />
          {editName ? (
            <div className="inline-edit" onClick={e => e.stopPropagation()}>
              <input
                className="inline-input"
                value={nameVal}
                onChange={e => setNameVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                autoFocus
              />
              <button className="btn btn--xs btn--primary" onClick={e => { e.stopPropagation(); saveName(); }}>OK</button>
            </div>
          ) : (
            <span className="goal-name" onDoubleClick={e => { e.stopPropagation(); setEditName(true); }}>
              {goal.name}
            </span>
          )}
        </div>
        <div className="goal-right">
          {editTarget ? (
            <div className="inline-edit" onClick={e => e.stopPropagation()}>
              <input
                className="inline-input inline-input--sm"
                value={targetVal}
                onChange={e => setTargetVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveTarget()}
                autoFocus
                type="number"
              />
              <button className="btn btn--xs btn--primary" onClick={e => { e.stopPropagation(); saveTarget(); }}>OK</button>
            </div>
          ) : (
            <span
              className="goal-target"
              onClick={e => { e.stopPropagation(); setTargetVal(goal.targetAmount.toString()); setEditTarget(true); }}
            >
              {fmt(goal.targetAmount)} ✏️
            </span>
          )}
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      <ProgressBar value={currentSavings} max={goal.targetAmount} color={color} />

      {monthsNeeded !== null && remaining > 0 && (
        <div className="goal-eta">
          Noch {fmt(remaining)} — ca. {monthsNeeded} Monate bei {fmt(monthlySavings)}/Mt.
        </div>
      )}
      {remaining <= 0 && (
        <div className="goal-achieved">✅ Ziel erreicht!</div>
      )}

      {expanded && (
        <div className="goal-details">
          {editNote ? (
            <div>
              <textarea
                className="textarea"
                value={noteVal}
                onChange={e => setNoteVal(e.target.value)}
                rows={2}
              />
              <div className="btn-row btn-row--sm">
                <button className="btn btn--xs btn--primary" onClick={saveNote}>Speichern</button>
                <button className="btn btn--xs btn--ghost" onClick={() => { setNoteVal(goal.note || ''); setEditNote(false); }}>Abbrechen</button>
              </div>
            </div>
          ) : (
            <div className="cat-note" onClick={() => setEditNote(true)}>
              {goal.note || <span className="placeholder">Notiz hinzufügen…</span>}
              <span className="edit-hint"> ✏️</span>
            </div>
          )}
          <button
            className="btn btn--xs btn--danger"
            style={{ marginTop: 8 }}
            onClick={() => dispatch({ type: 'REMOVE_SAVINGS_GOAL', id: goal.id })}
          >
            Ziel löschen
          </button>
        </div>
      )}
    </div>
  );
}

function SavingsScenarios({ savingsGoals, currentSavings }) {
  const rates = [300, 500, 600, 800];

  return (
    <div className="scenarios">
      <div className="scenarios-header">
        <div className="scenarios-col scenarios-col--label">Ziel</div>
        {rates.map(r => (
          <div key={r} className="scenarios-col">{fmt(r)}/Mt.</div>
        ))}
      </div>
      {savingsGoals.map(goal => {
        const remaining = Math.max(0, goal.targetAmount - currentSavings);
        return (
          <div key={goal.id} className="scenarios-row">
            <div className="scenarios-col scenarios-col--label">
              <div className="goal-dot" style={{ background: goal.color }} />
              {goal.name}
            </div>
            {rates.map(r => {
              const months = r > 0 ? Math.ceil(remaining / r) : '∞';
              return (
                <div key={r} className="scenarios-col scenarios-col--months">
                  {remaining <= 0 ? <span style={{ color: '#27AE60' }}>✅</span> : `${months} Mt.`}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
