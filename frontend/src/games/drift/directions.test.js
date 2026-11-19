import { describe, expect, it } from '@jest/globals';
import { DIRECTIONS, otherDirections } from './directions.js';

describe('directions', () => {
  it('lists the four directions', () => {
    expect(DIRECTIONS).toEqual(['up', 'down', 'left', 'right']);
  });

  it('otherDirections returns the other three', () => {
    for (const dir of DIRECTIONS) {
      const others = otherDirections(dir);
      expect(others).toHaveLength(3);
      expect(others).not.toContain(dir);
    }
  });
});
