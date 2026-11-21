import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlayer } from '../api/playersApi.js';
import PlayerDetails from '../components/PlayerDetails.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function PlayerDetailPage() {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayer(playerId).then(setPlayer).catch(setError);
  }, [playerId]);

  return (
    <section>
      <div className="page-header">
        <h1>{player ? player.username : 'Player'}</h1>
        {player && (
          <div className="button-row">
            <Link className="button" to={`/players/${playerId}/stats`}>
              Stats
            </Link>
            <Link className="button secondary" to={`/players/${playerId}/edit`}>
              Edit
            </Link>
          </div>
        )}
      </div>
      <ErrorMessage error={error} />
      {player ? <PlayerDetails player={player} /> : !error && <p>Loading…</p>}
      <p>
        <Link to="/players">← Back to players</Link>
      </p>
    </section>
  );
}
