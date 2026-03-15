import { useState } from 'react';
import { useBudget } from '../context/BudgetContext';

function fmt(val) {
  return new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val || 0);
}

export default function BudgetCategories() {
  const { state, dispatch, totalExpenses, available } = useBudget();
  const [newCatName, setNewCatName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  function addCategory() {
    if (newCatName.trim()) {
      dispatch({ type: 'ADD_CATEGORY', name: newCatName.trim() });
      setNewCatName('');
      setShowAddForm(false);
    }
  }

  const fixedCats = state.categories.filter(c => c.type === 'fixed');
  const variableCats = state.categories.filter(c => c.type === 'variable');
  const provisionCats = state.categories.filter(c => c.type === 'provision');
  const customCats = state.categories.filter(c => c.id.startsWith('custom_'));

  return (
    <div className="view">
      <div className="view-header">
        <h1 className="view-title">Budget-Kategorien</h1>
      </div>

      <div className="summary-grid">
        <div className="summary-card summary-card--expense">
          <div className="summary-label">Gesamtausgaben</div>
          <div className="summary-amount">{fmt(totalExpenses)}</div>
        </div>
        <div className="summary-card summary-card--available">
          <div className="summary-label">Verfügbar</div>
          <div className="summary-amount">{fmt(available)}</div>
        </div>
      </div>

      <CategorySection
        title="Fixkosten"
        icon="📌"
        categories={fixedCats}
        dispatch={dispatch}
      />
      <CategorySection
        title="Variable Kosten"
        icon="🔄"
        categories={variableCats}
        dispatch={dispatch}
      />
      <CategorySection
        title="Rückstellungen"
        icon="🗂️"
        categories={provisionCats}
        dispatch={dispatch}
      />
      {customCats.length > 0 && (
        <CategorySection
          title="Eigene Kategorien"
          icon="✨"
          categories={customCats}
          dispatch={dispatch}
          allowRemove
        />
      )}

      {/* Add category */}
      <div className="card">
        {showAddForm ? (
          <div className="add-cat-form">
            <input
              className="input"
              placeholder="Kategoriename…"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
              autoFocus
            />
            <div className="btn-row">
              <button className="btn btn--primary" onClick={addCategory}>Hinzufügen</button>
              <button className="btn btn--ghost" onClick={() => setShowAddForm(false)}>Abbrechen</button>
            </div>
          </div>
        ) : (
          <button className="btn btn--outline btn--full" onClick={() => setShowAddForm(true)}>
            + Neue Kategorie hinzufügen
          </button>
        )}
      </div>
    </div>
  );
}

function CategorySection({ title, icon, categories, dispatch, allowRemove }) {
  return (
    <div className="card">
      <div className="card-title">{icon} {title}</div>
      {categories.map(cat => (
        <CategoryItem key={cat.id} cat={cat} dispatch={dispatch} allowRemove={allowRemove} />
      ))}
    </div>
  );
}

function CategoryItem({ cat, dispatch, allowRemove }) {
  const [expanded, setExpanded] = useState(false);
  const [editAmount, setEditAmount] = useState(false);
  const [editName, setEditName] = useState(false);
  const [amountVal, setAmountVal] = useState('');
  const [nameVal, setNameVal] = useState('');
  const [noteVal, setNoteVal] = useState(cat.note || '');
  const [editNote, setEditNote] = useState(false);

  function saveAmount() {
    const n = parseFloat(amountVal.replace(',', '.'));
    if (!isNaN(n) && n >= 0) {
      dispatch({ type: 'UPDATE_CATEGORY', id: cat.id, updates: { amount: n, planned: n } });
    }
    setEditAmount(false);
  }

  function saveName() {
    if (nameVal.trim()) {
      dispatch({ type: 'UPDATE_CATEGORY', id: cat.id, updates: { name: nameVal.trim() } });
    }
    setEditName(false);
  }

  function saveNote() {
    dispatch({ type: 'UPDATE_CATEGORY', id: cat.id, updates: { note: noteVal } });
    setEditNote(false);
  }

  function toggleActive() {
    dispatch({ type: 'UPDATE_CATEGORY', id: cat.id, updates: { active: !cat.active } });
  }

  return (
    <div className={`cat-item ${!cat.active ? 'cat-item--inactive' : ''}`}>
      <div className="cat-item-header" onClick={() => setExpanded(!expanded)}>
        <div className="cat-item-left">
          <button
            className={`toggle-btn ${cat.active ? 'toggle-btn--on' : 'toggle-btn--off'}`}
            onClick={e => { e.stopPropagation(); toggleActive(); }}
            title={cat.active ? 'Deaktivieren' : 'Aktivieren'}
          >
            {cat.active ? '●' : '○'}
          </button>
          <span className="cat-icon">{cat.icon}</span>
          <div className="cat-name-wrap">
            {editName ? (
              <div className="inline-edit" onClick={e => e.stopPropagation()}>
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
              <span
                className="cat-name"
                onDoubleClick={e => { e.stopPropagation(); setNameVal(cat.name); setEditName(true); }}
              >
                {cat.name}
              </span>
            )}
            {cat.specialLabel && <span className="cat-special">{cat.specialLabel}</span>}
          </div>
        </div>
        <div className="cat-item-right">
          {editAmount ? (
            <div className="inline-edit" onClick={e => e.stopPropagation()}>
              <input
                className="inline-input inline-input--sm"
                value={amountVal}
                onChange={e => setAmountVal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveAmount()}
                autoFocus
                type="number"
              />
              <button className="btn btn--xs btn--primary" onClick={e => { e.stopPropagation(); saveAmount(); }}>OK</button>
            </div>
          ) : (
            <span
              className="cat-amount cat-amount--clickable"
              onClick={e => { e.stopPropagation(); setAmountVal(cat.amount.toString()); setEditAmount(true); }}
            >
              {fmt(cat.amount)} ✏️
            </span>
          )}
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="cat-details">
          {cat.isTax && (
            <div className="cat-detail-badge">🗂️ Steuerrückstellung — nicht als frei verfügbar ansehen</div>
          )}
          {cat.isTransport && (
            <div className="cat-detail-badge">🚆 Über den Transport-Rechner anpassbar</div>
          )}
          {/* Note */}
          <div className="cat-note-section">
            <div className="cat-note-label">Bemerkung:</div>
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
                  <button className="btn btn--xs btn--ghost" onClick={() => { setNoteVal(cat.note || ''); setEditNote(false); }}>Abbrechen</button>
                </div>
              </div>
            ) : (
              <div className="cat-note" onClick={() => setEditNote(true)}>
                {cat.note || <span className="placeholder">Bemerkung hinzufügen…</span>}
                <span className="edit-hint"> ✏️</span>
              </div>
            )}
          </div>

          {allowRemove && (
            <button
              className="btn btn--xs btn--danger"
              onClick={() => dispatch({ type: 'REMOVE_CATEGORY', id: cat.id })}
            >
              Kategorie löschen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
