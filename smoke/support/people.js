import { expect } from '@playwright/test';

const BACKEND_URL = process.env.SMOKE_BACKEND_URL ?? 'http://localhost:8080';

/**
 * A person in the journey: their own browser context (own cookies, own session) signed in through
 * the backend's smoke login — the stand-in for SFedU SSO, which a script cannot drive.
 *
 * The login goes through the same CSRF handshake the SPA uses: the backend hands out the
 * XSRF-TOKEN cookie on any response and expects it back in the X-XSRF-TOKEN header.
 */
export async function signIn(browser, person) {
  // The test runner applies the project's options (viewport, baseURL, locale) to every new context.
  const context = await browser.newContext();
  const redirect = await logIn(context, person);

  const page = await context.newPage();
  await page.goto(redirect);
  return { page, context, redirect };
}

/**
 * The login alone, in a context that may already have a page open — for someone who arrives signed
 * out first. Returns where SSO would land them.
 */
export async function logIn(context, { email, fio }) {
  await context.request.get(`${BACKEND_URL}/api/v1/users/me`);
  const token = (await context.cookies(BACKEND_URL)).find((cookie) => cookie.name === 'XSRF-TOKEN');
  expect(token, 'the backend hands out the CSRF cookie').toBeTruthy();

  const response = await context.request.post(`${BACKEND_URL}/api/v1/smoke/login`, {
    data: { email, fio },
    headers: { 'X-XSRF-TOKEN': token.value },
  });
  expect(response.ok(), `smoke login as ${email}: ${response.status()} ${await response.text()}`).toBeTruthy();
  const { redirect } = await response.json();
  return redirect;
}

/** A person nobody has seen before — the first login creates them, as SSO would. */
export function newcomer(testInfo, role) {
  const stamp = `${testInfo.project.name}-${Date.now().toString(36)}`;
  return { email: `${role}-${stamp}@smoke.test`, fio: `Смоук ${role} ${stamp}` };
}

/** Seeded by the backend's smoke profile (db/smoke/afterMigrate.sql). */
export const seeded = {
  admin: { email: 'admin@smoke.test', fio: 'Админов Админ Смоукович' },
  lead: { email: 'lead@smoke.test', fio: 'Лидова Лида Смоуковна' },
  firstYear: { email: 'first@smoke.test', fio: 'Первов Пётр Смоукович' },
  second: { email: 'second@smoke.test', fio: 'Вторая Вера Смоуковна' },
};

/** Students use this from a phone: nothing may push the page sideways at 390px. */
export async function expectNoSidewaysScroll(page, testInfo) {
  if (!testInfo.project.use.isMobile) {
    return;
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(0);
}
