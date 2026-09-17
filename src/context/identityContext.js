import { createContext, useContext } from 'react';

// { user, studentId, role, isAdmin, activeTrack, isParticipant, isSelectionOpen, loading, error, refresh }
export const IdentityContext = createContext(null);

export const useIdentity = () => useContext(IdentityContext);
