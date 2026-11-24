import { evaluateLevel, isLevelOver, judgeResponse } from './scoring.js';

/** How long the result of a trial stays on screen. */
export const FEEDBACK_MS = 450;
/** A timeout stays up longer, so a player who froze notices they were too slow. */
export const TIMEOUT_FEEDBACK_MS = 1200;
/** The blank road between one trial and the next. */
export const GAP_MS = 250;

/**
 * The starting state of a level.
 *
 * @param {Array<object>} trials From generateTrials.
 * @param {object} settings From parseLevelSettings.
 * @returns {object} State in the 'ready' phase.
 */
export function initLevel(trials, settings) {
  return {
    phase: 'ready',
    trials,
    settings,
    index: 0,
    shownAt: null,
    phaseEndsAt: null,
    results: [],
    lastOutcome: null,
  };
}

function record(state, result, now) {
  return {
    ...state,
    phase: 'feedback',
    phaseEndsAt: now + (result.outcome === 'timeout' ? TIMEOUT_FEEDBACK_MS : FEEDBACK_MS),
    results: [...state.results, result],
    lastOutcome: result,
  };
}

/**
 * The trial loop as a pure reducer. It never reads the clock: every action that depends on time
 * carries `now` in ms. Phases: ready -> showing -> feedback -> gap -> showing ... -> done.
 *
 * Actions: { type: 'start', now }, { type: 'respond', direction, now }, { type: 'tick', now },
 * { type: 'reset' }. A tick takes at most one transition step.
 *
 * @param {object} state Current state (never mutated).
 * @param {object} action One of the actions above.
 * @returns {object} The next state (the same object if nothing changed).
 */
export function levelReducer(state, action) {
  switch (action.type) {
    case 'start':
      if (state.phase !== 'ready') return state;
      return { ...state, phase: 'showing', index: 0, shownAt: action.now };
    case 'respond': {
      if (state.phase !== 'showing') return state;
      const trial = state.trials[state.index];
      const elapsedMs = action.now - state.shownAt;
      const outcome = judgeResponse(trial, action.direction, elapsedMs, state.settings.timeLimit);
      const followedDistractor =
        outcome === 'wrong' &&
        trial.distractors.length > 0 &&
        action.direction === trial.distractors[0].moving;
      return record(
        state,
        { outcome, elapsedMs, direction: action.direction, followedDistractor },
        action.now
      );
    }
    case 'tick':
      if (state.phase === 'showing') {
        if (action.now - state.shownAt <= state.settings.timeLimit) return state;
        return record(
          state,
          {
            outcome: 'timeout',
            elapsedMs: state.settings.timeLimit,
            direction: null,
            followedDistractor: false,
          },
          action.now
        );
      }
      if (state.phase === 'feedback') {
        if (action.now < state.phaseEndsAt) return state;
        if (isLevelOver(state.results, state.settings)) {
          return { ...state, phase: 'done', shownAt: null, phaseEndsAt: null };
        }
        return { ...state, phase: 'gap', phaseEndsAt: action.now + GAP_MS };
      }
      if (state.phase === 'gap') {
        if (action.now < state.phaseEndsAt) return state;
        return {
          ...state,
          phase: 'showing',
          index: state.index + 1,
          shownAt: action.now,
          phaseEndsAt: null,
        };
      }
      return state;
    case 'reset':
      return initLevel(state.trials, state.settings);
    default:
      return state;
  }
}

/** The trial on screen (or just answered). */
export function currentTrial(state) {
  return state.trials[state.index];
}

/** Wrong answers plus timeouts so far. */
export function errorsSoFar(state) {
  return state.results.filter((r) => r.outcome !== 'correct').length;
}

/** Mistakes the player can still make before the level fails; never below 0. */
export function errorsLeft(state) {
  return Math.max(0, state.settings.maxErrors - errorsSoFar(state));
}

/**
 * Summary of the level. Only meaningful in the 'done' phase. `distractor_errors` is for display
 * only and is not sent to the API.
 */
export function levelSummary(state) {
  return {
    ...evaluateLevel(state.results, state.settings),
    distractor_errors: state.results.filter((r) => r.followedDistractor).length,
  };
}
