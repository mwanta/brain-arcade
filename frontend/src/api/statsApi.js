import { request } from './client.js';

// filters: { from?: 'YYYY-MM-DD', to?: 'YYYY-MM-DD' (inclusive), game_id? }
const withFilters = (path, filters = {}) => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return params ? `${path}?${params}` : path;
};

export const getScoreHistory = (playerId, filters) =>
  request(withFilters(`/players/${playerId}/stats/history`, filters));
export const getGameSummaries = (playerId, filters) =>
  request(withFilters(`/players/${playerId}/stats/summary`, filters));
export const getAgeGroupComparison = (playerId, filters) =>
  request(withFilters(`/players/${playerId}/stats/comparison`, filters));
