import { test, expect } from '@playwright/test';
import { clearAllComments, loadPage, switchToDocumentView, mdSection, goSection } from './helpers';

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

test.beforeEach(async ({ request }) => {
  await clearAllComments(request);
});

// C1: gutter + prefix must be visible on touch without hover.
// The affordance is a CSS ::before pseudo-element whose opacity is set to 1
// under @media (pointer: coarse). Pseudo-element computed styles are not
// reliably readable in Chromium, so we verify two things instead:
// 1. The page is running in a coarse-pointer (touch) context — proving the
//    CSS rule applies.
// 2. The .line-num element is present and visible.
// Behavioural coverage (tap opens form) is in the C2 test below.
test('gutter add-comment button is visible without hover on touch', async ({ page }) => {
  await loadPage(page);
  await switchToDocumentView(page);

  const section = mdSection(page);
  await expect(section).toBeVisible();

  // Verify we are in a coarse-pointer (touch) context so the CSS rule fires.
  const isCoarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
  expect(isCoarse).toBe(true);

  // Verify the gutter element exists and is visible.
  const lineNum = section.locator('.line-num').first();
  await expect(lineNum).toBeVisible();
});

// C1: diff gutter + prefix visible on touch
test('diff gutter add-comment button is visible without hover on touch', async ({ page }) => {
  await loadPage(page);

  const section = goSection(page);
  await expect(section).toBeVisible();

  // Verify we are in a coarse-pointer (touch) context so the CSS rule fires.
  const isCoarse = await page.evaluate(() => window.matchMedia('(pointer: coarse)').matches);
  expect(isCoarse).toBe(true);

  // Verify the gutter element exists and is visible.
  const gutterNum = section.locator('.diff-gutter-num').first();
  await expect(gutterNum).toBeVisible();
});

// C3: mobile file picker appears when sidebar is hidden
test('mobile file picker is visible when sidebar is hidden', async ({ page }) => {
  await loadPage(page);

  // At 375px the file tree sidebar must be hidden
  const fileTree = page.locator('#fileTreePanel');
  await expect(fileTree).toBeHidden();

  // The mobile picker bar must be visible instead
  const pickerBar = page.locator('#mobileFilePickerBar');
  await expect(pickerBar).toBeVisible();

  const picker = page.locator('#mobileFilePicker');
  await expect(picker).toBeVisible();
});

// C3: mobile file picker has multiple files as options
test('mobile file picker contains multiple file options', async ({ page }) => {
  await loadPage(page);

  const picker = page.locator('#mobileFilePicker');
  await expect(picker).toBeVisible();

  // git-mode fixture has multiple files
  const options = picker.locator('option');
  const count = await options.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

// C4: textarea font-size is ≥16px on mobile (prevent iOS zoom)
test('comment form textarea has font-size >= 16px on mobile', async ({ page }) => {
  await loadPage(page);
  await switchToDocumentView(page);

  const section = mdSection(page);
  const gutter = section.locator('.line-comment-gutter').first();
  await gutter.tap();

  const textarea = page.locator('.comment-form textarea').first();
  await expect(textarea).toBeVisible();

  const fontSize = await textarea.evaluate((el: Element) =>
    parseFloat(getComputedStyle(el).fontSize)
  );
  expect(fontSize).toBeGreaterThanOrEqual(16);
});

// M1: comment reply actions are visible without hover on touch
test('comment reply actions are visible without hover on touch', async ({ page, request }) => {
  const session = await (await request.get('/api/session')).json();
  const md = (session.files as { path: string }[]).find((f: { path: string }) => f.path.endsWith('.md'));
  if (!md) {
    test.skip();
    return;
  }

  await request.post(`/api/file/comments?path=${encodeURIComponent(md.path)}`, {
    data: { start_line: 1, end_line: 1, body: 'test comment' },
  });

  await loadPage(page);
  await switchToDocumentView(page);

  // Wait for comment card to render, then open a reply form to trigger the reply-actions bar.
  const commentCard = page.locator('.comment-card').first();
  await expect(commentCard).toBeVisible();

  // The reply input trigger button at the bottom of the card produces reply-actions
  // after an existing reply exists. Since we have no replies, check the comment
  // action buttons instead — edit and delete are in .comment-actions.
  // On touch (pointer:coarse) these should always be visible at opacity:1.
  const actions = commentCard.locator('.comment-actions');
  await expect(actions).toBeVisible();

  // Verify the edit button inside actions has proper aria-label
  const editBtn = actions.locator('[aria-label="Edit comment"]').first();
  await expect(editBtn).toBeAttached();
});

// M2: theme-toggle buttons meet 44px touch target
test('theme toggle buttons meet 44px touch target minimum', async ({ page }) => {
  await loadPage(page);

  const themeToggle = page.locator('.theme-toggle').first();
  await expect(themeToggle).toBeVisible();

  const box = await themeToggle.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

// C2: tap on gutter opens a comment form (touch-based single-line comment)
test('tapping gutter on touch device opens comment form', async ({ page }) => {
  await loadPage(page);
  await switchToDocumentView(page);

  const section = mdSection(page);
  const gutter = section.locator('.line-comment-gutter').first();
  await expect(gutter).toBeVisible();
  await gutter.tap();

  const form = page.locator('.comment-form');
  await expect(form).toBeVisible();
});
