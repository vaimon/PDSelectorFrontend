import axios from 'axios';

// Same-origin by default; VITE_BACKEND_URL overrides for cross-origin local dev. See apiConfig.js.
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;
