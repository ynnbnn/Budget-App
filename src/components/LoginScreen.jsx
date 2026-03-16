import { useState } from 'react';

const PASS_KEY = 'budget_app_password';
const SESSION_KEY = 'budget_app_session';

async function hashPassword(password) {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isAuthenticated() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export default function LoginScreen({ onLogin }) {
  const hasPassword = !!localStorage.getItem(PASS_KEY);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || loading) return;

    setError('');
    setLoading(true);

    try {
      const hash = await hashPassword(password);

      if (hasPassword) {
        // Login
        if (hash === localStorage.getItem(PASS_KEY)) {
          sessionStorage.setItem(SESSION_KEY, '1');
          onLogin();
        } else {
          setError('Falsches Passwort. Bitte erneut versuchen.');
          setPassword('');
        }
      } else {
        // First-time setup
        if (password.length < 4) {
          setError('Passwort muss mindestens 4 Zeichen lang sein.');
          return;
        }
        if (password !== confirm) {
          setError('Passwörter stimmen nicht überein.');
          return;
        }
        localStorage.setItem(PASS_KEY, hash);
        sessionStorage.setItem(SESSION_KEY, '1');
        onLogin();
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setShowReset(true);
  }

  function confirmReset() {
    localStorage.removeItem(PASS_KEY);
    setShowReset(false);
    setPassword('');
    setConfirm('');
    setError('');
    // Reload to trigger "setup" mode
    window.location.reload();
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">💼</div>
        <div className="login-title">Mein Budget</div>
        <div className="login-subtitle">
          {hasPassword ? 'Bitte anmelden' : 'Passwort festlegen'}
        </div>

        {showReset ? (
          <div className="login-reset-confirm">
            <div className="login-error" style={{ textAlign: 'center', marginBottom: 16 }}>
              Passwort zurücksetzen? Die Budget-Daten bleiben erhalten.
            </div>
            <button className="login-btn" onClick={confirmReset}>
              Ja, Passwort zurücksetzen
            </button>
            <button className="login-back-btn" onClick={() => setShowReset(false)}>
              Abbrechen
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <input
              className="login-input"
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              autoFocus
              autoComplete={hasPassword ? 'current-password' : 'new-password'}
            />

            {!hasPassword && (
              <input
                className="login-input"
                type="password"
                placeholder="Passwort bestätigen"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                autoComplete="new-password"
              />
            )}

            {error && <div className="login-error">{error}</div>}

            <button
              className="login-btn"
              type="submit"
              disabled={loading || !password}
            >
              {loading ? '…' : hasPassword ? 'Anmelden' : 'Passwort festlegen'}
            </button>
          </form>
        )}

        {hasPassword && !showReset && (
          <button className="login-forgot-btn" onClick={handleReset}>
            Passwort vergessen?
          </button>
        )}

        {!hasPassword && (
          <div className="login-hint">
            Nur du hast Zugriff. Das Passwort wird lokal gespeichert.
          </div>
        )}
      </div>
    </div>
  );
}
