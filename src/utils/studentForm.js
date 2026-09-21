/**
 * A student between the organiser's form and `PUT /students/{id}` (#48).
 *
 * The endpoint takes a whole `StudentUpdateDto` and, for an admin, writes the name, the e-mail and
 * the enabled flag with whatever arrives — so the body is the student as loaded with the form's
 * four fields over it. A body built from the form alone would blank the rest of the person.
 */

const isWhole = (value, min, max) => {
  const trimmed = String(value).trim();
  if (!/^[0-9]+$/.test(trimmed)) {
    return false;
  }
  const number = Number(trimmed);
  return number >= min && number <= max;
};

export const toStudentFormValues = (student) => ({
  fio: student.user?.fio ?? '',
  email: student.user?.email ?? '',
  course: String(student.course ?? ''),
  groupNumber: String(student.group_number ?? ''),
});

/** What has to be fixed before saving, as `{ field: true }`. Ranges are the backend schema's. */
export const validateStudent = (values) => {
  const errors = {};
  if (!values.fio.trim()) {
    errors.fio = true;
  }
  if (!values.email.trim().includes('@')) {
    errors.email = true;
  }
  if (!isWhole(values.course, 1, 10)) {
    errors.course = true;
  }
  if (!isWhole(values.groupNumber, 0, 20)) {
    errors.groupNumber = true;
  }
  return errors;
};

export const toStudentPayload = (student, values) => ({
  course: Number(values.course),
  group_number: Number(values.groupNumber),
  about_self: student.about_self ?? null,
  contacts: student.contacts ?? null,
  // The same team as loaded: a different id here would move the student, which the backend checks
  // against the team's places and refuses — not something this form offers.
  current_team: student.current_team ? { id: student.current_team.id } : null,
  current_track: { id: student.current_track.id },
  user: {
    id: student.user.id,
    fio: values.fio.trim(),
    email: values.email.trim(),
    role: student.user.role,
    is_remind_enabled: student.user.is_remind_enabled,
    is_enabled: student.user.is_enabled,
  },
  technologies: (student.technologies ?? []).map(({ id, name }) => ({ id, name })),
});
