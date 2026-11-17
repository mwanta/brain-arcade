import { request } from './client.js';

export const listPlayers = () => request('/players');
export const getPlayer = (playerId) => request(`/players/${playerId}`);
export const createPlayer = (player) => request('/players', { method: 'POST', body: player });
export const updatePlayer = (playerId, changes) =>
  request(`/players/${playerId}`, { method: 'PATCH', body: changes });
