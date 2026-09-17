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
