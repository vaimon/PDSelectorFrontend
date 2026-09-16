import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import NotificationStrip from '../components/notifications/NotificationStrip';
import { NotificationContext, setNotifier } from './notificationContext';

const AUTO_DISMISS_MS = 5000;

const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const notify = useCallback(({ type = 'info', text }) => {
    if (!text) {
      return;
    }

    nextId.current += 1;
    const id = nextId.current;
    setNotifications((prev) => [...prev, { id, type, text }]);

    // An error stays until it is dismissed: it is the answer to something the user just did.
    if (type !== 'error') {
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    }
  }, [dismiss]);

  useEffect(() => {
    setNotifier(notify);
    return () => setNotifier(null);
  }, [notify]);

  const value = useMemo(
    () => ({ notifications, notify, dismiss }),
    [notifications, notify, dismiss],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationStrip notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
