import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useIdentity } from '../../context/identityContext';
import { forgetJoin, isJoinPath, pendingJoin } from '../../utils/pendingJoin';

/**
 * Brings a person who opened a join link back to it once they are signed in, wherever SSO landed
 * them. The questionnaire is left alone — it returns to the invitation itself after submitting,
 * which is the point of the detour.
 *
 * The way back is used once and forgotten: if the invitation then fails to load, or the person
 * walks away from it, they are not bounced back to it on every page they open.
 */
const PendingJoinRedirect = () => {
  const { user, loading } = useIdentity();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !user || pathname === '/registration' || pathname === '/login' || isJoinPath(pathname)) {
      return;
    }
    const target = pendingJoin();
    if (target) {
      forgetJoin();
      console.info('Возвращаем к приглашению в команду после входа');
      navigate(target, { replace: true });
    }
  }, [loading, user, pathname, navigate]);

  return null;
};

export default PendingJoinRedirect;
