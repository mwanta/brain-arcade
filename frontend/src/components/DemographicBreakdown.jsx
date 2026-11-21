import { useMemo, useState } from 'react';
import { getDemographicBreakdown } from '../api/statsApi.js';
import useStats from '../hooks/useStats.js';
import StatSection from './StatSection.jsx';
import GameTabs from './GameTabs.jsx';
import { GROUP_BY_OPTIONS, byGame, groupLabel, num } from './statsFormat.js';

export default function DemographicBreakdown({ playerId, filters }) {
  const [groupBy, setGroupBy] = useState('occupation');
  const [gameId, setGameId] = useState(null);
  const query = useMemo(() => ({ ...filters, group_by: groupBy }), [filters, groupBy]);
  const state = useStats(getDemographicBreakdown, playerId, query);

  const controls = (
    <label className="inline-field">
      Group by
      <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
        {GROUP_BY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <StatSection
      title="Breakdown by group"
      description="Average score of each group in your cohort, highest first."
      state={state}
      controls={controls}
    >
      {(rows) => {
        const games = byGame(rows);
        const game = games.find((g) => g.gameId === gameId) ?? games[0];
        const max = Math.max(...game.rows.map((r) => Number(r.group_avg_score)), 0.01);
        return (
          <>
            <GameTabs games={games} selectedId={game.gameId} onSelect={setGameId} />
            <ul className="hbar-list">
              {game.rows.map((r) => (
                <li key={r.group} className={r.is_player_group ? 'hbar-row is-you' : 'hbar-row'}>
                  <span className="hbar-label">
                    {groupLabel(groupBy, r.group)}
                    {r.is_player_group && <span className="you-tag">your group</span>}
                  </span>
                  <span className="hbar-track">
                    <span
                      className="hbar-fill"
                      style={{ width: `${(r.group_avg_score / max) * 100}%` }}
                    />
                  </span>
                  <span className="hbar-value">{num(r.group_avg_score)}</span>
                  <span className="hbar-meta">
                    #{r.group_rank} · {r.group_size} {r.group_size === 1 ? 'player' : 'players'}
                  </span>
                </li>
              ))}
            </ul>
          </>
        );
      }}
    </StatSection>
  );
}
