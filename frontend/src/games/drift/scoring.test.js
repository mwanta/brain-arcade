import { describe, expect, it } from '@jest/globals';
import { evaluateLevel, isLevelOver, judgeResponse } from './scoring.js';
import { parseLevelSettings } from './settings.js';

const settings = parseLevelSettings({
  trial_count: 10,
  time_limit: 3000,
  max_errors: 3,
  switch_probability: 0.1,
  car_count: 2,
  move_speed: 50,
  conflict_ratio: 0.2,
  distractor_count: 0,
});

const trial = { answer: 'left' };
const ok = (ms = 1000) => ({ outcome: 'correct', elapsedMs: ms });
const wrong = (ms = 1000) => ({ outcome: 'wrong', elapsedMs: ms });
const late = () => ({ outcome: 'timeout', elapsedMs: 3000 });
const repeat = (n, make) => Array.from({ length: n }, () => make());

describe('judgeResponse', () => {
  it('is correct for the right direction in time', () => {
    expect(judgeResponse(trial, 'left', 500, 3000)).toBe('correct');
    expect(judgeResponse(trial, 'left', 3000, 3000)).toBe('correct');
  });

  it('is wrong for another direction in time', () => {
    expect(judgeResponse(trial, 'up', 500, 3000)).toBe('wrong');
  });

  it('is a timeout for no direction', () => {
    expect(judgeResponse(trial, null, 500, 3000)).toBe('timeout');
  });

  it('is a timeout when too slow, even if right or wrong', () => {
    expect(judgeResponse(trial, 'left', 3001, 3000)).toBe('timeout');
    expect(judgeResponse(trial, 'up', 3001, 3000)).toBe('timeout');
  });
});

describe('isLevelOver', () => {
  it('is false while in progress', () => {
    expect(isLevelOver([], settings)).toBe(false);
    expect(isLevelOver(repeat(5, ok), settings)).toBe(false);
  });

  it('is false at exactly maxErrors and true above it', () => {
    expect(isLevelOver(repeat(3, wrong), settings)).toBe(false);
    expect(isLevelOver(repeat(4, wrong), settings)).toBe(true);
  });

  it('counts timeouts as errors', () => {
    expect(isLevelOver([wrong(), wrong(), late(), late()], settings)).toBe(true);
  });

  it('is true when every trial is played', () => {
    expect(isLevelOver(repeat(10, ok), settings)).toBe(true);
  });
});

describe('evaluateLevel', () => {
  it('passes exactly at maxErrors', () => {
    const results = [...repeat(3, wrong), ...repeat(7, ok)];
    const out = evaluateLevel(results, settings);
    expect(out.passed).toBe(true);
    expect(out.error_count).toBe(3);
  });

  it('fails at maxErrors + 1', () => {
    const results = [...repeat(4, wrong), ...repeat(6, ok)];
    const out = evaluateLevel(results, settings);
    expect(out.passed).toBe(false);
    expect(out.error_count).toBe(4);
  });

  it('fails when the level ended early', () => {
    const out = evaluateLevel([...repeat(2, ok), ...repeat(4, wrong)], settings);
    expect(out.passed).toBe(false);
    expect(out.error_count).toBe(4);
  });

  it('fails a short list even with no errors', () => {
    expect(evaluateLevel(repeat(5, ok), settings).passed).toBe(false);
  });

  it('counts timeouts as errors and as timeLimit in the duration', () => {
    const out = evaluateLevel([ok(1000), { outcome: 'timeout', elapsedMs: 9999 }], settings);
    expect(out.error_count).toBe(1);
    expect(out.duration_ms).toBe(4000);
  });

  it('rounds duration to an integer', () => {
    expect(evaluateLevel([ok(100.4), wrong(200.4)], settings).duration_ms).toBe(301);
  });

  it('computes accuracy and mean_rt_ms over correct responses', () => {
    const out = evaluateLevel([ok(1000), ok(1001), wrong(100), late()], settings);
    expect(out.accuracy).toBe(0.5);
    expect(out.mean_rt_ms).toBe(1001);
  });

  it('handles no results', () => {
    expect(evaluateLevel([], settings)).toEqual({
      passed: false,
      error_count: 0,
      duration_ms: 0,
      accuracy: 0,
      mean_rt_ms: null,
    });
  });

  it('has null mean_rt_ms when nothing was correct', () => {
    expect(evaluateLevel([wrong(), late()], settings).mean_rt_ms).toBeNull();
  });
});
