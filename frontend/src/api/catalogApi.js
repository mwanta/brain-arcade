import { request } from './client.js';

export const listDomains = () => request('/domains');
export const listSettingTypes = () => request('/setting-types');
export const listGames = () => request('/games');
// Includes levels, each with a { settingName: value } map (e.g. time_limit, max_errors).
export const getGame = (gameId) => request(`/games/${gameId}`);
