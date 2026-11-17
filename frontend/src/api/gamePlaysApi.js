import { request } from './client.js';

export const startGamePlay = (sessionId, gameId) =>
  request('/game-plays', { method: 'POST', body: { session_id: sessionId, game_id: gameId } });
export const getGamePlay = (playId) => request(`/game-plays/${playId}`);
export const finishGamePlay = (playId) =>
  request(`/game-plays/${playId}/finish`, { method: 'POST' });
export const listSessionGamePlays = (sessionId) => request(`/sessions/${sessionId}/game-plays`);

// attempt: { level_id, passed, duration_ms?, error_count?, started_at? (ISO string) }
export const recordLevelAttempt = (playId, attempt) =>
  request(`/game-plays/${playId}/attempts`, { method: 'POST', body: attempt });
export const listLevelAttempts = (playId) => request(`/game-plays/${playId}/attempts`);
