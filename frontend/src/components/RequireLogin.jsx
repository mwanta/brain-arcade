import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentPlayer } from '../context/CurrentPlayerContext.jsx';

// Renders children(playerId) for a logged-in player; otherwise sends them to /login
// and remembers where they were going.
export default function RequireLogin({ children }) {
  const { playerId } = useCurrentPlayer();
  const location = useLocation();
  if (playerId === null) return <Navigate to="/login" replace state={{ from: location }} />;
  return children(playerId);
}
