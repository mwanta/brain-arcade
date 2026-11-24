import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import {
  SYMBOLS,
  judgeResponse,
  makeAttempt,
  makeSequence,
  prepareLevels,
  readRules,
} from './logic.js';

const level = {
  level_id: 507,
  game_id: 42,
  level_number: 1,
  settings: { time_limit: 2000, max_errors: 2, trial_count: 12 },
};
const startedAt = '2026-11-22T20:00:00.123Z';
const correct = { correct: true, timedOut: false, durationMs: 310 };
const wrong = { correct: false, timedOut: false, durationMs: 440 };

describe('Quick Match rules', () => {
  it('loads settings and supports the original catalog without trial_count', () => {
    expect(readRules(level)).toEqual({ timeLimit: 2000, maxErrors: 2, trialCount: 12 });
    expect(readRules({ ...level, settings: { time_limit: 1200, max_errors: 1 } }).trialCount).toBe(
      12
    );
  });

  it.each([
    { time_limit: 0 },
    { time_limit: -1 },
    { time_limit: '2000' },
    { trial_count: 0 },
    { trial_count: 1.5 },
    { max_errors: -1 },
    { max_errors: 12 },
  ])('rejects unusable catalog settings %p', (settings) => {
    expect(() => readRules({ ...level, settings: { ...level.settings, ...settings } })).toThrow(
      'invalid settings'
    );
  });

  it('orders catalog levels and uses their actual IDs', () => {
    const second = { ...level, level_id: 999, level_number: 2 };
    const game = {
      name: 'Quick Match',
      game_id: 42,
      domain_name: 'processing_speed',
      levels: [second, level],
    };
    expect(prepareLevels(game).map((item) => item.level_id)).toEqual([507, 999]);
    expect(() => prepareLevels({ ...game, levels: [second] })).toThrow('start at level 1');
    expect(() => prepareLevels({ ...game, levels: [] })).toThrow('no configured levels');
    expect(() => prepareLevels({ ...game, domain_name: 'memory' })).toThrow('processing_speed');
    expect(() => prepareLevels({ ...game, game_id: 99 })).toThrow('belong to this game');
  });

  it('keeps the ten seed levels and existing-database upgrade in agreement', () => {
    const seed = readFileSync(
      new URL('../../../../backend/database/seed.sql', import.meta.url),
      'utf8'
    );
    const upgrade = readFileSync(
      new URL('../../../../backend/database/quick_match_catalog.sql', import.meta.url),
      'utf8'
    );
    const seedLevels = seed.split('INSERT INTO level (')[1].split(';')[0];
    const settings = seed
      .replace(/--[^\n]*/g, '')
      .split('INSERT INTO level_setting (')[1]
      .split(';')[0];
    const rows = [...settings.matchAll(/\((\d+),\s*(\d+),\s*([\d.]+)\)/g)];
    const catalog = [...seedLevels.matchAll(/\((\d+),\s*3,\s*(\d+)\)/g)]
      .map(([, id, number]) => {
        const values = Object.fromEntries(
          rows.filter((row) => row[1] === id).map((row) => [row[2], Number(row[3])])
        );
        return [Number(number), values[2], values[4], values[5]];
      })
      .sort((a, b) => a[0] - b[0]);
    const upgradeRows = [...upgrade.matchAll(/\((\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g)].map((row) =>
      row.slice(1).map(Number)
    );
    expect(catalog).toEqual(upgradeRows);
    expect(catalog).toHaveLength(10);
    expect(seed).toContain("(5,  'trial_count'");
    expect(upgrade).toContain('INSERT INTO setting_type (name, unit, description)');
    expect(catalog.every((row, index) => row[0] === index + 1 && row[3] === 12)).toBe(true);
    expect(catalog.slice(1).every((row, index) => row[1] < catalog[index][1])).toBe(true);
  });
});

describe('Quick Match comparisons', () => {
  it('balances same/different answers over many random seeds', () => {
    for (let seed = 0; seed < 100; seed++) {
      const sequence = makeSequence(12, seed);
      expect(sequence).toHaveLength(13);
      expect(sequence.every((symbol) => symbol >= 0 && symbol < SYMBOLS.length)).toBe(true);
      expect(sequence.slice(1).filter((symbol, index) => symbol === sequence[index])).toHaveLength(
        6
      );
    }
    expect(makeSequence(12, 123)).toEqual(makeSequence(12, 123));
    expect(makeSequence(12, 123)).not.toEqual(makeSequence(12, 456));
  });

  it('scores same and different decisions with an exclusive deadline', () => {
    expect(judgeResponse(0, 0, true, 999, 1000).correct).toBe(true);
    expect(judgeResponse(0, 1, false, 999, 1000).correct).toBe(true);
    expect(judgeResponse(0, 1, true, 500, 1000).correct).toBe(false);
    expect(judgeResponse(0, 0, true, 1000, 1000)).toEqual({
      correct: false,
      timedOut: true,
      durationMs: 1000,
    });
    expect(judgeResponse(0, 0, true, 1050, 1000).durationMs).toBe(1000);
    expect(judgeResponse(0, 0, null, 1000, 1000).correct).toBe(false);
  });

  it('makes exactly the schema-compatible attempt payload at the error boundary', () => {
    expect(makeAttempt(level, [...Array(10).fill(correct), wrong, wrong], startedAt)).toEqual({
      level_id: 507,
      started_at: startedAt,
      passed: true,
      duration_ms: 3980,
      error_count: 2,
    });
    expect(
      makeAttempt(level, [...Array(9).fill(correct), wrong, wrong, wrong], startedAt).passed
    ).toBe(false);
    expect(makeAttempt(level, [correct], startedAt).passed).toBe(false);
    expect(makeAttempt(level, Array(12).fill(correct), startedAt, true).passed).toBe(false);
  });
});
