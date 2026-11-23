import { createRng } from '../drift/random.js';

export const SYMBOLS = [
  { name: 'circle', character: '●' },
  { name: 'triangle', character: '▲' },
  { name: 'square', character: '■' },
  { name: 'diamond', character: '◆' },
  { name: 'plus', character: '+' },
  { name: 'star', character: '★' },
];

// The original two catalog levels predate trial_count. Keep them playable.
export function readRules(level) {
  const rules = {
    timeLimit: level.settings?.time_limit,
    maxErrors: level.settings?.max_errors ?? 0,
    trialCount: level.settings?.trial_count ?? 12,
  };
  if (
    !Number.isInteger(rules.timeLimit) ||
    rules.timeLimit <= 0 ||
    !Number.isInteger(rules.maxErrors) ||
    rules.maxErrors < 0 ||
    !Number.isInteger(rules.trialCount) ||
    rules.trialCount < 2 ||
    rules.maxErrors >= rules.trialCount
  ) {
    throw new Error(`Quick Match level ${level.level_number} has invalid settings.`);
  }
  return rules;
}

export function prepareLevels(game) {
  if (game.name !== 'Quick Match' || game.domain_name !== 'processing_speed') {
    throw new Error('Quick Match must belong to the processing_speed domain.');
  }
  const levels = [...game.levels].sort((a, b) => a.level_number - b.level_number);
  if (!levels.length) throw new Error('Quick Match has no configured levels.');
  levels.forEach((level, index) => {
    if (level.game_id !== game.game_id || level.level_number !== index + 1) {
      throw new Error('Quick Match levels must belong to this game and start at level 1.');
    }
    readRules(level);
  });
  return levels;
}

// A balanced, shuffled mix prevents "always different" from passing a level.
// The first symbol is a reference, so N comparisons need N + 1 symbols.
export function makeSequence(trialCount, seed) {
  const rng = createRng(seed);
  const matches = Array.from({ length: trialCount }, (_, i) => i < Math.floor(trialCount / 2));
  for (let i = matches.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [matches[i], matches[j]] = [matches[j], matches[i]];
  }
  const sequence = [rng.int(0, SYMBOLS.length - 1)];
  for (const match of matches) {
    const previous = sequence[sequence.length - 1];
    const alternatives = SYMBOLS.map((_, index) => index).filter((index) => index !== previous);
    sequence.push(match ? previous : rng.pick(alternatives));
  }
  return sequence;
}

// A late answer is one error even if the key happens to be correct.
export function judgeResponse(previous, current, answer, elapsed, timeLimit) {
  const timedOut = answer === null || elapsed >= timeLimit;
  return {
    correct: !timedOut && answer === (previous === current),
    timedOut,
    durationMs: Math.round(Math.max(0, Math.min(elapsed, timeLimit))),
  };
}

export function makeAttempt(level, responses, startedAt, aborted = false) {
  const rules = readRules(level);
  const errorCount = responses.filter((response) => !response.correct).length;
  return {
    level_id: level.level_id,
    started_at: startedAt,
    passed: !aborted && responses.length === rules.trialCount && errorCount <= rules.maxErrors,
    duration_ms: responses.reduce((sum, response) => sum + response.durationMs, 0),
    error_count: errorCount,
  };
}
