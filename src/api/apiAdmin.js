import apiClient from './apiClient';

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
