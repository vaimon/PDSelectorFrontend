// Everything the app says about a team's composition, in one place: three screens say it now, and
// two copies of the same sentence drift apart.
//
// Course 1 takes a first-year place, every later course a second-year one (TeamComposition).

const FIRST_YEAR = {
  places: 'first_year_places_left',
  taken: 'first_years',
  target: 'first_year_target',
  label: '1 курс',
  people: ['первокурсник', 'первокурсника', 'первокурсников'],
};

const SECOND_YEAR = {
  places: 'second_year_places_left',
  taken: 'second_years',
  target: 'second_year_target',
  label: '2 курс и старше',
  people: ['второкурсник', 'второкурсника', 'второкурсников'],
};

const yearOf = (course) => (course === 1 ? FIRST_YEAR : SECOND_YEAR);

const plural = (count, [one, few, many]) => {
  const tens = count % 100;
  if (tens > 10 && tens < 20) {
    return many;
  }
  const units = count % 10;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
};

export const placesLeftFor = (composition, course) => composition?.[yearOf(course).places];

/** What the backend would answer, said before the click instead of after it. */
export const noPlacesMessage = (course) => (
  `В команде нет мест для студентов ${course === 1 ? '1 курса' : '2 курса и старше'}.`
);

/** How full the team is: «1 курс — 2 из 3 · 2 курс и старше — 1 из 3». */
export const describePlaces = (composition) => (
  [FIRST_YEAR, SECOND_YEAR]
    .map((year) => `${year.label} — ${composition[year.taken]} из ${composition[year.target]}`)
    .join(' · ')
);

/** The target of the selection itself: «3 первокурсника и 3 второкурсника». */
export const describeTargets = (firstYearTarget, secondYearTarget) => (
  [[firstYearTarget, FIRST_YEAR], [secondYearTarget, SECOND_YEAR]]
    .map(([count, year]) => `${count} ${plural(count, year.people)}`)
    .join(' и ')
);

/** Who the team is still short of, or null when it has met both targets. */
export const describeMissing = (composition) => {
  if (!composition || composition.complete) {
    return null;
  }

  // Not complete means at least one year is short of its target, so there is always someone to
  // name here: `placesLeft` is max(0, target - members) against the same targets `complete` uses.
  const missing = [FIRST_YEAR, SECOND_YEAR]
    .map((year) => ({ year, count: composition[year.places] }))
    .filter(({ count }) => count > 0)
    .map(({ year, count }) => `${count} ${plural(count, year.people)}`);

  return `Не хватает: ${missing.join(', ')}`;
};
