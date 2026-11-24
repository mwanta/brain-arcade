const KEYS = [
  'trial_count',
  'time_limit',
  'max_errors',
  'switch_probability',
  'car_count',
  'move_speed',
  'conflict_ratio',
  'distractor_count',
];

function fail(key, problem) {
  throw new Error(`Invalid level setting "${key}": ${problem}`);
}

/**
 * Validate a level's raw settings map (from GET /api/games/:id) and convert it
 * to camelCase.
 *
 * @param {Record<string, number>} settings Raw settings with the 8 Drift keys.
 * @returns {{
 *   trialCount: number, timeLimit: number, maxErrors: number,
 *   switchProbability: number, carCount: number, moveSpeed: number,
 *   conflictRatio: number, distractorCount: number,
 * }} Parsed settings.
 * @throws {Error} Naming the key that is missing or out of range.
 */
export function parseLevelSettings(settings) {
  const raw = settings ?? {};
  const v = {};
  for (const key of KEYS) {
    const missing = raw[key] === undefined || raw[key] === null || raw[key] === '';
    const value = Number(raw[key]);
    if (missing || !Number.isFinite(value)) fail(key, 'missing or not a number');
    v[key] = value;
  }

  if (v.trial_count < 1) fail('trial_count', 'must be >= 1');
  if (v.car_count < 1) fail('car_count', 'must be >= 1');
  if (v.time_limit <= 0) fail('time_limit', 'must be > 0');
  if (v.max_errors < 0) fail('max_errors', 'must be >= 0');
  if (v.move_speed < 0) fail('move_speed', 'must be >= 0');
  for (const key of ['switch_probability', 'conflict_ratio']) {
    if (v[key] < 0 || v[key] > 1) fail(key, 'must be between 0 and 1');
  }
  if (!Number.isInteger(v.distractor_count) || v.distractor_count < 0) {
    fail('distractor_count', 'must be a whole number >= 0');
  }

  return {
    trialCount: v.trial_count,
    timeLimit: v.time_limit,
    maxErrors: v.max_errors,
    switchProbability: v.switch_probability,
    carCount: v.car_count,
    moveSpeed: v.move_speed,
    conflictRatio: v.conflict_ratio,
    distractorCount: v.distractor_count,
  };
}
