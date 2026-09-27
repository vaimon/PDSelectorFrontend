import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchAdminOverview } from '../api/apiAdmin';

/**
 * The overview, with «there is no selection» kept apart from «something went wrong».
 *
 * Between two selections the endpoint answers 404, and every number the screen shows is about a
 * selection — so that case is an empty state, not an error.
 *
 * `refreshKey` reloads it when it changes: the admin shell passes the path, so the counts it shows
 * catch up after work in another section (#68). A reload keeps the last answer on screen until the
 * new one arrives, instead of flashing «загружаем» on every section switch. `reload` does the same
 * on demand, for a change made without leaving the page (a new selection started in Settings, #73).
 */
export const useAdminOverview = (refreshKey) => {
  const [state, setState] = useState({ overview: null, loading: true, error: null, missing: false });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const overview = await fetchAdminOverview();
        if (!cancelled) {
          setState({ overview, loading: false, error: null, missing: false });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }
        if (error.response?.status === 404) {
          setState({ overview: null, loading: false, error: null, missing: true });
          return;
        }
        console.error('Не удалось загрузить состояние набора:', error);
        setState({ overview: null, loading: false, error, missing: false });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, nonce]);

  return useMemo(() => ({ ...state, reload }), [state, reload]);
};

export default useAdminOverview;
