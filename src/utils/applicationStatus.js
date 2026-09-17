// Statuses travel as SENT/ACCEPTED/... while the database keeps them lower case, so the key is
// normalised before lookup.
const LABELS = {
  sent: { text: 'Отправлена', tone: 'warn' },
  accepted: { text: 'Принята', tone: 'ok' },
  rejected: { text: 'Отклонена', tone: 'bad' },
  cancelled: { text: 'Отменена', tone: 'bad' },
};

export const describeApplicationStatus = (status) => (
  LABELS[String(status).toLowerCase()] ?? { text: String(status), tone: 'neutral' }
);

// Waiting for an answer — the only state in which anything can be accepted, rejected or cancelled.
export const isPendingApplication = (application) => (
  String(application?.status).toLowerCase() === 'sent'
);
