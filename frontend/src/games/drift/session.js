import { evaluateLevel } from './scoring.js';
import { parseLevelSettings } from './settings.js';

/**
 * One "session" in this file is ONE GAME: this many levels of this many trials each. It is not
 * the backend's `session` table, which is a player's sitting and can hold several game plays.
 */
export const SESSION_LEVELS = 10;
export const TRIALS_PER_LEVEL = 5;
/** Lives for the whole game. Every mistake (wrong answer or timeout) costs one. */
export const STARTING_LIVES = 5;

/**
 * Settings for one level of a game: the level's own difficulty, but only TRIALS_PER_LEVEL trials,
 * and max_errors = livesLeft - 1, so the level ends when the last life is lost and `passed`
 * (see evaluateLevel) means "all trials played with a life left".
 *
 * @param {object} raw A level's raw (snake_case) settings.
 * @param {number} livesLeft Lives at the start of the level, 1 to STARTING_LIVES.
 * @returns {object} Parsed settings.
 */
export function sessionLevelSettings(raw, livesLeft) {
  if (!Number.isInteger(livesLeft) || livesLeft < 1 || livesLeft > STARTING_LIVES) {
    throw new Error(
      `livesLeft must be a whole number from 1 to ${STARTING_LIVES}, got ${String(livesLeft)}`
    );
  }
  return parseLevelSettings({
    ...raw,
    trial_count: TRIALS_PER_LEVEL,
    max_errors: livesLeft - 1,
  });
}

function mistakesIn(results) {
  return results.filter((r) => r.outcome !== 'correct').length;
}

/**
 * Lives left after a level.
 *
 * @param {number} livesLeft Lives at the start of the level.
 * @param {Array<{ outcome: string }>} results The level's trial results.
 * @returns {number} livesLeft minus the mistakes, never below 0.
 */
export function livesAfter(livesLeft, results) {
  return Math.max(0, livesLeft - mistakesIn(results));
}

/**
 * The body for POST /api/game-plays/:id/attempts.
 *
 * @returns {{ level_id: number, passed: boolean, duration_ms: number, error_count: number }}
 */
export function attemptPayload(levelId, results, settings) {
  const { passed, duration_ms, error_count } = evaluateLevel(results, settings);
  return { level_id: levelId, passed, duration_ms, error_count };
}

/**
 * Score a whole game.
 *
 * @param {Array<{ results: Array<{ outcome: string, elapsedMs: number }>, settings: object }>}
 *   levels One entry per level played, in play order.
 * @returns {{ levels_passed: number, total_levels: number, lives_left: number, cleared: boolean,
 *   trials: number, mistakes: number, mean_rt_ms: number | null }} mean_rt_ms is over correct
 *   answers only (null if there are none).
 */
export function scoreSession(levels) {
  let levelsPassed = 0;
  let trials = 0;
  let mistakes = 0;
  let rtSum = 0;
  let correct = 0;
  for (const { results, settings } of levels) {
    if (evaluateLevel(results, settings).passed) levelsPassed += 1;
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
    levels_passed: levelsPassed,
    total_levels: SESSION_LEVELS,
    lives_left: Math.max(0, STARTING_LIVES - mistakes),
    cleared: levelsPassed === SESSION_LEVELS,
    trials,
    mistakes,
    mean_rt_ms: correct === 0 ? null : Math.round(rtSum / correct),
  };
}

/**
 * The levels to play from a GET /api/games/:id response.
 *
 * @param {{ levels: Array<{ level_id: number, level_number: number, settings: object }> }} game
 * @returns {Array<{ levelId: number, levelNumber: number, raw: object }>} Sorted by level
 *   number, the first SESSION_LEVELS only.
 * @throws {Error} If there are too few levels or a level's settings are invalid.
 */
export function driftLevelsFromGame(game) {
  const sorted = [...(game?.levels ?? [])]
    .sort((a, b) => a.level_number - b.level_number)
    .slice(0, SESSION_LEVELS);
  if (sorted.length < SESSION_LEVELS) {
    throw new Error(`Drift needs ${SESSION_LEVELS} levels but the game has ${sorted.length}`);
  }
  return sorted.map((l) => {
    sessionLevelSettings(l.settings, STARTING_LIVES); // validates; its message passes through
    return { levelId: l.level_id, levelNumber: l.level_number, raw: l.settings };
  });
}
