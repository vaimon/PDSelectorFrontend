import apiClient from './apiClient';

// Spring Security owns the logout: it clears JSESSIONID/SessionId and answers with a redirect to
// the login page. The caller navigates afterwards — the redirect itself is not a client route.
export const logout = async () => {
  await apiClient.post('/auth/logout');
};
