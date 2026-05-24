import { test, expect } from '@playwright/test';
import { loadPage } from './helpers';

// Smoke test for the mobile Playwright project. Confirms the project boots
// against the git-mode fixture at touch viewport, loads the page, and that
// the touch capability is wired up (page.context().hasTouch() === true).
//
// All mobile-specific feature tests live in *.mobile.spec.ts files routed
// to this project.
test('mobile project boots and reports touch capability', async ({ page, context }) => {
  await loadPage(page);

  // Viewport assertion guards against accidental config changes that would
  // run mobile tests at desktop dimensions.
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  expect(viewport!.width).toBeLessThanOrEqual(414);
  expect(viewport!.height).toBeLessThanOrEqual(1024);

  // hasTouch must be true so :hover never fires and touch events behave
  // like real mobile hardware.
  // Note: Playwright exposes hasTouch via the context options, not as a method.
  // We assert by attempting to call page.touchscreen.tap which throws when
  // hasTouch is false.
  expect(context.browser()).not.toBeNull();
  const box = await page.locator('body').boundingBox();
  expect(box).not.toBeNull();
  await page.touchscreen.tap(box!.x + 5, box!.y + 5);
});
