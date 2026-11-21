import { useEffect, useState } from 'react';
import MultiSelect from './MultiSelect.jsx';
import { GENDER_OPTIONS } from './genders.js';
import { OCCUPATION_OPTIONS } from './occupations.js';
import { EDUCATION_LEVEL_OPTIONS } from './educationLevels.js';
import { EMPTY_FILTERS, MATCH_OPTIONS, countActive } from './cohortFilters.js';

// Filters other than "match" sit in the "More filters" panel.
const PANEL_KEYS = [
  'occupation',
  'gender',
  'education_min',
  'education_max',
  'age_min',
  'age_max',
  'game_id',
  'from',
  'to',
  'min_plays',
];

// Edits a draft of the filters; nothing reloads until "Apply" is pressed.
export default function CohortFilters({ value, games, onApply }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const set = (key) => (v) => setDraft((d) => ({ ...d, [key]: v }));
  const onInput = (key) => (e) => set(key)(e.target.value);
  const toggleMatch = (attr) =>
    set('match')(
      draft.match.includes(attr) ? draft.match.filter((m) => m !== attr) : [...draft.match, attr]
    );

  const active = countActive(value);
  const panelActive = PANEL_KEYS.filter((k) =>
    Array.isArray(value[k]) ? value[k].length : value[k] !== ''
  ).length;
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);

  return (
    <form
      className="filters"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
    >
      <div className="filters-top">
        <div>
          <h2 className="filters-title">Your cohort</h2>
          <p className="muted small">
            The players you're compared with.{' '}
            {active === 0
              ? 'Right now that is everyone.'
              : `${active} ${active === 1 ? 'filter' : 'filters'} applied.`}{' '}
            You're always included.
          </p>
        </div>
        <div className="filter-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => onApply(EMPTY_FILTERS)}
            disabled={active === 0}
          >
            Clear all
          </button>
          <button type="submit" disabled={!dirty}>
            Apply filters
          </button>
        </div>
      </div>

      <div className="match-row">
        <span className="field-label">Players who share my</span>
        <div className="pill-row">
          {MATCH_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              className={draft.match.includes(o.value) ? 'pill on' : 'pill'}
              aria-pressed={draft.match.includes(o.value)}
              onClick={() => toggleMatch(o.value)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <details className="more-filters" open={panelActive > 0}>
        <summary>
          More filters
          {panelActive > 0 && <span className="count-badge">{panelActive}</span>}
        </summary>
        <div className="filter-grid">
          <MultiSelect
            label="Occupation"
            options={OCCUPATION_OPTIONS}
            value={draft.occupation}
            onChange={set('occupation')}
          />
          <MultiSelect
            label="Gender"
            options={GENDER_OPTIONS}
            value={draft.gender}
            onChange={set('gender')}
          />
          <label className="field">
            <span className="field-label">Education from</span>
            <select value={draft.education_min} onChange={onInput('education_min')}>
              <option value="">Any</option>
              {EDUCATION_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Education up to</span>
            <select value={draft.education_max} onChange={onInput('education_max')}>
              <option value="">Any</option>
              {EDUCATION_LEVEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Age from</span>
            <input
              type="number"
              min={0}
              max={150}
              value={draft.age_min}
              onChange={onInput('age_min')}
              placeholder="Any"
            />
          </label>
          <label className="field">
            <span className="field-label">Age up to</span>
            <input
              type="number"
              min={0}
              max={150}
              value={draft.age_max}
              onChange={onInput('age_max')}
              placeholder="Any"
            />
          </label>
          <label className="field">
            <span className="field-label">Game</span>
            <select value={draft.game_id} onChange={onInput('game_id')}>
              <option value="">All games</option>
              {games.map((g) => (
                <option key={g.game_id} value={g.game_id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="field-label">Played from</span>
            <input type="date" value={draft.from} onChange={onInput('from')} />
          </label>
          <label className="field">
            <span className="field-label">Played until</span>
            <input type="date" value={draft.to} onChange={onInput('to')} />
          </label>
          <label className="field">
            <span
              className="field-label"
              title="Players with fewer plays of a game are left out for that game"
            >
              Min. plays per game
            </span>
            <input
              type="number"
              min={1}
              value={draft.min_plays}
              onChange={onInput('min_plays')}
              placeholder="1"
            />
          </label>
        </div>
      </details>
    </form>
  );
}
