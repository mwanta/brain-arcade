import { useMemo, useState } from 'react';
import DriftBoard from '../games/drift/DriftBoard.jsx';
import DriftGame from '../games/drift/DriftGame.jsx';
import DriftScore from '../games/drift/DriftScore.jsx';
import { LEVELS } from '../games/drift/levelFixtures.js';
import { parseLevelSettings } from '../games/drift/settings.js';
import { generateTrials } from '../games/drift/trials.js';

// Temporary dev tool for checking Drift by eye: browse generated trials, or play a whole
// game (10 levels of 5 trials each, 5 lives) with these fixtures and no API calls. The real
// game is DriftGamePage at /drift. The level fixtures copy backend/database/seed.sql (see
// levelFixtures.js).

// Fixtures have no database ids, so a level's id is its number.
const FIXTURE_LEVELS = Object.entries(LEVELS).map(([n, raw]) => ({
  levelId: Number(n),
  levelNumber: Number(n),
  raw,
}));

function Session({ seed }) {
  return (
    <DriftGame
      levels={FIXTURE_LEVELS}
      seed={seed}
      allowJump
      renderFinal={(total, playAgain) => <DriftScore total={total} onPlayAgain={playAgain} />}
    />
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
