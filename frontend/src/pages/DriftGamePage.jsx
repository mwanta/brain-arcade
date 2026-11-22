import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGame, listGames } from '../api/catalogApi.js';
import { finishGamePlay, recordLevelAttempt, startGamePlay } from '../api/gamePlaysApi.js';
import { endSession, startSession } from '../api/sessionsApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import DriftGame from '../games/drift/DriftGame.jsx';
import DriftScore from '../games/drift/DriftScore.jsx';
import { createPlayRecorder } from '../games/drift/playRecorder.js';
import {
  SESSION_LEVELS,
  STARTING_LIVES,
  TRIALS_PER_LEVEL,
  attemptPayload,
  driftLevelsFromGame,
} from '../games/drift/session.js';

const API = { startSession, startGamePlay, recordLevelAttempt, finishGamePlay, endSession };

// A random 31-bit seed, so the cars differ from game to game.
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] >>> 1;

// The final overlay: the score plus the recorder's live save status.
function FinalScore({ recorder, total, onPlayAgain }) {
  const [status, setStatus] = useState(recorder.status);
  useEffect(() => {
    setStatus(recorder.status);
    return recorder.subscribe(setStatus);
  }, [recorder]);
  return (
    <DriftScore
      total={total}
      onPlayAgain={onPlayAgain}
      saveStatus={status === 'idle' ? 'saving' : status}
      onRetrySave={recorder.retry}
    >
    </DriftScore>
  );
}

export default function DriftGamePage({ playerId }) {
  const [loaded, setLoaded] = useState({ state: 'loading' });
  const [playing, setPlaying] = useState(null); // { recorder, seed, run } while a game is on
  const [over, setOver] = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  // The recorder of the game in progress, or null when none needs abandoning (no game, or its
  // results were handed to finish()). A ref, so cleanup works the same under StrictMode.
  const activeRecorder = useRef(null);
  const recorderRef = useRef(null);
  const startingRef = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeRecorder.current?.abandon();
      activeRecorder.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const games = await listGames();
        const drift = games.find((g) => g.name === 'Drift');
        if (!drift) throw new Error('The Drift game is not in the database.');
        const game = await getGame(drift.game_id);
        const levels = driftLevelsFromGame(game);
        if (!cancelled) setLoaded({ state: 'ready', game, levels });
      } catch (error) {
        if (!cancelled) setLoaded({ state: 'error', error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Creates a fresh recorder (a new session and play) and shows a new game.
  async function startNewGame() {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setStartError(null);
    const recorder = createPlayRecorder(API, { playerId, gameId: loaded.game.game_id });
    try {
      await recorder.begin();
    } catch (error) {
      recorder.abandon(); // ends the session if it was created before the play failed
      startingRef.current = false;
      if (mounted.current) {
        setStartError(error);
        setStarting(false);
      }
      return;
    }
    startingRef.current = false;
    if (!mounted.current) {
      recorder.abandon();
      return;
    }
    recorderRef.current = recorder;
    activeRecorder.current = recorder;
    setOver(false);
    setStarting(false);
    setPlaying((p) => ({ recorder, seed: randomSeed(), run: (p?.run ?? 0) + 1 }));
  }

  function quit() {
    activeRecorder.current?.abandon();
    activeRecorder.current = null;
    setPlaying(null);
    setOver(false);
  }

  function handleLevelComplete({ level, results, settings }) {
    recorderRef.current.record(attemptPayload(level.levelId, results, settings));
  }

  function handleGameOver() {
    activeRecorder.current = null; // finished games are never abandoned
    setOver(true);
    recorderRef.current.finish();
  }

  if (loaded.state === 'loading') return <p>Loading Drift…</p>;
  if (loaded.state === 'error') {
    return (
      <section>
        <h1>Drift</h1>
        <ErrorMessage error={loaded.error} />
        <p>
          If this mentions a missing level setting, the database may need rebuilding with
          ./scripts/db_rebuild.sh.
        </p>
      </section>
    );
  }

  if (!playing) {
    return (
      <section>
        <h1>Drift</h1>
        <p>{loaded.game.instructions}</p>
        <p>
          {SESSION_LEVELS} levels, {TRIALS_PER_LEVEL} rounds each. You have {STARTING_LIVES} lives
          for the whole game.
        </p>
        <ErrorMessage error={startError} />
        <button type="button" onClick={startNewGame} disabled={starting}>
          {startError ? 'Try again' : 'Start'}
        </button>
      </section>
    );
  }

  return (
    <section>
      {!over && (
        <p>
          <button type="button" onClick={quit}>
            Quit
          </button>
        </p>
      )}
      <ErrorMessage error={startError} />
      <DriftGame
        key={playing.run}
        levels={loaded.levels}
        seed={playing.seed}
        onLevelComplete={handleLevelComplete}
        onGameOver={handleGameOver}
        renderFinal={(total) => (
          <FinalScore recorder={playing.recorder} total={total} onPlayAgain={startNewGame} />
        )}
      />
    </section>
  );
}
