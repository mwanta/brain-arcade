// A dropdown of checkboxes. `value` is an array of selected option values.
export default function MultiSelect({ label, options, value, onChange, emptyLabel = 'Any' }) {
  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const summary =
    value.length === 0
      ? emptyLabel
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label
        : `${value.length} selected`;

  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <details className="multiselect">
        <summary>{summary}</summary>
        <div className="multiselect-menu">
          {options.map((o) => (
            <label key={o.value}>
              <input
                type="checkbox"
                checked={value.includes(o.value)}
                onChange={() => toggle(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
