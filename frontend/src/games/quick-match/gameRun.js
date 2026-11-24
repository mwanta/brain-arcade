import {
  getGamePlay,
  startGamePlay,
  finishGamePlay,
  listLevelAttempts,
  recordLevelAttempt,
} from '../../api/gamePlaysApi.js';
import {
  startSession,
  getSession,
  endSession,
  getCheckIn,
  createCheckIn,
} from '../../api/sessionsApi.js';

const api = {
  getGamePlay,
  startGamePlay,
  finishGamePlay,
  listLevelAttempts,
  recordLevelAttempt,
  startSession,
  getSession,
  endSession,
  getCheckIn,
  createCheckIn,
};

function sameAttempt(saved, attempt) {
  return (
    saved.level_id === attempt.level_id &&
    saved.started_at.replace(/Z$/, '') === attempt.started_at.replace(/Z$/, '') &&
    saved.passed === attempt.passed &&
    saved.duration_ms === attempt.duration_ms &&
    saved.error_count === attempt.error_count
  );
}

// One game page owns one session. Keep IDs between retries so a failed request
// doesn't restart an already-open run. Only existing API wrappers are used.
export class QuickMatchRun {
  constructor(playerId, gameId, client = api) {
    this.playerId = playerId;
    this.gameId = gameId;
    this.client = client;
    this.sessionId = null;
    this.playId = null;
    this.checkInSaved = false;
  }

  async start(checkIn) {
    if (this.sessionId === null) {
      this.sessionId = (await this.client.startSession(this.playerId)).session_id;
    }
    if (checkIn && !this.checkInSaved) {
      try {
        await this.client.getCheckIn(this.sessionId);
      } catch (error) {
        if (error.status !== 404) throw error;
        await this.client.createCheckIn(this.sessionId, checkIn);
      }
      this.checkInSaved = true;
    }
    if (this.playId === null) {
      this.playId = (await this.client.startGamePlay(this.sessionId, this.gameId)).play_id;
    }
  }

  async saveAttempt(attempt) {
    // A POST can commit even if its response is lost. Read back before retrying
    // and after a failed POST, using the original millisecond timestamp.
    const find = async () =>
      (await this.client.listLevelAttempts(this.playId)).find((saved) =>
        sameAttempt(saved, attempt)
      );
    const saved = await find();
    if (saved) return saved;
    try {
      return await this.client.recordLevelAttempt(this.playId, attempt);
    } catch (error) {
      const recovered = await find();
      if (recovered) return recovered;
      throw error;
    }
  }

  // Follow the site's session lifecycle when leaving the game. Keep an
  // unfinished play unfinished so the shared stats exclude it.
  async abandon({ keepalive = false } = {}) {
    if (this.sessionId === null) return;
    try {
      await this.client.endSession(this.sessionId, { keepalive });
    } catch {
      // The site's stale-session cleanup handles a failed best-effort close.
    }
  }

  async finish() {
    let play = await this.client.getGamePlay(this.playId);
    if (play.finished_at === null) {
      try {
        play = await this.client.finishGamePlay(this.playId);
      } catch (error) {
        play = await this.client.getGamePlay(this.playId);
        if (play.finished_at === null) throw error;
      }
    }
    const session = await this.client.getSession(this.sessionId);
    if (session.ended_at === null) {
      try {
        await this.client.endSession(this.sessionId);
      } catch (error) {
        if ((await this.client.getSession(this.sessionId)).ended_at === null) throw error;
      }
    }
    return play;
  }
}
