import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getGame, listGames } from '../api/catalogApi.js';
import { finishGamePlay, recordLevelAttempt, startGamePlay } from '../api/gamePlaysApi.js';
import { endSession, startSession } from '../api/sessionsApi.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import DriftGame from '../games/drift/DriftGame.jsx';
import DriftScore from '../games/drift/DriftScore.jsx';
import DriftTutorial from '../games/drift/DriftTutorial.jsx';
import { createPlayRecorder } from '../games/drift/playRecorder.js';
import { attemptPayload, driftLevelsFromGame } from '../games/drift/session.js';

const DESCRIPTION =
  "Follow the cars and click the arrow for the way they move or face, depending if they're driving or drifting.";

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
    ></DriftScore>
  );
}

// One page for /drift (the how-to-play screen) and /drift/play (the game). It is a single route
// so the game in progress, and the session it belongs to, survive moving between them.
export default function DriftGamePage({ playerId }) {
  const navigate = useNavigate();
  const sub = useLocation()
    .pathname.replace(/^\/drift\/?/, '')
    .replace(/\/$/, '');
  const [loaded, setLoaded] = useState({ state: 'loading' });
  const [playing, setPlaying] = useState(null); // { recorder, seed, run } while a game is on
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  const recorderRef = useRef(null);
  const startingRef = useRef(false);
  const mounted = useRef(false);
  // The open session of this sitting. Every game played here (Play again included) is a play in
  // this one session. It ends when the player leaves /drift/play or closes the page.
  const sessionRef = useRef(null);

  // Ends the session, best effort. `keepalive` lets the request outlive a closing page. The
  // backend accepts attempts and finish for a play after its session ended, so nothing in
  // flight is lost; an unfinished play is simply not in the stats.
  function endSitting({ keepalive = false } = {}) {
    const sid = sessionRef.current;
    if (sid === null) return;
    sessionRef.current = null;
    API.endSession(sid, keepalive ? { keepalive: true } : undefined).catch(() => {});
  }

  useEffect(() => {
    mounted.current = true;
    const onPageHide = () => endSitting({ keepalive: true });
    window.addEventListener('pagehide', onPageHide);
    return () => {
      mounted.current = false;
      window.removeEventListener('pagehide', onPageHide);
      endSitting();
    };
  }, []);

  // Leaving /drift/play (the browser's back button, say) ends the sitting.
  useEffect(() => {
    if (playing && sub !== 'play') {
      endSitting();
      setPlaying(null);
    }
  }, [playing, sub]);

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

  // Starts a play in the sitting's session, opening the session first if there is none. If the
  // session turns out to have ended already (409), opens a new one once.
  async function beginPlay() {
    for (let attempt = 0; ; attempt++) {
      const opened = sessionRef.current === null;
      if (opened) sessionRef.current = (await API.startSession(playerId)).session_id;
      const recorder = createPlayRecorder(API, {
        playerId,
        gameId: loaded.game.game_id,
        sessionId: sessionRef.current,
      });
      try {
        await recorder.begin();
        return recorder;
      } catch (error) {
        if (opened) {
          endSitting(); // a session that never got a play
        } else if (error.status === 409 && attempt === 0) {
          sessionRef.current = null;
          continue;
        }
        throw error;
      }
    }
  }

  // Shows a new game: a new play in this sitting's session.
  async function startNewGame() {
    if (startingRef.current) return;
    startingRef.current = true;
    setStarting(true);
    setStartError(null);
    let recorder;
    try {
      recorder = await beginPlay();
    } catch (error) {
      startingRef.current = false;
      if (mounted.current) {
        setStartError(error);
        setStarting(false);
      }
      return;
    }
    startingRef.current = false;
    if (!mounted.current) {
      endSitting();
      return;
    }
    recorderRef.current = recorder;
    setStarting(false);
    setPlaying((p) => ({ recorder, seed: randomSeed(), run: (p?.run ?? 0) + 1 }));
    navigate('/drift/play', { replace: sub === 'play' }); // "Play again" stays on /drift/play
  }

  function back() {
    endSitting();
    setPlaying(null);
    navigate('/drift');
  }

  function handleLevelComplete({ level, results, settings }) {
    recorderRef.current.record(attemptPayload(level.levelId, results, settings));
  }

  function handleGameOver() {
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

  // Anything but /drift and /drift/play goes to /drift. A refresh of /drift/play has no game to
  // show, so it goes there too.
  if (sub !== '' && sub !== 'play') return <Navigate to="/drift" replace />;
  if (sub === 'play' && !playing) return <Navigate to="/drift" replace />;

  if (sub === '') {
    return (
      <section>
        <h1>Drift</h1>
        <p>{DESCRIPTION}</p>
        <ErrorMessage error={startError} />
        <DriftTutorial
          onStart={startNewGame}
          startLabel={startError ? 'Try again' : 'Start Game'}
          startDisabled={starting}
        />
      </section>
    );
  }

  return (
    <section>
      <h1>Drift</h1>
      <p>{DESCRIPTION}</p>
      <ErrorMessage error={startError} />
      <div className="drift-game-row">
        <button type="button" className="drift-game-back" onClick={back}>
          Back To Tutorial
        </button>
        <div className="drift-game-main">
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
        </div>
      </div>
    </section>
  );
}
