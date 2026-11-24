import { useEffect, useState } from 'react';
import DriftBoard from './DriftBoard.jsx';
import PixelIcon from './PixelIcon.jsx';
import { TUTORIAL_STEPS } from './tutorial.js';
import './drift.css';

// Each step's board gets its own fixed seed, so its cars start in the same place every visit.
const STEP_SEED = 21;

/**
 * The how-to-play walkthrough: one animated example per step.
 *
 * @param {{ onStart: () => void, startLabel?: string, startDisabled?: boolean }} props `onStart`
 *   is called by the Start button below the step box, which is available on every step.
 */
export default function DriftTutorial({
  onStart,
  startLabel = 'Start Game',
  startDisabled = false,
}) {
  const [step, setStep] = useState(0);
  const last = TUTORIAL_STEPS.length - 1;
  const { trial, moveSpeed } = TUTORIAL_STEPS[step];

  const back = () => setStep((s) => Math.max(0, s - 1));
  const next = () => setStep((s) => Math.min(last, s + 1));

  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setStep((s) => Math.min(TUTORIAL_STEPS.length - 1, s + 1));
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="drift-tutorial">
      <div className="drift-tutorial-board">
        <DriftBoard
          key={step}
          trial={trial}
          moveSpeed={moveSpeed}
          running
          seed={STEP_SEED + step}
        />
      </div>
      <div className="drift-tutorial-side">
        <div className="drift-tutorial-panel">
          <h2 className="drift-tutorial-heading">How to play</h2>
          <p className="drift-tutorial-count" aria-live="polite">
            Step {step + 1} of {TUTORIAL_STEPS.length}
          </p>
          <div className="drift-tutorial-dots" aria-hidden="true">
            {TUTORIAL_STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`drift-tutorial-dot${i === step ? ' drift-tutorial-dot-current' : ''}`}
              />
            ))}
          </div>
          {/* Every step's text sits in the same grid cell, so the box is as tall as the longest
              step and never changes size; only the current step is visible. */}
          <div className="drift-tutorial-slides">
            {TUTORIAL_STEPS.map((s, i) => (
              <div
                key={s.title}
                className={`drift-tutorial-slide${i === step ? '' : ' drift-tutorial-slide-hidden'}`}
                aria-hidden={i !== step}
              >
                <h2 className="drift-tutorial-title">{s.title}</h2>
                <p className="drift-tutorial-text">{s.text}</p>
                {i < last && (
                  <p className="drift-tutorial-answer">
                    Answer: <PixelIcon name={s.trial.answer} size={32} />
                    <span className="drift-visually-hidden">{s.trial.answer}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="drift-tutorial-actions">
            <button
              type="button"
              className="drift-tutorial-button"
              onClick={back}
              disabled={step === 0}
            >
              Back
            </button>
            <button
              type="button"
              className="drift-tutorial-button drift-tutorial-button-primary"
              onClick={next}
              disabled={step === last}
            >
              Next
            </button>
          </div>
        </div>
        <button
          type="button"
          className={`drift-tutorial-button drift-tutorial-button-start${
            step === last ? ' drift-tutorial-button-ready' : ''
          }`}
          onClick={onStart}
          disabled={startDisabled}
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
}
