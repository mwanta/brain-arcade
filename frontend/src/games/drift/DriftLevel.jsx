import { useEffect, useMemo, useRef } from 'react';
import ArrowPad from './ArrowPad.jsx';
import DriftBoard from './DriftBoard.jsx';
import PixelIcon from './PixelIcon.jsx';
import { swipeDirection } from './input.js';
import { currentTrial, errorsSoFar, levelSummary } from './levelMachine.js';
import { STARTING_LIVES } from './session.js';
import { generateTrials } from './trials.js';
import { useDriftLevel } from './useDriftLevel.js';
import './drift.css';

function Feedback({ outcome, answer }) {
  if (!outcome) return null;
  const { outcome: kind, followedDistractor } = outcome;
  const icon = { correct: 'check', wrong: 'cross', timeout: 'clock' }[kind];
  const text = { correct: 'Correct', wrong: 'Wrong', timeout: 'Too slow' }[kind];
  return (
    <div className={`drift-overlay drift-feedback drift-feedback-${kind}`} role="status">
      <span className="drift-feedback-icon">
        <PixelIcon name={icon} size={96} />
      </span>
      <span className="drift-feedback-text">{text}</span>
      {kind !== 'correct' && (
        <span className="drift-feedback-answer">
          Right answer: <PixelIcon name={answer} size={24} />
          <span className="drift-visually-hidden">{answer}</span>
        </span>
      )}
      {followedDistractor && (
        <span className="drift-feedback-note">
          That&apos;s the grey cars&apos; way — ignore them.
        </span>
      )}
    </div>
  );
}

function Lives({ left, blinking }) {
  return (
    <div className="drift-lives" role="img" aria-label={`Lives: ${left} of ${STARTING_LIVES}`}>
      {Array.from({ length: STARTING_LIVES }, (_, i) => (
        <span
          key={i}
          className={`drift-heart ${i < left ? 'drift-heart-full' : 'drift-heart-empty'}${
            blinking && i === left ? ' drift-heart-lost' : ''
          }`}
        >
          <PixelIcon name={i < left ? 'heart' : 'heart-empty'} size={32} />
        </span>
      ))}
    </div>
  );
}

/**
 * Plays one level from start to finish.
 *
 * @param {{
 *   settings: object, seed: number, title?: string, lives?: number, finalOverlay?: ReactNode,
 *   onComplete: (done: { results: Array<object>, summary: object }) => void,
 * }} props `settings` is the parsed level settings; `onComplete` is called once, when the level
 *   ends (all trials played, or the last life is lost). `lives` is the lives at the START of
 *   the level; every mistake in the level costs one.
 */
export default function DriftLevel({
  settings,
  seed,
  title,
  lives = STARTING_LIVES,
  finalOverlay,
  onComplete,
}) {
  const trials = useMemo(() => generateTrials(settings, seed), [settings, seed]);
  const { state, start, respond } = useDriftLevel(trials, settings);
  const { phase } = state;
  const trial = currentTrial(state);
  const livesNow = Math.max(0, lives - errorsSoFar(state));
  const lostJustNow =
    phase === 'feedback' && state.lastOutcome && state.lastOutcome.outcome !== 'correct';

  const completed = useRef(false);
  useEffect(() => {
    if (phase !== 'done') {
      completed.current = false;
      return;
    }
    if (completed.current) return;
    completed.current = true;
    onComplete({ results: state.results, summary: levelSummary(state) });
  }, [phase, state, onComplete]);

  // Swipes: remember where the pointer went down, compare on release.
  const swipeStart = useRef(null);
  function onPointerDown(e) {
    if (e.button !== 0) return;
    swipeStart.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerUp(e) {
    const from = swipeStart.current;
    swipeStart.current = null;
    if (!from) return;
    if (phase === 'ready') {
      start();
    } else if (phase === 'showing') {
      const direction = swipeDirection(e.clientX - from.x, e.clientY - from.y);
      if (direction) respond(direction);
    }
  }

  function onPadPress(direction) {
    if (phase === 'ready') start();
    else if (phase === 'showing') respond(direction);
  }

  const shown = phase === 'showing' || phase === 'feedback';
  return (
    <div className="drift-level">
      <div className="drift-play">
        <div className="drift-main">
          <div
            className="drift-progress"
            role="progressbar"
            aria-label="Level progress"
            aria-valuemin={0}
            aria-valuemax={trials.length}
            aria-valuenow={state.results.length}
          >
            {trials.map((t, i) => (
              <div
                key={t.index}
                className={`drift-progress-segment${
                  state.results[i] ? ` drift-progress-${state.results[i].outcome}` : ''
                }`}
              />
            ))}
          </div>
          <div
            className="drift-stage"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerCancel={() => {
              swipeStart.current = null;
            }}
          >
            <DriftBoard
              trial={trial}
              moveSpeed={settings.moveSpeed}
              running={phase === 'showing'}
              showCars={shown}
              seed={seed + trial.index}
            />
            <Lives left={livesNow} blinking={lostJustNow} />
            {phase === 'ready' && (
              <div className="drift-overlay drift-ready">
                {title && <h2 className="drift-ready-title">{title}</h2>}
                {settings.distractorCount > 0 && (
                  <p className="drift-ready-note">
                    Ignore the grey cars with no headlights, they are distractors!
                  </p>
                )}
                <p>Click an arrow or press an arrow key to start</p>
                <button
                  type="button"
                  className="drift-start"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={start}
                >
                  Start
                </button>
              </div>
            )}
            {phase === 'done' && finalOverlay}
            {phase === 'feedback' && <Feedback outcome={state.lastOutcome} answer={trial.answer} />}
          </div>
          <div
            className="drift-timebar"
            role="progressbar"
            aria-label="Time left"
            aria-hidden={phase !== 'showing'}
          >
            {phase === 'showing' && (
              <div
                key={trial.index}
                className="drift-timebar-fill"
                style={{ animationDuration: `${settings.timeLimit}ms` }}
              />
            )}
          </div>
        </div>
        <ArrowPad onPress={onPadPress} disabled={phase !== 'showing' && phase !== 'ready'} />
      </div>
    </div>
  );
}
