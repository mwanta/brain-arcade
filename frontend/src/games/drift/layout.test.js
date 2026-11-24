import { DIRECTIONS, oppositeDirection } from './directions.js';
import { carFootprint, footprintsOverlap, sweptOverlap } from './footprint.js';
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
  const PAD = 8;
  // Every way a target group can look, with the grey group driving the other way on its axis.
  const CASES = [];
  for (const facing of DIRECTIONS) {
    for (const moving of DIRECTIONS) CASES.push([facing, moving, true]);
    CASES.push([facing, facing, false]);
    CASES.push([facing, oppositeDirection(facing), false]);
  }

  function groupsFor([facing, moving, drifting], cars, grey) {
    const lane = oppositeDirection(moving);
    return {
      axis: moving === 'up' || moving === 'down' ? 'y' : 'x',
      groups: [
        { footprint: carFootprint(facing, moving, drifting), count: cars },
        { footprint: carFootprint(lane, lane, false, false), count: grey },
      ],
    };
  }

  test.each([
    [3, 2],
    [5, 4],
    [8, 6],
    [10, 0],
  ])('places %i cars and %i grey cars without overlaps, now or when they pass', (cars, grey) => {
    for (const combo of CASES) {
      const { groups, axis } = groupsFor(combo, cars, grey);
      for (const seed of [1, 2, 3]) {
        const placed = layoutClear(groups, createRng(seed), 600, axis);
        expect(placed[0]).toHaveLength(cars);
        expect(placed[1]).toHaveLength(grey);
        placed.forEach((positions) => expectInside(positions, 600));

        // Same group: footprints keep clear of each other.
        placed.forEach((positions, g) => {
          for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
              const fp = groups[g].footprint;
              expect(footprintsOverlap(fp, positions[i], fp, positions[j], PAD)).toBe(false);
            }
          }
        });
        // Different groups drive past each other, so their lanes must never meet.
        for (const a of placed[0]) {
          for (const b of placed[1]) {
            const [fa, fb] = [groups[0].footprint, groups[1].footprint];
            expect(sweptOverlap(fa, a, fb, b, axis, PAD)).toBe(false);
          }
        }
      }
    }
  });

  test('the same seed gives deep-equal positions', () => {
    const { groups, axis } = groupsFor(['up', 'left', true], 5, 4);
    expect(layoutClear(groups, createRng(9), 600, axis)).toEqual(
      layoutClear(groups, createRng(9), 600, axis)
    );
  });

  test('returns null when the cars cannot all fit', () => {
    const { groups, axis } = groupsFor(['up', 'down', true], 200, 0);
    expect(layoutClear(groups, createRng(1), 600, axis)).toBeNull();
  });
});
