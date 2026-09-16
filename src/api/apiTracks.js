import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';

// Exactly one track is active at a time — it is the current selection. Readable by any signed-in
// account, including one that has not filled the participant questionnaire yet.
export const fetchActiveTrack = async () => {
  const response = await axios.get(`${API_BASE_URL}/tracks/current`, {
    withCredentials: true,
  });
  return response.data;
};
