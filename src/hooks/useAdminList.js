import { useCallback, useEffect, useState } from 'react';

const EMPTY = { items: [], page: 0, totalPages: 0, totalElements: 0 };

/**
 * One page of an admin list (#48), and a way to reload it after a change.
 *
 * Not the catalogue's `useStudents`/`useTeams`: those stop while the selection's window is shut and
 * cannot reload — and an organiser fixes things precisely when the window is shut, and needs the
 * list to show what they have just changed.
 *
 * `params` is compared by value: a fresh object literal every render is the normal way to call
 * this, and it must not refetch unless something in it actually changed.
 */
export const useAdminList = (fetchPage, params) => {
  const [state, setState] = useState({ ...EMPTY, loading: true, error: null });
  const [reloads, setReloads] = useState(0);
  const key = JSON.stringify(params);

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchPage({ ...JSON.parse(key), signal: controller.signal })
      .then(({ items, page, totalPages, totalElements }) => {
        // A response already on its way when the params changed must not overwrite the newer one.
        if (controller.signal.aborted) {
          return;
        }
        setState({ items, page, totalPages, totalElements, loading: false, error: null });
      })
      .catch((error) => {
        // A request this effect cancelled is not a failure, whatever the client names it: `fetch`
        // throws AbortError, axios CanceledError.
        if (controller.signal.aborted) {
          return;
        }
        console.error('Не удалось загрузить список:', error);
        setState({ ...EMPTY, loading: false, error });
      });

    return () => controller.abort();
  }, [fetchPage, key, reloads]);

  const refresh = useCallback(() => setReloads((count) => count + 1), []);

  return { ...state, refresh };
};

export default useAdminList;
