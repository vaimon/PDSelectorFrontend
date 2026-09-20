import axios from 'axios';

import { API_BASE_URL } from '../config/apiConfig';
import apiClient from './apiClient';

// Exactly one track is active at a time — it is the current selection. Readable by any signed-in
// account, including one that has not filled the participant questionnaire yet.
export const fetchActiveTrack = async () => {
  const response = await axios.get(`${API_BASE_URL}/tracks/current`, {
    withCredentials: true,
  });
  return response.data;
};

// The settings of the current selection (#47). Organiser only; the backend refuses every change
// once the selection has been handed over to the ПД cabinet (409 HANDED_OVER).
//
// The whole track goes back: the endpoint overwrites name, about, dates and type with whatever it
// is given, and only the targets are left alone when null. Sending a subset silently clears the
// rest, so callers build the payload from the track they loaded.
export const updateTrack = async (trackId, track) => {
  const { data } = await apiClient.put(`/tracks/${trackId}`, track);
  return data;
};

// Starts the next selection and makes it the active one. The previous selection stops being active
// and everything in it becomes read-only; its type and targets are copied onto the new one.
export const startNewSelection = async (selection) => {
  const { data } = await apiClient.post('/tracks/new-selection', selection);
  return data;
};

// Hands the selection over to the ПД cabinet: from here the backend refuses every change to it and
// to its teams. Idempotent — handing over twice keeps the first timestamp.
export const handOverTrack = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/handover`);
  return data;
};

// Takes the hand-over back. The backend allows this at any time, which is why it stays available
// on a screen where everything else is switched off.
export const cancelHandOver = async (trackId) => {
  const { data } = await apiClient.post(`/tracks/${trackId}/handover/cancel`);
  return data;
};
