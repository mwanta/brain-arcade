import { describe, expect, it } from '@jest/globals';
import { createRng } from './random.js';

function draw(rng, count) {
  return Array.from({ length: count }, () => rng.next());
}

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(draw(createRng(42), 20)).toEqual(draw(createRng(42), 20));
  });

  it('gives different sequences for different seeds', () => {
    expect(draw(createRng(1), 20)).not.toEqual(draw(createRng(2), 20));
  });

  it('keeps next() in [0, 1)', () => {
    const rng = createRng(7);
    for (const value of draw(rng, 10000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('int(1, 4) stays in 1-4 and returns every value', () => {
    const rng = createRng(123);
    const seen = new Set();
    for (let i = 0; i < 1000; i++) {
      const value = rng.int(1, 4);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(4);
      seen.add(value);
    }
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
  });

  it('chance(0) is never true and chance(1) is always true', () => {
    const rng = createRng(99);
    for (let i = 0; i < 1000; i++) {
      expect(rng.chance(0)).toBe(false);
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('pick returns elements of the array', () => {
    const rng = createRng(5);
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 100; i++) {
      expect(items).toContain(rng.pick(items));
    }
  });

  it('pick throws on an empty array', () => {
    expect(() => createRng(5).pick([])).toThrow();
  });
});
