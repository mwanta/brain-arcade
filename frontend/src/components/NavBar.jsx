import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <header className="navbar">
      <span className="brand">Brain Arcade</span>
      <nav>
        <NavLink to="/players" end>
          Players
        </NavLink>
        <NavLink to="/players/new">New player</NavLink>
      </nav>
    </header>
  );
}
