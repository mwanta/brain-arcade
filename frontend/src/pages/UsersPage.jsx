import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listUsers } from '../api/usersApi.js';
import UserTable from '../components/UserTable.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function UsersPage() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listUsers().then(setUsers).catch(setError);
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1>Users</h1>
        <Link className="button" to="/users/new">+ New user</Link>
      </div>
      <ErrorMessage error={error} />
      {users ? <UserTable users={users} /> : !error && <p>Loading…</p>}
    </section>
  );
}
