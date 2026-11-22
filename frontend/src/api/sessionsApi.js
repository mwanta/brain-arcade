import { request } from './client.js';

export const startSession = (playerId) =>
  request('/sessions', { method: 'POST', body: { player_id: playerId } });
export const getSession = (sessionId) => request(`/sessions/${sessionId}`);
export const endSession = (sessionId, { keepalive } = {}) =>
  request(`/sessions/${sessionId}/end`, { method: 'POST', keepalive });
export const listPlayerSessions = (playerId) => request(`/players/${playerId}/sessions`);

// checkIn: { hours_slept?, caffeine_drinks?, stress_level? (1-5), exercised_today? }
export const createCheckIn = (sessionId, checkIn) =>
  request(`/sessions/${sessionId}/check-in`, { method: 'POST', body: checkIn });
export const getCheckIn = (sessionId) => request(`/sessions/${sessionId}/check-in`);
