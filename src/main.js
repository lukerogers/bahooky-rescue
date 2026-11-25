import { Game, LEVELS, STATIONS } from './engine.js';
import { bearArt, urnArt, sceneryArt, stickerArt } from './art.js';
import { GameAudio } from './audio.js';
import { bindRescueInput } from './input.js';

const $ = id => document.getElementById(id);
const game = new Game();
const audio = new GameAudio();
const world = $('world');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let displayedPhase = '';
let displayedLevel = -1;
let previousTime = 0;
let lastAnnouncement = '';
const bearNodes = new Map();

function announce(text) {
  if (text === lastAnnouncement) return;
  lastAnnouncement = text;
  $('announcer').textContent = text;
}

function renderLevel() {
  const level = game.level;
  world.className = `world theme-${level.theme}`;
  $('scenery').innerHTML = sceneryArt(level.theme);
  $('location-name').textContent = level.location;
  $('location-icon').textContent = level.icon;
  $('level-number').textContent = String(game.levelIndex + 1).padStart(2, '0');
  $('level-kicker').textContent = `LEVEL ${game.levelIndex + 1} OF ${LEVELS.length}`;
  $('level-name').textContent = level.name;
  $('rescue-goal').textContent = level.goal;
  $('progress-dots').innerHTML = Array.from({ length: level.goal }, () => '<span class="progress-dot"></span>').join('');
  $('props').innerHTML = STATIONS.map((station, id) => `<div class="ground-urn" data-station="${id}" style="left:${station.x + 5}%;top:${station.y + 5}%">${urnArt(`ground-${id}`, true)}</div>`).join('');
  $('bears').innerHTML = '';
  bearNodes.clear();
  game.bears.forEach(bear => {
    const node = document.createElement('button');
    node.className = 'bear state-roam';
    node.dataset.bearId = bear.id;
    node.innerHTML = `<span class="bear-bubble"></span>${bearArt(bear.id)}<span class="swipe-pill"><span class="swipe-icon" aria-hidden="true">↔</span><span class="swipe-count"></span><span class="swipe-dots" aria-hidden="true"></span></span>`;
    $('bears').append(node);
    bearNodes.set(bear.id, node);
  });
  displayedLevel = game.levelIndex;
  $('help-text').innerHTML = '<strong>Tap or swipe an urn.</strong> Every wiggle helps!';
}

function renderRewards() {
  $('sticker-shelf').innerHTML = LEVELS.map((level, index) => {
    const unlocked = game.rewards.includes(index);
    return `<div class="sticker ${unlocked ? 'unlocked' : 'locked'}" aria-label="${level.reward}: ${unlocked ? 'earned' : `locked, finish level ${index + 1}`}"><div class="sticker-art">${stickerArt(level.rewardIcon)}<span class="sticker-check" aria-hidden="true">${unlocked ? '✓' : '·'}</span></div><div><strong>${level.reward}</strong><span>${unlocked ? 'You earned it!' : `Level ${index + 1} reward`}</span></div></div>`;
  }).join('');
}

function renderHUD() {
  $('total-score').textContent = game.score.toLocaleString();
  $('rescued-count').textContent = game.rescued;
  [...$('progress-dots').children].forEach((dot, index) => dot.classList.toggle('filled', index < game.rescued));
  $('pause-button').disabled = game.phase !== 'playing';
  $('pause-label').textContent = game.paused ? 'Resume' : 'Pause';
  $('pause-icon').textContent = game.paused ? '▷' : 'Ⅱ';
  $('pause-button').setAttribute('aria-label', game.paused ? 'Resume game' : 'Pause game');
  world.classList.toggle('is-paused', game.paused);
}

function renderBears() {
  for (const bear of game.bears) {
    const node = bearNodes.get(bear.id);
    if (!node) continue;
    const stuck = bear.state === 'stuck';
    node.style.left = `${bear.x}%`;
    node.style.top = `${bear.y}%`;
    // Roaming bears must never cover or intercept a stuck bear's touch target.
    node.style.zIndex = String(stuck ? 90 + Math.floor(bear.y / 10) : Math.floor(bear.y));
    node.className = `bear state-${bear.state}${bear.fart > 0 ? ' is-farting' : ''}`;
    node.disabled = !stuck || game.paused || game.phase !== 'playing';
    node.setAttribute('aria-label', `${bear.name}: ${stuck ? `urn stuck! ${bear.remaining} ${bear.remaining === 1 ? 'wiggle' : 'wiggles'} left. Tap or swipe to help.` : bear.state === 'freed' ? 'bahooky freed!' : 'running around'}`);
    const bubble = node.querySelector('.bear-bubble');
    const message = stuck ? ['My bahooky!', 'Urn… help?', 'Oh, bum!'][bear.id % 3] : bear.fart > 0 ? 'Prrrpt! ♡' : bear.state === 'freed' ? 'Thank you! ♡' : bear.state === 'pee' ? 'Psssss…' : '';
    if (bubble.textContent !== message) bubble.textContent = message;
    const count = node.querySelector('.swipe-count');
    const label = `${bear.remaining} ${bear.remaining === 1 ? 'wiggle' : 'wiggles'}`;
    if (count.textContent !== label) {
      count.textContent = label;
      node.querySelector('.swipe-dots').innerHTML = Array.from({ length: bear.required }, (_, i) => `<i class="${i < bear.required - bear.remaining ? 'done' : ''}"></i>`).join('');
    }
  }
  for (const prop of $('props').children) {
    const stationIndex = Number(prop.dataset.station);
    prop.hidden = game.bears.some(bear => bear.stationIndex === stationIndex && (bear.state === 'stuck' || bear.state === 'freed'));
  }
}

function buttonMarkup(id, text, secondary = false) {
  return `<button id="${id}" class="${secondary ? 'secondary-button' : 'primary-button'}">${text}</button>`;
}

function showOverlay() {
  const overlay = $('overlay');
  const phase = game.paused ? 'paused' : game.phase;
  if (phase === displayedPhase) return;
  displayedPhase = phase;
  overlay.className = `overlay ${phase === 'playing' ? 'hidden' : ''}`;
  if (phase === 'playing') {
    overlay.innerHTML = '';
    return;
  }
  let content;
  if (phase === 'ready') {
    content = `<div class="intro-mascot">${bearArt(0)}<span class="mascot-star star-one">✦</span><span class="mascot-star star-two">✦</span></div><p class="overlay-eyebrow">OH, WHAT A PICKLE.</p><h2 id="overlay-title">An urn on my <span>bahooky?!</span></h2><p>These silly bears need a helping hand.</p><div class="instruction-chip"><span aria-hidden="true">↔</span><span><strong>Tap or swipe the stuck urn.</strong><br>1–5 wiggles will pop it off!</span></div>${buttonMarkup('start-button', 'Let’s free some bahookies! <span aria-hidden="true">→</span>')}<p class="overlay-small">4 little levels · No timer · No losing<br>Sound is off until you turn it on.</p>`;
  } else if (phase === 'paused') {
    content = `<div class="pause-illustration" aria-hidden="true">☾</div><p class="overlay-eyebrow">A LITTLE BREATHER</p><h2 id="overlay-title">Bears on a break.</h2><p>Your points and wiggles are right here.<br>Come back whenever you’re ready.</p>${buttonMarkup('resume-button', 'Ready to wiggle <span aria-hidden="true">→</span>')}`;
  } else {
    const won = phase === 'won';
    content = `<div class="celebration-sticker">${stickerArt(game.level.rewardIcon)}</div><p class="overlay-eyebrow">${won ? 'ALL 4 LEVELS COMPLETE!' : `LEVEL ${game.levelIndex + 1} COMPLETE!`}</p><h2 id="overlay-title">${won ? 'You won!<br>You’re <span>The Big Bahooky!</span>' : ['Hip, hip… hooray!', 'Splash-tastic!', 'What a wiggle!'][game.levelIndex]}</h2><p>${game.level.celebration}</p><div class="celebration-stats"><div><strong>+${game.levelPoints}</strong><span>level points</span></div><div><strong>${won ? game.totalRescued : game.rescued}</strong><span>bahookies freed${won ? ' in all' : ''}</span></div></div><div class="new-reward"><span aria-hidden="true">★</span> ${game.level.reward} sticker earned!</div>${won ? `<p class="final-score">${game.score.toLocaleString()} happy points. All 4 stickers. BIG giggles.</p>${buttonMarkup('replay-button', 'Another silly adventure <span aria-hidden="true">↻</span>')}` : `${buttonMarkup('next-button', `Next: ${LEVELS[game.levelIndex + 1].name} <span aria-hidden="true">→</span>`)}<p class="overlay-small">${LEVELS[game.levelIndex + 1].intro}</p>`}`;
  }
  overlay.innerHTML = `<section class="overlay-card ${phase === 'ready' ? 'intro-card' : ''} ${phase === 'won' ? 'win-card' : ''}" role="dialog" aria-labelledby="overlay-title">${content}</section>`;
  // Keep overlays predictable: no automatic advancing or disappearing rewards.
  const action = overlay.querySelector('button');
  action?.focus({ preventScroll: true });
  $('start-button')?.addEventListener('click', startGame);
  $('replay-button')?.addEventListener('click', startGame);
  $('next-button')?.addEventListener('click', () => {
    audio.unlock();
    clearGesture();
    game.nextLevel();
    render();
    announce(`${game.level.name}. Free ${game.level.goal} bahookies. ${game.level.intro}`);
  });
  $('resume-button')?.addEventListener('click', togglePause);
  if (phase === 'celebrating' || phase === 'won') {
    $('help-text').innerHTML = phase === 'won' ? '<strong>Every bahooky is free!</strong> You’re The Big Bahooky!' : '<strong>Lovely helping! This level is complete.</strong> Enjoy your new sticker.';
    renderRewards();
    confetti();
    audio.celebrate();
    announce(phase === 'won' ? `You won! You’re The Big Bahooky! ${game.totalRescued} bahookies freed. ${game.score} points. All four stickers earned.` : `${game.level.name} complete! ${game.levelPoints} points. ${game.level.reward} sticker earned.`);
  }
}

function render() {
  if (displayedLevel !== game.levelIndex || (game.bears.length && !bearNodes.size)) renderLevel();
  renderHUD();
  renderBears();
  showOverlay();
}

function startGame() {
  clearGesture();
  audio.unlock();
  game.start();
  displayedLevel = -1;
  $('effects').innerHTML = '';
  renderRewards();
  render();
  announce(`${game.level.name}. Free ${game.level.goal} bahookies. Tap or swipe a stuck urn. Take your time!`);
}

function togglePause() {
  if (game.phase !== 'playing') return;
  clearGesture();
  game.togglePause();
  if (game.paused) audio.stop(); else audio.unlock();
  render();
  if (!game.paused) {
    const firstStuck = [...bearNodes.values()].find(node => !node.disabled);
    (firstStuck || $('pause-button')).focus({ preventScroll: true });
  }
  announce(game.paused ? 'Game paused. Take your time.' : 'Game resumed. Every wiggle helps!');
}

function effectAt(bear, text, freed) {
  const pop = document.createElement('div');
  pop.className = `point-pop${freed ? ' freed-pop' : ''}`;
  pop.style.left = `${bear.x}%`;
  pop.style.top = `${bear.y - 7}%`;
  pop.textContent = text;
  $('effects').append(pop);
  setTimeout(() => pop.remove(), 1150);
  if (freed) {
    const urn = document.createElement('div');
    urn.className = 'flying-urn';
    urn.style.left = `${bear.x + 4}%`;
    urn.style.top = `${bear.y}%`;
    urn.innerHTML = urnArt(`fly-${bear.id}-${bear.wiggles}-${game.totalRescued}`);
    $('effects').append(urn);
    setTimeout(() => urn.remove(), 850);
  }
}

function rescue(id) {
  const result = game.swipe(id);
  if (!result.accepted) return;
  audio.boing();
  // Trigger sound from the rescue event, never from movement or rendering.
  if (result.freed) audio.fart();
  const bear = game.bears.find(item => item.id === id);
  const urn = bearNodes.get(id).querySelector('.urn-piece');
  urn.classList.remove('jiggle');
  void urn.getBoundingClientRect();
  urn.classList.add('jiggle');
  effectAt(bear, result.freed ? '+110 · POP!' : '+10 · boing!', result.freed);
  render();
  if (!result.completed) {
    $('help-text').innerHTML = result.freed ? `<strong>${bear.name} is free! +100 rescue points.</strong> Lovely helping!` : `<strong>Boing! ${bear.remaining} ${bear.remaining === 1 ? 'wiggle' : 'wiggles'} to go.</strong> You’re doing great.`;
    announce(result.freed ? `${bear.name} is free! Prrrpt! ${game.rescued} of ${game.level.goal} bahookies freed.` : `${bear.name}: boing! ${bear.remaining} wiggles left.`);
  }
  // A freed button leaves the keyboard order. Offer the next stuck bear.
  if (result.freed && document.activeElement === bearNodes.get(id) && game.phase === 'playing') {
    const next = [...bearNodes.values()].find(node => !node.disabled);
    (next || $('pause-button')).focus({ preventScroll: true });
  }
}

const clearGesture = bindRescueInput(world, id => game.phase === 'playing' && !game.paused && game.bears.some(bear => bear.id === id && bear.state === 'stuck'), rescue);

function confetti() {
  if (reducedMotion.matches) return;
  const colors = ['#efaf53', '#84aba0', '#dc947e', '#f4d778', '#a1bd7c'];
  for (let i = 0; i < 28; i++) {
    const piece = document.createElement('i');
    piece.className = 'confetti';
    piece.style.cssText = `left:${(i * 37) % 100}%;background:${colors[i % colors.length]};--delay:${(i % 7) * .06}s;--turn:${(i % 2 ? 1 : -1) * (150 + i * 11)}deg`;
    $('effects').append(piece);
    setTimeout(() => piece.remove(), 2600);
  }
}

$('sound-button').addEventListener('click', async () => {
  const enabled = await audio.toggle();
  $('sound-button').setAttribute('aria-pressed', String(enabled));
  $('sound-button').setAttribute('aria-label', enabled ? 'Turn sound off' : 'Turn sound on');
  $('sound-label').textContent = enabled ? 'Sound on' : 'Sound off';
  $('sound-icon').textContent = enabled ? '♫' : '♪';
  if (enabled && !game.paused) audio.boing();
  if (!enabled || game.paused) audio.stop();
  announce(enabled ? 'Quiet, silly sounds on.' : 'Sound off. You can still see every wiggle.');
});
$('pause-button').addEventListener('click', togglePause);
// Prevent a surprise jump when returning to a backgrounded tab.
document.addEventListener('visibilitychange', () => {
  previousTime = 0;
  if (document.hidden && game.phase === 'playing' && !game.paused) togglePause();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && game.phase === 'playing') togglePause();
  // Trap focus within the field's dialog, while keeping the sound and pause
  // controls available. Nothing behind a celebration is interactive.
  if (event.key === 'Tab' && displayedPhase !== 'playing') {
    const focusable = [$('sound-button'), $('pause-button'), ...$('overlay').querySelectorAll('button')].filter(node => node && !node.disabled);
    const current = focusable.indexOf(document.activeElement);
    const next = event.shiftKey ? (current - 1 + focusable.length) % focusable.length : (current + 1) % focusable.length;
    event.preventDefault();
    focusable[next]?.focus({ preventScroll: true });
  }
});

function frame(time) {
  const dt = previousTime ? (time - previousTime) / 1000 : 0;
  previousTime = time;
  game.tick(dt);
  renderBears();
  requestAnimationFrame(frame);
}

renderLevel();
renderRewards();
render();
requestAnimationFrame(frame);
