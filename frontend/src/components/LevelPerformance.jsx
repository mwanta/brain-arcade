import { useState } from 'react';
import { getLevelPerformance } from '../api/statsApi.js';
import useStats from '../hooks/useStats.js';
import StatSection from './StatSection.jsx';
import GameTabs from './GameTabs.jsx';
import { byGame, num, pct, seconds, settingLabel } from './statsFormat.js';

// The player's value in bold, then the cohort's.
function VersusCell({ mine, cohort }) {
  return (
    <td className="nowrap">
      <strong>{mine}</strong> <span className="muted small">vs {cohort}</span>
    </td>
  );
}

export default function LevelPerformance({ playerId, filters }) {
  const [gameId, setGameId] = useState(null);
  const state = useStats(getLevelPerformance, playerId, filters);
  return (
    <StatSection
      title="Level by level"
      description="Pass rate, errors and speed on each level you've attempted, with the level's settings. Times only count passed attempts."
      state={state}
    >
      {(rows) => {
        const games = byGame(rows);
        const game = games.find((g) => g.gameId === gameId) ?? games[0];
        // Split level time per trial when the game's levels store a trial_count.
        const byTrial = game.rows.every((r) => r.trial_count);
        const time = (r, ms) => seconds(byTrial && ms != null ? ms / r.trial_count : ms);
        return (
          <>
            <GameTabs games={games} selectedId={game.gameId} onSelect={setGameId} />
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Settings</th>
                    <th>Attempts</th>
                    <th>
                      Pass rate <span className="th-note">you vs cohort</span>
                    </th>
                    <th>
                      Errors <span className="th-note">per attempt</span>
                    </th>
                    <th>
                      {byTrial ? 'Time per trial' : 'Level time'}{' '}
                      <span className="th-note">passed attempts</span>
                    </th>
                    <th title="Share of the other players with a lower pass rate">Better than</th>
                  </tr>
                </thead>
                <tbody>
                  {game.rows.map((r) => (
                    <tr key={r.level_number}>
                      <td>{r.level_number}</td>
                      <td>
                        <ul className="setting-list">
                          {r.settings.map((st) => (
                            <li key={st.name} className="setting">
                              {settingLabel(st)}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>{r.attempts}</td>
                      <VersusCell mine={pct(r.pass_rate)} cohort={pct(r.cohort_pass_rate)} />
                      <VersusCell
                        mine={num(r.avg_errors, 1)}
                        cohort={num(r.cohort_avg_errors, 1)}
                      />
                      <VersusCell
                        mine={time(r, r.avg_pass_ms)}
                        cohort={time(r, r.cohort_avg_pass_ms)}
                      />
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
