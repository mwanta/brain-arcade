import { genderLabel } from './genders.js';
import { occupationLabel } from './occupations.js';
import { educationLevelLabel } from './educationLevels.js';

const missing = (v) => v === null || v === undefined;

export const num = (v, digits = 2) =>
  missing(v) ? '—' : Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
export const pct = (v) => (missing(v) ? '—' : `${num(v, 1)}%`);
export const seconds = (ms) => (missing(ms) ? '—' : `${(ms / 1000).toFixed(2)} s`);

// One level setting ({name, value, unit} from setting_type) in words, e.g.
// "time limit 2.00 s", "switch probability 20%", "max errors 1". The unit is left
// off when the name already says it (max_errors in 'errors').
export function settingLabel({ name, value, unit }) {
  const label = name.replaceAll('_', ' ');
  if (unit === 'ms') return `${label} ${seconds(value)}`;
  if (unit === 'ratio') return `${label} ${pct(value * 100)}`;
  const named = !unit || label.includes(unit.replace(/s$/, ''));
  return `${label} ${num(value)}${named ? '' : ` ${unit}`}`;
}

// Splits stats rows into one entry per game, keeping the API's order.
export function byGame(rows) {
  const games = new Map();
  for (const row of rows) {
    if (!games.has(row.game_id)) {
      games.set(row.game_id, { gameId: row.game_id, gameName: row.game_name, rows: [] });
    }
    games.get(row.game_id).rows.push(row);
  }
  return [...games.values()];
}

export const GROUP_BY_OPTIONS = [
  { value: 'occupation', label: 'Occupation' },
  { value: 'education_level', label: 'Education level' },
  { value: 'age_group', label: 'Age group' },
  { value: 'gender', label: 'Gender' },
];

export function groupLabel(groupBy, value) {
  if (value === 'unspecified') return 'Not specified';
  if (groupBy === 'occupation') return occupationLabel(value);
  if (groupBy === 'education_level') return educationLevelLabel(value);
  if (groupBy === 'gender') return genderLabel(value);
  return value; // age groups are already labels, e.g. "30-39"
}

export const FACTOR_LABELS = {
  sleep: 'Sleep the night before',
  caffeine: 'Caffeine today',
  stress: 'Stress level',
  exercise: 'Exercise today',
};

export const BUCKET_LABELS = {
  under_6h: 'Under 6 h',
  '6_to_8h': '6–8 h',
  '8h_plus': '8 h or more',
  none: 'None',
  '1_to_2': '1–2 drinks',
  '3_plus': '3 or more',
  low: 'Low (1–2)',
  medium: 'Medium (3)',
  high: 'High (4–5)',
  exercised: 'Exercised',
  did_not_exercise: 'Did not exercise',
};
