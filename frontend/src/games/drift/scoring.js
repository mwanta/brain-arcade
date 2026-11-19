function countErrors(results) {
  return results.filter((r) => r.outcome !== 'correct').length;
}

/**
 * Judge one response.
 *
 * @param {{ answer: string }} trial The trial being answered.
 * @param {string | null} direction The player's direction, or null for no answer.
 * @param {number} elapsedMs Time taken to respond.
 * @param {number} timeLimit Allowed response time in ms.
 * @returns {'correct' | 'wrong' | 'timeout'} A null direction or elapsedMs > timeLimit is a timeout.
 */
export function judgeResponse(trial, direction, elapsedMs, timeLimit) {
  if (direction === null || direction === undefined || elapsedMs > timeLimit) return 'timeout';
  return direction === trial.answer ? 'correct' : 'wrong';
}

/**
 * Whether the level has ended: errors (wrong + timeout) exceed maxErrors, or all trials are done.
 *
 * @param {Array<{ outcome: string, elapsedMs: number }>} results Results so far.
 * @param {{ maxErrors: number, trialCount: number }} settings Parsed settings.
 * @returns {boolean} True if no more trials should be played.
 */
export function isLevelOver(results, settings) {
  return countErrors(results) > settings.maxErrors || results.length === settings.trialCount;
}

/**
 * Summarize a finished (or early-failed) level. The snake_case fields are posted to the
 * level-attempt API as-is.
 *
 * @param {Array<{ outcome: string, elapsedMs: number }>} results Results in play order.
 * @param {{ maxErrors: number, trialCount: number, timeLimit: number }} settings Parsed settings.
 * @returns {{
 *   passed: boolean, error_count: number, duration_ms: number,
 *   accuracy: number, mean_rt_ms: number | null,
 * }} passed needs every trial played with errors <= maxErrors; duration_ms counts timeouts
 *   as timeLimit; accuracy is 0 with no results; mean_rt_ms is over correct responses only.
 */
export function evaluateLevel(results, settings) {
  const errorCount = countErrors(results);
  const duration = results.reduce(
    (sum, r) => sum + (r.outcome === 'timeout' ? settings.timeLimit : r.elapsedMs),
    0
  );
  const correct = results.filter((r) => r.outcome === 'correct');
  return {
    passed: results.length === settings.trialCount && errorCount <= settings.maxErrors,
    error_count: errorCount,
    duration_ms: Math.round(duration),
    accuracy: results.length === 0 ? 0 : correct.length / results.length,
    mean_rt_ms:
      correct.length === 0
        ? null
        : Math.round(correct.reduce((s, r) => s + r.elapsedMs, 0) / correct.length),
  };
}
