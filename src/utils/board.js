/**
 * The composition board (#55) as the page reads it: who counts for which year, what a team is
 * short of, which teams a filter keeps, and what a move looks like before the server confirms it.
 *
 * The year rule is the backend's (`TeamComposition.isFirstYear`): course 1 is the first year, any
 * other course — an unset one included — counts towards the second. The page asks its questions
 * (over target? who leads next?) from the same numbers the server will check.
 */

export const isFirstYear = (course) => course === 1;

/**
 * The student's own course. Not the bucket they count towards: a third-year fills a second-year
 * place, but is still a third-year.
 */
export const courseLabel = (course) => (course ? `${course} курс` : 'курс не указан');

/** «1 курс 2/3 · 2 курс 3/3» */
export const countersLine = (team) =>
  `1 курс ${team.firstYears}/${team.firstYearTarget} · 2 курс ${team.secondYears}/${team.secondYearTarget}`;

/** The places a student would take, as the picker shows them: «2 курс 2/3» for anyone past the first year. */
export const counterFor = (team, course) => (isFirstYear(course)
  ? `1 курс ${team.firstYears}/${team.firstYearTarget}`
  : `2 курс ${team.secondYears}/${team.secondYearTarget}`);

export const canJoin = (team, course) => (isFirstYear(course)
  ? team.firstYears < team.firstYearTarget
  : team.secondYears < team.secondYearTarget);

export const isShort = (team) =>
  team.firstYears < team.firstYearTarget || team.secondYears < team.secondYearTarget;

export const hasOwnTargets = (team) => team.firstYearOverride != null || team.secondYearOverride != null;

export const STATUS_LABELS = {
  COMPLETE: 'Собрана',
  INCOMPLETE: 'Не хватает людей',
  OVER_TARGET: 'Сверх цели',
};

// The backend's precedence (CompositionBoardDto.TeamStatus): over target outranks short.
const statusOf = ({ firstYears, secondYears, firstYearTarget, secondYearTarget }) => {
  if (firstYears > firstYearTarget || secondYears > secondYearTarget) return 'OVER_TARGET';
  if (firstYears < firstYearTarget || secondYears < secondYearTarget) return 'INCOMPLETE';
  return 'COMPLETE';
};

const withMembers = (team, members) => {
  const firstYears = members.filter((member) => isFirstYear(member.course)).length;
  const next = { ...team, members, firstYears, secondYears: members.length - firstYears };
  return { ...next, status: statusOf(next) };
};

/**
 * The board as it will be once the move goes through — shown at once, and replaced by the
 * server's answer (or thrown away, if it refuses). A lead who moves hands the lead to `newLeadId`
 * first, as the server does; nobody arrives anywhere as a lead.
 */
export const applyMove = (board, { studentId, fromTeamId, toTeamId, newLeadId }) => {
  const from = fromTeamId == null ? null : board.teams.find((team) => team.id === fromTeamId);
  const moved = from
    ? from.members.find((member) => member.id === studentId)
    : board.pool.find((student) => student.id === studentId);
  if (!moved) return board;
  const arriving = { ...moved, lead: false };

  const teams = board.teams.map((team) => {
    if (team.id === fromTeamId) {
      const members = team.members
        .filter((member) => member.id !== studentId)
        .map((member) => (newLeadId != null ? { ...member, lead: member.id === newLeadId } : member));
      return { ...withMembers(team, members), leadId: newLeadId ?? team.leadId };
    }
    if (team.id === toTeamId) {
      return withMembers(team, [...team.members, arriving]);
    }
    return team;
  });

  let pool = board.pool;
  if (fromTeamId == null) pool = pool.filter((student) => student.id !== studentId);
  if (toTeamId == null) pool = [...pool, arriving];
  return { ...board, teams, pool };
};

/** A team whose members all went to the pool, gone from the board — what dissolving does. */
export const applyDissolve = (board, teamId) => {
  const team = board.teams.find((candidate) => candidate.id === teamId);
  if (!team) return board;
  return {
    ...board,
    teams: board.teams.filter((candidate) => candidate.id !== teamId),
    pool: [...board.pool, ...team.members.map((member) => ({ ...member, lead: false }))],
  };
};

const byName = (a, b) => a.name.localeCompare(b.name, 'ru');

// What needs a hand first: over target, then short, then complete.
const STATUS_ORDER = { OVER_TARGET: 0, INCOMPLETE: 1, COMPLETE: 2 };

const matches = (text, value) => value?.toLocaleLowerCase('ru').includes(text);

/**
 * The teams a filter keeps. The text matches a team's name or any member's; «places for» takes a
 * course (1 or 2) and keeps the teams that student could join without going over target.
 */
export const filterTeams = (teams, { text, shortOnly, placesFor, sort }) => {
  const needle = text.trim().toLocaleLowerCase('ru');
  const kept = teams.filter((team) => (!shortOnly || isShort(team))
    && (!placesFor || canJoin(team, placesFor))
    && (!needle || matches(needle, team.name) || team.members.some((member) => matches(needle, member.name))));
  return kept.sort(sort === 'name'
    ? byName
    : (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || byName(a, b));
};

export const filterPool = (pool, text) => {
  const needle = text.trim().toLocaleLowerCase('ru');
  return pool.filter((student) => !needle || matches(needle, student.name)).sort(byName);
};

/** Where a student can be moved: every other team, those with room for their year first. */
export const destinationsFor = (board, student, fromTeamId, text) => {
  const needle = text.trim().toLocaleLowerCase('ru');
  return board.teams
    .filter((team) => team.id !== fromTeamId && (!needle || matches(needle, team.name)))
    .sort((a, b) => Number(canJoin(b, student.course)) - Number(canJoin(a, student.course)) || byName(a, b));
};
