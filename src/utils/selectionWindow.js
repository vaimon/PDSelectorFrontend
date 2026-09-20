const dateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

// Track dates arrive as [year, month, day]: the backend keeps Jackson's default LocalDate shape,
// and IntegrationTrackDto is the single place that opts into ISO strings — its comment says the
// existing frontend is exactly why the global setting cannot change.
const toDate = (parts) => (
  Array.isArray(parts) && parts.length >= 3
    ? new Date(parts[0], parts[1] - 1, parts[2])
    : null
);

const formatDate = (date) => dateFormatter.format(date);

/**
 * What the shell says about the current selection: which one it is and whether it is open.
 *
 * The state itself comes from the backend (`SelectionWindowState`), which is also what refuses
 * mutations outside the window — deriving it from the dates here again would disagree with it on
 * a track that has no end date, which the server treats as closed.
 *
 * Returns null when no selection is running: between two of them there is no active track.
 */
export const describeSelectionWindow = (activeTrack) => {
  if (!activeTrack) {
    return null;
  }

  const { name, windowState } = activeTrack;
  const start = toDate(activeTrack.startDate);
  const end = toDate(activeTrack.endDate);

  if (windowState === 'NOT_OPEN') {
    return {
      name,
      state: 'upcoming',
      note: start ? `откроется ${formatDate(start)}` : 'дата начала не назначена',
    };
  }

  if (windowState === 'CLOSED') {
    return {
      name,
      state: 'closed',
      note: end ? `завершён ${formatDate(end)}` : 'дата окончания не назначена',
    };
  }

  return { name, state: 'open', note: end ? `до ${formatDate(end)}` : 'идёт' };
};

/**
 * Why an action is unavailable right now, for a disabled button's title and for the section hint.
 * Null when the selection is open and there is nothing to explain.
 */
export const selectionClosedReason = (activeTrack) => {
  if (!activeTrack) {
    return 'Набора сейчас нет.';
  }

  const selection = describeSelectionWindow(activeTrack);
  if (selection.state === 'open') {
    return null;
  }

  return selection.state === 'upcoming'
    ? `Набор «${selection.name}» ещё не открыт: ${selection.note}.`
    : `Набор «${selection.name}» закрыт: ${selection.note}.`;
};
