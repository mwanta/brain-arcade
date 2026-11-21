import { describe, expect, it } from '@jest/globals';
import { PIXEL_ICONS, iconPixels } from './pixelIcons.js';

describe('PIXEL_ICONS', () => {
  it('are all 8x8 grids of # and .', () => {
    for (const rows of Object.values(PIXEL_ICONS)) {
      expect(rows).toHaveLength(8);
      for (const row of rows) expect(row).toMatch(/^[#.]{8}$/);
    }
  });

  it('points each arrow the right way', () => {
    const top = (name) => iconPixels(name).filter((p) => p.y === 0).length;
    expect(top('up')).toBeGreaterThan(0);
    expect(top('down')).toBe(2);
    expect(iconPixels('left').some((p) => p.x === 0 && p.y === 3)).toBe(true);
    expect(iconPixels('right').some((p) => p.x === 7 && p.y === 3)).toBe(true);
    expect(iconPixels('down').some((p) => p.y === 7 && p.x === 3)).toBe(true);
    expect(iconPixels('up').some((p) => p.y === 0 && p.x === 3)).toBe(true);
  });

  it('throws on an unknown name', () => {
    expect(() => iconPixels('nope')).toThrow();
  });
});
