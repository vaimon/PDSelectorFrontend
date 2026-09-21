/**
 * The admin activity log (vaimon/team-selection#16) as the history screen shows it (#49).
 *
 * An entry is already a finished sentence (`summary`) with the names copied in when it was
 * written, so it reads the same after a rename or a deletion. What is left to do here is a short
 * label for the kind of action, a readable time, and the query for a period.
 */

const ACTION_LABELS = {
  TEAM_CREATED: 'Команда создана',
  TEAM_UPDATED: 'Команда изменена',
  TEAM_DISBANDED: 'Команда распущена',
  MEMBER_JOINED: 'Вступление',
  MEMBER_REMOVED: 'Исключение',
  MEMBER_LEFT: 'Выход из команды',
  MEMBER_MOVED: 'Перевод',
  LEAD_CHANGED: 'Смена тимлида',
  TARGETS_CHANGED: 'Цели команды',
  APPLICATION_SENT: 'Заявка',
  APPLICATION_ANSWERED: 'Ответ на заявку',
  APPLICATION_DELETED: 'Заявка удалена',
  JOIN_LINK_ISSUED: 'Ссылка выдана',
  JOIN_LINK_DISABLED: 'Ссылка отключена',
  QUESTIONNAIRE_FILLED: 'Анкета',
  STUDENT_UPDATED: 'Правка участника',
  STUDENT_DELETED: 'Анкета удалена',
  USER_CREATED: 'Новый пользователь',
  USER_UPDATED: 'Правка пользователя',
  ROLE_ASSIGNED: 'Роль',
  USER_DEACTIVATED: 'Пользователь отключён',
  SELECTION_SETTINGS_CHANGED: 'Настройки набора',
  SELECTION_STARTED: 'Новый набор',
  HANDED_OVER: 'Передача в кабинет ПД',
  HANDOVER_CANCELLED: 'Передача отменена',
};

/** A kind the backend adds later still shows — as its own name, until it gets a label here. */
export const actionLabel = (action) => ACTION_LABELS[action] ?? action;

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/**
 * `"2026-09-21T14:05:33.123"` → «21 сентября 2026 г., 14:05».
 *
 * The time is the server's (a `LocalDateTime`, no offset, Europe/Moscow by `TimeConfig`), and it is
 * shown as sent: built from its parts in UTC and formatted in UTC, so neither the browser's zone nor a
 * daylight-saving gap in it can move it.
 */
export const formatAt = (at) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(at ?? '');
  if (!match) {
    return at ?? '';
  }
  const [, year, month, day, hour, minute] = match.map(Number);
  return timeFormatter.format(new Date(Date.UTC(year, month - 1, day, hour, minute)));
};

/** A period from two date fields; both ends included, as the backend compares `>=` and `<=`. */
export const periodParams = ({ from, to }) => ({
  from: from ? `${from}T00:00:00` : undefined,
  // To the microsecond: entries carry fractions of a second, and the backend compares `<=`.
  to: to ? `${to}T23:59:59.999999` : undefined,
});

/**
 * Who did it, for an entry written without a person (`ActivityEntryDto.actorName` is empty then):
 * the ПД cabinet marking a hand-over over its API key, or somebody's first sign-in creating them.
 */
const NO_PERSON = {
  HANDED_OVER: 'кабинет ПД',
  HANDOVER_CANCELLED: 'кабинет ПД',
  USER_CREATED: 'первый вход',
};

export const actorOf = (entry) => entry.actorName ?? NO_PERSON[entry.action] ?? 'без участия человека';
