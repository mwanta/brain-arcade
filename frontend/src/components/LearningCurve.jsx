import { useState } from 'react';
import { getLearningCurve } from '../api/statsApi.js';
import useStats from '../hooks/useStats.js';
import StatSection from './StatSection.jsx';
import GameTabs from './GameTabs.jsx';
import LineChart from './LineChart.jsx';
import { byGame, num } from './statsFormat.js';

export default function LearningCurve({ playerId, filters }) {
  const [gameId, setGameId] = useState(null);
  const state = useStats(getLearningCurve, playerId, filters);
  return (
    <StatSection
      title="Learning curve"
      description="Your score on each play of a game, next to other players' average on their play with the same number."
      state={state}
    >
      {(rows) => {
        const games = byGame(rows);
        const game = games.find((g) => g.gameId === gameId) ?? games[0];
        const byPlay = Object.fromEntries(game.rows.map((r) => [r.play_number, r]));
        return (
          <>
            <GameTabs games={games} selectedId={game.gameId} onSelect={setGameId} />
            <p className="legend">
              <span className="line-key line-key-you" /> You
              <span className="line-key line-key-peers" /> Other players (average)
            </p>
            <LineChart
              ariaLabel={`${game.gameName}: your score by play number compared with other players`}
              xLabel="Play number"
              yLabel="Score"
              xValues={game.rows.map((r) => r.play_number)}
              series={[
                {
                  name: 'You',
                  className: 'series-you',
                  points: game.rows.map((r) => ({ x: r.play_number, y: r.player_score })),
                },
                {
                  name: 'Others',
                  className: 'series-peers',
                  points: game.rows.map((r) => ({ x: r.play_number, y: r.peer_avg_score })),
                },
              ]}
              renderTooltip={(play) => {
                const r = byPlay[play];
                return (
                  <>
                    <div className="tooltip-title">Play {play}</div>
                    <div>
                      <span className="line-key line-key-you" />{' '}
                      <strong>{num(r.player_score)}</strong> you
                    </div>
                    <div>
                      <span className="line-key line-key-peers" />{' '}
                      <strong>{num(r.peer_avg_score)}</strong> others ({r.peer_players})
                    </div>
                  </>
                );
              }}
            />
            <details className="table-toggle">
              <summary>Show table</summary>
              <table className="table compact">
                <thead>
                  <tr>
                    <th>Play</th>
                    <th>Your score</th>
                    <th>Others' average</th>
                    <th>Other players</th>
                  </tr>
                </thead>
                <tbody>
                  {game.rows.map((r) => (
                    <tr key={r.play_number}>
                      <td>{r.play_number}</td>
                      <td>{num(r.player_score)}</td>
                      <td>{num(r.peer_avg_score)}</td>
                      <td>{r.peer_players}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </>
        );
      }}
    </StatSection>
  );
}
