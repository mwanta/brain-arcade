import { getCohortComparison } from '../api/statsApi.js';
import useStats from '../hooks/useStats.js';
import StatSection from './StatSection.jsx';
import PercentileMeter from './PercentileMeter.jsx';
import { num } from './statsFormat.js';

function gap(player, cohort) {
  const diff = Number(player) - Number(cohort);
  if (Math.abs(diff) < 0.005) return 'Right at average';
  return `${diff > 0 ? '▲' : '▼'} ${num(Math.abs(diff))} ${diff > 0 ? 'above' : 'below'} average`;
}

export default function CohortComparison({ playerId, filters }) {
  const state = useStats(getCohortComparison, playerId, filters);
  return (
    <StatSection
      title="How you compare"
      description="Your average score on each game against everyone in your cohort."
      state={state}
    >
      {(rows) => (
        <div className="card-grid compact-cards">
          {rows.map((r) => (
            <article key={r.game_id} className="card">
              <h3>{r.game_name}</h3>
              <div className="stat-pair">
                <div>
                  <span className="stat-value">{num(r.player_avg_score)}</span>
                  <span className="stat-label">
                    you · {r.plays} {r.plays === 1 ? 'play' : 'plays'}
                  </span>
                </div>
                <div>
                  <span className="stat-value secondary">{num(r.cohort_avg_score)}</span>
                  <span className="stat-label">cohort</span>
                </div>
              </div>
              <p className="delta">{gap(r.player_avg_score, r.cohort_avg_score)}</p>
              <PercentileMeter percentile={r.percentile} cohortSize={r.cohort_size} />
              <p className="muted small">
                Rank {r.cohort_rank} of {r.cohort_size} · your best score {r.player_best_score}
              </p>
            </article>
          ))}
        </div>
      )}
    </StatSection>
  );
}
