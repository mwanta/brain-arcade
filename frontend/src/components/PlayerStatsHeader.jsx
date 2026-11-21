import { Link } from 'react-router-dom';
import { genderLabel } from './genders.js';
import { occupationLabel } from './occupations.js';
import { educationLevelLabel } from './educationLevels.js';

function ageOf(birthday) {
  const born = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const beforeBirthday =
    today.getMonth() < born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() < born.getDate());
  return beforeBirthday ? age - 1 : age;
}

// Banner at the top of the stats page: who the stats are for.
export default function PlayerStatsHeader({ player, playerId }) {
  const details = player
    ? [
        `Age ${ageOf(player.birthday)}`,
        player.gender && genderLabel(player.gender),
        player.occupation && occupationLabel(player.occupation),
        player.education_level && educationLevelLabel(player.education_level),
      ].filter(Boolean)
    : [];

  return (
    <header className="stats-hero">
      <div className="stats-hero-main">
        <div className="avatar" aria-hidden="true">
          {player ? player.username.slice(0, 2).toUpperCase() : ''}
        </div>
        <div>
          <p className="eyebrow">Player stats</p>
          <h1>{player ? player.username : 'Loading…'}</h1>
          <ul className="chip-list">
            {details.map((d) => (
              <li key={d} className="chip">
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Link className="hero-link" to={`/players/${playerId}`}>
        ← Back to player
      </Link>
    </header>
  );
}
