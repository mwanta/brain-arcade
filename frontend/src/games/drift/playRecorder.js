/**
 * Saves one Drift play to the backend in order, however fast levels finish.
 *
 * @param {{ startSession: Function, startGamePlay: Function, recordLevelAttempt: Function,
 *   finishGamePlay: Function, endSession: Function }} api The API calls (injected for tests).
 * @param {{ playerId: number, gameId: number, sessionId?: number | null }} options Pass a
 *   sessionId to join an existing session; otherwise the recorder starts, and later ends, its own.
 * @returns {object} { begin, record, finish, retry, abandon, subscribe, status, error }
 */
export function createPlayRecorder(api, { playerId, gameId, sessionId = null }) {
  const owns = sessionId === null || sessionId === undefined;
  let sid = owns ? null : sessionId;
  let playId = null;

  let status = 'idle'; // 'idle' | 'saving' | 'saved' | 'error'
  let lastError = null;
  const listeners = new Set();

  const attempts = []; // { payload, sent }
  let failed = false;
  let finishRequested = false;
  let playFinished = false;
  let sessionEnded = false;

  // Every network step after begin() runs through this chain, one at a time.
  let tail = Promise.resolve();
  const enqueue = (fn) => {
    tail = tail.then(fn);
    return tail;
  };

  function setStatus(next) {
    if (next === status) return;
    status = next;
    for (const listener of [...listeners]) listener(status);
  }

  function fail(e) {
    failed = true;
    lastError = e?.message || String(e);
    setStatus('error');
  }

  // Sends the attempts not yet sent, in order. Stops at the first failure.
  async function sendPending() {
    for (const a of attempts) {
      if (a.sent) continue;
      try {
        await api.recordLevelAttempt(playId, a.payload);
        a.sent = true;
      } catch (e) {
        fail(e);
        return false;
      }
    }
    return true;
  }

  // Finishes the play, then ends an owned session. Each step runs once, so a retry resumes.
  async function completeFinish() {
    try {
      if (!playFinished) {
        await api.finishGamePlay(playId);
        playFinished = true;
      }
      if (owns && !sessionEnded) {
        await api.endSession(sid);
        sessionEnded = true;
      }
      setStatus('saved');
    } catch (e) {
      fail(e);
    }
  }

  return {
    get status() {
      return status;
    },
    get error() {
      return lastError;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async begin() {
      if (owns && sid === null) {
        const session = await api.startSession(playerId);
        sid = session.session_id;
      }
      const play = await api.startGamePlay(sid, gameId);
      playId = play.play_id;
    },

    record(payload) {
      attempts.push({ payload, sent: false });
      // After a failure, later attempts wait behind the failed one until retry().
      if (!failed) enqueue(sendPending);
    },

    finish() {
      finishRequested = true;
      if (!failed) setStatus('saving');
      return enqueue(async () => {
        if (failed) return;
        if (await sendPending()) await completeFinish();
      });
    },

    retry() {
      if (!failed) return Promise.resolve();
      failed = false;
      lastError = null;
      setStatus('saving');
      return enqueue(async () => {
        if (!(await sendPending())) return;
        if (finishRequested) await completeFinish();
        else setStatus('idle');
      });
    },

    // Best effort: ends an owned session but does not finish the play, so it is not in stats.
    // With `keepalive` (for a closing page) the request is allowed to outlive the page.
    async abandon({ keepalive = false } = {}) {
      if (status === 'saved' || sessionEnded || !owns || sid === null) return;
      sessionEnded = true;
      try {
        await (keepalive ? api.endSession(sid, { keepalive: true }) : api.endSession(sid));
      } catch {
        // Nothing useful to do: the player is leaving.
      }
    },
  };
}
