// Backend origin is inlined at build time (Vite replaces import.meta.env). Empty default =
// same-origin: in prod nginx serves the frontend and proxies /api to the backend under
// teams.pd-mmcs.ru. For local dev set VITE_BACKEND_URL=http://localhost:8080 (cross-origin).
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;
