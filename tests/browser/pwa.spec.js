import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test.beforeAll(() => {
  execFileSync(process.execPath, [fileURLToPath(new URL('../../scripts/build.js', import.meta.url))]);
});

test('provides an installable manifest and correctly sized iPad/app icons', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');
  const manifestURL = await page.locator('link[rel="manifest"]').getAttribute('href');
  const response = await request.get(manifestURL);
  expect(response.headers()['content-type']).toContain('application/manifest+json');
  const manifest = await response.json();
  expect(manifest).toMatchObject({ id: './', start_url: './', scope: './', display: 'standalone' });
  const appleIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  for (const icon of [...manifest.icons, { src: appleIcon, sizes: '180x180' }]) {
    const image = await request.get(icon.src);
    expect(image.ok()).toBeTruthy();
    expect(image.headers()['content-type']).toBe('image/png');
    const bytes = await image.body();
    expect(bytes.subarray(1, 4).toString()).toBe('PNG');
    expect(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`).toBe(icon.sizes);
  }
});

for (const base of ['/', '/dist/']) {
  test(`reopens offline with playable audio and game files at ${base}`, async ({ page, context }) => {
    await page.goto(base);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
      }
    });
    // Discard the first page and its game state: launch a new page offline.
    await page.close();
    await context.setOffline(true);
    const offline = await context.newPage();
    const errors = [];
    offline.on('pageerror', error => errors.push(error.message));
    await offline.clock.install();
    await offline.goto(`${base}?from=home-screen`);
    await expect(offline.locator('#game-title')).toContainText('Bahooky');
    await offline.getByRole('button', { name: /Let’s free some bahookies/ }).click();
    await offline.clock.runFor(15000);
    await expect(offline.locator('.state-stuck')).toHaveCount(3);
    await offline.locator('.state-stuck').first().click();
    await expect(offline.locator('#total-score')).not.toHaveText('0');
    await offline.getByRole('button', { name: 'Turn sound on' }).click();
    const decoded = await offline.evaluate(async () => {
      const audio = new (window.AudioContext || window.webkitAudioContext)();
      try {
        const clips = ['boing1', 'boing2', 'boing3', 'fart1', 'fart2', 'fart3', 'fart4', 'fart5'];
        return await Promise.all(clips.map(async clip => {
          const response = await fetch(`assets/${clip}.mp3`);
          const buffer = await audio.decodeAudioData(await response.arrayBuffer());
          return buffer.duration > 0;
        }));
      } finally {
        await audio.close();
      }
    });
    expect(decoded).toEqual(Array(8).fill(true));
    // Explicit index URLs work too, not just the directory start_url.
    await offline.goto(`${base}index.html`);
    await expect(offline.getByRole('button', { name: /Let’s free some bahookies/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
