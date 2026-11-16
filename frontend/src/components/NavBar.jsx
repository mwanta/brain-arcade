import { NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <header className="navbar">
      <span className="brand">Brain Arcade</span>
      <nav>
        <NavLink to="/users" end>Users</NavLink>
        <NavLink to="/users/new">New user</NavLink>
      </nav>
    </header>
  );
}
