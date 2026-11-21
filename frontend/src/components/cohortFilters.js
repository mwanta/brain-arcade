// Cohort filters live in the URL (?match=age_group&occupation=student,...) so a filtered
// stats page can be bookmarked or shared. Keys match the backend's query parameters.
const LIST_KEYS = ['match', 'occupation', 'gender'];
const VALUE_KEYS = [
  'game_id',
  'from',
  'to',
  'education_min',
  'education_max',
  'age_min',
  'age_max',
  'min_plays',
];

export const EMPTY_FILTERS = {
  ...Object.fromEntries(LIST_KEYS.map((k) => [k, []])),
  ...Object.fromEntries(VALUE_KEYS.map((k) => [k, ''])),
};

export const MATCH_OPTIONS = [
  { value: 'age_group', label: 'Age group' },
  { value: 'gender', label: 'Gender' },
  { value: 'occupation', label: 'Occupation' },
  { value: 'education_level', label: 'Education level' },
];

export function readFilters(searchParams) {
  const filters = { ...EMPTY_FILTERS };
  for (const key of LIST_KEYS) {
    const raw = searchParams.get(key);
    filters[key] = raw ? raw.split(',').filter(Boolean) : [];
  }
  for (const key of VALUE_KEYS) filters[key] = searchParams.get(key) ?? '';
  return filters;
}

export function writeFilters(filters) {
  const params = new URLSearchParams();
  for (const key of LIST_KEYS) if (filters[key].length) params.set(key, filters[key].join(','));
  for (const key of VALUE_KEYS) if (filters[key] !== '') params.set(key, filters[key]);
  return params;
}

export const countActive = (filters) =>
  LIST_KEYS.filter((k) => filters[k].length).length +
  VALUE_KEYS.filter((k) => filters[k] !== '').length;
