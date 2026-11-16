import { genderLabel } from './genders.js';

export default function UserDetails({ user }) {
  return (
    <dl className="details">
      <dt>User ID</dt><dd>{user.user_id}</dd>
      <dt>Username</dt><dd>{user.username}</dd>
      <dt>Birthday</dt><dd>{user.birthday}</dd>
      <dt>Gender</dt><dd>{genderLabel(user.gender)}</dd>
      <dt>Created at</dt><dd>{new Date(user.created_at).toLocaleString()}</dd>
      <dt>Updated at</dt><dd>{new Date(user.updated_at).toLocaleString()}</dd>
    </dl>
  );
}
