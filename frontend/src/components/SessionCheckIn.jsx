// The optional check-in for the session a game is about to open: one check_in row per
// session (see SCHEMA.md). `value` is the form's strings (EMPTY_CHECK_IN in checkIn.js);
// turn it into the API body with toCheckIn(). The answers feed the stats page's
// "Sleep, caffeine, stress and exercise" section.
export default function SessionCheckIn({ value, onChange, disabled }) {
  const change = (event) => onChange({ ...value, [event.target.name]: event.target.value });
  return (
    <details className="session-check-in">
      <summary>Check-in for this session (optional)</summary>
      <div className="filter-grid">
        <label className="field">
          <span className="field-label">Hours slept last night</span>
          <input
            type="number"
            name="hours_slept"
            min="0"
            max="24"
            step="0.5"
            value={value.hours_slept}
            onChange={change}
            disabled={disabled}
          />
        </label>
        <label className="field">
          <span className="field-label">Caffeine drinks today</span>
          <input
            type="number"
            name="caffeine_drinks"
            min="0"
            step="1"
            value={value.caffeine_drinks}
            onChange={change}
            disabled={disabled}
          />
        </label>
        <label className="field">
          <span className="field-label">Stress level</span>
          <select
            name="stress_level"
            value={value.stress_level}
            onChange={change}
            disabled={disabled}
          >
            <option value="">Choose</option>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {level}
                {level === 1 ? ' — Low' : level === 5 ? ' — High' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Exercised today?</span>
          <select
            name="exercised_today"
            value={value.exercised_today}
            onChange={change}
            disabled={disabled}
          >
            <option value="">Choose</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
      </div>
    </details>
  );
}
