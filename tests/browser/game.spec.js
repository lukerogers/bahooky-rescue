import { test, expect } from '@playwright/test';

async function boot(page) {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: /Let’s free some bahookies/ }).click();
  await page.clock.runFor(15000);
  await expect(page.locator('.state-stuck')).toHaveCount(3);
  await expect(page.locator('.bear')).toHaveCount(4);
}

async function probeAudio(page) {
  await page.addInitScript(() => {
    window.__audioProbe = { started: 0, types: [], contexts: [], decoded: [], boings: [], farts: [] };
    // Associate the real fetched bytes with decoded buffers, without mocking
    // requests or playback, so boing and fart recordings can be counted apart.
    const clipNames = new WeakMap();
    const bufferNames = new WeakMap();
    const realFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await realFetch(...args);
      if (/\/assets\/(boing[1-3]|fart[1-5])\.mp3$/.test(response.url)) {
        const arrayBuffer = response.arrayBuffer.bind(response);
        response.arrayBuffer = async () => {
          const data = await arrayBuffer();
          clipNames.set(data, response.url.split('/').at(-1));
          return data;
        };
      }
      return response;
    };
    const Original = window.AudioContext;
    if (!Original) return;
    window.AudioContext = class extends Original {
      constructor(...args) { super(...args); window.__audioProbe.contexts.push(this); }
      async decodeAudioData(data) {
        const buffer = await super.decodeAudioData(data);
        const name = clipNames.get(data);
        bufferNames.set(buffer, name);
        window.__audioProbe.decoded.push({ name, duration: buffer.duration });
        return buffer;
      }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (...args) => {
          const name = bufferNames.get(source.buffer);
          const kind = name?.startsWith('boing') ? 'boings' : 'farts';
          window.__audioProbe[kind].push({ name, duration: source.buffer.duration, channels: source.buffer.numberOfChannels });
          return start(...args);
        };
        return source;
      }
      createOscillator() {
        const oscillator = super.createOscillator();
        const start = oscillator.start.bind(oscillator);
        oscillator.start = (...args) => {
          window.__audioProbe.started++;
          window.__audioProbe.types.push(oscillator.type);
          return start(...args);
        };
        return oscillator;
      }
    };
  });
}

async function center(locator) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function twoWiggleBear(page) {
  const match = page.locator('.state-stuck').filter({ hasText: '2 wiggles' }).first();
  const id = await match.getAttribute('data-bear-id');
  return page.locator(`[data-bear-id="${id}"]`);
}

async function swipe(page, locator, { cancel = false, jitter = false, dx = 54, dy = 18 } = {}) {
  const position = await center(locator);
  const session = await page.context().newCDPSession(page);
  const touch = (x, y) => [{ x, y, id: 1, radiusX: 9, radiusY: 9 }];
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(position.x, position.y) });
  if (cancel) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  } else {
    for (let step = 1; step <= 6; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(position.x + (jitter ? step % 3 : step * dx / 6), position.y + (jitter ? step % 2 : step * dy / 6)) });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await session.detach();
}

test('touch taps, swipes, jitter, cancellation, jiggle and no page scrolling', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await boot(page);
  const two = await twoWiggleBear(page);
  await center(two);
  const scrollBefore = await page.evaluate(() => scrollY);
  await swipe(page, two, { cancel: true });
  await expect(two.locator('.swipe-count')).toHaveText('2 wiggles');
  await expect(page.locator('#total-score')).toHaveText('0');
  await swipe(page, two);
  await expect(two.locator('.swipe-count')).toHaveText('1 wiggle');
  await expect(two.locator('.urn-piece')).toHaveClass(/jiggle/);
  expect(await two.locator('.urn-piece').evaluate(node => getComputedStyle(node).animationName)).toBe('urn-jiggle');
  await expect(page.locator('#total-score')).toHaveText('10');
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  await swipe(page, two, { jitter: true });
  await expect(page.locator('#total-score')).toHaveText('120');
  await expect(page.locator('#rescued-count')).toHaveText('1');
  const one = page.locator('.state-stuck').filter({ hasText: '1 wiggle' }).first();
  const position = await center(one);
  await page.touchscreen.tap(position.x, position.y);
  await expect(page.locator('#total-score')).toHaveText('230');
  await expect(page.locator('#rescued-count')).toHaveText('2');
  expect(await page.locator('#world').evaluate(node => getComputedStyle(node).touchAction)).toBe('none');
  expect(await page.locator('.bear').first().evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(120);
  expect(errors).toEqual([]);
});

test('pause freezes bears and keeps swipe progress, then resumes', async ({ page }) => {
  await boot(page);
  const bear = await twoWiggleBear(page);
  const id = await bear.getAttribute('data-bear-id');
  await swipe(page, bear);
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  const snapshot = await page.locator('#bears').innerHTML();
  await page.clock.runFor(20000);
  expect(await page.locator('#bears').innerHTML()).toBe(snapshot);
  await expect(page.getByRole('heading', { name: 'Bears on a break.' })).toBeVisible();
  await expect(page.locator('#total-score')).toHaveText('10');
  await page.getByRole('button', { name: /Ready to wiggle/ }).click();
  const resumed = page.locator(`[data-bear-id="${id}"]`);
  await expect(resumed.locator('.swipe-count')).toHaveText('1 wiggle');
  await swipe(page, resumed);
  await expect(page.locator('#total-score')).toHaveText('120');
});

test('all eight MP3s decode; each wiggle boings once and removal farts once; pause/mute stay silent', async ({ page }) => {
  const clips = [];
  page.on('response', response => {
    if (/\/assets\/(boing[1-3]|fart[1-5])\.mp3$/.test(response.url())) clips.push({ name: response.url().split('/').at(-1), status: response.status(), type: response.headers()['content-type'] });
  });
  await probeAudio(page);
  await page.clock.install();
  await page.goto('/');
  expect(await page.evaluate(() => window.__audioProbe.contexts.length)).toBe(0);
  expect(clips).toEqual([]);
  await page.getByRole('button', { name: 'Turn sound on', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Turn sound off', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => window.__audioProbe.contexts[0].state)).toBe('running');
  await expect.poll(() => page.evaluate(() => window.__audioProbe.decoded.length)).toBe(8);
  await expect.poll(() => page.evaluate(() => window.__audioProbe.boings.length)).toBe(1); // sound-on preview
  expect(clips.map(clip => clip.name).sort()).toEqual(['boing1.mp3', 'boing2.mp3', 'boing3.mp3', 'fart1.mp3', 'fart2.mp3', 'fart3.mp3', 'fart4.mp3', 'fart5.mp3']);
  expect(clips.every(clip => clip.status === 200 && clip.type === 'audio/mpeg')).toBe(true);
  expect(await page.evaluate(() => window.__audioProbe.decoded.every(buffer => buffer.duration > 0))).toBe(true);
  const before = await page.evaluate(() => window.__audioProbe.started);
  await page.getByRole('button', { name: /Let’s free some bahookies/ }).click();
  await page.clock.runFor(30000);
  expect(await page.evaluate(() => window.__audioProbe.started)).toBe(before);
  expect(await page.evaluate(() => window.__audioProbe.farts.length)).toBe(0);
  expect(await page.evaluate(() => window.__audioProbe.boings.length)).toBe(1);
  await expect(page.locator('.is-farting')).toHaveCount(0);
  const bear = await twoWiggleBear(page);
  await swipe(page, bear, { cancel: true });
  expect(await page.evaluate(() => window.__audioProbe.boings.length)).toBe(1);
  await swipe(page, bear);
  await expect.poll(() => page.evaluate(() => window.__audioProbe.boings.length)).toBe(2);
  expect(await page.evaluate(() => window.__audioProbe.farts.length)).toBe(0);
  await expect(bear).not.toHaveClass(/is-farting/);
  await swipe(page, bear);
  await expect.poll(() => page.evaluate(() => window.__audioProbe.boings.length)).toBe(3);
  expect(await page.evaluate(() => window.__audioProbe.boings.every(clip => /^boing[1-3]\.mp3$/.test(clip.name) && clip.duration > 0))).toBe(true);
  expect(await page.evaluate(() => window.__audioProbe.started)).toBe(before);
  await expect.poll(() => page.evaluate(() => window.__audioProbe.farts.length)).toBe(1);
  expect(await page.evaluate(() => window.__audioProbe.farts[0].duration)).toBeGreaterThan(0);
  await expect(bear).toHaveClass(/state-freed is-farting/);
  await expect(bear.locator('.fart-art')).toBeVisible();
  await expect(bear.locator('.bear-bubble')).toContainText('Prrrpt!');
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await page.getByRole('button', { name: /Ready to wiggle/ }).click();
  await page.clock.runFor(15000);
  expect(await page.evaluate(() => window.__audioProbe.started)).toBe(before);
  expect(await page.evaluate(() => window.__audioProbe.boings.length)).toBe(3);
  expect(await page.evaluate(() => window.__audioProbe.farts.length)).toBe(1);
  expect(clips).toHaveLength(8);
  await expect(page.locator('.is-farting')).toHaveCount(0);
  await page.getByRole('button', { name: 'Turn sound off', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__audioProbe.contexts[0].state)).toBe('suspended');
  const muted = await page.evaluate(() => window.__audioProbe.started);
  const oneId = await page.locator('.state-stuck').filter({ hasText: '1 wiggle' }).first().getAttribute('data-bear-id');
  const one = page.locator(`[data-bear-id="${oneId}"]`);
  await swipe(page, one);
  await expect(one).toHaveClass(/state-freed is-farting/);
  expect(await page.evaluate(() => window.__audioProbe.started)).toBe(muted);
  expect(await page.evaluate(() => window.__audioProbe.boings.length)).toBe(3);
  expect(await page.evaluate(() => window.__audioProbe.farts.length)).toBe(1);
});

test('four complete levels, every swipe count, points, stickers, final win and replay', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await probeAudio(page);
  await boot(page);
  await page.getByRole('button', { name: 'Turn sound on', exact: true }).click();
  const backgrounds = [];
  const counts = new Set();
  const expectedPoints = ['460', '1,060', '1,820', '2,720'];
  for (let level = 0; level < 4; level++) {
    backgrounds.push(await page.locator('#scenery').innerHTML());
    await expect(page.locator('#level-kicker')).toHaveText(`LEVEL ${level + 1} OF 4`);
    await expect(page.locator('#rescue-goal')).toHaveText(String(level + 4));
    await expect(page.locator('.bear')).toHaveCount(level + 4);
    expect(await page.locator('#bears').innerHTML()).not.toContain('undefined');
    for (let wave = 0; wave < 12 && await page.locator('#overlay.hidden').count(); wave++) {
      const stuck = page.locator('.state-stuck:not(:disabled)');
      while (await stuck.count() && await page.locator('#overlay.hidden').count()) {
        const bear = stuck.first();
        const needed = Number((await bear.locator('.swipe-count').textContent()).split(' ')[0]);
        counts.add(needed);
        const id = await bear.getAttribute('data-bear-id');
        const stable = page.locator(`[data-bear-id="${id}"]`);
        for (let i = 0; i < needed; i++) {
          const position = await center(stable);
          await page.touchscreen.tap(position.x, position.y);
        }
      }
      if (await page.locator('#overlay.hidden').count()) await page.clock.runFor(8000);
    }
    await expect(page.locator('#overlay')).not.toHaveClass(/hidden/);
    await expect(page.locator('.sticker.unlocked')).toHaveCount(level + 1);
    await expect(page.locator('#total-score')).toHaveText(expectedPoints[level]);
    const celebration = await page.locator('#overlay').innerHTML();
    await page.clock.runFor(12000);
    expect(await page.locator('#overlay').innerHTML()).toBe(celebration);
    if (level < 3) {
      await page.getByRole('button', { name: /^Next:/ }).click();
      await page.clock.runFor(8000);
    }
  }
  expect(new Set(backgrounds).size).toBe(4);
  expect([...counts].sort()).toEqual([1, 2, 3, 4, 5]);
  await expect(page.getByRole('heading', { name: /You won!.*The Big Bahooky!/ })).toBeVisible();
  await expect(page.locator('.celebration-stats')).toContainText('22');
  expect(await page.evaluate(() => window.__audioProbe.farts.length)).toBe(22);
  expect(await page.evaluate(() => window.__audioProbe.boings.length)).toBe(53); // 52 wiggles + sound-on preview
  expect(await page.evaluate(() => window.__audioProbe.started)).toBe(20); // five melody notes per level
  await expect(page.locator('#help-text')).toContainText('Every bahooky is free!');
  await expect(page.locator('#announcer')).toContainText('The Big Bahooky');
  await page.getByRole('button', { name: /Another silly adventure/ }).click();
  await expect(page.locator('#total-score')).toHaveText('0');
  await expect(page.locator('.sticker.unlocked')).toHaveCount(0);
  await expect(page.locator('#level-kicker')).toHaveText('LEVEL 1 OF 4');
  expect(errors).toEqual([]);
});

test('keyboard help, reduced motion, and narrow layout work without overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await boot(page);
  const two = await twoWiggleBear(page);
  await two.focus();
  await page.keyboard.press('Enter');
  await expect(two.locator('.swipe-count')).toHaveText('1 wiggle');
  await page.keyboard.press('Space');
  await expect(page.locator('#total-score')).toHaveText('120');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Bears on a break.' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#overlay')).toHaveClass(/hidden/);
  expect(await page.locator('.bear-body').first().evaluate(node => getComputedStyle(node).animationName)).toBe('none');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('long vertical touch, mouse dragging, and narrow/tablet layouts stay forgiving', async ({ page }) => {
  await boot(page);
  const first = await twoWiggleBear(page);
  await center(first);
  const scrollBefore = await page.evaluate(() => scrollY);
  await swipe(page, first, { dx: 0, dy: 120 });
  await expect(first.locator('.swipe-count')).toHaveText('1 wiggle');
  await expect(page.locator('#total-score')).toHaveText('10');
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  const second = await twoWiggleBear(page);
  const position = await center(second);
  await page.mouse.move(position.x, position.y);
  await page.mouse.down();
  await page.mouse.move(position.x + 100, position.y - 120, { steps: 20 });
  await page.mouse.up();
  await expect(second.locator('.swipe-count')).toHaveText('1 wiggle');
  await expect(page.locator('#total-score')).toHaveText('20');
  await expect(page.locator('#rescued-count')).toHaveText('0');
  for (const viewport of [{ width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const contained = await page.locator('#world').evaluate(world => {
      const field = world.getBoundingClientRect();
      return [...world.querySelectorAll('.bear')].every(node => {
        const bear = node.getBoundingClientRect();
        return bear.left >= field.left && bear.right <= field.right && bear.top >= field.top && bear.bottom <= field.bottom;
      });
    });
    expect(contained, `all bears must stay inside a ${viewport.width}px field`).toBe(true);
  }
});
