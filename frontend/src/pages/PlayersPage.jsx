import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPlayers } from '../api/playersApi.js';
import PlayerTable from '../components/PlayerTable.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function PlayersPage() {
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listPlayers().then(setPlayers).catch(setError);
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>Players</h1>
        <Link className="button" to="/players/new">
          + New player
        </Link>
      </div>
      <ErrorMessage error={error} />
      {players ? <PlayerTable players={players} /> : !error && <p>Loading…</p>}
    </section>
  );
}
