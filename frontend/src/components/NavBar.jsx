import { NavLink, useNavigate } from 'react-router-dom';
import { useCurrentPlayer } from '../context/CurrentPlayerContext.jsx';

export default function NavBar() {
  const { player, logout } = useCurrentPlayer();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <span className="brand">Brain Arcade</span>
      {player && (
        <nav aria-label="Main navigation">
          <NavLink to="/drift">Drift</NavLink>
          <NavLink to="/games/quick-match">Quick Match</NavLink>
          <NavLink to="/stats">Stats</NavLink>
        </nav>
      )}
      {player && (
        <div className="navbar-user">
          <span className="navbar-username" title="Logged in">
            {player.username}
          </span>
          <button type="button" className="navbar-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      )}
    </header>
  );
}
