import { describe, expect, it } from '@jest/globals';
import { levelPoints, scoreSession, sessionLevelSettings } from './session.js';

const ok = (ms) => ({ outcome: 'correct', elapsedMs: ms });
const wrong = (ms = 500) => ({ outcome: 'wrong', elapsedMs: ms });
const late = () => ({ outcome: 'timeout', elapsedMs: 2000 });

describe('levelPoints', () => {
  const five = (make) => Array.from({ length: 5 }, make);

  it('gives full points up to half the time limit', () => {
    expect(
      levelPoints(
        five(() => ok(0)),
        2000
      )
    ).toBe(100);
    expect(
      levelPoints(
        five(() => ok(1000)),
        2000
      )
    ).toBe(100);
  });

  it('loses points steadily after half the limit, down to 85 at the limit', () => {
    expect(
      levelPoints(
        five(() => ok(1500)),
        2000
      )
    ).toBe(93);
    expect(
      levelPoints(
        five(() => ok(2000)),
        2000
      )
    ).toBe(85);
  });

  it('never goes below 85 for a correct answer, however slow', () => {
    expect(
      levelPoints(
        five(() => ok(9000)),
        2000
      )
    ).toBe(85);
  });

  it('gives each trial an equal share and nothing for mistakes', () => {
    expect(levelPoints([ok(2000), wrong(), late(), wrong(), late()], 2000)).toBe(17);
    expect(levelPoints(five(wrong), 2000)).toBe(0);
  });

  it('handles an empty level', () => {
    expect(levelPoints([], 2000)).toBe(0);
  });
});

describe('scoreSession', () => {
  it('totals level points out of 100 per level, plus mistakes and mean reaction time', () => {
    const levels = [
      { results: [ok(0), ok(1000), wrong(), ok(2000), ok(0)], timeLimit: 2000 },
      { results: [late(), ok(500), ok(0), ok(0), ok(1000)], timeLimit: 1000 },
    ];
    expect(scoreSession(levels)).toEqual({
      score: levelPoints(levels[0].results, 2000) + levelPoints(levels[1].results, 1000),
      max_score: 200,
      trials: 10,
      mistakes: 2,
      mean_rt_ms: 563,
    });
    expect(scoreSession(levels).score).toBe(77 + 77);
  });

  it('scores a perfect ten-level session out of 1000', () => {
    const level = { results: Array.from({ length: 5 }, () => ok(0)), timeLimit: 1000 };
    expect(scoreSession(Array.from({ length: 10 }, () => level))).toMatchObject({
      score: 1000,
      max_score: 1000,
    });
  });

  it('handles a session with no correct answers', () => {
    expect(scoreSession([{ results: [wrong(), late()], timeLimit: 1000 }])).toMatchObject({
      score: 0,
      max_score: 100,
      mistakes: 2,
      mean_rt_ms: null,
    });
  });

  it('handles no levels', () => {
    expect(scoreSession([])).toMatchObject({ score: 0, max_score: 0, trials: 0, mean_rt_ms: null });
  });
});

describe('sessionLevelSettings', () => {
  it('keeps 5 trials and never fails early', () => {
    const settings = sessionLevelSettings({
      trial_count: 32,
      time_limit: 1800,
      max_errors: 2,
      switch_probability: 0.6,
      car_count: 8,
      move_speed: 130,
      conflict_ratio: 0.7,
      distractor_count: 6,
    });
    expect(settings).toMatchObject({
      trialCount: 5,
      maxErrors: 5,
      timeLimit: 1800,
      moveSpeed: 130,
      distractorCount: 6,
    });
  });
});
