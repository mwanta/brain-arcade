import { useNavigate } from 'react-router-dom';
import { createPlayer } from '../api/playersApi.js';
import PlayerForm from '../components/PlayerForm.jsx';

export default function CreatePlayerPage() {
  const navigate = useNavigate();

  const handleCreate = async (values) => {
    const player = await createPlayer(values);
    navigate(`/players/${player.player_id}`);
  };

  return (
    <section>
      <h1>New player</h1>
      <PlayerForm submitLabel="Create player" onSubmit={handleCreate} />
    </section>
  );
}
