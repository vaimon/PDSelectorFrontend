import { test, expect } from '@playwright/test';
import { expectNoSidewaysScroll, logIn, newcomer, seeded, signIn } from './support/people';

// The student journey against the real backend, one step building on the previous one. Steps still
// to come with their features: invites (#16), "how it works" (#25) and the admin board (#27) each
// add their own step here.
//
// On desktop the team lead and the first-year are the seeded people; at 390px everybody is a
// newcomer who fills the questionnaire from the phone first.
test.describe.configure({ mode: 'serial' });

const people = {};
let teamName;
let joinLink;

async function fillQuestionnaire(page, testInfo, { course, group, contact }, landsOn = /\/profile$/) {
  await expect(page.getByRole('heading', { name: 'Анкета участника отбора' })).toBeVisible();
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

/** Opens «Моя команда» in the cabinet sidebar (the navbar has a link of the same name). */
async function openMyTeamSection(page) {
  await page.locator('.sidebar').getByRole('link', { name: 'Моя команда' }).click();
  await expect(page.getByRole('heading', { name: 'Моя команда', level: 2 })).toBeVisible();
}

test('a newcomer fills the questionnaire and lands in the cabinet', async ({ browser }, testInfo) => {
  const person = newcomer(testInfo, 'newcomer');
  const { page, redirect } = await signIn(browser, person);
  expect(redirect, 'a first login without a questionnaire goes to the questionnaire').toBe('/registration');

  await fillQuestionnaire(page, testInfo, { course: 2, group: 3, contact: '@smoke_newcomer' });

  await expect(page.getByRole('heading', { name: 'Личный кабинет' })).toBeVisible();
  await expect(page.getByText('@smoke_newcomer')).toBeVisible();
  await expect(page.getByText(person.fio).first()).toBeVisible();
  if (!testInfo.project.use.isMobile) {
    // The shell names the current selection; at phone width that line is not shown.
    await expect(page.locator('.navbar').getByText('Смоук-набор')).toBeVisible();
  }
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

  // And the first-year's cabinet now shows the team as theirs.
  await catalog.goto('/profile');
  await openMyTeamSection(catalog);
  await expect(catalog.getByRole('heading', { name: teamName, level: 3 })).toBeVisible();
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

test('the admin sees the team @desktop', async ({ browser }) => {
  expect(teamName, 'builds on the team step; run the whole file').toBeDefined();
  const { page, redirect } = await signIn(browser, seeded.admin);
  expect(redirect).toBe('/admin');
  await expect(page.getByRole('link', { name: 'Администрирование' })).toBeVisible();

  await page.goto('/teams');
  await expect(page.getByRole('heading', { name: teamName, level: 3 })).toBeVisible();
});
