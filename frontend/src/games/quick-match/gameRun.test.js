import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { QuickMatchRun } from './gameRun.js';

const attempt = {
  level_id: 507,
  started_at: '2026-11-22T20:00:00.123Z',
  passed: true,
  duration_ms: 4000,
  error_count: 1,
};
let client;
let run;

beforeEach(() => {
  client = {
    startSession: jest.fn().mockResolvedValue({ session_id: 77 }),
    getSession: jest.fn().mockResolvedValue({ session_id: 77, ended_at: null }),
    endSession: jest.fn().mockResolvedValue({ session_id: 77, ended_at: 'now' }),
    getCheckIn: jest.fn().mockRejectedValue({ status: 404 }),
    createCheckIn: jest.fn().mockResolvedValue({ check_in_id: 1 }),
    startGamePlay: jest.fn().mockResolvedValue({ play_id: 88 }),
    getGamePlay: jest.fn().mockResolvedValue({ play_id: 88, finished_at: null, score: 2 }),
    finishGamePlay: jest.fn().mockResolvedValue({ play_id: 88, finished_at: 'now', score: 2 }),
    listLevelAttempts: jest.fn().mockResolvedValue([]),
    recordLevelAttempt: jest.fn().mockResolvedValue({ attempt_id: 1, ...attempt }),
  };
  run = new QuickMatchRun(12, 42, client);
});

describe('Quick Match API lifecycle', () => {
  it('links player, session, game and level result, then finishes in order', async () => {
    await run.start({ hours_slept: 7.5 });
    await run.saveAttempt(attempt);
    expect(await run.finish()).toMatchObject({ score: 2, finished_at: 'now' });
    expect(client.startSession).toHaveBeenCalledWith(12);
    expect(client.createCheckIn).toHaveBeenCalledWith(77, { hours_slept: 7.5 });
    expect(client.startGamePlay).toHaveBeenCalledWith(77, 42);
    expect(client.recordLevelAttempt).toHaveBeenCalledWith(88, attempt);
    expect(client.finishGamePlay.mock.invocationCallOrder[0]).toBeLessThan(
      client.endSession.mock.invocationCallOrder[0]
    );
  });

  it('reuses the session and check-in after a failed start', async () => {
    client.startGamePlay.mockRejectedValueOnce(new Error('offline'));
    await expect(run.start({ stress_level: 2 })).rejects.toThrow('offline');
    await run.start({ stress_level: 2 });
    expect(client.startSession).toHaveBeenCalledTimes(1);
    expect(client.createCheckIn).toHaveBeenCalledTimes(1);
  });

  it('allows an omitted check-in and recovers a check-in whose response was lost', async () => {
    await run.start(null);
    expect(client.createCheckIn).not.toHaveBeenCalled();
    const other = new QuickMatchRun(12, 42, client);
    client.getCheckIn.mockResolvedValue({ check_in_id: 1 });
    await other.start({ hours_slept: 7 });
    expect(client.createCheckIn).not.toHaveBeenCalled();
  });

  it('reads back a committed attempt after a lost POST response', async () => {
    run.playId = 88;
    const saved = { ...attempt, attempt_id: 3, started_at: attempt.started_at.replace('Z', '') };
    client.recordLevelAttempt.mockRejectedValue(new Error('response lost'));
    client.listLevelAttempts.mockResolvedValueOnce([]).mockResolvedValue([saved]);
    expect(await run.saveAttempt(attempt)).toEqual(saved);
    expect(await run.saveAttempt(attempt)).toEqual(saved);
    expect(client.recordLevelAttempt).toHaveBeenCalledTimes(1);
  });

  it('keeps failed writes retryable without mistaking another result for this one', async () => {
    run.playId = 88;
    client.listLevelAttempts.mockResolvedValue([{ ...attempt, level_id: 999 }]);
    client.recordLevelAttempt.mockRejectedValueOnce(new Error('offline'));
    await expect(run.saveAttempt(attempt)).rejects.toThrow('offline');
    await run.saveAttempt(attempt);
    expect(client.recordLevelAttempt).toHaveBeenCalledTimes(2);
  });

  it('recovers a finish whose response was lost, then closes the session', async () => {
    run.playId = 88;
    run.sessionId = 77;
    client.finishGamePlay.mockRejectedValue(new Error('response lost'));
    client.getGamePlay
      .mockResolvedValueOnce({ finished_at: null })
      .mockResolvedValue({ play_id: 88, finished_at: 'now', score: 2 });
    expect((await run.finish()).score).toBe(2);
    expect(client.endSession).toHaveBeenCalledWith(77);
    await run.finish();
    expect(client.finishGamePlay).toHaveBeenCalledTimes(1);
  });

  it('retries session closure after the play has already finished', async () => {
    client.getGamePlay.mockResolvedValue({ finished_at: 'now', score: 1 });
    client.endSession.mockRejectedValueOnce(new Error('offline'));
    await expect(run.finish()).rejects.toThrow('offline');
    await run.finish();
    expect(client.finishGamePlay).not.toHaveBeenCalled();
    expect(client.endSession).toHaveBeenCalledTimes(2);
  });
});
