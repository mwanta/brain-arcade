import { settingLabel } from './statsFormat.js';

describe('settingLabel', () => {
  it('formats a level setting from its unit', () => {
    expect(settingLabel({ name: 'time_limit', value: 2000, unit: 'ms' })).toBe('time limit 2.00 s');
    expect(settingLabel({ name: 'switch_probability', value: 0.2, unit: 'ratio' })).toBe(
      'switch probability 20%'
    );
    expect(settingLabel({ name: 'move_speed', value: 60, unit: 'px/s' })).toBe(
      'move speed 60 px/s'
    );
    expect(settingLabel({ name: 'distractor_count', value: 2, unit: 'cars' })).toBe(
      'distractor count 2 cars'
    );
  });

  it('leaves off a unit the name already says', () => {
    expect(settingLabel({ name: 'max_errors', value: 1, unit: 'errors' })).toBe('max errors 1');
    expect(settingLabel({ name: 'trial_count', value: 12, unit: 'trials' })).toBe('trial count 12');
    expect(settingLabel({ name: 'car_count', value: 3, unit: 'cars' })).toBe('car count 3');
    expect(settingLabel({ name: 'custom', value: 3, unit: null })).toBe('custom 3');
  });
});
