import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, LEVELS, ROAM_BOUNDS, STATIONS } from '../src/engine.js';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function advance(game, seconds = 15) {
  for (let i = 0; i < seconds * 10; i++) game.tick(.1);
}

function finishLevel(game) {
  let swipes = 0;
  for (let wave = 0; wave < 12 && game.phase === 'playing'; wave++) {
    advance(game);
    for (const bear of game.bears) {
      while (bear.state === 'stuck' && game.phase === 'playing') {
        const result = game.swipe(bear.id);
        assert.equal(result.accepted, true);
        swipes++;
      }
    }
  }
  assert.notEqual(game.phase, 'playing', 'level must be finite and completable');
  return swipes;
}

test('four gentle levels have 4–7 bears, increasing rescue goals and 1–5 swipe counts', () => {
  assert.equal(LEVELS.length, 4);
  assert.deepEqual(LEVELS.map(level => level.goal), [4, 5, 6, 7]);
  assert.deepEqual(LEVELS.map(level => Math.max(...level.swipes)), [2, 3, 4, 5]);
  assert.equal(new Set(LEVELS.map(level => level.theme)).size, 4);
  for (const level of LEVELS) {
    assert.equal(level.swipes.length, level.goal);
    assert.ok(level.swipes.every(count => count >= 1 && count <= 5));
  }
  assert.deepEqual([...new Set(LEVELS[3].swipes)].sort(), [1, 2, 3, 4, 5]);
});

test('bears roam, pee on scenery, approach urns, and stop when stuck', () => {
  const game = new Game({ random: seededRandom(42) });
  game.start();
  const bear = game.bears[0];
  const startX = bear.x;
  advance(game, .6);
  assert.notEqual(bear.x, startX);
  advance(game, 1.2);
  assert.equal(bear.state, 'pee');
  advance(game);
  assert.equal(bear.state, 'stuck');
  assert.ok(bear.remaining > 0);
  const position = { x: bear.x, y: bear.y };
  advance(game, 30);
  assert.deepEqual({ x: bear.x, y: bear.y }, position);
  assert.equal(bear.state, 'stuck', 'no time limit or auto-removal');
});

test('exactly the required wiggles; no wrong-target points or over-counting', () => {
  const game = new Game();
  game.start();
  assert.deepEqual(game.swipe(0), { accepted: false });
  assert.deepEqual(game.swipe(99), { accepted: false });
  assert.equal(game.score, 0);
  advance(game);
  const bear = game.bears.find(item => item.required === 2);
  const first = game.swipe(bear.id);
  assert.deepEqual(first, { accepted: true, freed: false, remaining: 1, completed: false, points: 10 });
  assert.equal(bear.state, 'stuck');
  assert.equal(bear.wiggles, 1);
  assert.equal(game.score, 10);
  const second = game.swipe(bear.id);
  assert.equal(second.freed, true);
  assert.equal(second.remaining, 0);
  assert.equal(bear.state, 'freed');
  assert.equal(game.rescued, 1);
  assert.equal(game.score, 120);
  assert.equal(game.swipe(bear.id).accepted, false);
  assert.equal(bear.remaining, 0);
  assert.equal(game.score, 120);
});

test('pause freezes movement, counters, and touch actions', () => {
  const game = new Game();
  game.start();
  advance(game);
  game.togglePause();
  const snapshot = JSON.stringify(game);
  advance(game, 20);
  assert.equal(game.swipe(0).accepted, false);
  assert.equal(JSON.stringify(game), snapshot);
  game.togglePause();
  assert.equal(game.swipe(0).accepted, true);
});

test('all levels award correct points and unique rewards, then end and replay cleanly', () => {
  const game = new Game();
  assert.equal(game.nextLevel(), false);
  game.start();
  let expectedScore = 0;
  let totalRescued = 0;
  for (let index = 0; index < LEVELS.length; index++) {
    const level = LEVELS[index];
    assert.equal(game.levelIndex, index);
    assert.equal(game.rescued, 0);
    assert.equal(game.bears.length, index + 4);
    assert.equal(new Set(game.bears.map(bear => bear.name)).size, game.bears.length);
    assert.equal(game.nextLevel(), false, 'cannot skip a level');
    const swipes = finishLevel(game);
    assert.equal(swipes, level.swipes.reduce((sum, count) => sum + count, 0));
    assert.equal(game.spawned, level.goal, 'no more urns than the rescue goal');
    assert.equal(game.rescued, level.goal);
    assert.ok(game.bears.every(bear => bear.rescued), 'every bear is rescued exactly once');
    assert.equal(game.levelPoints, level.goal * 100 + swipes * 10);
    expectedScore += game.levelPoints;
    totalRescued += level.goal;
    assert.equal(game.score, expectedScore);
    assert.equal(game.totalRescued, totalRescued);
    assert.deepEqual(game.rewards, Array.from({ length: index + 1 }, (_, i) => i));
    assert.equal(game.phase, index === 3 ? 'won' : 'celebrating');
    const snapshot = JSON.stringify(game);
    advance(game, 50);
    assert.equal(JSON.stringify(game), snapshot, 'rewards wait for the player');
    if (index < 3) assert.equal(game.nextLevel(), true);
  }
  assert.equal(game.score, 2720);
  assert.equal(game.totalRescued, 22);
  assert.equal(game.nextLevel(), false, 'there is no level five');
  assert.equal(game.swipe(0).accepted, false);
  game.start();
  assert.equal(game.phase, 'playing');
  assert.equal(game.levelIndex, 0);
  assert.equal(game.score, 0);
  assert.equal(game.totalRescued, 0);
  assert.deepEqual(game.rewards, []);
});

test('random waypoints change direction, stay in bounds, and are reproducible with a seed', () => {
  const run = seed => {
    const game = new Game({ random: seededRandom(seed) });
    game.startLevel(3);
    const bear = game.bears.at(-1);
    game.roam(bear, 30);
    const path = [];
    const directions = new Set();
    for (let i = 0; i < 250; i++) {
      const previous = { x: bear.x, y: bear.y };
      game.tick(.1);
      path.push([bear.x, bear.y]);
      directions.add(`${Math.sign(bear.x - previous.x)},${Math.sign(bear.y - previous.y)}`);
      for (const item of game.bears) {
        assert.ok(item.x >= ROAM_BOUNDS.minX && item.x <= ROAM_BOUNDS.maxX);
        assert.ok(item.y >= ROAM_BOUNDS.minY && item.y <= ROAM_BOUNDS.maxY);
        assert.equal(item.fart, 0, 'wandering, peeing and getting stuck are fart-free');
      }
    }
    assert.equal(directions.size, 4, 'wandering changes both horizontal and vertical direction');
    return path;
  };
  assert.deepEqual(run(42), run(42));
  assert.notDeepEqual(run(42), run(99), 'different random seeds produce different paths');
});

test('larger casts share three reserved stations without overlap or deadlocks', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const game = new Game({ random: seededRandom(seed) });
    game.startLevel(3);
    advance(game, 30);
    assert.equal(game.bears.filter(bear => bear.state === 'stuck').length, 3);
    assert.equal(game.bears.filter(bear => bear.stationIndex === null).length, 4);
    for (let step = 0; step < 2000 && game.phase === 'playing'; step++) {
      game.tick(.1);
      const reserved = game.bears.filter(bear => bear.stationIndex !== null).map(bear => bear.stationIndex);
      assert.ok(reserved.length <= STATIONS.length);
      assert.equal(new Set(reserved).size, reserved.length, 'each station has just one bear');
      for (const bear of game.bears.filter(bear => bear.state === 'stuck')) game.swipe(bear.id);
    }
    assert.equal(game.phase, 'won', `seed ${seed} must complete`);
    assert.equal(game.rescued, 7);
    assert.ok(game.bears.every(bear => bear.rescued));
  }
});

test('only removing an urn triggers a fart, never partial swipes or later wandering', () => {
  const game = new Game({ random: seededRandom(42) });
  game.start();
  advance(game, 30);
  assert.ok(game.bears.every(bear => bear.fart === 0));
  const bear = game.bears.find(item => item.required === 2);
  game.swipe(bear.id);
  assert.equal(bear.fart, 0);
  game.swipe(bear.id);
  assert.equal(bear.fart, 1.4);
  assert.equal(bear.rescued, true);
  game.togglePause();
  advance(game, 10);
  assert.equal(bear.fart, 1.4, 'pause keeps the rescue puff');
  game.togglePause();
  advance(game, 1.5);
  assert.equal(bear.fart, 0, 'the rescue puff expires');
  advance(game, 40);
  assert.ok(game.bears.every(item => item.fart === 0));
  assert.equal(bear.stationIndex, null, 'rescued bears release their urn station');
  assert.equal(bear.remaining, 0);
  assert.equal(game.swipe(bear.id).accepted, false, 'a rescued bear cannot be rescued twice');
});

test('invalid level/tick input does not corrupt state', () => {
  const game = new Game();
  assert.equal(game.startLevel(-1), false);
  assert.equal(game.startLevel(4), false);
  game.start();
  const snapshot = JSON.stringify(game);
  game.tick(NaN);
  game.tick(-1);
  game.tick(Infinity);
  assert.equal(JSON.stringify(game), snapshot);
});

