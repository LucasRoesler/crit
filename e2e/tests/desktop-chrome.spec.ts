import { test, expect } from '@playwright/test';
import { clearAllComments, loadPage } from './helpers';

// Desktop invariants — guards against mobile chrome work (F1) bleeding into
// the desktop layout. Runs in the git-mode project at default viewport.
test.describe('Desktop chrome invariants', () => {
  test.beforeEach(async ({ page, request }) => {
    await clearAllComments(request);
    await loadPage(page);
  });

  test('file-tree sidebar is visible on desktop', async ({ page }) => {
    const fileTree = page.locator('#fileTreePanel');
    await expect(fileTree).toBeVisible();
  });

  test('mobile file picker bar is not visible on desktop', async ({ page }) => {
    // The bar element exists in the DOM but should be display:none above the
    // mobile breakpoint.
    const pickerBar = page.locator('#mobileFilePickerBar');
    await expect(pickerBar).toBeHidden();
  });

  test('secondary header controls remain visible on desktop', async ({ page }) => {
    // The mobile breakpoint uses !important to hide these because JS sets
    // their inline display='' unconditionally. Guard against the !important
    // rule leaking to desktop viewport.
    await expect(page.locator('#branchContext')).toBeVisible();
    await expect(page.locator('#diffModeToggle')).toBeVisible();
    // .scope-toggle only shows in git mode with commits — the git-mode fixture
    // satisfies that; if it's hidden on desktop something else went wrong.
    await expect(page.locator('.scope-toggle')).toBeVisible();
  });
});
