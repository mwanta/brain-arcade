import { useMemo, useState } from 'react';
import DriftBoard from '../games/drift/DriftBoard.jsx';
import { parseLevelSettings } from '../games/drift/settings.js';
import { generateTrials } from '../games/drift/trials.js';

// Temporary dev tool for checking the Drift visuals by eye. PR 6 replaces it.
// The fixtures copy levels 1, 6 and 10 from backend/database/seed.sql.
const LEVELS = {
  1: {
    trial_count: 20,
    time_limit: 3000,
    max_errors: 4,
    switch_probability: 0.2,
    car_count: 3,
    move_speed: 60,
    conflict_ratio: 0.3,
    distractor_count: 0,
  },
  6: {
    trial_count: 24,
    time_limit: 2600,
    max_errors: 4,
    switch_probability: 0.4,
    car_count: 3,
    move_speed: 50,
    conflict_ratio: 0.5,
    distractor_count: 2,
  },
  10: {
    trial_count: 32,
    time_limit: 1800,
    max_errors: 2,
    switch_probability: 0.6,
    car_count: 8,
    move_speed: 130,
    conflict_ratio: 0.7,
    distractor_count: 6,
  },
};

export default function DriftPreviewPage() {
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
        <label>
          Level{' '}
          <select value={level} onChange={(e) => changeLevel(e.target.value)}>
            <option value="1">Level 1</option>
            <option value="6">Level 6</option>
            <option value="10">Level 10</option>
          </select>
        </label>{' '}
        <label>
          Seed <input type="number" value={seed} onChange={(e) => changeSeed(e.target.value)} />
        </label>
      </p>
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
    </section>
  );
}
