import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { createPlayer } from '../api/playersApi.js';
import { useCurrentPlayer } from '../context/CurrentPlayerContext.jsx';
import PlayerForm from '../components/PlayerForm.jsx';

// The only way into the app: log in with a username, or create a new player
// (who is then logged in as themselves).
export default function LoginPage() {
  const { player, login, setPlayer } = useCurrentPlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const destination = location.state?.from?.pathname ?? '/stats';

  if (player) return <Navigate to={destination} replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username.trim());
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.details?.username || err.message);
      setSubmitting(false);
    }
  };

  // PlayerForm shows any ApiError (e.g. username taken) next to the fields.
  const handleCreate = async (values) => {
    setPlayer(await createPlayer(values));
    navigate(destination, { replace: true });
  };

  return (
    <section className="login">
      <div className="login-card">
        <p className="eyebrow-dark">Brain Arcade</p>
        <div className="tabs login-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={mode === 'login' ? 'tab active' : 'tab'}
            onClick={() => setMode('login')}
          >
            Log in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'create'}
            className={mode === 'create' ? 'tab active' : 'tab'}
            onClick={() => setMode('create')}
          >
            Create player
          </button>
        </div>

        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleLogin} noValidate>
            <h1>Welcome back</h1>
            <p className="muted">Enter your username to see your stats.</p>
            <label className="field">
              <span className="field-label">Username</span>
              <input
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'login-error' : undefined}
              />
            </label>
            {error && (
              <p id="login-error" className="field-error" role="alert">
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting || !username.trim()}>
              {submitting ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        ) : (
          <div className="login-form">
            <h1>New player</h1>
            <p className="muted">
              Your details are used to compare you with similar players. Only username and birthday
              are required.
            </p>
            <PlayerForm submitLabel="Create player and log in" onSubmit={handleCreate} />
          </div>
        )}
      </div>
    </section>
  );
}
