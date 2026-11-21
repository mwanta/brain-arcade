import { genderLabel } from './genders.js';
import { occupationLabel } from './occupations.js';
import { educationLevelLabel } from './educationLevels.js';

export default function PlayerDetails({ player }) {
  return (
    <dl className="details">
      <dt>Player ID</dt>
      <dd>{player.player_id}</dd>
      <dt>Username</dt>
      <dd>{player.username}</dd>
      <dt>Birthday</dt>
      <dd>{player.birthday}</dd>
      <dt>Gender</dt>
      <dd>{genderLabel(player.gender)}</dd>
      <dt>Occupation</dt>
      <dd>{occupationLabel(player.occupation)}</dd>
      <dt>Education level</dt>
      <dd>{educationLevelLabel(player.education_level)}</dd>
      <dt>Created at</dt>
      <dd>{new Date(player.created_at).toLocaleString()}</dd>
      <dt>Updated at</dt>
      <dd>{new Date(player.updated_at).toLocaleString()}</dd>
    </dl>
  );
}
