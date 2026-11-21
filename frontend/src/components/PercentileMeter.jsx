import { pct } from './statsFormat.js';

// A track filled to the player's percentile within their cohort.
export default function PercentileMeter({ percentile, cohortSize }) {
  if (cohortSize < 2) {
    return <p className="muted small">You're the only player in this cohort.</p>;
  }
  return (
    <div className="meter">
      <div
        className="meter-track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentile}
        aria-label="Percentile"
      >
        <div className="meter-fill" style={{ width: `${percentile}%` }} />
      </div>
      <span className="small">
        Better than <strong>{pct(percentile)}</strong> of others
      </span>
    </div>
  );
}
