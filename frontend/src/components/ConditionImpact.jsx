import { getConditionImpact } from '../api/statsApi.js';
import useStats from '../hooks/useStats.js';
import StatSection from './StatSection.jsx';
import PairedBar from './PairedBar.jsx';
import { BUCKET_LABELS, FACTOR_LABELS } from './statsFormat.js';

export default function ConditionImpact({ playerId, filters }) {
  const state = useStats(getConditionImpact, playerId, filters);
  return (
    <StatSection
      title="Sleep, caffeine, stress and exercise"
      description="Share of a game's levels passed, by what players reported in their check-in before the session."
      state={state}
    >
      {(rows) => {
        const factors = [...new Set(rows.map((r) => r.factor))];
        return (
          <>
            <p className="legend">
              <span className="swatch swatch-you" /> You
              <span className="swatch swatch-peers" /> Other players
            </p>
            <div className="card-grid">
              {factors.map((factor) => (
                <article key={factor} className="card">
                  <h3>{FACTOR_LABELS[factor] ?? factor}</h3>
                  {rows
                    .filter((r) => r.factor === factor)
                    .map((r) => (
                      <div key={r.bucket} className="bucket">
                        <span className="bucket-label">{BUCKET_LABELS[r.bucket] ?? r.bucket}</span>
                        <PairedBar
                          value={r.player_avg_completion}
                          plays={r.player_plays}
                          who="you"
                        />
                        <PairedBar value={r.peer_avg_completion} plays={r.peer_plays} who="peers" />
                      </div>
                    ))}
                </article>
              ))}
            </div>
          </>
        );
      }}
    </StatSection>
  );
}
