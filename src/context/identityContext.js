import { createContext, useContext } from 'react';

// { user, studentId, role, isAdmin, activeTrack, isParticipant, loading, error, refresh }
export const IdentityContext = createContext(null);

export const useIdentity = () => useContext(IdentityContext);
