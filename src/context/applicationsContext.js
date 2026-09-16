import { createContext, useContext } from 'react';

// { invites, requests, total, loading, refresh }
export const ApplicationsContext = createContext(null);

export const useApplications = () => useContext(ApplicationsContext);
