import { describe, expect, it } from '@jest/globals';
import { oppositeDirection } from './directions.js';
import { TUTORIAL_STEPS } from './tutorial.js';
import { answerFor } from './trials.js';

function checkTrial(trial) {
  const first = trial.cars[0];
  expect(trial.answer).toBe(answerFor(first));
  expect(trial.rule).toBe(first.state);
  for (const c of trial.cars) expect(c).toEqual(first);
  expect(trial.conflict).toBe(first.facing !== first.moving);
  if (first.state === 'drive') {
    expect([first.facing, oppositeDirection(first.facing)]).toContain(first.moving);
  }
  for (const d of trial.distractors) {
    expect(d.state).toBe('drive');
    expect(d.facing).toBe(d.moving);
    expect(d.moving).toBe(oppositeDirection(first.moving));
  }
}

describe('TUTORIAL_STEPS', () => {
  it('has the five steps in order, with slow speeds', () => {
    expect(TUTORIAL_STEPS.map((s) => s.title)).toEqual([
      'Driving',
      'Reversing',
      'Drifting',
      'Grey cars',
      'Controls and lives',
    ]);
    for (const s of TUTORIAL_STEPS) {
      expect(s.text.length).toBeGreaterThan(0);
      expect(s.moveSpeed).toBe(40);
    }
  });

  it('teaches the right answers', () => {
    expect(TUTORIAL_STEPS.slice(0, 4).map((s) => s.trial.answer)).toEqual([
      'up',
      'down',
      'left',
      'right',
    ]);
    expect(TUTORIAL_STEPS[3].trial.distractors).toHaveLength(2);
  });

  it('builds every trial consistently', () => {
    TUTORIAL_STEPS.forEach((s) => checkTrial(s.trial));
  });
});
