import Cookies from 'js-cookie';

export const getSavedTrackId = () => {
  const savedTrackId = Cookies.get("trackId");

  if (savedTrackId) {
    return savedTrackId;
  }

  const defaultTrackId = "1";
  Cookies.set("trackId", defaultTrackId);
  return defaultTrackId;
};

export const saveTrackId = (trackId) => {
  Cookies.set("trackId", trackId);
};
