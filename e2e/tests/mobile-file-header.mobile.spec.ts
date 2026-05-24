import { test, expect } from '@playwright/test';
import { clearAllComments, loadPage, goSection } from './helpers';

// F6: mobile review-mode controls — the file-header has room for the
// filename, doesn't crowd, and the page no longer scrolls horizontally
// because of file-header-viewed checkboxes that overflow.
test.describe('Mobile file-header layout (F6)', () => {
  test.beforeEach(async ({ page, request }) => {
    await clearAllComments(request);
    await loadPage(page);
  });

  test('file-header-viewed checkbox is hidden on mobile', async ({ page }) => {
    // The "Viewed" checkbox has margin-left:auto which consumes all flex
    // space in the header and pushes the filename past the viewport. Hide
    // it on mobile so the filename has room.
    const viewed = page.locator('.file-header-viewed').first();
    await expect(viewed).toBeHidden();
  });

  test('filename has positive visible width on mobile', async ({ page }) => {
    const section = goSection(page);
    await expect(section).toBeVisible();
    const filename = section.locator('.file-header-name').first();
    const box = await filename.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
  });

  test('page has no horizontal scroll at mobile viewport', async ({ page }) => {
    // The full assertion that was deferred from F1 and F5. With F6's
    // .file-header-viewed hide, no remaining element should push the page
    // past the viewport.
    await expect(goSection(page).locator('.diff-container')).toBeVisible();
    const widths = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    expect(widths.scroll).toBeLessThanOrEqual(widths.client + 1);
  });
});
