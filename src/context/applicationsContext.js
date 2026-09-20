import { createContext, useContext } from 'react';

// { invites, requests, myRequests, sentInvites, myTeam, total, loading, refresh }
export const ApplicationsContext = createContext(null);

export const useApplications = () => useContext(ApplicationsContext);
