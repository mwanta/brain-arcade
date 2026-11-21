import { getCohortDistribution } from '../api/statsApi.js';
import useStats from '../hooks/useStats.js';
import StatSection from './StatSection.jsx';
import BarChart from './BarChart.jsx';
import { byGame, pct } from './statsFormat.js';

const range = (r) => `${pct(r.percentile_low)} to ${pct(r.percentile_high)}`;
const players = (n) => `${n} ${n === 1 ? 'player' : 'players'}`;

export default function ScoreDistribution({ playerId, filters }) {
  const state = useStats(getCohortDistribution, playerId, filters);
  return (
    <StatSection
      title="Where your best score lands"
      description="How many players in your cohort reached each best score."
      state={state}
    >
      {(rows) => (
        <>
          <p className="legend">
            <span className="swatch swatch-you" /> Your best score
            <span className="swatch swatch-neutral" /> Other scores
          </p>
          <div className="card-grid">
            {byGame(rows).map((game) => {
              const mine = game.rows.find((r) => r.is_player_best);
              return (
                <article key={game.gameId} className="card">
                  <h3>{game.gameName}</h3>
                  <BarChart
                    ariaLabel={`${game.gameName}: players by best score`}
                    xLabel="Best score (highest level passed)"
                    yLabel="Players"
                    bars={game.rows.map((r) => ({
                      key: r.score,
                      label: String(r.score),
                      value: r.members,
                      highlight: r.is_player_best,
                      row: r,
                    }))}
                    renderTooltip={(b) => (
                      <>
                        <strong>{players(b.row.members)}</strong> with best score {b.row.score}
                        <br />
                        <span className="muted">Percentile range {range(b.row)}</span>
                      </>
                    )}
                  />
                  {mine && (
                    <p className="small">
                      Your best score, <strong>{mine.score}</strong>, puts you in the{' '}
                      <strong>{range(mine)}</strong> range.
                    </p>
                  )}
                  <details className="table-toggle">
                    <summary>Show table</summary>
                    <table className="table compact">
                      <thead>
                        <tr>
                          <th>Best score</th>
                          <th>Players</th>
                          <th>Percentile range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.rows.map((r) => (
                          <tr key={r.score} className={r.is_player_best ? 'is-you' : undefined}>
                            <td>{r.score}</td>
                            <td>{r.members}</td>
                            <td>{range(r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                </article>
              );
            })}
          </div>
        </>
      )}
    </StatSection>
  );
}
