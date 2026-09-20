/**
 * The selection's settings between the form and the wire.
 *
 * Two conversions live here rather than in the screen, because they are the part that can be wrong
 * without looking wrong: the backend sends dates as `[year, month, day]` arrays and takes them
 * back the same way, while `<input type="date">` speaks `YYYY-MM-DD` — and a month is 1-based on
 * one side of that and 0-based nowhere, which is exactly the kind of thing that survives a glance.
 */

const pad = (value) => String(value).padStart(2, '0');

/** `[2026, 10, 4]` → `"2026-10-04"`; anything else → `""`, which is an empty date field. */
export const toDateInput = (parts) => (
  Array.isArray(parts) && parts.length >= 3
    ? `${parts[0]}-${pad(parts[1])}-${pad(parts[2])}`
    : ''
);

/** `"2026-10-04"` → `[2026, 10, 4]`; an empty field → null, the shape the backend reads as unset. */
export const fromDateInput = (value) => {
  if (!value) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return [year, month, day];
};

export const toFormValues = (track) => ({
  name: track.name ?? '',
  startDate: toDateInput(track.startDate),
  endDate: toDateInput(track.endDate),
  firstYearTarget: String(track.firstYearTarget ?? ''),
  secondYearTarget: String(track.secondYearTarget ?? ''),
});

const isTarget = (value) => /^[0-9]+$/.test(value.trim());

/**
 * The window both forms need: a selection has to have two dates, in that order.
 *
 * The end date is required even though the backend accepts it empty, because an unset end date is
 * not an open-ended selection there — it is a closed one (`SelectionWindowState`), so allowing it
 * would shut the selection down while looking like it removed a limit.
 */
const validateWindow = (values) => {
  const errors = {};

  if (!values.startDate) {
    errors.startDate = true;
  }
  if (!values.endDate) {
    errors.endDate = true;
  }
  // Strictly before, as `@ValidDateRange` has it — equal dates are a 400, not a one-day selection.
  if (values.startDate && values.endDate && values.startDate >= values.endDate) {
    errors.endDate = true;
    errors.range = true;
  }

  return errors;
};

/** What the organiser has to fix before the settings can be saved, as `{ field: true }`. */
export const validate = (values) => {
  const errors = validateWindow(values);

  if (!values.name.trim()) {
    errors.name = true;
  }
  if (!isTarget(values.firstYearTarget)) {
    errors.firstYearTarget = true;
  }
  if (!isTarget(values.secondYearTarget)) {
    errors.secondYearTarget = true;
  }

  return errors;
};

/**
 * The body of `PUT /tracks/{id}`: the track as it was loaded, with the form's fields over it.
 *
 * Spreading the loaded track is not tidiness — the endpoint overwrites `about` and `type` with
 * whatever arrives, so a payload built from the form alone would quietly erase both.
 */
export const toTrackPayload = (track, values) => ({
  ...track,
  name: values.name.trim(),
  startDate: fromDateInput(values.startDate),
  endDate: fromDateInput(values.endDate),
  firstYearTarget: Number(values.firstYearTarget),
  secondYearTarget: Number(values.secondYearTarget),
});

/** The body of `POST /tracks/new-selection`: only the dates are required, the name is optional. */
export const toNewSelectionPayload = (values) => ({
  name: values.name.trim() || null,
  startDate: fromDateInput(values.startDate),
  endDate: fromDateInput(values.endDate),
});

export const validateNewSelection = validateWindow;
