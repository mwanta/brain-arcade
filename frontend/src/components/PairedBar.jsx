import { pct } from './statsFormat.js';

// One horizontal 0-100% bar with its value and play count; `who` is "you" or "peers".
export default function PairedBar({ value, plays, who }) {
  return (
    <div className="pair-bar">
      <span className="hbar-track">
        <span className={`hbar-fill fill-${who}`} style={{ width: `${value ?? 0}%` }} />
      </span>
      <span className="hbar-value">{pct(value)}</span>
      <span className="hbar-meta">
        {plays} {plays === 1 ? 'play' : 'plays'}
      </span>
    </div>
  );
}
