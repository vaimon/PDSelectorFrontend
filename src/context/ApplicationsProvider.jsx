import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { fetchStudentById } from '../api/apiStudentsController';
import { fetchTeamById } from '../api/apiTeamsController';
import { ApplicationsContext } from './applicationsContext';
import { useIdentity } from './identityContext';

// Enums travel as SENT/INVITE while the database keeps them lower case, so nothing here compares
// raw strings.
const equalsIgnoreCase = (value, expected) => String(value).toLowerCase() === expected;
const isPending = (application) => equalsIgnoreCase(application.status, 'sent');

const EMPTY = { invites: [], requests: [], myRequests: [] };

/**
 * Everything the student has to do with applications: invites addressed to them, requests to join
 * their team when they lead one, and the requests they sent themselves. There is no "my
 * applications" endpoint (GET /applications is admin-only), so all three come from the records that
 * carry them. The navbar counter and the applications page read the same state instead of asking
 * twice; only the first two wait for an answer, so only they are counted.
 */
const ApplicationsProvider = ({ children }) => {
  const { studentId, isParticipant } = useIdentity();
  const [state, setState] = useState({ ...EMPTY, loading: false });
  const location = useLocation();
  // Two navigations in quick succession leave two pairs of requests in flight, and the older
  // answer can land last; only the newest one is allowed to write.
  const latestLoad = useRef(0);

  const load = useCallback(async () => {
    const loadId = latestLoad.current + 1;
    latestLoad.current = loadId;

    if (!isParticipant || studentId == null) {
      setState({ ...EMPTY, loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));
    try {
      const student = await fetchStudentById(studentId);
      const myApplications = student.applications ?? [];
      const invites = myApplications.filter(
        (application) => isPending(application) && equalsIgnoreCase(application.type, 'invite'),
      );
      // Sent by the student, in any state: they are the answer to "what did I apply to".
      const myRequests = myApplications.filter(
        (application) => equalsIgnoreCase(application.type, 'request'),
      );

      // Only a team lead decides on requests, and only on the ones sent to their own team.
      const teamId = student.is_captain ? student.current_team?.id : null;
      const team = teamId ? await fetchTeamById(teamId) : null;
      const requests = (team?.applications ?? []).filter(
        (application) => isPending(application) && equalsIgnoreCase(application.type, 'request'),
      );

      if (loadId === latestLoad.current) {
        setState({ invites, requests, myRequests, loading: false });
      }
    } catch (error) {
      console.error('Не удалось загрузить заявки:', error);
      if (loadId === latestLoad.current) {
        setState({ ...EMPTY, loading: false });
      }
    }
  }, [isParticipant, studentId]);

  // This is the only notification channel there is, so it refreshes whenever the user moves around
  // the app or comes back to the tab.
  useEffect(() => {
    load();
  }, [load, location.pathname]);

  useEffect(() => {
    window.addEventListener('focus', load);
    return () => window.removeEventListener('focus', load);
  }, [load]);

  const value = useMemo(
    () => ({
      ...state,
      total: state.invites.length + state.requests.length,
      refresh: load,
    }),
    [state, load],
  );

  return <ApplicationsContext.Provider value={value}>{children}</ApplicationsContext.Provider>;
};

export default ApplicationsProvider;
