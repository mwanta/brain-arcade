import { DIRECTIONS, oppositeDirection } from './directions.js';
import { carFootprint, footprintsOverlap } from './footprint.js';
import { layoutCars, layoutClear } from './layout.js';
import { createRng } from './random.js';

const SEEDS = [0, 1, 2, 3, 7, 42, 99, 12345];

function closestPair(positions) {
  let min = Infinity;
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const gap = Math.hypot(positions[i].x - positions[j].x, positions[i].y - positions[j].y);
      min = Math.min(min, gap);
    }
  }
  return min;
}

function expectInside(positions, size) {
  for (const p of positions) {
    expect(p.x).toBeGreaterThanOrEqual(50);
    expect(p.x).toBeLessThanOrEqual(size - 50);
    expect(p.y).toBeGreaterThanOrEqual(50);
    expect(p.y).toBeLessThanOrEqual(size - 50);
  }
}

describe('layoutCars', () => {
  test.each([1, 2, 3, 4, 5, 6, 8, 12])('returns %i positions', (count) => {
    expect(layoutCars(count, createRng(1))).toHaveLength(count);
  });

  test('at least 50 from every edge and 70 from every other car', () => {
    for (const count of [1, 2, 3, 4, 5, 6, 8]) {
      for (const seed of SEEDS) {
        const positions = layoutCars(count, createRng(seed));
        expectInside(positions, 400);
        expect(closestPair(positions)).toBeGreaterThanOrEqual(70);
      }
    }
  });

  test('spreads cars across the board rather than clumping them', () => {
    for (const seed of SEEDS) {
      const positions = layoutCars(8, createRng(seed), 600);
      const xs = positions.map((p) => p.x);
      const ys = positions.map((p) => p.y);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(250);
      expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(250);
    }
  });

  test('a crowded 600 board stays in bounds and at least 56 apart', () => {
    for (const seed of SEEDS) {
      const positions = layoutCars(24, createRng(seed), 600);
      expect(positions).toHaveLength(24);
      expectInside(positions, 600);
      expect(closestPair(positions)).toBeGreaterThanOrEqual(56);
    }
  });

  test('the same seed gives deep-equal positions', () => {
    expect(layoutCars(8, createRng(77), 600)).toEqual(layoutCars(8, createRng(77), 600));
  });

  test('different seeds scatter differently', () => {
    expect(layoutCars(4, createRng(1))).not.toEqual(layoutCars(4, createRng(2)));
  });

  test('falls back to an in-bounds grid when even relaxed sampling cannot fit the cars', () => {
    // Nine cars cannot fit 56 apart inside the 300-unit square.
    const positions = layoutCars(9, createRng(3));
    expect(positions).toHaveLength(9);
    expectInside(positions, 400);
  });
});

describe('layoutClear', () => {
  const COMBOS = [];
  for (const facing of DIRECTIONS) {
    for (const moving of DIRECTIONS) {
      COMBOS.push([facing, moving, true]); // drifting: any direction, with a trail
    }
    COMBOS.push([facing, facing, false]); // driving forward
    COMBOS.push([facing, oppositeDirection(facing), false]); // driving in reverse
  }

  test.each([8, 16, 24])(
    'places %i cars with no overlapping bodies, beams, smoke or skid marks',
    (count) => {
      for (const [facing, moving, drifting] of COMBOS) {
        const footprint = carFootprint(facing, moving, drifting);
        for (const seed of [1, 2, 3]) {
          const positions = layoutClear(count, createRng(seed), 600, footprint);
          expect(positions).toHaveLength(count);
          expectInside(positions, 600);
          for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
              expect(footprintsOverlap(footprint, positions[i], positions[j], 8)).toBe(false);
            }
          }
        }
      }
    }
  );

  test('the same seed gives deep-equal positions', () => {
    const footprint = carFootprint('up', 'left', true);
    expect(layoutClear(12, createRng(9), 600, footprint)).toEqual(
      layoutClear(12, createRng(9), 600, footprint)
    );
  });

  test('returns null when the cars cannot all fit', () => {
    expect(layoutClear(200, createRng(1), 600, carFootprint('up', 'down', true))).toBeNull();
  });
});
