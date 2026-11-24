import { DIRECTIONS } from './directions.js';
import { advance, directionAngle, directionVector, snapToGrid, translateAttr } from './geometry.js';

describe('snapToGrid and translateAttr', () => {
  test('rounds to the nearest multiple of the step', () => {
    expect(snapToGrid(5)).toBe(4);
    expect(snapToGrid(6)).toBe(8);
    expect(snapToGrid(-5)).toBe(-4);
    expect(snapToGrid(13, 10)).toBe(10);
  });

  test('translateAttr snaps both coordinates', () => {
    expect(translateAttr({ x: 101, y: 59 })).toBe('translate(100 60)');
  });
});

describe('directionAngle', () => {
  test('rotates an up-pointing car to each direction', () => {
    expect(directionAngle('up')).toBe(0);
    expect(directionAngle('right')).toBe(90);
    expect(directionAngle('down')).toBe(180);
    expect(directionAngle('left')).toBe(270);
  });

  test('rejects an unknown direction', () => {
    expect(() => directionAngle('north')).toThrow();
  });
});

describe('directionVector', () => {
  test('is a unit vector in SVG coordinates (y grows downward)', () => {
    expect(directionVector('up')).toEqual({ x: 0, y: -1 });
    expect(directionVector('down')).toEqual({ x: 0, y: 1 });
    expect(directionVector('left')).toEqual({ x: -1, y: 0 });
    expect(directionVector('right')).toEqual({ x: 1, y: 0 });
  });

  test('returns a copy that cannot corrupt later calls', () => {
    directionVector('up').y = 99;
    expect(directionVector('up')).toEqual({ x: 0, y: -1 });
  });

  test('rejects an unknown direction', () => {
    expect(() => directionVector('north')).toThrow();
  });
});

describe('advance', () => {
  test('moves speed * dt / 1000 units (100 units/s over 500 ms is 50)', () => {
    expect(advance({ x: 200, y: 200 }, 'right', 100, 500)).toEqual({ x: 250, y: 200 });
    expect(advance({ x: 200, y: 200 }, 'left', 100, 500)).toEqual({ x: 150, y: 200 });
    expect(advance({ x: 200, y: 200 }, 'down', 100, 500)).toEqual({ x: 200, y: 250 });
    expect(advance({ x: 200, y: 200 }, 'up', 100, 500)).toEqual({ x: 200, y: 150 });
  });

  test('does not move when dt is 0', () => {
    for (const dir of DIRECTIONS) {
      expect(advance({ x: 123, y: 45 }, dir, 130, 0)).toEqual({ x: 123, y: 45 });
    }
  });

  test('does not mutate its input', () => {
    const pos = { x: 10, y: 10 };
    advance(pos, 'right', 100, 1000);
    expect(pos).toEqual({ x: 10, y: 10 });
  });

  test('wraps to the opposite side when more than margin past an edge', () => {
    // Ends 1 past the margin (431 > 430) and reappears 1 past the margin on the other side.
    expect(advance({ x: 430, y: 200 }, 'right', 1, 1000)).toEqual({ x: -29, y: 200 });
    expect(advance({ x: -30, y: 200 }, 'left', 1, 1000)).toEqual({ x: 429, y: 200 });
    expect(advance({ x: 200, y: 430 }, 'down', 1, 1000)).toEqual({ x: 200, y: -29 });
    expect(advance({ x: 200, y: -30 }, 'up', 1, 1000)).toEqual({ x: 200, y: 429 });
  });

  test('does not wrap while within margin of the edge', () => {
    expect(advance({ x: 420, y: 200 }, 'right', 10, 1000)).toEqual({ x: 430, y: 200 });
    expect(advance({ x: 395, y: 200 }, 'right', 10, 1000)).toEqual({ x: 405, y: 200 });
    expect(advance({ x: -20, y: 200 }, 'left', 10, 1000)).toEqual({ x: -30, y: 200 });
  });

  test('respects a custom size and margin', () => {
    expect(advance({ x: 100, y: 50 }, 'right', 10, 1000, 100, 5)).toEqual({ x: 0, y: 50 });
  });

  test('a very long step still lands inside the wrapped range', () => {
    const p = advance({ x: 0, y: 200 }, 'right', 1000, 10000);
    expect(p.x).toBeGreaterThanOrEqual(-30);
    expect(p.x).toBeLessThanOrEqual(430);
  });
});
