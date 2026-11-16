import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getUser, updateUser } from '../api/usersApi.js';
import UserForm from '../components/UserForm.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function EditUserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUser(userId).then(setUser).catch(setError);
  }, [userId]);

  const handleUpdate = async (values) => {
    await updateUser(userId, values);
    navigate(`/users/${userId}`);
  };

  return (
    <section>
      <h1>Edit {user?.username ?? 'user'}</h1>
      <ErrorMessage error={error} />
      {user && <UserForm initialValues={user} submitLabel="Save changes" onSubmit={handleUpdate} />}
      <p><Link to={`/users/${userId}`}>← Cancel</Link></p>
    </section>
  );
}
