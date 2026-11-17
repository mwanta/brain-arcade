import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getPlayer, updatePlayer } from '../api/playersApi.js';
import PlayerForm from '../components/PlayerForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function EditPlayerPage() {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPlayer(playerId).then(setPlayer).catch(setError);
  }, [playerId]);

  const handleUpdate = async (values) => {
    await updatePlayer(playerId, values);
    navigate(`/players/${playerId}`);
  };

  return (
    <section>
      <h1>Edit {player?.username ?? 'player'}</h1>
      <ErrorMessage error={error} />
      {player && (
        <PlayerForm initialValues={player} submitLabel="Save changes" onSubmit={handleUpdate} />
      )}
      <p>
        <Link to={`/players/${playerId}`}>← Cancel</Link>
      </p>
    </section>
  );
}
