/**
 * Seeded random number generator for Drift (mulberry32).
 *
 * The trial generator must be reproducible from a seed so tests can predict
 * trials, so game code uses this instead of Math.random. The same integer seed
 * always produces the same sequence.
 *
 * @param {number} seed Integer seed.
 * @returns {{
 *   next: () => number,
 *   int: (min: number, max: number) => number,
 *   chance: (p: number) => boolean,
 *   pick: <T>(array: T[]) => T,
 * }}
 *   - next(): float in [0, 1)
 *   - int(min, max): integer in [min, max], inclusive
 *   - chance(p): true with probability p (p <= 0 never, p >= 1 always)
 *   - pick(array): random element; throws on an empty array
 */
export function createRng(seed) {
  let state = seed >>> 0;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function int(min, max) {
    return min + Math.floor(next() * (max - min + 1));
  }

  function chance(p) {
    return next() < p;
  }

  function pick(array) {
    if (array.length === 0) {
      throw new Error('pick() needs a non-empty array');
    }
    return array[int(0, array.length - 1)];
  }

  return { next, int, chance, pick };
}
