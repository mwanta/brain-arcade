import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { keyToDirection } from './input.js';
import { initLevel, levelReducer } from './levelMachine.js';

const TICKING = new Set(['showing', 'feedback', 'gap']);

/**
 * Runs one level: wraps levelReducer, feeds it a tick on every animation frame while a trial is
 * in progress, and turns keyboard presses into start / respond actions.
 *
 * @param {Array<object>} trials From generateTrials.
 * @param {object} settings From parseLevelSettings.
 * @returns {{ state: object, start: () => void, respond: (direction: string) => void,
 *   reset: () => void }}
 */
export function useDriftLevel(trials, settings) {
  const [state, dispatch] = useReducer(levelReducer, undefined, () => initLevel(trials, settings));
  const phase = state.phase;

  // The keydown listener reads the phase from a ref so it is attached once, not per phase.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const start = useCallback(() => dispatch({ type: 'start', now: performance.now() }), []);
  const respond = useCallback(
    (direction) => dispatch({ type: 'respond', direction, now: performance.now() }),
    []
  );
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  useEffect(() => {
    if (!TICKING.has(phase)) return undefined;
    let frame = requestAnimationFrame(function tick() {
      dispatch({ type: 'tick', now: performance.now() });
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const direction = keyToDirection(e.key);
      const current = phaseRef.current;
      if (current === 'ready' && (direction || e.key === ' ')) {
        e.preventDefault();
        dispatch({ type: 'start', now: performance.now() });
      } else if (direction) {
        // Always swallow mapped keys so the arrows never scroll the page mid-level.
        e.preventDefault();
        if (current === 'showing') {
          dispatch({ type: 'respond', direction, now: performance.now() });
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return useMemo(() => ({ state, start, respond, reset }), [state, start, respond, reset]);
}
