import { request } from './client.js';

// filters: { from?: 'YYYY-MM-DD', to?: 'YYYY-MM-DD' (inclusive), game_id? }
// The cohort calls also take cohort filters (see README): lists may be arrays or
// comma-separated strings, e.g. { occupation: ['student', 'retired'], match: 'age_group' }.
const withFilters = (path, filters = {}) => {
  const params = new URLSearchParams(
    Object.entries(filters)
      .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : v])
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return params ? `${path}?${params}` : path;
};

export const getScoreHistory = (playerId, filters) =>
  request(withFilters(`/players/${playerId}/stats/history`, filters));
export const getGameSummaries = (playerId, filters) =>
  request(withFilters(`/players/${playerId}/stats/summary`, filters));
export const getAgeGroupComparison = (playerId, filters) =>
  request(withFilters(`/players/${playerId}/stats/comparison`, filters));

const cohort = (playerId, path, filters) =>
  request(withFilters(`/players/${playerId}/stats/cohort/${path}`, filters));

export const getCohortComparison = (playerId, filters) => cohort(playerId, 'comparison', filters);
export const getCohortDistribution = (playerId, filters) =>
  cohort(playerId, 'distribution', filters);
// filters.group_by: 'age_group' | 'gender' | 'occupation' (default) | 'education_level'
export const getDemographicBreakdown = (playerId, filters) =>
  cohort(playerId, 'breakdown', filters);
// filters.max_play_number: how many plays to show (default 10)
export const getLearningCurve = (playerId, filters) => cohort(playerId, 'learning-curve', filters);
export const getConditionImpact = (playerId, filters) => cohort(playerId, 'conditions', filters);
export const getLevelPerformance = (playerId, filters) => cohort(playerId, 'levels', filters);
