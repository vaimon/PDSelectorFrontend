import { createContext, useContext } from 'react';

// { notify, dismiss, notifications }
export const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

// The API layer lives outside React, so it reaches the provider through this bridge instead of
// every call site catching and rendering its own message.
let notifier = null;

export const setNotifier = (next) => {
  notifier = next;
};

export const notifyError = (text) => {
  if (!notifier) {
    // Before the provider mounts there is nothing on screen to show it on.
    console.error(text);
    return;
  }

  notifier({ type: 'error', text });
};
