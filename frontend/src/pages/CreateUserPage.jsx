import { useNavigate } from 'react-router-dom';
import { createUser } from '../api/usersApi.js';
import UserForm from '../components/UserForm.jsx';

export default function CreateUserPage() {
  const navigate = useNavigate();

  const handleCreate = async (values) => {
    const user = await createUser(values);
    navigate(`/users/${user.user_id}`);
  };

  return (
    <section>
      <h1>New user</h1>
      <UserForm submitLabel="Create user" onSubmit={handleCreate} />
    </section>
  );
}
