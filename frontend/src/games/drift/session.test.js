import { describe, expect, it } from '@jest/globals';
import {
  SESSION_LEVELS,
  STARTING_LIVES,
  attemptPayload,
  driftLevelsFromGame,
  livesAfter,
  scoreSession,
  sessionLevelSettings,
} from './session.js';

const ok = (ms = 500) => ({ outcome: 'correct', elapsedMs: ms });
const wrong = (ms = 500) => ({ outcome: 'wrong', elapsedMs: ms });
const late = () => ({ outcome: 'timeout', elapsedMs: 2000 });

const RAW = {
  trial_count: 32,
  time_limit: 1800,
  max_errors: 2,
  switch_probability: 0.6,
  car_count: 8,
  move_speed: 130,
  conflict_ratio: 0.7,
  distractor_count: 6,
};

describe('sessionLevelSettings', () => {
  it('plays 5 trials and lets maxErrors be livesLeft - 1', () => {
    expect(sessionLevelSettings(RAW, 5)).toMatchObject({
      trialCount: 5,
      maxErrors: 4,
      timeLimit: 1800,
      moveSpeed: 130,
      distractorCount: 6,
    });
    expect(sessionLevelSettings(RAW, 1).maxErrors).toBe(0);
  });

  it('rejects lives outside 1 to 5 or not whole', () => {
    for (const bad of [0, 6, 2.5, -1, NaN, undefined, '3']) {
      expect(() => sessionLevelSettings(RAW, bad)).toThrow(/livesLeft/);
    }
  });
});

describe('livesAfter', () => {
  it('subtracts wrong answers and timeouts', () => {
    expect(livesAfter(5, [ok(), wrong(), late(), ok(), ok()])).toBe(3);
    expect(livesAfter(5, [ok(), ok()])).toBe(5);
  });

  it('never goes below 0', () => {
    expect(livesAfter(2, [wrong(), wrong(), late()])).toBe(0);
  });
});

describe('attemptPayload', () => {
  it('passes a full level with a life left', () => {
    const settings = sessionLevelSettings(RAW, 3);
    const results = [ok(100), wrong(200), ok(100), late(), ok(100)];
    expect(attemptPayload(7, results, settings)).toEqual({
      level_id: 7,
      passed: true,
      duration_ms: 100 + 200 + 100 + 1800 + 100,
      error_count: 2,
    });
  });

  it('fails a level cut short when the last life is lost', () => {
    const settings = sessionLevelSettings(RAW, 2);
    const payload = attemptPayload(3, [ok(), wrong(), wrong()], settings);
    expect(payload.passed).toBe(false);
    expect(payload.error_count).toBe(2);
  });

  it('counts timeouts as the time limit', () => {
    const settings = sessionLevelSettings(RAW, 5);
    expect(attemptPayload(1, [late(), ok(100)], settings).duration_ms).toBe(1900);
  });

  it('has exactly the 4 keys', () => {
    const settings = sessionLevelSettings(RAW, 5);
    expect(Object.keys(attemptPayload(1, [ok()], settings)).sort()).toEqual([
      'duration_ms',
      'error_count',
      'level_id',
      'passed',
    ]);
  });
});

describe('scoreSession', () => {
  // Plays levels in order the way DriftGame does. mistakesPerLevel[i] is how many of level i's
  // first trials the player gets wrong; the level stops once the last life is gone.
  function play(mistakesPerLevel) {
    let lives = STARTING_LIVES;
    const levels = [];
    for (const m of mistakesPerLevel) {
      const settings = sessionLevelSettings(RAW, lives);
      const results = [];
      for (let i = 0; i < 5; i += 1) {
        results.push(i < m ? wrong() : ok(400));
        if (livesAfter(lives, results) === 0) break;
      }
      levels.push({ results, settings });
      lives = livesAfter(lives, results);
      if (lives === 0) break;
    }
    return levels;
  }

  it('clears all 10 levels', () => {
    expect(scoreSession(play(Array(10).fill(0)))).toMatchObject({
      levels_passed: 10,
      total_levels: 10,
      cleared: true,
      lives_left: 5,
      mistakes: 0,
      trials: 50,
      mean_rt_ms: 400,
    });
  });

  it('does not count the level where the last life is lost (level 4)', () => {
    const total = scoreSession(play([1, 1, 0, 5]));
    expect(total.levels_passed).toBe(3);
    expect(total.cleared).toBe(false);
    expect(total.lives_left).toBe(0);
    expect(total.mistakes).toBe(5);
  });

  it('scores 0 when the last life is lost in level 1', () => {
    expect(scoreSession(play([5]))).toMatchObject({
      levels_passed: 0,
      lives_left: 0,
      mistakes: 5,
      cleared: false,
    });
  });

  it('keeps lives_left and mistakes consistent', () => {
    expect(scoreSession(play([2, 1, 0]))).toMatchObject({
      mistakes: 3,
      lives_left: 2,
      levels_passed: 3,
    });
  });

  it('has no mean speed without correct answers, and handles no levels', () => {
    expect(scoreSession(play([5])).mean_rt_ms).toBeNull();
    expect(scoreSession([])).toMatchObject({ levels_passed: 0, trials: 0, mean_rt_ms: null });
  });
});

describe('driftLevelsFromGame', () => {
  const level = (n) => ({ level_id: 100 + n, level_number: n, settings: RAW });
  const game = (numbers) => ({ levels: numbers.map(level) });

  it('sorts by level number', () => {
    const levels = driftLevelsFromGame(game([3, 1, 2, 10, 9, 8, 7, 6, 5, 4]));
    expect(levels.map((l) => l.levelNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(levels[0]).toEqual({ levelId: 101, levelNumber: 1, raw: RAW });
  });

  it('keeps only the first 10', () => {
    const levels = driftLevelsFromGame(game([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));
    expect(levels).toHaveLength(SESSION_LEVELS);
    expect(levels.at(-1).levelNumber).toBe(10);
  });

  it('throws with too few levels', () => {
    expect(() => driftLevelsFromGame(game([1, 2, 3]))).toThrow(/10 levels.*3/);
    expect(() => driftLevelsFromGame({})).toThrow(/10 levels/);
  });

  it('lets a settings error through', () => {
    const bad = game([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    bad.levels[4].settings = { ...RAW, distractor_count: undefined };
    expect(() => driftLevelsFromGame(bad)).toThrow(/distractor_count/);
  });
});

describe('settings from the database (no trial_count or max_errors)', () => {
  // The seed no longer stores these two for Drift; the game supplies them.
  const { trial_count, max_errors, ...FROM_API } = RAW;

  it('sessionLevelSettings fills in 5 trials and the lives-based error limit', () => {
    expect(trial_count).toBeDefined();
    expect(max_errors).toBeDefined();
    expect(sessionLevelSettings(FROM_API, 5)).toMatchObject({ trialCount: 5, maxErrors: 4 });
    expect(sessionLevelSettings(FROM_API, 2)).toMatchObject({ trialCount: 5, maxErrors: 1 });
  });

  it('driftLevelsFromGame accepts levels without them', () => {
    const levels = driftLevelsFromGame({
      levels: Array.from({ length: 10 }, (_, i) => ({
        level_id: 100 + i,
        level_number: i + 1,
        settings: FROM_API,
      })),
    });
    expect(levels).toHaveLength(SESSION_LEVELS);
    expect(levels[0].raw).toEqual(FROM_API);
  });
});
