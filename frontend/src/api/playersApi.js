import { request } from './client.js';

export const listPlayers = () => request('/players');
export const getPlayer = (playerId) => request(`/players/${playerId}`);
export const createPlayer = (player) => request('/players', { method: 'POST', body: player });
export const updatePlayer = (playerId, changes) =>
  request(`/players/${playerId}`, { method: 'PATCH', body: changes });
// Username only, no password. Resolves to the player, or throws ApiError (404 if unknown).
export const loginPlayer = (username) => request('/login', { method: 'POST', body: { username } });
