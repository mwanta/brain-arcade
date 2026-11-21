import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { loginPlayer } from '../api/playersApi.js';

// The logged-in player, held in memory only: a page refresh logs the player out.
// There is no auth; logging in just means entering an existing username.
const CurrentPlayerContext = createContext(null);

export function CurrentPlayerProvider({ children }) {
  const [player, setPlayer] = useState(null);

  const login = useCallback(async (username) => {
    const found = await loginPlayer(username);
    setPlayer(found);
    return found;
  }, []);
  const logout = useCallback(() => setPlayer(null), []);

  const value = useMemo(
    () => ({ player, playerId: player?.player_id ?? null, login, logout, setPlayer }),
    [player, login, logout]
  );
  return <CurrentPlayerContext.Provider value={value}>{children}</CurrentPlayerContext.Provider>;
}

// { player, playerId, login(username), logout(), setPlayer(player) }
export function useCurrentPlayer() {
  const value = useContext(CurrentPlayerContext);
  if (!value) throw new Error('useCurrentPlayer must be used inside <CurrentPlayerProvider>');
  return value;
}
