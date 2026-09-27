/**
 * The overview's arithmetic (#69), apart from how it is drawn: the verdict and the forecast from the
 * day-by-day history, and the gap — who is short of whom, and whether the pool can fill it — from
 * the composition board. The components only render what these return.
 *
 * The year rule is the backend's, via `utils/board.js`: course 1 fills a first-year place, any
 * other course (an unset one included) a second-year one.
 */
import { isFirstYear, isShort } from './board';
import { plural } from './composition';

const DAY_MS = 24 * 60 * 60 * 1000;

/** How many days back the pace looks, and how many it needs before it is worth a line. */
const PACE_WINDOW = 7;
const PACE_MIN_DAYS = 3;

/** `"2026-10-01"` as a local date, so a day stays the day it names in any time zone. */
export const parseDay = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const daysBetween = (from, to) => Math.round((to - from) / DAY_MS);

const dayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
export const formatDay = (value) => dayFormatter.format(parseDay(value));

const shortDayFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
export const formatShortDay = (value) => shortDayFormatter.format(parseDay(value)).replace('.', '');

/** Complete teams today against yesterday; null when yesterday is not in the series. */
export const changeSinceYesterday = (days) => {
  if (days.length < 2) return null;
  return days[days.length - 1].completeTeams - days[days.length - 2].completeTeams;
};

/**
 * Where the complete-team count is heading by the close, at the pace of the last week (or of as
 * many days as there are). Null when there is too little history to call it a pace, when the
 * window is not open, or when the close date is unknown.
 */
export const forecast = (history, windowOpen) => {
  const { days, endDate } = history;
  if (!windowOpen || !endDate || days.length < PACE_MIN_DAYS) return null;

  const last = days[days.length - 1];
  const base = days[Math.max(0, days.length - 1 - PACE_WINDOW)];
  const span = daysBetween(parseDay(base.date), parseDay(last.date));
  if (span <= 0) return null;

  const pace = (last.completeTeams - base.completeTeams) / span;
  const remaining = Math.max(0, daysBetween(parseDay(last.date), parseDay(endDate)));
  // The line stops at «все команды»: more teams than exist cannot be complete.
  const projected = Math.min(last.totalTeams, last.completeTeams + pace * remaining);

  return { pace, projected, endDate };
};

/**
 * The short teams, grouped by how many people each is missing, the nearest to done first: those are
 * the ones a single placement finishes.
 */
export const gapBuckets = (board) => {
  const short = board.teams
    .filter(isShort)
    .map((team) => {
      const needFirst = Math.max(0, team.firstYearTarget - team.firstYears);
      const needSecond = Math.max(0, team.secondYearTarget - team.secondYears);
      const lead = team.members.find((member) => member.id === team.leadId);
      return { team, lead, missing: needFirst + needSecond };
    })
    .sort((a, b) => a.missing - b.missing || a.team.name.localeCompare(b.team.name, 'ru'));

  const buckets = [];
  short.forEach((entry) => {
    const bucket = buckets[buckets.length - 1];
    if (bucket && bucket.missing === entry.missing) {
      bucket.teams.push(entry);
    } else {
      buckets.push({ missing: entry.missing, teams: [entry] });
    }
  });
  return buckets;
};

export const missingLabel = (missing) => `Не хватает ${missing} ${plural(missing, ['человека', 'человек', 'человек'])}`;

export const teamsLabel = (count) => `${count} ${plural(count, ['команда', 'команды', 'команд'])}`;

/**
 * Per year: the students without a team against the places the short teams have for that year, and
 * what the difference means. The places are counted against targets, so a surplus is people the
 * targets have no room for — new teams, or places over target.
 */
export const poolBalance = (board) => {
  const shortTeams = board.teams.filter(isShort);
  const year = (first) => {
    const pool = board.pool.filter((student) => isFirstYear(student.course) === first).length;
    const places = shortTeams.reduce((sum, team) => sum + (first
      ? Math.max(0, team.firstYearTarget - team.firstYears)
      : Math.max(0, team.secondYearTarget - team.secondYears)), 0);
    const difference = pool - places;

    let verdict;
    if (difference === 0) {
      verdict = { tone: 'ok', text: pool === 0 ? 'Никого не осталось, и мест не осталось.' : 'Людей ровно столько, сколько мест.' };
    } else if (difference > 0) {
      verdict = {
        tone: 'warn',
        text: `${difference} ${plural(difference, ['человеку', 'людям', 'людям'])} не хватит мест в целях: нужны новые команды или места сверх цели.`,
      };
    } else {
      verdict = {
        tone: 'warn',
        text: `${-difference} ${plural(-difference, ['место', 'места', 'мест'])} не заполнить из пула.`,
      };
    }
    return { pool, places, verdict };
  };

  return { firstYear: year(true), secondYear: year(false) };
};

export const overTargetCount = (board) => board.teams.filter((team) => team.status === 'OVER_TARGET').length;

/**
 * Where the selection stands, as one sentence (#73) — what the organiser should see before anything
 * that ends it: «Собрано 22 из 28 команд, 10 человек без команды.»
 *
 * Null while the overview is not there (loading, failed, no selection): a sentence made of zeros
 * would tell the organiser everything is empty, which is the one thing not known.
 */
export const summarize = (overview) => {
  if (!overview) return null;
  const { teams, students } = overview;

  if (teams.total > 0 && teams.complete === teams.total && students.withoutTeam === 0) {
    return teams.total === 1
      ? 'Команда собрана, без команды никого.'
      : `Все ${teams.total} ${plural(teams.total, ['команда', 'команды', 'команд'])} собраны, без команды никого.`;
  }

  const collected = `Собрано ${teams.complete} из ${teams.total} ${plural(teams.total, ['команды', 'команд', 'команд'])}`;
  const without = `${students.withoutTeam} ${plural(students.withoutTeam, ['человек', 'человека', 'человек'])} без команды`;
  return `${collected}, ${without}.`;
};
