import { parseLevelSettings } from './settings.js';

/** A session is this many levels of this many trials each. */
export const SESSION_LEVELS = 10;
export const TRIALS_PER_LEVEL = 5;
/** Each level is worth this many points, so a whole session is out of 1000. */
export const POINTS_PER_LEVEL = 100;
/** A correct answer within this share of the time limit earns a trial's full points. */
export const FULL_POINTS_UNTIL = 0.5;
/** A correct answer at the time limit still earns this share of a trial's points. */
export const MIN_CORRECT_SHARE = 0.85;

/**
 * Settings for one level of a session: the level's own difficulty, but only
 * TRIALS_PER_LEVEL trials, and no early fail, so every level is played in full.
 *
 * @param {object} raw A level's raw (snake_case) settings.
 * @returns {object} Parsed settings.
 */
export function sessionLevelSettings(raw) {
  return parseLevelSettings({
    ...raw,
    trial_count: TRIALS_PER_LEVEL,
    max_errors: TRIALS_PER_LEVEL,
  });
}

/**
 * Points for one level, out of POINTS_PER_LEVEL. The points are shared equally between the
 * trials. A correct trial earns its full share if answered within FULL_POINTS_UNTIL of the time
 * limit, then loses points steadily as the answer gets slower, down to MIN_CORRECT_SHARE of the
 * share at the limit. Wrong answers and timeouts earn nothing.
 *
 * @param {Array<{ outcome: string, elapsedMs: number }>} results The level's trial results.
 * @param {number} timeLimit The level's time limit in ms.
 * @returns {number} Whole points, 0 to POINTS_PER_LEVEL.
 */
export function levelPoints(results, timeLimit) {
  if (results.length === 0) return 0;
  const perTrial = POINTS_PER_LEVEL / results.length;
  let points = 0;
  for (const r of results) {
    if (r.outcome !== 'correct') continue;
    const slow = (r.elapsedMs / timeLimit - FULL_POINTS_UNTIL) / (1 - FULL_POINTS_UNTIL);
    const lost = (1 - MIN_CORRECT_SHARE) * Math.min(1, Math.max(0, slow));
    points += perTrial * (1 - lost);
  }
  return Math.round(points);
}

/**
 * Score a whole session.
 *
 * @param {Array<{ results: Array<{ outcome: string, elapsedMs: number }>, timeLimit: number }>}
 *   levels One entry per level played, in order.
 * @returns {{ score: number, max_score: number, trials: number, mistakes: number,
 *   mean_rt_ms: number | null }} score is the sum of the levels' points out of max_score
 *   (POINTS_PER_LEVEL per level played); mistakes counts wrong answers and timeouts;
 *   mean_rt_ms is over correct answers only (null if there are none).
 */
export function scoreSession(levels) {
  let score = 0;
  let trials = 0;
  let mistakes = 0;
  let rtSum = 0;
  let correct = 0;
  for (const { results, timeLimit } of levels) {
    score += levelPoints(results, timeLimit);
    for (const r of results) {
      trials += 1;
      if (r.outcome === 'correct') {
        correct += 1;
        rtSum += r.elapsedMs;
      } else {
        mistakes += 1;
      }
    }
  }
  return {
    score,
    max_score: levels.length * POINTS_PER_LEVEL,
    trials,
    mistakes,
    mean_rt_ms: correct === 0 ? null : Math.round(rtSum / correct),
  };
}
