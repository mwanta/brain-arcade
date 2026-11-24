import { describe, expect, it } from '@jest/globals';
import {
  FEEDBACK_MS,
  GAP_MS,
  TIMEOUT_FEEDBACK_MS,
  currentTrial,
  errorsLeft,
  errorsSoFar,
  initLevel,
  levelReducer,
  levelSummary,
} from './levelMachine.js';
import { otherDirections } from './directions.js';
import { parseLevelSettings } from './settings.js';
import { generateTrials } from './trials.js';

const RAW = {
  trial_count: 3,
  time_limit: 1000,
  max_errors: 1,
  switch_probability: 0.2,
  car_count: 2,
  move_speed: 60,
  conflict_ratio: 0.5,
  distractor_count: 0,
};

function setup(overrides = {}, seed = 1) {
  const settings = parseLevelSettings({ ...RAW, ...overrides });
  return initLevel(generateTrials(settings, seed), settings);
}

const started = (state, now = 0) => levelReducer(state, { type: 'start', now });
const wrongFor = (trial) => otherDirections(trial.answer)[0];

/** Answer the current trial `now` ms after it appeared, then tick through feedback and the gap into the next phase. */
function answerAndAdvance(state, direction, now) {
  const at = state.shownAt + now;
  let s = levelReducer(state, { type: 'respond', direction, now: at });
  s = levelReducer(s, { type: 'tick', now: at + FEEDBACK_MS });
  if (s.phase === 'gap') s = levelReducer(s, { type: 'tick', now: at + FEEDBACK_MS + GAP_MS });
  return s;
}

const deepFreeze = (o) => {
  Object.values(o).forEach((v) => v && typeof v === 'object' && deepFreeze(v));
  return Object.freeze(o);
};

describe('levelReducer', () => {
  it('starts in ready with nothing played', () => {
    expect(setup()).toMatchObject({ phase: 'ready', index: 0, shownAt: null, results: [] });
  });

  it('start moves ready to showing and sets shownAt', () => {
    expect(started(setup(), 500)).toMatchObject({ phase: 'showing', index: 0, shownAt: 500 });
  });

  it('start is ignored outside ready', () => {
    const s = started(setup(), 500);
    expect(levelReducer(s, { type: 'start', now: 900 })).toBe(s);
  });

  it('records a correct answer with its elapsed time', () => {
    const s = started(setup(), 100);
    const answer = currentTrial(s).answer;
    const next = levelReducer(s, { type: 'respond', direction: answer, now: 450 });
    expect(next.phase).toBe('feedback');
    expect(next.phaseEndsAt).toBe(450 + FEEDBACK_MS);
    expect(next.results).toEqual([
      { outcome: 'correct', elapsedMs: 350, direction: answer, followedDistractor: false },
    ]);
    expect(next.lastOutcome).toBe(next.results[0]);
  });

  it('records a wrong answer', () => {
    const s = started(setup());
    const direction = wrongFor(currentTrial(s));
    const next = levelReducer(s, { type: 'respond', direction, now: 200 });
    expect(next.results[0]).toMatchObject({ outcome: 'wrong', elapsedMs: 200, direction });
  });

  it('flags following the grey cars on a driving trial', () => {
    const settings = parseLevelSettings({ ...RAW, trial_count: 20, distractor_count: 2 });
    const trials = generateTrials(settings, 3);
    const driveIndex = trials.findIndex((t) => t.rule === 'drive');
    expect(driveIndex).toBeGreaterThanOrEqual(0);
    const trial = trials[driveIndex];
    const base = {
      ...initLevel(trials, settings),
      phase: 'showing',
      index: driveIndex,
      shownAt: 0,
    };

    const grey = trial.distractors[0].moving;
    expect(grey).not.toBe(trial.answer);
    const followed = levelReducer(base, { type: 'respond', direction: grey, now: 10 });
    expect(followed.results[0]).toMatchObject({ outcome: 'wrong', followedDistractor: true });

    const other = otherDirections(trial.answer).find((d) => d !== grey);
    const elsewhere = levelReducer(base, { type: 'respond', direction: other, now: 10 });
    expect(elsewhere.results[0]).toMatchObject({ outcome: 'wrong', followedDistractor: false });

    const right = levelReducer(base, { type: 'respond', direction: trial.answer, now: 10 });
    expect(right.results[0].followedDistractor).toBe(false);
  });

  it('never flags followedDistractor without distractors', () => {
    const s = started(setup());
    for (const direction of otherDirections(currentTrial(s).answer)) {
      const next = levelReducer(s, { type: 'respond', direction, now: 10 });
      expect(next.results[0].followedDistractor).toBe(false);
    }
  });

  it('ignores respond in ready, feedback, gap and done', () => {
    const respond = { type: 'respond', direction: 'up', now: 5000 };
    const ready = setup();
    expect(levelReducer(ready, respond)).toBe(ready);

    const trial = currentTrial(ready);
    const feedback = levelReducer(started(ready), {
      type: 'respond',
      direction: trial.answer,
      now: 10,
    });
    expect(levelReducer(feedback, respond)).toBe(feedback);

    const gap = levelReducer(feedback, { type: 'tick', now: 10 + FEEDBACK_MS });
    expect(gap.phase).toBe('gap');
    expect(levelReducer(gap, respond)).toBe(gap);

    const failing = setup({ max_errors: 0 });
    const failed = answerAndAdvance(started(failing), wrongFor(currentTrial(failing)), 0);
    expect(failed.phase).toBe('done');
    expect(levelReducer(failed, respond)).toBe(failed);
  });

  it('does not time out before timeLimit', () => {
    const s = started(setup(), 0);
    expect(levelReducer(s, { type: 'tick', now: 1000 })).toBe(s);
  });

  it('records a timeout after timeLimit', () => {
    const next = levelReducer(started(setup(), 0), { type: 'tick', now: 1001 });
    expect(next.phase).toBe('feedback');
    expect(next.results).toEqual([
      { outcome: 'timeout', elapsedMs: 1000, direction: null, followedDistractor: false },
    ]);
    expect(next.phaseEndsAt).toBe(1001 + TIMEOUT_FEEDBACK_MS);
    expect(TIMEOUT_FEEDBACK_MS).toBeGreaterThan(FEEDBACK_MS);
  });

  it('takes one transition step per tick', () => {
    const next = levelReducer(started(setup(), 0), { type: 'tick', now: 99999 });
    expect(next.phase).toBe('feedback');
    expect(levelReducer(next, { type: 'tick', now: 99999 + TIMEOUT_FEEDBACK_MS }).phase).toBe(
      'gap'
    );
  });

  it('flows showing -> feedback -> gap -> showing', () => {
    const s0 = started(setup(), 0);
    const s1 = levelReducer(s0, { type: 'respond', direction: currentTrial(s0).answer, now: 300 });
    expect(levelReducer(s1, { type: 'tick', now: 300 + FEEDBACK_MS - 1 })).toBe(s1);
    const s2 = levelReducer(s1, { type: 'tick', now: 300 + FEEDBACK_MS });
    expect(s2.phase).toBe('gap');
    const gapEnd = 300 + FEEDBACK_MS + GAP_MS;
    expect(levelReducer(s2, { type: 'tick', now: gapEnd - 1 })).toBe(s2);
    const s3 = levelReducer(s2, { type: 'tick', now: gapEnd });
    expect(s3).toMatchObject({ phase: 'showing', index: 1, shownAt: gapEnd });
  });

  it('ends in done after every trial and passes', () => {
    let s = started(setup(), 0);
    while (s.phase !== 'done') {
      s = answerAndAdvance(s, currentTrial(s).answer, 100);
    }
    expect(s.results).toHaveLength(3);
    expect(levelSummary(s).passed).toBe(true);
  });

  it('fails early once errors exceed maxErrors', () => {
    let s = started(setup({ trial_count: 6 }), 0);
    for (let i = 0; i < 2; i++) {
      s = answerAndAdvance(s, wrongFor(currentTrial(s)), 100);
    }
    expect(s.phase).toBe('done');
    expect(s.results).toHaveLength(2);
    expect(levelSummary(s).passed).toBe(false);
  });

  it('counts distractor errors in the summary', () => {
    const base = setup({ trial_count: 4, max_errors: 4, distractor_count: 2 });
    const s = {
      ...base,
      phase: 'done',
      results: [
        { outcome: 'wrong', elapsedMs: 100, direction: 'up', followedDistractor: true },
        { outcome: 'wrong', elapsedMs: 100, direction: 'left', followedDistractor: false },
        { outcome: 'correct', elapsedMs: 100, direction: 'down', followedDistractor: false },
        { outcome: 'wrong', elapsedMs: 100, direction: 'up', followedDistractor: true },
      ],
    };
    expect(levelSummary(s)).toMatchObject({ distractor_errors: 2, error_count: 3, passed: true });
  });

  it('keeps errorsLeft at 0 or more', () => {
    const base = setup();
    const wrong = { outcome: 'wrong', elapsedMs: 1 };
    expect(errorsLeft(base)).toBe(1);
    expect(errorsLeft({ ...base, results: [wrong] })).toBe(0);
    const many = { ...base, results: [wrong, wrong, wrong, wrong] };
    expect(errorsSoFar(many)).toBe(4);
    expect(errorsLeft(many)).toBe(0);
  });

  it('reset returns to ready with no results', () => {
    const s = answerAndAdvance(started(setup(), 0), 'up', 0);
    const next = levelReducer(s, { type: 'reset' });
    expect(next).toMatchObject({
      phase: 'ready',
      index: 0,
      shownAt: null,
      results: [],
      lastOutcome: null,
    });
    expect(next.trials).toBe(s.trials);
  });

  it('does not mutate its input state', () => {
    let s = deepFreeze(setup({ distractor_count: 2 }));
    const actions = [
      { type: 'start', now: 0 },
      { type: 'respond', direction: 'up', now: 100 },
      { type: 'tick', now: 100 + FEEDBACK_MS },
      { type: 'tick', now: 100 + FEEDBACK_MS + GAP_MS },
      { type: 'tick', now: 5000 },
      { type: 'reset' },
    ];
    for (const action of actions) {
      const before = structuredClone(s);
      s = deepFreeze(levelReducer(s, action));
      expect(before).toBeDefined();
    }
    const frozen = deepFreeze(setup());
    const snapshot = structuredClone(frozen);
    levelReducer(frozen, { type: 'start', now: 1 });
    expect(frozen).toEqual(snapshot);
  });
});
