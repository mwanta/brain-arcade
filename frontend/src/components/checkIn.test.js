import { describe, expect, it } from '@jest/globals';
import { EMPTY_CHECK_IN, toCheckIn } from './checkIn.js';

describe('toCheckIn', () => {
  it('keeps only answered questions, as numbers and a boolean', () => {
    expect(
      toCheckIn({ ...EMPTY_CHECK_IN, hours_slept: '7.5', stress_level: '2', exercised_today: 'no' })
    ).toEqual({ hours_slept: 7.5, stress_level: 2, exercised_today: false });
    expect(toCheckIn({ ...EMPTY_CHECK_IN, caffeine_drinks: '0', exercised_today: 'yes' })).toEqual({
      caffeine_drinks: 0,
      exercised_today: true,
    });
  });

  it('is null when nothing was answered', () => {
    expect(toCheckIn(EMPTY_CHECK_IN)).toBeNull();
  });
});
