import { test, expect } from '@playwright/test';

for (const legacyCSS of [false, true]) {
  test(`tablet field renders and touch rescues work${legacyCSS ? ' without CSS math or inset' : ''}`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    if (legacyCSS) {
      // Model older iPad WebKit ignoring unsupported declarations. Strip the
      // source before parsing so duplicate fallback declarations are preserved.
      await page.route('**/styles.css', async route => {
        const response = await route.fetch();
        const css = (await response.text())
          .replace(/[\w-]+\s*:\s*(?:clamp|min|max)\([^;{}]*\)\s*;/g, '')
          .replace(/\binset\s*:[^;{}]*;/g, '');
        await route.fulfill({ response, body: css });
      });
    }
    await page.clock.install();
    await page.goto('/');
    for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
      await page.setViewportSize(viewport);
      const field = await page.locator('#world').boundingBox();
      expect(field.height).toBeGreaterThanOrEqual(520);
      const scenery = await page.locator('#scenery > svg').boundingBox();
      expect(scenery).toEqual(field);
      expect(await page.locator('#overlay').boundingBox()).toEqual(field);
      const card = await page.locator('.overlay-card').boundingBox();
      expect(card.width).toBeLessThanOrEqual(465);
      expect(card.x).toBeGreaterThanOrEqual(field.x);
      expect(card.y).toBeGreaterThanOrEqual(field.y);
      expect(card.y + card.height).toBeLessThanOrEqual(field.y + field.height);
      await expect(page.getByRole('button', { name: /Let’s free some bahookies/ })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.getByRole('button', { name: /Let’s free some bahookies/ }).tap();
    await page.clock.runFor(15000);
    await expect(page.locator('.state-stuck')).toHaveCount(3);
    const id = await page.locator('.state-stuck').filter({ hasText: '2 wiggles' }).first().getAttribute('data-bear-id');
    const bear = page.locator(`[data-bear-id="${id}"]`);
    await expect(bear.locator('.bear-art')).toBeVisible();
    expect((await bear.boundingBox()).width).toBeGreaterThanOrEqual(132);
    await bear.tap();
    await expect(bear.locator('.swipe-count')).toHaveText('1 wiggle');
    await bear.tap();
    await expect(page.locator('#rescued-count')).toHaveText('1');
    await expect(page.locator('#total-score')).toHaveText('120');
    expect(errors).toEqual([]);
  });
}
