import apiClient from './apiClient';

/**
 * The composition board of the current selection (vaimon/team-selection#14).
 *
 * Every change answers with the whole board, carrying fresh team versions: the next action sends
 * those back, and a team somebody else changed in between is refused with 409 STALE_VERSION
 * instead of being overwritten. Between two selections the read answers 404.
 */
export const fetchBoard = async ({ signal } = {}) => {
  const { data } = await apiClient.get('/admin/board', { signal });
  return data;
};

/** From a team or the pool to another team or the pool; a team on either side comes with its version. */
export const moveStudent = async (move) => {
  const { data } = await apiClient.post('/admin/board/moves', move);
  return data;
};

/** A team's own per-year targets; `null` for a year goes back to the selection's. */
export const setTeamTargets = async (teamId, { version, firstYearTarget, secondYearTarget }) => {
  const { data } = await apiClient.put(`/admin/board/teams/${teamId}/targets`, {
    version,
    firstYearTarget,
    secondYearTarget,
  });
  return data;
};

export const changeTeamLead = async (teamId, { version, studentId }) => {
  const { data } = await apiClient.post(`/admin/board/teams/${teamId}/lead`, { version, studentId });
  return data;
};

export const dissolveTeam = async (teamId, { version }) => {
  const { data } = await apiClient.post(`/admin/board/teams/${teamId}/dissolve`, { version });
  return data;
};
