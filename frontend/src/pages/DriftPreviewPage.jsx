import { useCallback, useMemo, useState } from 'react';
import DriftBoard from '../games/drift/DriftBoard.jsx';
import DriftLevel from '../games/drift/DriftLevel.jsx';
import DriftScore from '../games/drift/DriftScore.jsx';
import { LEVELS } from '../games/drift/levelFixtures.js';
import {
  SESSION_LEVELS,
  TRIALS_PER_LEVEL,
  scoreSession,
  sessionLevelSettings,
} from '../games/drift/session.js';
import { parseLevelSettings } from '../games/drift/settings.js';
import { generateTrials } from '../games/drift/trials.js';

// Temporary dev tool for checking Drift by eye: browse generated trials, or play a whole
// session (10 levels of 5 trials each) and get a score. The real Drift game page will replace
// it later. The level fixtures copy backend/database/seed.sql (see levelFixtures.js).

function Session({ seed }) {
  const [levelNumber, setLevelNumber] = useState(1);
  const [finished, setFinished] = useState([]);
  const [run, setRun] = useState(0);

  // After the last level levelNumber is SESSION_LEVELS + 1: the last level stays on screen with
  // the final score drawn over its board.
  const gameOver = levelNumber > SESSION_LEVELS;
  const shownLevel = Math.min(levelNumber, SESSION_LEVELS);
  const settings = useMemo(() => sessionLevelSettings(LEVELS[shownLevel]), [shownLevel]);

  const onComplete = useCallback(
    ({ results }) => {
      setFinished((prev) => [...prev, { results, timeLimit: settings.timeLimit }]);
      setLevelNumber((n) => n + 1);
    },
    [settings]
  );

  // Dev shortcut: jump to any level. Scores of the levels before it are kept; later ones are
  // dropped.
  function jumpTo(n) {
    setFinished((prev) => prev.slice(0, n - 1));
    setLevelNumber(n);
    setRun((r) => r + 1);
  }

  return (
    <div>
      <p>
        <label>
          Jump to level (dev){' '}
          <select value={shownLevel} onChange={(e) => jumpTo(Number(e.target.value))}>
            {Array.from({ length: SESSION_LEVELS }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Level {i + 1}
              </option>
            ))}
          </select>
        </label>
      </p>
      <DriftLevel
        title={`Level ${shownLevel} of ${SESSION_LEVELS}`}
        key={`${run}-${shownLevel}`}
        settings={settings}
        seed={seed + shownLevel * 1000}
        finalOverlay={
          gameOver && (
            <DriftScore
              total={scoreSession(finished)}
              onPlayAgain={() => {
                setFinished([]);
                setLevelNumber(1);
                setRun((n) => n + 1);
              }}
            />
          )
        }
        onComplete={onComplete}
      />
    </div>
  );
}

export default function DriftPreviewPage() {
  const [mode, setMode] = useState('browse');
  const [level, setLevel] = useState('1');
  const [seed, setSeed] = useState(1);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);

  const settings = useMemo(() => parseLevelSettings(LEVELS[level]), [level]);
  const trials = useMemo(() => generateTrials(settings, seed), [settings, seed]);
  const trial = trials[index];
  const car = trial.cars[0];

  function changeLevel(value) {
    setLevel(value);
    setIndex(0);
  }

  function changeSeed(value) {
    const n = Math.trunc(Number(value));
    setSeed(Number.isFinite(n) ? n : 0);
    setIndex(0);
  }

  return (
    <section>
      <h1>Drift preview</h1>
      <p>Dev-only visual check. Not part of the shipped app.</p>
      <p>
        {[
          ['browse', 'Browse trials'],
          ['play', 'Play game'],
        ].map(([value, text]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            disabled={mode === value}
            onClick={() => setMode(value)}
          >
            {text}
          </button>
        ))}
      </p>
      <p>
        {mode === 'browse' && (
          <label>
            Level{' '}
            <select value={level} onChange={(e) => changeLevel(e.target.value)}>
              {Object.keys(LEVELS).map((n) => (
                <option key={n} value={n}>
                  Level {n}
                </option>
              ))}
            </select>
          </label>
        )}{' '}
        <label>
          Seed <input type="number" value={seed} onChange={(e) => changeSeed(e.target.value)} />
        </label>
      </p>
      {mode === 'play' ? (
        <Session key={seed} seed={seed} />
      ) : (
        <>
          <p>
            <button type="button" onClick={() => setIndex((i) => i - 1)} disabled={index === 0}>
              Prev
            </button>{' '}
            <span>
              Trial {index + 1} of {trials.length}
            </span>{' '}
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              disabled={index === trials.length - 1}
            >
              Next
            </button>{' '}
            <button type="button" onClick={() => setRunning((r) => !r)}>
              {running ? 'Pause' : 'Play'}
            </button>{' '}
            <label>
              <input
                type="checkbox"
                checked={showAnswer}
                onChange={(e) => setShowAnswer(e.target.checked)}
              />{' '}
              Show answer
            </label>
          </p>
          <DriftBoard
            trial={trial}
            moveSpeed={settings.moveSpeed}
            running={running}
            seed={seed + trial.index}
          />
          {showAnswer && (
            <p>
              Rule:{' '}
              {trial.rule === 'drive'
                ? 'driving (follow the moving direction)'
                : 'drifting (follow the facing direction)'}
              . Cars face {car.facing}, move {car.moving}. Answer: <strong>{trial.answer}</strong>.
              {trial.distractors.length > 0 &&
                ` ${trial.distractors.length} grey cars drive ${trial.distractors[0].moving} (ignore them).`}
            </p>
          )}
        </>
      )}
    </section>
  );
}
