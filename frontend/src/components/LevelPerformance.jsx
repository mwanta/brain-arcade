import { useState } from 'react';
import { getLevelPerformance } from '../api/statsApi.js';
import useStats from '../hooks/useStats.js';
import StatSection from './StatSection.jsx';
import GameTabs from './GameTabs.jsx';
import { byGame, num, pct, seconds } from './statsFormat.js';

export default function LevelPerformance({ playerId, filters }) {
  const [gameId, setGameId] = useState(null);
  const state = useStats(getLevelPerformance, playerId, filters);
  return (
    <StatSection
      title="Level by level"
      description="Pass rate and speed on each level you've attempted. Times only count passed attempts."
      state={state}
    >
      {(rows) => {
        const games = byGame(rows);
        const game = games.find((g) => g.gameId === gameId) ?? games[0];
        return (
          <>
            <GameTabs games={games} selectedId={game.gameId} onSelect={setGameId} />
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Rules</th>
                    <th>Attempts</th>
                    <th>Your pass rate</th>
                    <th>Cohort pass rate</th>
                    <th>Your time</th>
                    <th>Cohort time</th>
                    <th title="Share of the other players with a lower pass rate">Better than</th>
                  </tr>
                </thead>
                <tbody>
                  {game.rows.map((r) => (
                    <tr key={r.level_number}>
                      <td>{r.level_number}</td>
                      <td className="muted small">
                        {seconds(r.time_limit_ms)} limit · {num(r.max_errors)} errors allowed
                      </td>
                      <td>{r.attempts}</td>
                      <td>
                        <strong>{pct(r.pass_rate)}</strong>
                      </td>
                      <td>{pct(r.cohort_pass_rate)}</td>
                      <td>
                        <strong>{seconds(r.avg_pass_ms)}</strong>
                      </td>
                      <td>{seconds(r.cohort_avg_pass_ms)}</td>
                      <td>{r.cohort_players > 1 ? pct(r.pass_rate_percentile) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      }}
    </StatSection>
  );
}
