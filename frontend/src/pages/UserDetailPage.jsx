import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getUser } from '../api/usersApi.js';
import UserDetails from '../components/UserDetails.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function UserDetailPage() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUser(userId).then(setUser).catch(setError);
  }, [userId]);

  return (
    <section>
      <div className="page-header">
        <h1>{user ? user.username : 'User'}</h1>
        {user && <Link className="button" to={`/users/${userId}/edit`}>Edit</Link>}
      </div>
      <ErrorMessage error={error} />
      {user ? <UserDetails user={user} /> : !error && <p>Loading…</p>}
      <p><Link to="/users">← Back to users</Link></p>
    </section>
  );
}
