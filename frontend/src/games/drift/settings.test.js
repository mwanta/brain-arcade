import { describe, expect, it } from '@jest/globals';
import { parseLevelSettings } from './settings.js';

const LEVEL_1 = {
  trial_count: 10,
  time_limit: 3000,
  max_errors: 3,
  switch_probability: 0.1,
  car_count: 2,
  move_speed: 50,
  conflict_ratio: 0.2,
  distractor_count: 0,
};

describe('parseLevelSettings', () => {
  it('accepts valid input and converts names', () => {
    expect(parseLevelSettings(LEVEL_1)).toEqual({
      trialCount: 10,
      timeLimit: 3000,
      maxErrors: 3,
      switchProbability: 0.1,
      carCount: 2,
      moveSpeed: 50,
      conflictRatio: 0.2,
      distractorCount: 0,
    });
    expect(parseLevelSettings({ ...LEVEL_1, distractor_count: 3 }).distractorCount).toBe(3);
  });

  it.each(Object.keys(LEVEL_1))('throws naming %s when it is missing', (key) => {
    const bad = { ...LEVEL_1 };
    delete bad[key];
    expect(() => parseLevelSettings(bad)).toThrow(key);
  });

  it.each([
    ['trial_count', 0],
    ['car_count', 0],
    ['time_limit', 0],
    ['max_errors', -1],
    ['move_speed', -1],
    ['switch_probability', -0.1],
    ['switch_probability', 1.1],
    ['conflict_ratio', -0.1],
    ['conflict_ratio', 1.1],
    ['distractor_count', -1],
    ['distractor_count', 1.5],
  ])('throws naming %s when it is %s', (key, value) => {
    expect(() => parseLevelSettings({ ...LEVEL_1, [key]: value })).toThrow(key);
  });

  it('accepts boundary values', () => {
    expect(() =>
      parseLevelSettings({
        ...LEVEL_1,
        max_errors: 0,
        move_speed: 0,
        switch_probability: 1,
        conflict_ratio: 0,
      })
    ).not.toThrow();
  });
});
