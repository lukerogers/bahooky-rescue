export const LEVELS = Object.freeze([
  { name: 'Sunny Meadow', location: 'the sunny meadow', icon: '✿', theme: 'meadow', goal: 4, swipes: [1, 2, 2, 1], speed: 17, reward: 'Toot Scout', rewardIcon: 'leaf', intro: 'A little wiggle goes a long way!', celebration: 'A meadow full of happy bahookies!' },
  { name: 'Bubble Pond', location: 'the bubble pond', icon: '◉', theme: 'pond', goal: 5, swipes: [1, 2, 3, 2, 2], speed: 19, reward: 'Puddle Pal', rewardIcon: 'duck', intro: 'Some urns need three little wiggles.', celebration: 'Splash! You’re a proper Puddle Pal.' },
  { name: 'Peachy Orchard', location: 'the peachy orchard', icon: '❀', theme: 'orchard', goal: 6, swipes: [2, 3, 4, 2, 3, 2], speed: 21, reward: 'Wiggle Wizard', rewardIcon: 'urn', intro: 'Stickier urns. Same happy little wiggles!', celebration: 'Those tricky urns didn’t stand a chance!' },
  { name: 'Moonlight Picnic', location: 'the moonlight picnic', icon: '☾', theme: 'night', goal: 7, swipes: [1, 3, 2, 5, 4, 3, 2], speed: 23, reward: 'Big Bahooky', rewardIcon: 'crown', intro: 'One last picnic. You’ve got this!', celebration: 'Every bear has a happy bahooky!' },
]);

export const STATIONS = Object.freeze([{ x: 24, y: 35 }, { x: 76, y: 49 }, { x: 31, y: 76 }]);
export const ROAM_BOUNDS = Object.freeze({ minX: 24, maxX: 76, minY: 22, maxY: 80 });
const NAMES = ['Bumble', 'Biscuit', 'Noodle', 'Waffles', 'Pickle', 'Muffin', 'Pudding'];

export class Game {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.phase = 'ready';
    this.levelIndex = 0;
    this.score = 0;
    this.rewards = [];
    this.totalRescued = 0;
    this.bears = [];
    this.rescued = 0;
    this.levelPoints = 0;
    this.spawned = 0;
    this.paused = false;
    this.time = 0;
  }

  get level() { return LEVELS[this.levelIndex]; }

  start() {
    this.score = 0;
    this.rewards = [];
    this.totalRescued = 0;
    this.startLevel(0);
  }

  startLevel(index) {
    if (!Number.isInteger(index) || index < 0 || index >= LEVELS.length) return false;
    this.levelIndex = index;
    this.phase = 'playing';
    this.paused = false;
    this.rescued = 0;
    this.levelPoints = 0;
    this.spawned = 0;
    this.time = 0;
    // Each level has its own larger cast. Every bear needs rescuing once;
    // shared urn stations keep at most three large, stationary touch targets.
    this.bears = Array.from({ length: this.level.goal }, (_, id) => {
      const bear = {
        id, name: NAMES[id], ...this.randomPosition(), stationIndex: null,
        remaining: 0, required: 0, wiggles: 0, fart: 0, rescued: false,
      };
      this.roam(bear, 1.2 + id * .7 + this.random() * .5);
      return bear;
    });
    return true;
  }

  nextLevel() {
    if (this.phase !== 'celebrating' || this.levelIndex >= LEVELS.length - 1) return false;
    return this.startLevel(this.levelIndex + 1);
  }

  togglePause() {
    if (this.phase !== 'playing') return false;
    this.paused = !this.paused;
    return this.paused;
  }

  tick(seconds) {
    if (this.phase !== 'playing' || this.paused || !Number.isFinite(seconds) || seconds <= 0) return;
    const dt = Math.min(seconds, 0.1);
    this.time += dt;
    for (const bear of this.bears) {
      bear.fart = Math.max(0, bear.fart - dt);
      if (bear.state === 'stuck') continue;
      bear.timer -= dt;
      if (bear.state === 'freed') {
        if (bear.timer <= 0) {
          bear.stationIndex = null;
          this.roam(bear);
        }
      } else if (bear.state === 'pee') {
        if (bear.timer <= 0) {
          const available = STATIONS.map((_, index) => index).filter(index => !this.bears.some(other => other.stationIndex === index));
          if (!bear.rescued && available.length && this.spawned < this.level.goal) {
            bear.stationIndex = available[Math.floor(this.random() * available.length)];
            bear.state = 'approach';
            bear.destination = STATIONS[bear.stationIndex];
            bear.speedScale = 1;
            bear.required = this.level.swipes[this.spawned++];
            bear.remaining = bear.required;
          } else this.roam(bear);
        }
      } else if (bear.state === 'roam') {
        bear.turnTimer -= dt;
        if (this.move(bear, dt) || bear.turnTimer <= 0) this.chooseHeading(bear);
        if (bear.timer <= 0) {
          bear.state = 'pee';
          bear.timer = 1.4;
        }
      } else if (bear.state === 'approach') {
        if (this.move(bear, dt)) bear.state = 'stuck';
      }
    }
  }

  move(bear, dt) {
    const dx = bear.destination.x - bear.x;
    const dy = bear.destination.y - bear.y;
    const distance = Math.hypot(dx, dy);
    const step = this.level.speed * bear.speedScale * dt;
    if (distance <= step) {
      bear.x = bear.destination.x;
      bear.y = bear.destination.y;
      return true;
    }
    bear.x += dx / distance * step;
    bear.y += dy / distance * step;
    return false;
  }

  randomPosition() {
    const { minX, maxX, minY, maxY } = ROAM_BOUNDS;
    return { x: minX + this.random() * (maxX - minX), y: minY + this.random() * (maxY - minY) };
  }

  chooseHeading(bear) {
    const destination = this.randomPosition();
    // Even a nearly identical random point should produce a useful little run.
    if (Math.hypot(destination.x - bear.x, destination.y - bear.y) < 12) {
      destination.x = bear.x < 50 ? ROAM_BOUNDS.maxX : ROAM_BOUNDS.minX;
    }
    bear.destination = destination;
    bear.turnTimer = .7 + this.random() * 1.1;
    bear.speedScale = .75 + this.random() * .3;
  }

  roam(bear, duration = 2 + this.random() * 2) {
    bear.state = 'roam';
    bear.timer = duration;
    this.chooseHeading(bear);
  }

  swipe(id) {
    const bear = this.bears.find(item => item.id === id);
    if (this.phase !== 'playing' || this.paused || !bear || bear.state !== 'stuck') return { accepted: false };
    bear.remaining--;
    bear.wiggles++;
    this.score += 10;
    this.levelPoints += 10;
    const freed = bear.remaining === 0;
    if (freed) {
      bear.state = 'freed';
      bear.timer = 1.8;
      bear.rescued = true;
      bear.fart = 1.4;
      this.rescued++;
      this.totalRescued++;
      this.score += 100;
      this.levelPoints += 100;
      if (this.rescued === this.level.goal) {
        this.rewards.push(this.levelIndex);
        this.phase = this.levelIndex === LEVELS.length - 1 ? 'won' : 'celebrating';
      }
    }
    return { accepted: true, freed, remaining: bear.remaining, completed: this.phase !== 'playing', points: freed ? 110 : 10 };
  }
}
