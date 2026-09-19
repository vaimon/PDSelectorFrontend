// Where a person opening a join link was going. SSO lands everyone on a fixed page (/teams,
// /registration, /admin), so the path survives the round trip here and brings them back to the
// invitation. Storage can be missing or throw (private mode, blocked site data); the flow then just
// loses the way back and the person opens the link again.
const KEY = 'pendingJoin';
const JOIN_PATH = /^\/join\/[^/]+$/;

export const isJoinPath = (path) => JOIN_PATH.test(path);

export const rememberJoin = (path) => {
  if (!isJoinPath(path)) {
    return;
  }
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // no storage — nothing to remember with
  }
};

export const pendingJoin = () => {
  try {
    const path = sessionStorage.getItem(KEY);
    return path && isJoinPath(path) ? path : null;
  } catch {
    return null;
  }
};

export const forgetJoin = () => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing stored, nothing to forget
  }
};
