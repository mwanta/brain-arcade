import { useMemo, useState } from 'react';
import DriftBoard from '../games/drift/DriftBoard.jsx';
import { parseLevelSettings } from '../games/drift/settings.js';
import { generateTrials } from '../games/drift/trials.js';

// Temporary dev tool for checking the Drift visuals by eye. PR 6 replaces it.
// (mixed_traffic is part of the level data but is ignored: every car is a target.)
const LEVELS = {
  1: {
    trial_count: 10,
    time_limit: 3000,
    max_errors: 3,
    switch_probability: 0.1,
    car_count: 2,
    move_speed: 50,
    conflict_ratio: 0.2,
    mixed_traffic: 0,
  },
  10: {
    trial_count: 30,
    time_limit: 1500,
    max_errors: 2,
    switch_probability: 0.5,
    car_count: 6,
    move_speed: 130,
    conflict_ratio: 0.75,
    mixed_traffic: 1,
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
        </p>
      )}
    </section>
  );
}
