import ErrorMessage from './ErrorMessage.jsx';

// One stats panel: title, optional controls, and loading / error / empty states.
// `children` is a function that renders the loaded rows.
export default function StatSection({ title, description, state, controls, children }) {
  const { data, error, loading } = state;
  let body = null;
  if (data && data.length > 0) body = children(data);
  else if (data) body = <p className="muted">No finished plays match these filters.</p>;
  else if (loading) body = <p className="muted">Loading…</p>;

  return (
    <section className="stat-section" aria-busy={loading}>
      <div className="stat-section-header">
        <div>
          <h2>{title}</h2>
          {description && <p className="muted">{description}</p>}
        </div>
        {controls}
      </div>
      <ErrorMessage error={error} />
      {body}
    </section>
  );
}
