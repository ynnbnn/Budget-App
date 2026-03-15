import { useState } from 'react';
import { useBudget } from '../context/BudgetContext';

function fmt(val) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val || 0);
}

export default function ToolsView() {
  const { state, dispatch } = useBudget();
  const { transportSettings } = state;

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Rechner & Einstellungen</h1>
      </div>

      <TransportCalculator settings={transportSettings} dispatch={dispatch} />
      <TaxReserve state={state} dispatch={dispatch} />
      <ResetSection dispatch={dispatch} />
    </div>
  );
}

function TransportCalculator({ settings, dispatch }) {
  const [costPerDay, setCostPerDay] = useState(settings.costPerDay.toString());
  const [mode, setMode] = useState(settings.mode);
  const [daysPerWeek, setDaysPerWeek] = useState(settings.daysPerWeek.toString());
  const [daysPerMonth, setDaysPerMonth] = useState(settings.daysPerMonth.toString());

  const cpd = parseFloat(costPerDay) || 0;
  const dpw = parseFloat(daysPerWeek) || 0;
  const dpm = parseFloat(daysPerMonth) || 0;

  const monthlyDays = mode === 'week' ? dpw * 4.33 : dpm;
  const monthlyTotal = Math.round(monthlyDays * cpd);

  function apply() {
    dispatch({
      type: 'UPDATE_TRANSPORT',
      updates: {
        costPerDay: cpd,
        mode,
        daysPerWeek: dpw,
        daysPerMonth: dpm,
      },
    });
  }

  return (
    <div className="card">
      <div className="card-title">🚆 Transport-Rechner</div>
      <div className="card-sub" style={{ marginBottom: 12 }}>
        Biel → Olten mit Halbtax. Passe deine Präsenztage an.
      </div>

      <div className="form-group">
        <label className="form-label">Kosten pro Reisetag (CHF)</label>
        <input
          className="input"
          type="number"
          value={costPerDay}
          onChange={e => setCostPerDay(e.target.value)}
          step="0.5"
        />
        <div className="form-hint">Mit Halbtax: ca. 24 CHF/Tag (Biel–Olten Hin&Rück)</div>
      </div>

      <div className="form-group">
        <label className="form-label">Erfassung</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              value="week"
              checked={mode === 'week'}
              onChange={() => setMode('week')}
            />
            Tage pro Woche
          </label>
          <label className="radio-label">
            <input
              type="radio"
              value="month"
              checked={mode === 'month'}
              onChange={() => setMode('month')}
            />
            Tage pro Monat
          </label>
        </div>
      </div>

      {mode === 'week' ? (
        <div className="form-group">
          <label className="form-label">Präsenztage pro Woche</label>
          <input
            className="input"
            type="number"
            value={daysPerWeek}
            onChange={e => setDaysPerWeek(e.target.value)}
            step="0.5"
            min="0"
            max="7"
          />
          <div className="form-hint">
            = {(dpw * 4.33).toFixed(1)} Tage/Monat
          </div>
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Präsenztage pro Monat</label>
          <input
            className="input"
            type="number"
            value={daysPerMonth}
            onChange={e => setDaysPerMonth(e.target.value)}
            step="1"
            min="0"
            max="31"
          />
        </div>
      )}

      <div className="transport-result">
        <span>Monatliche Transportkosten</span>
        <strong className="transport-total">{fmt(monthlyTotal)}</strong>
      </div>

      <button className="btn btn--primary btn--full" onClick={apply}>
        Übernehmen ins Budget
      </button>
    </div>
  );
}

function TaxReserve({ state, dispatch }) {
  const taxCat = state.categories.find(c => c.id === 'taxes');
  if (!taxCat) return null;

  const [editAmount, setEditAmount] = useState(false);
  const [amountVal, setAmountVal] = useState('');
  const [editNote, setEditNote] = useState(false);
  const [noteVal, setNoteVal] = useState(taxCat.note || '');

  const monthlyAmount = taxCat.amount;
  const yearlyAmount = monthlyAmount * 12;

  function saveAmount() {
    const n = parseFloat(amountVal.replace(',', '.'));
    if (!isNaN(n) && n >= 0) {
      dispatch({ type: 'UPDATE_CATEGORY', id: 'taxes', updates: { amount: n, planned: n } });
    }
    setEditAmount(false);
  }

  function saveNote() {
    dispatch({ type: 'UPDATE_CATEGORY', id: 'taxes', updates: { note: noteVal } });
    setEditNote(false);
  }

  return (
    <div className="card card--tax">
      <div className="card-title">📋 Steuerrückstellung</div>
      <div className="card-sub" style={{ marginBottom: 12 }}>
        Kanton Bern, Gemeinde Ligerz. Dieses Geld ist <strong>nicht frei verfügbar</strong>.
      </div>

      <div className="tax-grid">
        <div className="tax-cell">
          <div className="tax-cell-label">Pro Monat</div>
          {editAmount ? (
            <div className="inline-edit">
              <input
                className="inline-input inline-input--sm"
                value={amountVal}
                onChange={e => setAmountVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveAmount()}
                autoFocus
                type="number"
              />
              <button className="btn btn--xs btn--primary" onClick={saveAmount}>OK</button>
              <button className="btn btn--xs btn--ghost" onClick={() => setEditAmount(false)}>×</button>
            </div>
          ) : (
            <div
              className="tax-cell-amount"
              onClick={() => { setAmountVal(monthlyAmount.toString()); setEditAmount(true); }}
            >
              {fmt(monthlyAmount)} ✏️
            </div>
          )}
        </div>
        <div className="tax-cell">
          <div className="tax-cell-label">Pro Jahr (geschätzt)</div>
          <div className="tax-cell-amount">{fmt(yearlyAmount)}</div>
        </div>
      </div>

      <div className="form-group" style={{ marginTop: 12 }}>
        <div
          className={`toggle-switch ${taxCat.active ? 'toggle-switch--on' : ''}`}
          onClick={() => dispatch({ type: 'UPDATE_CATEGORY', id: 'taxes', updates: { active: !taxCat.active } })}
        >
          <div className="toggle-thumb" />
          <span>{taxCat.active ? 'Aktiv – im Budget eingerechnet' : 'Deaktiviert – Vorsicht!'}</span>
        </div>
        {!taxCat.active && (
          <div className="warning warning--warning" style={{ marginTop: 8 }}>
            ⚠️ Steuerrückstellung deaktiviert! Denk daran, genug zurückzuhalten.
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Notiz</label>
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
              <button className="btn btn--xs btn--ghost" onClick={() => { setNoteVal(taxCat.note || ''); setEditNote(false); }}>Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="cat-note" onClick={() => setEditNote(true)}>
            {taxCat.note || <span className="placeholder">Notiz hinzufügen…</span>}
            <span className="edit-hint"> ✏️</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ResetSection({ dispatch }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="card">
      <div className="card-title">⚙️ App zurücksetzen</div>
      <div className="card-sub" style={{ marginBottom: 12 }}>
        Setzt alle Werte auf die Standardwerte zurück. Alle eigenen Änderungen gehen verloren.
      </div>
      {confirm ? (
        <div>
          <div className="warning warning--danger" style={{ marginBottom: 8 }}>
            Wirklich zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.
          </div>
          <div className="btn-row">
            <button
              className="btn btn--danger"
              onClick={() => { dispatch({ type: 'RESET' }); setConfirm(false); }}
            >
              Ja, zurücksetzen
            </button>
            <button className="btn btn--ghost" onClick={() => setConfirm(false)}>Abbrechen</button>
          </div>
        </div>
      ) : (
        <button className="btn btn--outline" onClick={() => setConfirm(true)}>
          Auf Standardwerte zurücksetzen
        </button>
      )}
    </div>
  );
}
