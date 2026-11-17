import { Link } from 'react-router-dom';
import { genderLabel } from './genders.js';

export default function PlayerTable({ players }) {
  if (players.length === 0) return <p>No players yet.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Username</th>
          <th>Birthday</th>
          <th>Gender</th>
          <th>Created</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {players.map((u) => (
          <tr key={u.player_id}>
            <td>{u.player_id}</td>
            <td>
              <Link to={`/players/${u.player_id}`}>{u.username}</Link>
            </td>
            <td>{u.birthday}</td>
            <td>{genderLabel(u.gender)}</td>
            <td>{new Date(u.created_at).toLocaleString()}</td>
            <td>
              <Link to={`/players/${u.player_id}/edit`}>Edit</Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
