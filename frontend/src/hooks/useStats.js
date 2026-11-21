import { useEffect, useState } from 'react';

// Calls a stats API function (playerId, filters) and re-runs it when the filters change.
// Returns { data, error, loading }; the previous data stays visible while reloading.
export default function useStats(fetcher, playerId, filters) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetcher(playerId, JSON.parse(filtersKey)).then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (error) => !cancelled && setState({ data: null, error, loading: false })
    );
    return () => {
      cancelled = true;
    };
  }, [fetcher, playerId, filtersKey]);

  return state;
}
