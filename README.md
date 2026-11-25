# Bahooky Rescue!

A small, cheerful browser game about bears with urns stuck on their **bahookies**. Built with plain HTML, CSS, JavaScript, and original inline SVG artwork. No runtime dependencies, external assets, ads, accounts, or network requests beyond the local game files.

## Run

Use Node.js 18 or newer:

```sh
npm install
npm start
```

Open **http://localhost:3000**. No build step is needed. `npm run dev` starts the same server. Set `PORT` to change the port.

For a phone or tablet on the same trusted Wi-Fi network, open `http://<your-computer-LAN-IP>:3000` and allow the local server through your firewall if necessary. The server listens on all interfaces; it is a development server, not a public production host.

## Deploy to Cloudflare Pages

This is a static site; it does not need a server-side runtime. Build the Pages-ready files with Node.js 18 or newer:

```sh
npm install
npm run build
```

The build copies only the site and its assets into `dist/`. To publish with the Cloudflare dashboard:

1. Push this project to a GitHub or GitLab repository.
2. In Cloudflare, open **Workers & Pages → Create application → Pages → Connect to Git** and select the repository.
3. Set **Framework preset** to **None**, **Build command** to `npm run build`, and **Build output directory** to `dist`. Leave the root directory as `/` and do not set a deploy command.
4. Save and deploy. Cloudflare will build on each push; the first deployment will provide a `*.pages.dev` URL.
5. To use your own domain, open the Pages project’s **Custom domains** tab and follow the prompts.

To deploy manually from a local terminal instead, install/authenticate Wrangler once, create the Pages project, then build and deploy:

```sh
npx wrangler login
npx wrangler pages project create bahooky-rescue
npm run build
npx wrangler pages deploy dist --project-name=bahooky-rescue
```

The game, including its MP3s, is served as static files; progress remains in memory and resets on reload as it does locally.

## Install on an iPad

1. Deploy the site over **HTTPS** (the Cloudflare Pages URL above works).
2. Open that URL in **Safari** on the iPad.
3. Tap **Share → Add to Home Screen**. If shown, leave **Open as Web App** enabled, then tap **Add**.
4. Launch **Bahooky Rescue!** from the Home Screen. It opens as a standalone app without Safari’s normal browser toolbar.
5. Keep the app open online for a few seconds on its first launch so offline files can finish downloading. Then try closing it, enabling Airplane Mode, and opening it again.

The game and all eight sound recordings are cached for offline play; sound still starts off and requires a tap to enable. No App Store or Apple developer account is needed. Installing does **not** save progress: reloading or relaunching starts a fresh game. iPadOS may clear cached website data under storage pressure; reconnect and open the app to restore offline files.

An ordinary `http://<LAN-IP>:3000` address is fine for online play, but cannot register the service worker needed for offline support. Use HTTPS for iPad testing; the `localhost` development exception only applies on the device running the browser.

### Offline updates and development

`npm run build` includes the manifest, icons, and service worker in `dist/` and gives each changed build a new content-based cache version. Updates download when the app is opened online and wait until all existing game windows are closed before activating, so an ongoing game is not interrupted. Only this app’s old caches are removed.

When serving the source directly with `npm start`, bump `VERSION` in `sw.js` after editing cached files, or unregister the worker and clear its cache in browser developer tools. Add any new runtime files to `APP_FILES` in `sw.js` so they also work offline. To regenerate the committed PNG app icons after changing `assets/icon.svg`, run `npm run icons` (requires the same Chrome/Chromium setup as browser tests).

## Play

1. Choose **Let’s free some bahookies!**
2. A bigger cast of **4, 5, 6, then 7 bears** wanders in random patterns, pees on little rocks, and accidentally backs into urns. Their routes, turns, starting positions, and small speed variations change each playthrough.
3. When a bear stops, **tap or swipe anywhere on that bear/urn**. Every separate gesture is one wiggle, in any direction. The label and dots show how many remain. **An urn popping off triggers a fart puff, “Prrrpt!”, and one randomly selected recording from `assets/fart1.mp3` through `assets/fart5.mp3` when sound is on.** There are no wandering or getting-stuck farts.
4. Earn **10 points per wiggle + 100 per freed bahooky**. There are no speed bonuses, penalties, lives, or timers.
5. Enjoy a celebration and a new sticker after each level. Choose the next level whenever ready.
6. Finish all four levels to win: **“You’re The Big Bahooky!”** Replay starts a fresh adventure.

| Level | Background | Bears / rescues | Wiggles per urn | Sticker |
| --- | --- | ---: | --- | --- |
| 1 | Sunny Meadow | 4 | 1–2 | Toot Scout |
| 2 | Bubble Pond | 5 | 1–3 | Puddle Pal |
| 3 | Peachy Orchard | 6 | 2–4 | Wiggle Wizard |
| 4 | Moonlight Picnic | 7 | 1–5 | Big Bahooky |

All 22 rescues earn **2,720 points** and all four stickers. Each bear needs rescuing once, then keeps wandering. The bear pace rises only slightly; **stuck bears never move or time out**. Only three bears can reserve urn stations at once, so the large rescue targets remain separate. Wandering bears stay within the field and cannot cover or intercept those targets.

### Comfort and input

- Sound starts **off**. **Sound on** enables one random recording from `assets/boing1.mp3` through `assets/boing3.mp3` for each accepted wiggle, a random MP3 fart on each urn removal, and a short celebration melody. Taps and keyboard wiggles play boings too; cancelled gestures do not. Enabling sound plays a single boing preview. All eight local recordings preload and cache on first opt-in, play at 25% gain, and stop on pause/mute. No autoplay. A clip that fails to load or decode is skipped without interrupting the game.
- Large bear targets (at least 132 px wide) accept both taps and 20 px swipes. One gesture cannot count multiple times. Cancelled touches do not count.
- The play field disables touch scrolling, selection, and the long-press context menu. The page can still scroll outside the play field.
- **Pause** keeps every point and partial wiggle. Switching to another tab automatically pauses the game.
- **Tab + Enter/Space** also free bears; **Escape** pauses/resumes. Stuck bears have accessible labels, and rescues/rewards have live announcements.
- The device's **Reduce Motion** preference removes running/hopping/puff/confetti animations and keeps only a short, direct urn jiggle as input feedback.
- No flashing, graphic injuries, sudden volume changes, or losing. Progress stays in memory for the current page; reloading resets it.

## Checks

```sh
npm test              # 14 pure game-logic and audio tests
npm run test:browser  # 24 browser tests: Chromium desktop/phone + WebKit tablet
npm run test:all      # both suites
```

Browser tests use installed Windows Chrome when available. Elsewhere, install the test browser once:

```sh
npx playwright install chromium webkit
```

Install WebKit with `npx playwright install webkit` even when using system Chrome. The `ipad-webkit` project checks tablet portrait/landscape layout and touch rescues, including simulated lack of CSS math functions and `inset`. Set `BROWSER_PATH` to a Chrome/Chromium executable to override the Chromium choice. Browser tests automatically start the local server. Failure screenshots and traces go into `test-results/`.

### Verified

- PWA manifest, PNG icon dimensions, and Apple Home Screen metadata. Offline reopening, gameplay, and decoding all eight sound clips at both the site root and a built subdirectory URL.
- Actual browser touch events: tapping, directional/long vertical swiping, small finger jitter, touch cancellation, no duplicate counts, and no play-field scroll. Mouse dragging is checked too.
- Jiggle animation and minimum target size.
- Tablet scenery and start-dialog bounds in portrait/landscape, plus touch rescues in Chromium and WebKit. Layout remains playable when CSS math functions and `inset` are stripped to simulate older iPad WebKit.
- Sound opt-in, running Web Audio context, exactly one MP3 boing per wiggle, exactly one MP3 fart per rescue (including level-ending rescues), visible rescue puffs, no ambient farts, no duplicate sounds after pause/resume, and silent muting.
- All eight actual MP3s (three boings and five farts) serve as `audio/mpeg` and decode in Chromium. Unit tests cover selection of every recording, caching, cleanup, cancellation of delayed loads on pause/mute, and failed downloads/decoding.
- Random bounded paths and direction changes across seeds; seven bears sharing three exclusive urn stations without deadlocks across 20 seeded runs.
- Pause/resume without movement, point changes, or lost partial swipes.
- All four backgrounds, increasing goals, every count from 1 through 5, exact points, stickers, and celebrations that wait for input.
- Complete win screen with “The Big Bahooky!”, 22 rescues, 2,720 points, all four stickers, and clean replay.
- Keyboard input, reduced motion, no horizontal overflow, contained targets at 320 px/768 px/landscape widths, and no browser JavaScript errors during touch play/completion.

### Not yet verified

Physical touchscreen devices, Safari/iPadOS Home Screen installation and offline relaunch, Firefox, perceived sound/volume through real speakers, and playtesting with the intended child. Browser touch tests emulate a 390 × 844 phone in Chromium and tablet layouts in Chromium/WebKit; they are not a substitute for testing the actual iPad and its iPadOS version. Adjust comfort, pacing, and humor based on his response.

## Files

- `index.html` — page, HUD, controls, play field, sticker shelf.
- `styles.css` — responsive layout, touch targets, animation, reduced-motion styles.
- `src/engine.js` — four finite levels, bear state machine, swipe counts, points, rewards.
- `src/main.js` — rendering, celebrations, announcements, pause, replay.
- `src/input.js` — pointer/tap/keyboard input and mobile compatibility-click protection.
- `src/audio.js` — opt-in random cached MP3 boing/fart playback and a synthesized celebration melody.
- `assets/boing1.mp3` through `assets/boing3.mp3`, `assets/fart1.mp3` through `assets/fart5.mp3` — the eight supplied recordings (unchanged).
- `src/art.js`, `assets/icon.svg` — original bears, urns, backgrounds, stickers, favicon.
- `manifest.webmanifest`, `sw.js`, `src/pwa.js` — installation metadata, versioned offline cache, and service worker registration.
- `assets/apple-touch-icon.png`, `assets/icon-192.png`, `assets/icon-512.png`, `scripts/generate-icons.js` — Home Screen icons and their generator.
- `scripts/build.js` — static deployment build and automatic offline cache versioning.
- `server.js`, `package.json`, `package-lock.json` — local server and commands.
- `tests/engine.test.js`, `tests/audio.test.js`, `tests/browser/game.spec.js`, `tests/browser/pwa.spec.js`, `tests/browser/tablet.spec.js`, `playwright.config.js` — automated checks.
