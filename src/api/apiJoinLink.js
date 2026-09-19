import apiClient from './apiClient';

// Join links (vaimon/team-selection#13). The token is the whole secret, so it only ever travels in
// the path of these calls and in the link itself.

// The current token, or null when the team has no link. Team lead or admin.
export const getJoinLink = async (teamId) => {
  const response = await apiClient.get(`/teams/${teamId}/join-link`);
  return response.data || null;
};

// A new token; the previous link stops working. Team lead only, and only while the window is open.
export const issueJoinLink = async (teamId) => {
  const response = await apiClient.post(`/teams/${teamId}/join-link`);
  return response.data;
};

// Not limited by the window: a leaked link has to be revocable after the close too.
export const disableJoinLink = async (teamId) => {
  await apiClient.post(`/teams/${teamId}/join-link/disable`);
};

// What the link leads to, and whether this person can join. Open to anyone signed in.
export const previewJoin = async (token) => {
  const response = await apiClient.get(`/teams/join/${encodeURIComponent(token)}`);
  return response.data;
};

export const joinByToken = async (token) => {
  const response = await apiClient.post(`/teams/join/${encodeURIComponent(token)}`);
  return response.data;
};

export const joinLinkUrl = (token) => `${window.location.origin}/join/${token}`;
