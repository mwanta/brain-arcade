import { describe, expect, it } from '@jest/globals';
import { DIRECTIONS, oppositeDirection, otherDirections } from './directions.js';

describe('directions', () => {
  it('lists the four directions', () => {
    expect(DIRECTIONS).toEqual(['up', 'down', 'left', 'right']);
  });

  it('oppositeDirection flips each direction and rejects unknown ones', () => {
    expect(oppositeDirection('up')).toBe('down');
    expect(oppositeDirection('down')).toBe('up');
    expect(oppositeDirection('left')).toBe('right');
    expect(oppositeDirection('right')).toBe('left');
    expect(() => oppositeDirection('north')).toThrow();
  });

  it('otherDirections returns the other three', () => {
    for (const dir of DIRECTIONS) {
      const others = otherDirections(dir);
      expect(others).toHaveLength(3);
      expect(others).not.toContain(dir);
    }
  });
});
