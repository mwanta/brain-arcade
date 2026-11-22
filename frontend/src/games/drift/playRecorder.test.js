import { describe, expect, it } from '@jest/globals';
import { createPlayRecorder } from './playRecorder.js';

// Fake async API. Every call is logged; `failures` lists call names that should reject the next
// time they run (each entry is used once). Calls resolve after a macrotask so ordering matters.
function fakeApi() {
  const calls = [];
  const failures = [];
  let inFlight = 0;
  let maxInFlight = 0;
  const make =
    (name, result) =>
    async (...args) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight -= 1;
      const i = failures.indexOf(name);
      if (i !== -1) {
        failures.splice(i, 1);
        throw new Error(`${name} failed`);
      }
      calls.push([name, ...args]);
      return result(...args);
    };
  return {
    calls,
    failures,
    get maxInFlight() {
      return maxInFlight;
    },
    api: {
      startSession: make('startSession', () => ({ session_id: 11 })),
      startGamePlay: make('startGamePlay', () => ({ play_id: 22 })),
      recordLevelAttempt: make('recordLevelAttempt', () => ({})),
      finishGamePlay: make('finishGamePlay', () => ({})),
      endSession: make('endSession', () => ({})),
    },
  };
}

const names = (fake) => fake.calls.map((c) => c[0]);
const payload = (n) => ({ level_id: n, passed: true, duration_ms: 1000, error_count: 0 });

describe('begin', () => {
  it('creates a session and a play when no sessionId is given', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    expect(fake.calls).toEqual([
      ['startSession', 1],
      ['startGamePlay', 11, 4],
    ]);
  });

  it('only starts a play when given a sessionId', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    await rec.begin();
    expect(fake.calls).toEqual([['startGamePlay', 9, 4]]);
  });

  it('throws when a call fails', async () => {
    const fake = fakeApi();
    fake.failures.push('startGamePlay');
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await expect(rec.begin()).rejects.toThrow('startGamePlay failed');
    fake.failures.push('startSession');
    const rec2 = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await expect(rec2.begin()).rejects.toThrow('startSession failed');
  });
});

describe('record and finish', () => {
  it('sends records in order, one at a time, even when called quickly', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    await rec.begin();
    rec.record(payload(1));
    rec.record(payload(2));
    rec.record(payload(3));
    await rec.finish();
    const sent = fake.calls.filter((c) => c[0] === 'recordLevelAttempt');
    expect(sent.map((c) => c[2].level_id)).toEqual([1, 2, 3]);
    expect(sent.every((c) => c[1] === 22)).toBe(true);
    expect(fake.maxInFlight).toBe(1);
  });

  it('finishes after all attempts, then ends an owned session', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    rec.record(payload(1));
    rec.record(payload(2));
    const done = rec.finish();
    expect(rec.status).toBe('saving');
    await done;
    expect(names(fake)).toEqual([
      'startSession',
      'startGamePlay',
      'recordLevelAttempt',
      'recordLevelAttempt',
      'finishGamePlay',
      'endSession',
    ]);
    expect(fake.calls.at(-1)).toEqual(['endSession', 11]);
    expect(rec.status).toBe('saved');
  });

  it('does not end a session it does not own', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    await rec.begin();
    await rec.finish();
    expect(names(fake)).toEqual(['startGamePlay', 'finishGamePlay']);
    expect(rec.status).toBe('saved');
  });
});

describe('failures and retry', () => {
  it('goes to error, skips finishGamePlay, and retry resends only unsent attempts', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    rec.record(payload(1));
    fake.failures.push('recordLevelAttempt'); // the first send (attempt 1) fails
    rec.record(payload(2));
    rec.record(payload(3));
    await rec.finish();
    expect(rec.status).toBe('error');
    expect(rec.error).toBe('recordLevelAttempt failed');
    expect(names(fake)).not.toContain('finishGamePlay');

    await rec.retry();
    const sent = fake.calls.filter((c) => c[0] === 'recordLevelAttempt').map((c) => c[2].level_id);
    expect([...sent].sort()).toEqual([1, 2, 3]); // each exactly once
    expect(sent).toHaveLength(3);
    expect(names(fake).slice(-2)).toEqual(['finishGamePlay', 'endSession']);
    expect(rec.status).toBe('saved');
    expect(rec.error).toBeNull();
  });

  it('keeps later records behind a failed one and sends them in order on retry', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    await rec.begin();
    fake.failures.push('recordLevelAttempt');
    rec.record(payload(1)); // fails
    await new Promise((r) => setTimeout(r, 10));
    rec.record(payload(2)); // waits, not sent
    await new Promise((r) => setTimeout(r, 10));
    expect(rec.status).toBe('error');
    expect(fake.calls.filter((c) => c[0] === 'recordLevelAttempt')).toHaveLength(0);
    rec.finish();
    await rec.retry();
    const sent = fake.calls.filter((c) => c[0] === 'recordLevelAttempt').map((c) => c[2].level_id);
    expect(sent).toEqual([1, 2]);
    expect(rec.status).toBe('saved');
  });

  it('resumes at the failed step when finishGamePlay fails', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    rec.record(payload(1));
    fake.failures.push('finishGamePlay');
    await rec.finish();
    expect(rec.status).toBe('error');
    await rec.retry();
    expect(names(fake).filter((n) => n === 'recordLevelAttempt')).toHaveLength(1);
    expect(names(fake).slice(-2)).toEqual(['finishGamePlay', 'endSession']);
    expect(rec.status).toBe('saved');
  });
});

describe('abandon', () => {
  it('ends an owned session without finishing the play', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    await rec.abandon();
    expect(names(fake)).toEqual(['startSession', 'startGamePlay', 'endSession']);
    await rec.abandon();
    expect(names(fake).filter((n) => n === 'endSession')).toHaveLength(1);
  });

  it('is a no-op for a session it does not own', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    await rec.begin();
    await rec.abandon();
    expect(names(fake)).toEqual(['startGamePlay']);
  });

  it('is a no-op after a successful finish', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    await rec.finish();
    const before = fake.calls.length;
    await rec.abandon();
    expect(fake.calls).toHaveLength(before);
  });

  it('never throws', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    fake.failures.push('endSession');
    await expect(rec.abandon()).resolves.toBeUndefined();
  });
});

describe('subscribe', () => {
  it('notifies status changes and stops after unsubscribe', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    const seen = [];
    const unsubscribe = rec.subscribe((s) => seen.push(s));
    await rec.begin();
    await rec.finish();
    expect(seen).toEqual(['saving', 'saved']);

    unsubscribe();
    const rec2 = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    const seen2 = [];
    rec2.subscribe((s) => seen2.push(s))();
    await rec2.begin();
    await rec2.finish();
    expect(seen2).toEqual([]);
  });

  it('reports errors and the retry', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4, sessionId: 9 });
    const seen = [];
    rec.subscribe((s) => seen.push(s));
    await rec.begin();
    fake.failures.push('finishGamePlay');
    await rec.finish();
    await rec.retry();
    expect(seen).toEqual(['saving', 'error', 'saving', 'saved']);
  });
});

describe('abandon with keepalive', () => {
  it('passes keepalive to endSession so the request outlives a closing page', async () => {
    const fake = fakeApi();
    const rec = createPlayRecorder(fake.api, { playerId: 1, gameId: 4 });
    await rec.begin();
    await rec.abandon({ keepalive: true });
    expect(fake.calls.at(-1)).toEqual(['endSession', 11, { keepalive: true }]);
  });

  it('starts the request before the first await, as a closing page needs', async () => {
    let called = false;
    const api = {
      startSession: async () => ({ session_id: 5 }),
      startGamePlay: async () => ({ play_id: 6 }),
      endSession: async () => {
        called = true;
      },
    };
    const rec = createPlayRecorder(api, { playerId: 1, gameId: 4 });
    await rec.begin();
    const pending = rec.abandon({ keepalive: true });
    expect(called).toBe(true);
    await pending;
  });
});
