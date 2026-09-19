import { defineConfig, devices } from '@playwright/test';

// The Playwright browser download is not reachable from every network (it times out from ours), so
// the smoke drives the Chrome installed on the machine by default. SMOKE_BROWSER=msedge uses Edge,
// SMOKE_BROWSER=bundled the browser from `npx playwright install chromium`.
const browser = process.env.SMOKE_BROWSER ?? 'chrome';
const channel = browser === 'bundled' ? undefined : browser;

const BACKEND_URL = process.env.SMOKE_BACKEND_URL ?? 'http://localhost:8080';

export default defineConfig({
  testDir: './smoke',
  // One database for the whole run, and each step builds on the previous one.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    // Never someone else's dev server: it may be another branch or point at another backend.
    reuseExistingServer: false,
    env: { VITE_BACKEND_URL: BACKEND_URL },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1280, height: 800 } },
    },
    {
      // Students fill the questionnaire from a phone, straight from a chat link.
      name: 'mobile-390',
      use: {
        ...devices['Desktop Chrome'],
        channel,
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
      grepInvert: /@desktop/,
    },
  ],
});
