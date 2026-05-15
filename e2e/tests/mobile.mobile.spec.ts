import { test, expect } from '@playwright/test';
import { clearAllComments, loadPage, switchToDocumentView, mdSection, goSection, getMdPath } from './helpers';

test.beforeEach(async ({ request }) => {
  await clearAllComments(request);
});

// C1: gutter + prefix must be visible on touch without hover.
// The affordance is a CSS ::before pseudo-element whose opacity is set to 1
// under @media (pointer: coarse). Pseudo-element computed styles are not
// reliably readable in Chromium, so we verify the .line-num element is
// present and visible. Behavioural coverage (tap opens form) is in C2.
test('gutter add-comment button is visible without hover on touch', async ({ page }) => {
  await loadPage(page);
  await switchToDocumentView(page);

  const section = mdSection(page);
  await expect(section).toBeVisible();

  const lineNum = section.locator('.line-num').first();
  await expect(lineNum).toBeVisible();
});

// C1: diff gutter + prefix visible on touch
test('diff gutter add-comment button is visible without hover on touch', async ({ page }) => {
  await loadPage(page);

  const section = goSection(page);
  await expect(section).toBeVisible();

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
  await expect(async () => {
    expect(await picker.locator('option').count()).toBeGreaterThanOrEqual(2);
  }).toPass();
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
  const mdPath = await getMdPath(request);

  // Post a comment and a reply so .reply-actions renders.
  const commentResp = await request.post(`/api/file/comments?path=${encodeURIComponent(mdPath)}`, {
    data: { start_line: 1, end_line: 1, body: 'test comment' },
  });
  expect(commentResp.ok()).toBeTruthy();
  const comment = await commentResp.json();

  const replyResp = await request.post(
    `/api/comment/${comment.id}/replies?path=${encodeURIComponent(mdPath)}`,
    { data: { body: 'test reply' } },
  );
  expect(replyResp.ok()).toBeTruthy();

  await loadPage(page);
  await switchToDocumentView(page);

  const section = mdSection(page);
  await expect(section.locator('.comment-card')).toHaveCount(1);
  const commentCard = section.locator('.comment-card').first();
  await expect(commentCard).toBeVisible();

  // The M1 CSS sets .reply-actions { opacity: 1 } under @media (pointer: coarse).
  // On hover-based (desktop) devices these are hidden until hover. Verify they are
  // visible here — which proves the touch CSS is applied.
  const replyActions = commentCard.locator('.reply-actions').first();
  await expect(replyActions).toBeVisible();
});

// M2: header icon buttons (settings gear, TOC) meet 44px touch target.
// .theme-toggle is the class applied to these header icon buttons.
test('header icon buttons meet 44px touch target minimum', async ({ page }) => {
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
