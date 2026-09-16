const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

// Track dates arrive as [year, month, day]: the backend keeps Jackson's default LocalDate shape,
// and IntegrationTrackDto is the single place that opts into ISO strings — its comment says the
// existing frontend is exactly why the global setting cannot change.
const toDate = (parts) => (
  Array.isArray(parts) && parts.length >= 3
    ? new Date(parts[0], parts[1] - 1, parts[2])
    : null
);

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * What the shell says about the current selection: which one it is and whether it is open.
 * Returns null when no selection is running — between two of them there is no active track.
 */
export const describeSelectionWindow = (activeTrack) => {
  if (!activeTrack) {
    return null;
  }

  const { name } = activeTrack;
  const start = toDate(activeTrack.startDate);
  const end = toDate(activeTrack.endDate);
  const today = startOfToday();

  if (start && today < start) {
    return { name, state: 'upcoming', note: `откроется ${dateFormatter.format(start)}` };
  }

  if (end && today > end) {
    return { name, state: 'closed', note: `завершён ${dateFormatter.format(end)}` };
  }

  return { name, state: 'open', note: end ? `до ${dateFormatter.format(end)}` : 'идёт' };
};
