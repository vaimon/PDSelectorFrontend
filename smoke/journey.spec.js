import { test, expect } from '@playwright/test';
import { expectNoSidewaysScroll, logIn, newcomer, seeded, signIn } from './support/people';

// The student journey against the real backend, one step building on the previous one. The admin
// board (#27) adds its own step here when it lands.
//
// On desktop the team lead and the first-year are the seeded people; at 390px everybody is a
// newcomer who fills the questionnaire from the phone first.
test.describe.configure({ mode: 'serial' });

const people = {};
let teamName;
let joinLink;

async function fillQuestionnaire(page, testInfo, { course, group, contact }, landsOn = /\/how-it-works$/) {
  await expect(page.getByRole('heading', { name: 'Анкета участника набора' })).toBeVisible();
  await expectNoSidewaysScroll(page, testInfo);
  await page.getByLabel('Курс').selectOption(String(course));
  await page.getByLabel('Номер группы').fill(String(group));
  await page.getByLabel('Как с вами связаться').fill(contact);
  await page.getByRole('group', { name: 'Технологии' }).getByRole('checkbox').first().check();
  await page.getByRole('button', { name: 'Отправить анкету' }).click();

  await expect(page.getByRole('status')).toContainText('Анкета сохранена');
  await expect(page).toHaveURL(landsOn);
}

/** The lead's own team page, reached the way a lead gets there: cabinet → «Моя команда». */
async function openOwnTeamPage(page) {
  await page.goto('/profile');
  await openMyTeamSection(page);
  await page.locator('.card').filter({ has: page.getByRole('heading', { name: teamName }) })
    .getByRole('link').click();
  await expect(page.getByRole('heading', { name: teamName, level: 1 })).toBeVisible();
}

async function confirm(page, heading, action) {
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: heading })).toBeVisible();
  await dialog.getByRole('button', { name: action, exact: true }).click();
  await expect(dialog).toBeHidden();
}

/** Clicks a navbar link, opening the menu first at phone width — no page reload either way. */
async function navigateTo(page, label) {
  const menu = page.getByRole('button', { name: 'Меню разделов' });
  if (await menu.isVisible()) {
    await menu.click();
  }
  await page.locator('.navbar').getByRole('link', { name: label, exact: true })
    .filter({ visible: true }).click();
}

/** Opens «Моя команда» in the cabinet sidebar (the navbar has a link of the same name). */
async function openMyTeamSection(page) {
  await page.locator('.sidebar').getByRole('link', { name: 'Моя команда' }).click();
  await expect(page.getByRole('heading', { name: 'Моя команда', level: 2 })).toBeVisible();
}

test('a newcomer fills the questionnaire and is told how the selection works', async ({ browser }, testInfo) => {
  const person = newcomer(testInfo, 'newcomer');
  const { page, redirect } = await signIn(browser, person);
  expect(redirect, 'a first login without a questionnaire goes to the questionnaire').toBe('/registration');

  await fillQuestionnaire(page, testInfo, { course: 2, group: 3, contact: '@smoke_newcomer' });

  // The first screen after the questionnaire answers "what now": the two paths, the composition
  // this selection asks for, and the date it all has to happen by — from the seeded track, not
  // from the page's own text.
  await expect(page.getByRole('heading', { name: 'Как проходит набор', level: 1 })).toBeVisible();
  await expect(page.getByText('3 первокурсника и 3 второкурсника')).toBeVisible();
  await expect(page.getByText(/Идёт набор «Смоук-набор», до \d+ \p{L}+\./u)).toBeVisible();
  await expectNoSidewaysScroll(page, testInfo);

  // The cabinet is one click away, and the guidance stays reachable from the menu afterwards.
  await navigateTo(page, 'Моя команда');
  await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
  await expect(page.getByText('@smoke_newcomer')).toBeVisible();
  await expect(page.getByText(person.fio).first()).toBeVisible();
  // The shell names the selection and its deadline — in the bar on a laptop, and behind the menu
  // button on a phone, where the bar drops the line. Asserted on both, or the phone half of the
  // one thing this screen must always show would be free to disappear.
  if (testInfo.project.use.isMobile) {
    await page.getByRole('button', { name: 'Меню разделов' }).click();
    const inMenu = page.locator('.nav-menu-selection');
    await expect(inMenu).toContainText('Смоук-набор');
    await expect(inMenu).toContainText(/до \d+ \p{L}+/u);
    await page.keyboard.press('Escape');
  } else {
    await expect(page.locator('.navbar').getByText('Смоук-набор')).toBeVisible();
  }
  await navigateTo(page, 'Как проходит набор');
  await expect(page.getByRole('heading', { name: 'Как проходит набор', level: 1 })).toBeVisible();
  await expectNoSidewaysScroll(page, testInfo);
  people.newcomer = person;
});

test('the team lead creates a team', async ({ browser }, testInfo) => {
  const lead = testInfo.project.use.isMobile ? people.newcomer : seeded.lead;
  expect(lead, 'builds on the questionnaire step; run the whole file').toBeDefined();
  teamName = `Смоук ${testInfo.project.name} ${Date.now().toString(36)}`;
  const { page, redirect } = await signIn(browser, lead);
  expect(redirect).toBe('/teams');

  await page.goto('/profile');
  await openMyTeamSection(page);
  await expect(page.getByText('Вы пока не в команде.')).toBeVisible();
  await page.getByRole('button', { name: 'Создать команду' }).click();

  const form = page.getByRole('dialog');
  await form.getByLabel('Название команды:').fill(teamName);
  await form.getByLabel('Описание проекта:').fill('Команда из сквозного смоук-прогона');
  await form.getByRole('radio').first().check();
  await form.getByRole('checkbox').first().check();
  await expectNoSidewaysScroll(page, testInfo);
  await form.getByRole('button', { name: 'Создать команду' }).click();

  await expect(page.getByRole('status')).toContainText('Команда создана');
  await expect(page.getByRole('heading', { name: teamName, level: 3 })).toBeVisible();
  people.lead = lead;
});

test('a first-year asks to join, the lead accepts, and both sides see it', async ({ browser }, testInfo) => {
  expect(people.lead && teamName, 'builds on the team step; run the whole file').toBeTruthy();
  let firstYear = seeded.firstYear;
  let applicant;
  if (testInfo.project.use.isMobile) {
    firstYear = newcomer(testInfo, 'first');
    applicant = await signIn(browser, firstYear);
    await fillQuestionnaire(applicant.page, testInfo, { course: 1, group: 1, contact: '@smoke_first' });
  } else {
    applicant = await signIn(browser, firstYear);
  }

  const catalog = applicant.page;
  await catalog.goto('/teams');
  const card = catalog.locator('.card').filter({ has: catalog.getByRole('heading', { name: teamName }) });
  await expect(card).toBeVisible();
  await expectNoSidewaysScroll(catalog, testInfo);

  // «Есть места для моего курса» asks the backend about this student's own year. What the
  // parameter means is pinned on the backend (vaimon/team-selection#37); what has to hold here is
  // that the viewer's course reaches the wire under the name the two repositories agreed on — a
  // dropped parameter, a renamed key or a course read from the wrong place each turn this red.
  // A frontend that hardcoded 1 would pass: both projects act as a first-year here, and course 2
  // is checked by hand rather than by seeding three more students.
  const filters = catalog.locator('.filter-section');
  const showFilters = filters.getByRole('button', { name: 'Показать' });
  if (await showFilters.isVisible()) {
    await showFilters.click();
  }
  // The response, not the request: the assertion below then runs against a settled list instead
  // of relying on the page still showing «Загружаем команды…» while the fetch is in flight.
  const filtered = catalog.waitForResponse(
    (response) => response.url().includes('/teams/search')
      && response.url().includes('has_place_for_course=1'),
  );
  await filters.getByLabel('Есть места для моего курса').check();
  await filters.getByRole('button', { name: 'Применить' }).click();
  await filtered;
  // The team has every first-year place free at this point, so it survives its own filter.
  await expect(card).toBeVisible();

  await card.getByRole('button', { name: 'Подать заявку' }).click();
  await confirm(catalog, 'Отправить заявку?', 'Отправить');
  await expect(catalog.getByRole('status')).toContainText('Заявка отправлена');
  await expect(card.getByRole('button', { name: 'Отменить заявку' })).toBeVisible();

  const { page: lead } = await signIn(browser, people.lead);
  await lead.goto('/applications');
  await expect(lead.getByRole('heading', { name: 'Заявки в вашу команду' })).toBeVisible();
  await expectNoSidewaysScroll(lead, testInfo);
  if (!testInfo.project.use.isMobile) {
    await expect(lead.getByRole('link', { name: /^Заявки/ }).getByLabel('Ожидают ответа: 1')).toBeVisible();
  }
  const incoming = lead.locator('section').filter({ has: lead.getByRole('heading', { name: 'Заявки в вашу команду' }) });
  const row = incoming.getByRole('listitem').filter({ hasText: firstYear.fio });
  await row.getByRole('button', { name: 'Принять' }).click();
  await confirm(lead, 'Принять в команду?', 'Принять');
  await expect(lead.getByRole('status')).toContainText('Заявка принята');
  await expect(lead.getByRole('heading', { name: 'Заявки в вашу команду' })).toBeHidden();
  await expect(lead.locator('.nav-badge')).toHaveCount(0);

  // The team page lists the new member, and nothing is left waiting for an answer.
  await openOwnTeamPage(lead);
  const members = lead.locator('.team-members');
  await expect(members.getByRole('heading', { name: firstYear.fio })).toBeVisible();
  await expect(members.getByRole('link', { name: 'Заявки в команду', exact: true })).toBeVisible();
  await expectNoSidewaysScroll(lead, testInfo);

  // And the first-year's cabinet now shows the team as theirs, with what it still needs.
  await catalog.goto('/profile');
  await openMyTeamSection(catalog);
  await expect(catalog.getByRole('heading', { name: teamName, level: 3 })).toBeVisible();
  await expect(catalog.getByText('Не хватает: 2 первокурсника, 2 второкурсника')).toBeVisible();
});

test('the team says who it is still short of, and so does the catalogue', async ({ browser }, testInfo) => {
  expect(people.lead && teamName, 'builds on the request step; run the whole file').toBeTruthy();
  const { page: lead } = await signIn(browser, people.lead);

  // Two of six places taken: the lead and the first-year who just joined.
  await openOwnTeamPage(lead);
  await expect(lead.getByText('1 курс — 1 из 3 · 2 курс и старше — 1 из 3')).toBeVisible();
  await expect(lead.getByText(/^Не хватает: 2 первокурсника, 2 второкурсника\. Собрать состав можно до /))
    .toBeVisible();
  await expectNoSidewaysScroll(lead, testInfo);

  // The same numbers where someone decides whether this team is worth a request: the target is
  // two numbers, not one, so «есть свободные места» alone would not answer them.
  await lead.goto('/teams');
  const card = lead.locator('.card').filter({ has: lead.getByRole('heading', { name: teamName }) });
  await expect(card.getByText('1 курс — 1 из 3 · 2 курс и старше — 1 из 3')).toBeVisible();
  await expectNoSidewaysScroll(lead, testInfo);
});

test('a friend opens the join link signed out and joins through login and the questionnaire', async ({ browser }, testInfo) => {
  expect(people.lead && teamName, 'builds on the team step; run the whole file').toBeTruthy();

  const { page: lead } = await signIn(browser, people.lead);
  await openOwnTeamPage(lead);
  const panel = lead.getByRole('region', { name: 'Ссылка для вступления' });
  await panel.getByRole('button', { name: 'Создать ссылку' }).click();
  await expect(lead.getByRole('status')).toContainText('Ссылка создана');
  const link = await panel.getByRole('textbox', { name: 'Ссылка для вступления' }).inputValue();
  joinLink = link;
  expect(link).toMatch(/\/join\/[\w-]+$/);
  await expectNoSidewaysScroll(lead, testInfo);

  // The friend has never been here: the link sends them to login first.
  const friend = newcomer(testInfo, 'friend');
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(link);
  await expect(page).toHaveURL(/\/login$/);

  // SSO would now bring a newcomer back to the questionnaire; the smoke login stands in for it.
  const landing = await logIn(context, friend);
  expect(landing).toBe('/registration');
  await page.goto(landing);
  await expect(page.getByText(`После анкеты вернём вас к приглашению в команду «${teamName}»`)).toBeVisible();
  await fillQuestionnaire(page, testInfo, { course: 2, group: 5, contact: '@smoke_friend' }, /\/join\/[\w-]+$/);

  await expect(page.getByRole('heading', { name: teamName })).toBeVisible();
  await expectNoSidewaysScroll(page, testInfo);
  await page.getByRole('button', { name: 'Вступить' }).click();
  await expect(page.getByRole('status')).toContainText(`Вы в команде «${teamName}»`);
  await expect(page).toHaveURL(/\/teams\/\d+$/);
  await expect(page.locator('.team-members').getByRole('heading', { name: friend.fio })).toBeVisible();
  people.friend = friend;
});

test('the lead invites a free student and they accept', async ({ browser }, testInfo) => {
  expect(people.lead && teamName, 'builds on the team step; run the whole file').toBeTruthy();
  // A first-year: the seeded targets are 3 + 3 and the first-year places are the ones still free
  // after the earlier steps.
  const invitee = newcomer(testInfo, 'invitee');
  const { page: student } = await signIn(browser, invitee);
  await fillQuestionnaire(student, testInfo, { course: 1, group: 7, contact: '@smoke_invitee' });

  const { page: lead } = await signIn(browser, people.lead);
  await lead.goto('/students');
  await lead.getByRole('search').getByRole('textbox').fill(invitee.fio);
  await lead.getByRole('search').getByRole('button', { name: 'Выполнить поиск' }).click();
  const card = lead.locator('.card').filter({ has: lead.getByRole('heading', { name: invitee.fio }) });
  await expect(card).toBeVisible();
  await expectNoSidewaysScroll(lead, testInfo);
  await card.getByRole('button', { name: 'Пригласить', exact: true }).click();
  await confirm(lead, 'Пригласить в команду?', 'Пригласить');
  await expect(lead.getByRole('status')).toContainText('Приглашение отправлено');

  await lead.goto('/applications');
  const sent = lead.locator('section')
    .filter({ has: lead.getByRole('heading', { name: 'Отправленные приглашения' }) });
  await expect(sent.getByRole('listitem').filter({ hasText: invitee.fio })).toBeVisible();

  // The student answers where everything else waiting for them is.
  await student.goto('/applications');
  const incoming = student.locator('section')
    .filter({ has: student.getByRole('heading', { name: 'Приглашения в команды' }) });
  await expect(incoming.getByRole('link', { name: teamName })).toBeVisible();
  await expectNoSidewaysScroll(student, testInfo);
  await incoming.getByRole('button', { name: 'Принять' }).click();
  await confirm(student, 'Принять приглашение?', 'Принять');
  await expect(student.getByRole('status')).toContainText('Вы в команде');

  // Everything below has to happen inside the running app: a reload would refetch identity and
  // hide exactly the bug this step exists for. The marker dies with the document, so a `goto`
  // slipped in later turns the check red instead of quietly making it vacuous.
  await student.evaluate(() => { window.__sameDocument = true; });
  // The shell has to know the student is in a team now, or the catalogue keeps offering
  // «Подать заявку» and «Моя команда» keeps pointing at the cabinet.
  await navigateTo(student, 'Команды');
  const ownTeamCard = student.locator('.card')
    .filter({ has: student.getByRole('heading', { name: teamName }) });
  await expect(ownTeamCard).toBeVisible();
  await expect(student.getByRole('button', { name: 'Подать заявку', exact: true })).toHaveCount(0);
  await navigateTo(student, 'Моя команда');
  await expect(student).toHaveURL(/\/teams\/\d+$/);
  await expect(student.getByRole('heading', { name: teamName, level: 1 })).toBeVisible();
  expect(await student.evaluate(() => window.__sameDocument), 'navigated without reloading').toBe(true);

  // Nothing is left waiting on the lead's side: the invite is answered, not cancellable any more.
  await lead.goto('/applications');
  const answered = sent.getByRole('listitem').filter({ hasText: invitee.fio });
  await expect(answered).toContainText('Принята');
  await expect(answered.getByRole('button', { name: 'Отменить приглашение', exact: true })).toHaveCount(0);
  people.invitee = invitee;
});

test('the lead removes a member and another one leaves', async ({ browser }, testInfo) => {
  expect(people.lead && people.invitee && people.friend, 'builds on the invite step; run the whole file').toBeTruthy();

  const { page: lead } = await signIn(browser, people.lead);
  await openOwnTeamPage(lead);
  const members = lead.locator('.team-members');
  // The lead is named once — the page used to name them beside the roster as well — and there is
  // no way out that keeps the team: they hand the role over or disband it.
  await expect(members.locator('.card-badge')).toHaveText(['Тимлид']);
  await expect(lead.getByRole('button', { name: 'Выйти из команды' })).toHaveCount(0);
  await expect(lead.getByRole('button', { name: 'Распустить команду' })).toBeVisible();
  await expect(members.getByText('1 курс — 2 из 3 · 2 курс и старше — 2 из 3')).toBeVisible();
  await expectNoSidewaysScroll(lead, testInfo);

  // The rest happens inside the running app: the roster has to change on its own, and a reload
  // would hide one that never did. The marker dies with the document, so a `goto` slipped in later
  // turns the check red instead of quietly making it vacuous.
  await lead.evaluate(() => { window.__sameDocument = true; });
  const inviteeCard = members.locator('.card')
    .filter({ has: lead.getByRole('heading', { name: people.invitee.fio }) });
  await inviteeCard.getByRole('button', { name: 'Исключить', exact: true }).click();
  await confirm(lead, 'Исключить участника?', 'Исключить');
  await expect(lead.getByRole('status')).toContainText('Участник исключён');
  await expect(inviteeCard).toHaveCount(0);
  await expect(members.getByText('1 курс — 1 из 3 · 2 курс и старше — 2 из 3')).toBeVisible();
  expect(await lead.evaluate(() => window.__sameDocument), 'the roster changed without reloading').toBe(true);

  // The one who joined by the link leaves on their own — and manages nobody else on the way.
  const { page: friend } = await signIn(browser, people.friend);
  await friend.goto('/profile');
  await openMyTeamSection(friend);
  await friend.locator('.card').filter({ has: friend.getByRole('heading', { name: teamName }) })
    .getByRole('link').click();
  await expect(friend.getByRole('heading', { name: teamName, level: 1 })).toBeVisible();
  await expect(friend.getByRole('button', { name: 'Исключить' })).toHaveCount(0);
  await expect(friend.getByRole('button', { name: 'Сделать тимлидом' })).toHaveCount(0);
  await expectNoSidewaysScroll(friend, testInfo);
  // Leaving takes them to the catalogue, and it has to be the app that takes them: a full load
  // would refetch identity on the way and hide a shell that never learned they left.
  await friend.evaluate(() => { window.__sameDocument = true; });
  await friend.getByRole('button', { name: 'Выйти из команды' }).click();
  await confirm(friend, 'Выйти из команды?', 'Выйти');
  await expect(friend.getByRole('status')).toContainText('Вы вышли из команды');
  await expect(friend).toHaveURL(/\/teams$/);
  expect(await friend.evaluate(() => window.__sameDocument), 'left without reloading').toBe(true);
  await expect(friend.getByRole('button', { name: 'Подать заявку', exact: true }).first()).toBeVisible();

  // Both sides agree afterwards: their cabinet has no team, the lead's roster has no them.
  await friend.goto('/profile');
  await openMyTeamSection(friend);
  await expect(friend.getByText('Вы пока не в команде.')).toBeVisible();
  await openOwnTeamPage(lead);
  await expect(members.getByRole('heading', { name: people.friend.fio })).toHaveCount(0);
});

test('a registered student opens the link signed out and is brought back to it after login @desktop', async ({ browser }) => {
  expect(joinLink, 'builds on the join-link step; run the whole file').toBeDefined();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(joinLink);
  await expect(page).toHaveURL(/\/login$/);

  // A participant lands in the catalogue after SSO; the app has to take them back to the invitation.
  const landing = await logIn(context, { email: 'second@smoke.test' });
  expect(landing).toBe('/teams');
  await page.goto(landing);
  await expect(page).toHaveURL(joinLink);
  await page.getByRole('button', { name: 'Вступить' }).click();
  await expect(page.getByRole('status')).toContainText(`Вы в команде «${teamName}»`);

  // The way back was used once: moving on does not bounce them to the invitation again.
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
  await expect(page).toHaveURL(/\/profile$/);
});

/**
 * The number a stat block shows, found by the words under it.
 *
 * The label is matched exactly against its own span: a block also carries a hint, and «1 курс» is
 * a substring of the hint under «без команды» — a loose filter would match two blocks and die on
 * strict mode instead of on the number.
 */
async function statValue(page, label) {
  const stat = page.locator('.admin-stat').filter({ has: page.getByText(label, { exact: true }) });
  await expect(stat, `«${label}» is on the overview`).toBeVisible();
  return Number(await stat.locator('.admin-stat-value').innerText());
}

test('the admin lands on the overview and sees the team @desktop', async ({ browser }) => {
  expect(teamName, 'builds on the team step; run the whole file').toBeDefined();
  const { page, redirect } = await signIn(browser, seeded.admin);
  expect(redirect).toBe('/admin');
  await expect(page.getByRole('link', { name: 'Администрирование' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Где сейчас набор: Смоук-набор/ })).toBeVisible();

  // The cast of this run, counted: the 3 seeded students plus the 3 who filled the questionnaire
  // above — the team's lead and the friend (both 2 курс) and the invitee (1 курс); the first-year
  // who asked to join is the seeded one on desktop. Three of them are in the one team by the end.
  // Every number below is a different field of the answer, so a swapped pair — собраны/не хватает,
  // в командах/без команды, 1 курс/2 курс — turns this red.
  expect(await statValue(page, 'зарегистрировались')).toBe(6);
  expect(await statValue(page, '1 курс')).toBe(2);
  expect(await statValue(page, '2 курс и старше')).toBe(4);
  expect(await statValue(page, 'в командах'), 'the team is down to three by the last step').toBe(3);
  expect(await statValue(page, 'без команды')).toBe(3);
  await expect(page.getByText('1 курс — 1, 2 курс и старше — 2')).toBeVisible();

  expect(await statValue(page, 'всего'), 'the team this run created').toBe(1);
  expect(await statValue(page, 'собраны'), 'it is short of 2 first-years and 1 second-year').toBe(0);
  expect(await statValue(page, 'кого-то не хватает')).toBe(1);

  // Every application this run raised was answered, so nothing is waiting and nothing is stale.
  expect(await statValue(page, 'заявок от студентов')).toBe(0);
  expect(await statValue(page, 'приглашений от команд')).toBe(0);

  await page.goto('/teams');
  await expect(page.getByRole('heading', { name: teamName, level: 3 })).toBeVisible();
});
