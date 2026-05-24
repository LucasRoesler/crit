import { test, expect } from '@playwright/test';
import { clearAllComments, loadPage, goSection } from './helpers';

// F3: visible touch-only `+` affordance.
// On touch (pointer:coarse), the user sees a `+` prefix next to each
// commentable line number (a CSS ::before pseudo-element on .line-num
// / .diff-gutter-num). The desktop blue `+` button (.line-add /
// .diff-comment-btn) is hidden on touch because it depends on hover.
test.describe('Mobile add-comment affordance (F3)', () => {
  test.beforeEach(async ({ page, request }) => {
    await clearAllComments(request);
    await loadPage(page);
  });

  test('line-num ::before "+" prefix is rendered on touch', async ({ page }) => {
    // The ::before pseudo-element on .diff-gutter-num renders a `+` prefix
    // on touch. We assert content is set (not the default 'none') AND that
    // it contains a "+". A computed `content: none` means no pseudo-element
    // exists at all, regardless of opacity.
    const lineNum = goSection(page).locator('.diff-gutter-num').first();
    await expect(lineNum).toBeAttached();
    const beforeStyle = await lineNum.evaluate((el) => {
      const cs = getComputedStyle(el, '::before');
      return { content: cs.content, opacity: parseFloat(cs.opacity) };
    });
    expect(beforeStyle.content).not.toBe('none');
    expect(beforeStyle.content).toContain('+');
    expect(beforeStyle.opacity).toBeGreaterThan(0);
  });

  test('desktop blue .diff-comment-btn is invisible on touch', async ({ page }) => {
    // The .diff-comment-btn element stays in the DOM (F4 will make it the
    // click target on touch). It's visually invisible because its base
    // opacity is 0 and touch never fires hover. Assert opacity:0.
    const btn = page.locator('.diff-comment-btn').first();
    await expect(btn).toBeAttached();
    const opacity = await btn.evaluate((el) =>
      parseFloat(getComputedStyle(el).opacity)
    );
    expect(opacity).toBe(0);
  });
});
