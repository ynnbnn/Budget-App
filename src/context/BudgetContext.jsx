import { createContext, useContext, useReducer } from 'react';
import { INITIAL_DATA } from '../data/initialData';

const BudgetContext = createContext(null);

const STORAGE_KEY = 'budget_app_data';

function mergeWithInitial(stored) {
  if (!stored) return INITIAL_DATA;
  // Ensure all top-level keys exist (schema migration)
  return {
    income: stored.income ?? INITIAL_DATA.income,
    categories: stored.categories ?? INITIAL_DATA.categories,
    savingsAllocation: stored.savingsAllocation ?? INITIAL_DATA.savingsAllocation,
    transportSettings: stored.transportSettings ?? INITIAL_DATA.transportSettings,
    savingsAccounts: stored.savingsAccounts ?? INITIAL_DATA.savingsAccounts,
    savingsGoals: stored.savingsGoals ?? INITIAL_DATA.savingsGoals,
    currentMonth: stored.currentMonth ?? INITIAL_DATA.currentMonth,
  };
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return mergeWithInitial(JSON.parse(raw));
  } catch {}
  return null;
}

function saveToStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function budgetReducer(state, action) {
  let next;
  switch (action.type) {
    case 'SET_INCOME':
      next = { ...state, income: action.value };
      break;

    case 'UPDATE_CATEGORY':
      next = {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.id ? { ...c, ...action.updates } : c
        ),
      };
      break;

    case 'ADD_CATEGORY':
      next = {
        ...state,
        categories: [
          ...state.categories,
          {
            id: 'custom_' + Date.now(),
            name: action.name,
            icon: '💬',
            type: 'variable',
            amount: 0,
            planned: 0,
            actual: 0,
            active: true,
            note: '',
            editable: true,
          },
        ],
      };
      break;

    case 'REMOVE_CATEGORY':
      next = {
        ...state,
        categories: state.categories.filter(c => c.id !== action.id),
      };
      break;

    case 'UPDATE_TRANSPORT': {
      next = { ...state, transportSettings: { ...state.transportSettings, ...action.updates } };
      const ts = next.transportSettings;
      const monthlyDays =
        ts.mode === 'week' ? ts.daysPerWeek * 4.33 : ts.daysPerMonth;
      const newAmount = Math.round(monthlyDays * ts.costPerDay);
      next = {
        ...next,
        categories: next.categories.map(c =>
          c.id === 'transport' ? { ...c, amount: newAmount, planned: newAmount } : c
        ),
      };
      break;
    }

    case 'UPDATE_SAVINGS_ALLOCATION':
      next = { ...state, savingsAllocation: { ...state.savingsAllocation, ...action.updates } };
      break;

    case 'UPDATE_SAVINGS_ACCOUNT':
      next = {
        ...state,
        savingsAccounts: state.savingsAccounts.map(a =>
          a.id === action.id ? { ...a, ...action.updates } : a
        ),
      };
      break;

    case 'ADD_SAVINGS_ACCOUNT':
      next = {
        ...state,
        savingsAccounts: [
          ...state.savingsAccounts,
          { id: 'account_' + Date.now(), name: 'Neues Sparkonto', balance: 0, note: '' },
        ],
      };
      break;

    case 'REMOVE_SAVINGS_ACCOUNT':
      next = {
        ...state,
        savingsAccounts: state.savingsAccounts.filter(a => a.id !== action.id),
      };
      break;

    case 'UPDATE_SAVINGS_GOAL':
      next = {
        ...state,
        savingsGoals: state.savingsGoals.map(g =>
          g.id === action.id ? { ...g, ...action.updates } : g
        ),
      };
      break;

    case 'ADD_SAVINGS_GOAL':
      next = {
        ...state,
        savingsGoals: [
          ...state.savingsGoals,
          {
            id: 'goal_' + Date.now(),
            name: 'Neues Ziel',
            targetAmount: 1000,
            note: '',
            color: '#2E86AB',
          },
        ],
      };
      break;

    case 'REMOVE_SAVINGS_GOAL':
      next = { ...state, savingsGoals: state.savingsGoals.filter(g => g.id !== action.id) };
      break;

    case 'RESET':
      next = { ...INITIAL_DATA };
      break;

    default:
      return state;
  }

  saveToStorage(next);
  return next;
}

export function BudgetProvider({ children }) {
  const [state, dispatch] = useReducer(
    budgetReducer,
    null,
    () => loadFromStorage() || INITIAL_DATA
  );

  // Derived values
  const activeCategories = state.categories.filter(c => c.active);
  const totalExpenses = activeCategories.reduce((sum, c) => sum + (c.amount || 0), 0);
  const available = state.income - totalExpenses;
  const freeAvailable = available - state.savingsAllocation.savings - state.savingsAllocation.buffer;
  const totalSavings = state.savingsAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  const taxCategory = state.categories.find(c => c.id === 'taxes');
  const taxAmount = taxCategory && taxCategory.active ? taxCategory.amount : 0;

  // Warnings
  const warnings = [];
  if (available < 0) {
    warnings.push({ level: 'danger', msg: 'Ausgaben übersteigen dein Einkommen!' });
  }
  if (freeAvailable < 0 && available >= 0) {
    warnings.push({ level: 'danger', msg: 'Spar- und Pufferbeträge übersteigen das Verfügbare!' });
  }
  if (state.savingsAllocation.savings < 300 && state.savingsAllocation.savings > 0) {
    warnings.push({ level: 'warning', msg: 'Sparbetrag unter 300 CHF – Ziele schwer erreichbar.' });
  }
  if (state.savingsAllocation.buffer < 200 && state.savingsAllocation.buffer > 0) {
    warnings.push({ level: 'warning', msg: 'Puffer sehr klein – wenig Spielraum für Unerwartetes.' });
  }
  if (taxCategory && !taxCategory.active) {
    warnings.push({ level: 'warning', msg: 'Steuerrückstellung deaktiviert – Achtung bei der Steuerrechnung!' });
  }
  const subsCategory = state.categories.find(c => c.id === 'subscriptions');
  if (subsCategory && subsCategory.active && subsCategory.amount > 130) {
    warnings.push({ level: 'info', msg: 'Abo-Kosten über dem üblichen Rahmen (> 130 CHF).' });
  }

  // Budget status based on freeAvailable
  let budgetStatus = 'green';
  if (freeAvailable < 200) budgetStatus = 'yellow';
  if (freeAvailable < 0 || available < 0) budgetStatus = 'red';

  return (
    <BudgetContext.Provider value={{
      state, dispatch,
      totalExpenses, available, freeAvailable,
      totalSavings, taxAmount,
      warnings, budgetStatus,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
