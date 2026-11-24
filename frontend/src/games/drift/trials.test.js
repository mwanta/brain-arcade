import { describe, expect, it } from '@jest/globals';
import { oppositeDirection } from './directions.js';
import { parseLevelSettings } from './settings.js';
import { generateTrials } from './trials.js';

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
const LEVEL_10 = {
  trial_count: 30,
  time_limit: 1500,
  max_errors: 2,
  switch_probability: 0.5,
  car_count: 6,
  move_speed: 130,
  conflict_ratio: 0.75,
  distractor_count: 4,
};

const SEEDS = Array.from({ length: 200 }, (_, i) => i + 1);
const level1 = parseLevelSettings(LEVEL_1);
const level10 = parseLevelSettings(LEVEL_10);

describe('generateTrials', () => {
  it('returns trialCount trials with 0-based indexes and carCount cars', () => {
    for (const seed of SEEDS) {
      for (const s of [level1, level10]) {
        const trials = generateTrials(s, seed);
        expect(trials).toHaveLength(s.trialCount);
        trials.forEach((t, i) => {
          expect(t.index).toBe(i);
          expect(t.cars).toHaveLength(s.carCount);
        });
      }
    }
  });

  it.each([0, 0.25, 0.5, 1])('has an exact conflict count for ratio %s', (ratio) => {
    const s = parseLevelSettings({ ...LEVEL_1, trial_count: 20, conflict_ratio: ratio });
    for (const seed of SEEDS) {
      const trials = generateTrials(s, seed);
      expect(trials.filter((t) => t.conflict)).toHaveLength(Math.round(20 * ratio));
    }
  });

  it('rounds the conflict count', () => {
    for (const seed of SEEDS) {
      expect(generateTrials(level1, seed).filter((t) => t.conflict)).toHaveLength(2);
      expect(generateTrials(level10, seed).filter((t) => t.conflict)).toHaveLength(23);
    }
  });

  it('makes lit car facing/moving match the conflict flag', () => {
    for (const seed of SEEDS) {
      for (const s of [level1, level10]) {
        for (const t of generateTrials(s, seed)) {
          const car = t.cars[0];
          expect(car.facing === car.moving).toBe(!t.conflict);
        }
      }
    }
  });

  it('answers follow the rule', () => {
    for (const seed of SEEDS) {
      for (const s of [level1, level10]) {
        for (const t of generateTrials(s, seed)) {
          const car = t.cars[0];
          expect(car.state).toBe(t.rule);
          expect(t.answer).toBe(t.rule === 'drive' ? car.moving : car.facing);
        }
      }
    }
  });

  it('driving cars only go forward or in reverse; drifting cars can slide sideways', () => {
    let slid = 0;
    for (const seed of SEEDS) {
      for (const s of [level1, level10]) {
        for (const t of generateTrials(s, seed)) {
          for (const car of t.cars) {
            const collinear =
              car.moving === car.facing || car.moving === oppositeDirection(car.facing);
            if (car.state === 'drive') expect(collinear).toBe(true);
            else if (!collinear) slid++;
          }
        }
      }
    }
    expect(slid).toBeGreaterThan(0);
  });

  it('a conflict on a driving trial means reversing', () => {
    for (const seed of SEEDS) {
      for (const t of generateTrials(level1, seed)) {
        const car = t.cars[0];
        if (t.rule === 'drive' && t.conflict) {
          expect(car.moving).toBe(oppositeDirection(car.facing));
        }
      }
    }
  });

  it('never switches rule when switchProbability is 0', () => {
    const s = parseLevelSettings({ ...LEVEL_1, switch_probability: 0 });
    for (const seed of SEEDS) {
      expect(new Set(generateTrials(s, seed).map((t) => t.rule)).size).toBe(1);
    }
  });

  it('alternates every trial when switchProbability is 1', () => {
    const s = parseLevelSettings({ ...LEVEL_1, switch_probability: 1 });
    for (const seed of SEEDS) {
      const trials = generateTrials(s, seed);
      for (let i = 1; i < trials.length; i++) {
        expect(trials[i].rule).not.toBe(trials[i - 1].rule);
      }
    }
  });

  it('switches at roughly switchProbability', () => {
    for (const p of [0.1, 0.5]) {
      const s = parseLevelSettings({ ...LEVEL_10, switch_probability: p });
      let switches = 0;
      let total = 0;
      for (const seed of SEEDS) {
        const trials = generateTrials(s, seed);
        for (let i = 1; i < trials.length; i++) {
          total++;
          if (trials[i].rule !== trials[i - 1].rule) switches++;
        }
      }
      expect(Math.abs(switches / total - p)).toBeLessThan(0.05);
    }
  });

  it('starts on either rule about half the time', () => {
    const drives = SEEDS.filter((seed) => generateTrials(level1, seed)[0].rule === 'drive');
    expect(drives.length / SEEDS.length).toBeGreaterThan(0.4);
    expect(drives.length / SEEDS.length).toBeLessThan(0.6);
  });

  it('every target car is identical, with no lit or targetIndex fields', () => {
    for (const seed of SEEDS) {
      for (const s of [level1, level10]) {
        for (const t of generateTrials(s, seed)) {
          for (const car of t.cars) expect(car).toEqual(t.cars[0]);
          expect(t.cars[0]).not.toHaveProperty('lit');
          expect(t).not.toHaveProperty('targetIndex');
        }
      }
    }
  });

  it('adds distractorCount grey cars that drive opposite to how the target cars move', () => {
    for (const seed of SEEDS) {
      for (const t of generateTrials(level10, seed)) {
        expect(t.distractors).toHaveLength(4);
        for (const d of t.distractors) {
          expect(d.state).toBe('drive');
          expect(d.facing).toBe(d.moving); // driving straight ahead
          expect(d.moving).toBe(oppositeDirection(t.cars[0].moving));
        }
      }
    }
  });

  it('has no distractors when distractorCount is 0, and they never change the answer', () => {
    for (const seed of SEEDS) {
      const without = generateTrials(level1, seed);
      for (const t of without) expect(t.distractors).toEqual([]);
      const withD = generateTrials(parseLevelSettings({ ...LEVEL_1, distractor_count: 3 }), seed);
      expect(withD.map((t) => t.answer)).toEqual(without.map((t) => t.answer));
    }
  });

  it('is deterministic per seed and varies across seeds', () => {
    for (const seed of SEEDS) {
      expect(generateTrials(level10, seed)).toEqual(generateTrials(level10, seed));
    }
    expect(generateTrials(level10, 1)).not.toEqual(generateTrials(level10, 2));
  });
});
