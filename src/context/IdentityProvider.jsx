import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchCurrentUser, getCurrentStudentId } from '../api/apiStudentsController';
import { fetchActiveTrack } from '../api/apiTracks';
import { IdentityContext } from './identityContext';

const EMPTY = { user: null, studentId: null, activeTrack: null };

/**
 * The single answer to "who is using the app right now".
 *
 * The user id and the student id are different numbers: `users` holds everyone who ever signed in,
 * `students` only those who filled the participant questionnaire. Anything addressing a student —
 * a profile, a captain check, a team or an application — takes studentId, never user.id.
 */
const IdentityProvider = ({ children }) => {
  const [state, setState] = useState({ ...EMPTY, loading: true, error: null });

  const load = useCallback(async () => {
    // A reload after an action (joining a team, filling the questionnaire) keeps what is known
    // on screen: flipping `loading` here would blank the navigation for the duration of the
    // requests. Only the very first load has nothing to show.
    setState((prev) => ({ ...prev, loading: prev.user == null, error: null }));
    try {
      const [user, studentId, activeTrack] = await Promise.all([
        fetchCurrentUser(),
        getCurrentStudentId(),
        // Between two selections there is no active track and the backend answers 404. Who you are
        // does not depend on that — only whether you are taking part does.
        fetchActiveTrack().catch((error) => {
          if (error.response?.status === 404) {
            return null;
          }
          throw error;
        }),
      ]);
      setState({ user, studentId, activeTrack, loading: false, error: null });
    } catch (error) {
      // 401 means signed out, which the global interceptor already turns into a redirect to /login.
      if (error.response?.status !== 401) {
        console.error('Не удалось определить текущего пользователя:', error);
      }
      setState({ ...EMPTY, loading: false, error });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => {
    const { user, studentId, activeTrack } = state;

    return {
      ...state,
      role: user?.role ?? null,
      isAdmin: user?.role === 'ADMIN',
      // The backend refuses every student mutation outside the window (SelectionWindowService),
      // so the UI reads its state instead of deriving the rule from the dates a second time.
      isSelectionOpen: activeTrack?.windowState === 'OPEN',
      // A student row survives from one selection to the next, so having one is not the same as
      // taking part in the current one — the questionnaire has to point at the active track.
      isParticipant:
        studentId != null
        && activeTrack != null
        && user?.student?.current_track_id === activeTrack.id,
      refresh: load,
    };
  }, [state, load]);

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
};

export default IdentityProvider;
