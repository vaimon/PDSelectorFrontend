import { useState } from 'react';

import { useNotifications } from '../context/notificationContext';

/**
 * A mutation the user has to confirm first: ask, run it, say what happened, reload.
 *
 * The reload runs on both paths and the dialog closes either way — a failure has already been
 * shown by the shared client, and reloading means a list never keeps showing a decision that did
 * not actually happen. A request that went through may leave somewhere else instead through its
 * own `after`: leaving a team or disbanding one leaves nothing on this page to reload, and a
 * refusal has to stay where it is.
 */
export const useConfirmAction = (reload) => {
  const { notify } = useNotifications();
  const [request, setRequest] = useState(null);
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    let done = false;
    try {
      await request.run();
      done = true;
      notify({ type: 'success', text: request.successText });
    } catch (error) {
      console.error('Не удалось выполнить действие:', error);
    } finally {
      await (done && request.after ? request.after() : reload());
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
