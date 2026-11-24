import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGame, listGames } from '../api/catalogApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import QuickMatchCheckIn from '../games/quick-match/QuickMatchCheckIn.jsx';
import QuickMatchRound from '../games/quick-match/QuickMatchRound.jsx';
import { QuickMatchRun } from '../games/quick-match/gameRun.js';
import { prepareLevels, readRules } from '../games/quick-match/logic.js';
import '../games/quick-match/quickMatch.css';

const EMPTY_CHECK_IN = {
  hours_slept: '',
  caffeine_drinks: '',
  stress_level: '',
  exercised_today: '',
};

export default function QuickMatchPage({ playerId }) {
  const [game, setGame] = useState(null);
  const [phase, setPhase] = useState('intro');
  const [error, setError] = useState(null);
  const [levelIndex, setLevelIndex] = useState(0);
  const [attempt, setAttempt] = useState(null);
  const [score, setScore] = useState(0);
  const [checkIn, setCheckIn] = useState(EMPTY_CHECK_IN);
  const run = useRef(null);
  const busy = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const onPageHide = () => run.current?.abandon({ keepalive: true });
    window.addEventListener('pagehide', onPageHide);
    return () => {
      mounted.current = false;
      window.removeEventListener('pagehide', onPageHide);
      run.current?.abandon();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const entry = (await listGames()).find((item) => item.name === 'Quick Match');
        if (!entry) throw new Error('Quick Match is missing from the game catalog.');
        const detail = await getGame(entry.game_id);
        detail.levels = prepareLevels(detail);
        if (!cancelled) setGame(detail);
      } catch (err) {
        if (!cancelled) setError(err);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const level = game?.levels[levelIndex];
  const rules = level && readRules(level);
  const lastLevel = game && levelIndex === game.levels.length - 1;

  async function start(event) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setPhase('starting');
    try {
      const values = Object.fromEntries(
        Object.entries(checkIn)
          .filter(([, value]) => value !== '')
          .map(([key, value]) => [key, key === 'exercised_today' ? value === 'yes' : Number(value)])
      );
      run.current ??= new QuickMatchRun(playerId, game.game_id);
      await run.current.start(Object.keys(values).length ? values : null);
      if (!mounted.current) {
        await run.current.abandon();
        return;
      }
      setPhase('ready');
    } catch (err) {
      setError(err);
      setPhase('intro');
    } finally {
      busy.current = false;
    }
  }

  async function save(result) {
    if (busy.current) return;
    busy.current = true;
    setAttempt(result);
    setPhase('saving');
    setError(null);
    try {
      await run.current.saveAttempt(result);
      if (result.passed) setScore(level.level_number);
      setPhase('result');
    } catch (err) {
      setError(err);
      setPhase('save-error');
    } finally {
      busy.current = false;
    }
  }

  async function finish() {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setPhase('finishing');
    try {
      const play = await run.current.finish();
      setScore(play.score);
      setPhase('complete');
    } catch (err) {
      setError(err);
      setPhase('finish-error');
    } finally {
      busy.current = false;
    }
  }

  function playAgain() {
    run.current = null;
    setLevelIndex(0);
    setAttempt(null);
    setScore(0);
    setCheckIn(EMPTY_CHECK_IN);
    setPhase('intro');
  }

  return (
    <section className="qm-page">
      <header className="qm-heading">
        <div>
          <p className="eyebrow-dark">Processing speed</p>
          <h1>Quick Match</h1>
        </div>
        {game && (
          <span className="qm-level-label">
            {phase === 'intro' || phase === 'complete'
              ? `${game.levels.length} levels`
              : `Level ${level.level_number} / ${game.levels.length}`}
          </span>
        )}
      </header>
      <ErrorMessage error={error} />
      {!game && !error && <p role="status">Loading game…</p>}
      {!game && error && <p>Check that the backend is running and the game catalog is loaded.</p>}

      {game && (phase === 'intro' || phase === 'starting') && (
        <form className="qm-panel" onSubmit={start}>
          <h2>A quick eye. A quicker decision.</h2>
          <p>
            Remember the first symbol. For each new symbol, choose whether it is the same as the one
            immediately before it.
          </p>
          <div
            className="qm-example"
            aria-label="Example: a circle followed by a circle means Same"
          >
            <span>●</span>
            <span aria-hidden="true">→</span>
            <span>●</span>
            <strong>Same</strong>
          </div>
          <p>
            Use <kbd>←</kbd> for Different and <kbd>→</kbd> for Same, or tap the buttons.
          </p>
          <p className="muted">
            Each level gets faster. A wrong answer or timeout counts as one error. Pass to unlock
            the next level. Your score is the highest level passed.
          </p>
          <QuickMatchCheckIn
            value={checkIn}
            onChange={setCheckIn}
            disabled={phase === 'starting' || run.current?.sessionId != null}
          />
          <button type="submit" className="qm-primary" disabled={phase === 'starting'}>
            {phase === 'starting' ? 'Starting…' : 'Start game'}
          </button>
        </form>
      )}

      {phase === 'ready' && (
        <div className="qm-panel qm-centered">
          <h2>Level {level.level_number}</h2>
          <p>
            {rules.trialCount} comparisons · {(rules.timeLimit / 1000).toFixed(2)} seconds per
            symbol
          </p>
          <p>
            Up to {rules.maxErrors} {rules.maxErrors === 1 ? 'error' : 'errors'} allowed.
          </p>
          <button type="button" className="qm-primary" onClick={() => setPhase('playing')}>
            Begin level
          </button>
          <button type="button" className="ghost" onClick={finish}>
            Finish game
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <QuickMatchRound key={level.level_id} level={level} onComplete={save} />
      )}
      {phase === 'saving' && (
        <div className="qm-panel" role="status">
          Saving level…
        </div>
      )}
      {phase === 'save-error' && (
        <div className="qm-panel">
          <p>Your level result is waiting to be saved.</p>
          <button type="button" onClick={() => save(attempt)}>
            Retry saving
          </button>
        </div>
      )}
      {phase === 'result' && (
        <div className="qm-panel qm-centered">
          <h2>
            {attempt.passed
              ? lastLevel
                ? 'All levels passed!'
                : 'Level passed!'
              : 'Game complete'}
          </h2>
          <p>
            {attempt.error_count} {attempt.error_count === 1 ? 'error' : 'errors'} ·{' '}
            {(attempt.duration_ms / 1000).toFixed(2)} seconds answering
          </p>
          <p>
            Highest level passed <strong>{score}</strong>
          </p>
          {attempt.passed && !lastLevel && (
            <button
              type="button"
              className="qm-primary"
              onClick={() => {
                setLevelIndex((value) => value + 1);
                setPhase('ready');
              }}
            >
              Next level
            </button>
          )}
          <button
            type="button"
            className={attempt.passed && !lastLevel ? 'secondary' : 'qm-primary'}
            onClick={finish}
          >
            Save and finish
          </button>
        </div>
      )}
      {phase === 'finishing' && (
        <div className="qm-panel" role="status">
          Finishing game…
        </div>
      )}
      {phase === 'finish-error' && (
        <div className="qm-panel">
          <p>Your results are saved. Finishing the game is still pending.</p>
          <button type="button" onClick={finish}>
            Retry finishing
          </button>
        </div>
      )}
      {phase === 'complete' && (
        <div className="qm-panel qm-centered">
          <p className="eyebrow-dark">Results saved</p>
          <h2>Level {score} reached</h2>
          <p>
            You passed {score} of {game.levels.length} levels.
          </p>
          <div className="button-row">
            <button type="button" onClick={playAgain}>
              Play again
            </button>
            <Link className="button secondary" to={`/stats?game_id=${game.game_id}`}>
              View my stats
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
