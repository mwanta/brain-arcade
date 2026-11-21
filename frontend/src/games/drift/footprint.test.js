import { DIRECTIONS } from './directions.js';
import { carFootprint, footprintsOverlap } from './footprint.js';

function bounds(rects) {
  return {
    x0: Math.min(...rects.map((r) => r.x0)),
    y0: Math.min(...rects.map((r) => r.y0)),
    x1: Math.max(...rects.map((r) => r.x1)),
    y1: Math.max(...rects.map((r) => r.y1)),
  };
}

describe('carFootprint', () => {
  test('a driving car covers its body and beams ahead of it', () => {
    const up = carFootprint('up', 'up', false);
    expect(up).toHaveLength(2);
    expect(up[0]).toEqual({ x0: -16, y0: -24, x1: 16, y1: 24 }); // body, 32 x 48
    expect(up[1]).toEqual({ x0: -28, y0: -48, x1: 28, y1: -24 }); // beams ahead
  });

  test('beams point the way the car faces, whichever way it moves', () => {
    expect(carFootprint('right', 'up', false)[1]).toEqual({ x0: 24, y0: -28, x1: 48, y1: 28 });
    expect(carFootprint('down', 'down', false)[1]).toEqual({ x0: -28, y0: 24, x1: 28, y1: 48 });
    expect(carFootprint('left', 'left', false)[1]).toEqual({ x0: -48, y0: -28, x1: -24, y1: 28 });
  });

  test('a drifting car adds a trail behind the way it moves, not behind its rear', () => {
    // Facing up but moving down: the trail is above the car, on the same side as the nose.
    const [, , trail] = carFootprint('up', 'down', true);
    expect(trail.y1).toBeLessThanOrEqual(-24);
    expect(trail.y0).toBeLessThan(-60);
    // Facing right but moving up: the trail is below the car.
    const [, , sideways] = carFootprint('right', 'up', true);
    expect(sideways.y0).toBeGreaterThanOrEqual(24);
    expect(sideways.y1).toBeGreaterThan(60);
  });

  test('a driving car has no trail', () => {
    for (const dir of DIRECTIONS) expect(carFootprint(dir, dir, false)).toHaveLength(2);
    expect(carFootprint('up', 'left', true)).toHaveLength(3);
  });

  test('turning the car swaps its width and length', () => {
    const upB = bounds(carFootprint('up', 'up', false).slice(0, 1));
    const rightB = bounds(carFootprint('right', 'right', false).slice(0, 1));
    expect(upB.x1 - upB.x0).toBe(rightB.y1 - rightB.y0);
    expect(upB.y1 - upB.y0).toBe(rightB.x1 - rightB.x0);
  });
});

describe('footprintsOverlap', () => {
  const fp = carFootprint('up', 'up', false);

  test('cars on top of each other overlap', () => {
    expect(footprintsOverlap(fp, { x: 100, y: 100 }, { x: 100, y: 100 })).toBe(true);
  });

  test('a car whose body sits in another car beams overlaps it', () => {
    expect(footprintsOverlap(fp, { x: 100, y: 100 }, { x: 100, y: 60 })).toBe(true);
  });

  test('cars far enough apart do not overlap, and padding widens the gap', () => {
    // Side by side: footprint is 56 wide, so 56 apart just touches and 57 clears.
    expect(footprintsOverlap(fp, { x: 100, y: 100 }, { x: 157, y: 100 })).toBe(false);
    expect(footprintsOverlap(fp, { x: 100, y: 100 }, { x: 157, y: 100 }, 4)).toBe(true);
  });
});
