import { useState } from 'react';

import { useNotifications } from '../context/notificationContext';

/**
 * A mutation the user has to confirm first: ask, run it, say what happened, reload.
 *
 * The reload runs on both paths and the dialog closes either way — a failure has already been
 * shown by the shared client, and reloading means a list never keeps showing a decision that did
 * not actually happen.
 */
export const useConfirmAction = (reload) => {
  const { notify } = useNotifications();
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await request.run();
      notify({ type: 'success', text: request.successText });
    } catch (error) {
      console.error('Не удалось выполнить действие с заявкой:', error);
    } finally {
      await reload();
      setBusy(false);
      setRequest(null);
    }
  };

  return {
    ask: setRequest,
    confirmProps: {
      request,
      onConfirm: confirm,
      onCancel: () => setRequest(null),
      busy,
    },
  };
};

export default useConfirmAction;
