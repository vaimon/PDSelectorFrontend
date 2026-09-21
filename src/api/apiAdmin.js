import apiClient from './apiClient';
import { normalizePageResponse } from './normalizeResponse';

/**
 * Where the current selection stands, in one answer (vaimon/team-selection#10).
 *
 * Between two selections the backend answers 404 («Набор не настроен») — that is an answer, not a
 * failure, and the page says so. Reads go through `apiClient` like every mutation: it is the one
 * place that sends a 401 back to login, and it stays quiet on a GET instead of raising a toast.
 */
export const fetchAdminOverview = async () => {
  const { data } = await apiClient.get('/admin/overview');
  return data;
};

/**
 * People by name or e-mail, or by role (#49). Enabled accounts only: the backend returns disabled
 * ones too when the flag is left out, and nobody gives access to an account that cannot sign in.
 * One search box, two backend fields — an «@» says it is an address.
 */
export const fetchUsers = async ({ text, role, page = 0, size = 20, signal }) => {
  const params = { isEnabled: true, page, size };
  const trimmed = text?.trim();
  if (trimmed) {
    params[trimmed.includes('@') ? 'email' : 'fio'] = trimmed;
  }
  if (role) {
    params.role = role;
  }
  const { data } = await apiClient.get('/users', { params, signal });
  return normalizePageResponse(data);
};

// Gives or takes ADMIN. The backend refuses to take it from the last admin (400, with the reason).
export const assignRole = async (userId, name) => {
  await apiClient.post(`/users/${userId}/assign-role`, { name });
};

/**
 * The activity log (vaimon/team-selection#16), newest first. `teamId` also matches entries where
 * the team is the other side of a move; `from` and `to` are inclusive.
 */
export const fetchActivity = async ({ teamId, studentId, actorUserId, from, to, page = 0, size = 50, signal }) => {
  const params = { page, size };
  if (teamId) params.teamId = teamId;
  if (studentId) params.studentId = studentId;
  if (actorUserId) params.actorUserId = actorUserId;
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get('/admin/activity', { params, signal });
  return normalizePageResponse(data);
};
