import { test, expect } from '@playwright/test';
import { logIn, seeded } from './support/people';

// The one thing #19 promises, made mechanical: the header, the search field and the page content
// are three different containers in the source, and a person sees them as one left edge and one
// right edge. Widths are set per case, so this runs once — the phone project would prove the same
// six things a second time.
const WIDTHS = [360, 600, 780, 900, 1280, 1920];

const PAGES = [
  { path: '/teams', content: '.content-layout', hasSearch: true },
  { path: '/profile', content: '.cabinet-page', hasSearch: false },
  { path: '/how-it-works', content: '.how-page', hasSearch: false },
];

/** Where the content of a container actually starts and ends — its padding edges, not its box. */
async function contentEdges(page, selector) {
  return page.locator(selector).first().evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      left: Math.round(rect.left + parseFloat(style.paddingLeft)),
      right: Math.round(rect.right - parseFloat(style.paddingRight)),
    };
  });
}

test('the header, the search field and the page content share their edges @desktop', async ({ browser }) => {
  const context = await browser.newContext();
  await logIn(context, seeded.lead);
  const page = await context.newPage();

  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });

    for (const { path, content, hasSearch } of PAGES) {
      await page.goto(path);
      await expect(page.locator(content)).toBeVisible();
      const where = `${path} at ${width}px`;

      // The bar itself spans the window; the row inside it is the part that has to line up.
      const header = await contentEdges(page, '.navbar-row');
      const body = await contentEdges(page, content);
      expect(header, `${where}: the header and the content must share both edges`).toEqual(body);

      if (hasSearch) {
        const search = await contentEdges(page, '.search-bar');
        expect(search, `${where}: the search row must share both edges too`).toEqual(body);
      }

      // Agreeing on an edge is not enough: with no container at all the three would agree on 0
      // and the full width. The gutter has to be there, and the line length has to be capped.
      expect(body.left, `${where}: the content must be held off the edge`).toBeGreaterThan(0);
      expect(body.right - body.left, `${where}: the content must not be wider than the container`)
        .toBeLessThanOrEqual(1200 - 2 * (width >= 600 ? 24 : 16));

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${where}: nothing may push the page sideways`).toBeLessThanOrEqual(0);
    }
  }
});
