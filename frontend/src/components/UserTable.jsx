import { Link } from 'react-router-dom';
import { genderLabel } from './genders.js';

export default function UserTable({ users }) {
  if (users.length === 0) return <p>No users yet.</p>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th><th>Username</th><th>Birthday</th><th>Gender</th><th>Created</th><th />
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.user_id}>
            <td>{u.user_id}</td>
            <td><Link to={`/users/${u.user_id}`}>{u.username}</Link></td>
            <td>{u.birthday}</td>
            <td>{genderLabel(u.gender)}</td>
            <td>{new Date(u.created_at).toLocaleString()}</td>
            <td><Link to={`/users/${u.user_id}/edit`}>Edit</Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
