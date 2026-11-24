import { describe, expect, it } from '@jest/globals';
import { keyToDirection, swipeDirection } from './input.js';

describe('keyToDirection', () => {
  it('maps arrow keys', () => {
    expect(keyToDirection('ArrowUp')).toBe('up');
    expect(keyToDirection('ArrowDown')).toBe('down');
    expect(keyToDirection('ArrowLeft')).toBe('left');
    expect(keyToDirection('ArrowRight')).toBe('right');
  });

  it('maps WASD in either case', () => {
    expect(['w', 'a', 's', 'd'].map(keyToDirection)).toEqual(['up', 'left', 'down', 'right']);
    expect(['W', 'A', 'S', 'D'].map(keyToDirection)).toEqual(['up', 'left', 'down', 'right']);
  });

  it('returns null for anything else', () => {
    for (const key of ['x', ' ', 'Enter', 'Escape', 'arrowup', 'Shift', '', undefined]) {
      expect(keyToDirection(key)).toBeNull();
    }
  });
});

describe('swipeDirection', () => {
  it('detects all four directions', () => {
    expect(swipeDirection(0, -50)).toBe('up');
    expect(swipeDirection(0, 50)).toBe('down');
    expect(swipeDirection(-50, 0)).toBe('left');
    expect(swipeDirection(50, 0)).toBe('right');
  });

  it('returns null below the threshold', () => {
    expect(swipeDirection(29, 10)).toBeNull();
    expect(swipeDirection(0, 0)).toBeNull();
    expect(swipeDirection(10, 20, 25)).toBeNull();
    expect(swipeDirection(30, 0)).toBe('right');
  });

  it('returns null for an exact diagonal', () => {
    expect(swipeDirection(40, 40)).toBeNull();
    expect(swipeDirection(-40, 40)).toBeNull();
  });

  it('picks the dominant axis on a near-diagonal', () => {
    expect(swipeDirection(41, 40)).toBe('right');
    expect(swipeDirection(-40, -41)).toBe('up');
    expect(swipeDirection(-41, 40)).toBe('left');
    expect(swipeDirection(40, 41)).toBe('down');
  });
});
