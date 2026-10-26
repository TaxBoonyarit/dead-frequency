import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../dist/engine.mjs';

test('female survivor moves and sprints faster, with less health than male survivor', () => {
  for (const sprint of [false, true]) {
    const distances = [], health = [];
    for (const id of ['female', 'male']) {
      const g = new Game(() => .5); assert.equal(g.selectCharacter(id), true); g.start();
      g.spawnClock = 999; const start = g.player.x;
      g.update(.05, { x: 1, sprint }); distances.push(g.player.x - start); health.push(g.player.hp);
      assert.equal(g.player.hp, g.player.maxHp);
      assert.equal(g.characterId, id);
    }
    assert.ok(distances[0] > distances[1]); assert.ok(health[0] < health[1]);
  }
});

test('selection persists through difficulty and restart and cannot change during a run', () => {
  const g = new Game(); g.selectCharacter('female'); g.reset('nightmare'); g.start();
  assert.equal(g.characterId, 'female'); assert.equal(g.player.hp, 80);
  assert.equal(g.selectCharacter('male'), false); assert.equal(g.characterId, 'female');
  g.pause(); assert.equal(g.selectCharacter('male'), false);
  g.player.maxHp += 25; g.player.hp = 10; g.start();
  assert.equal(g.player.maxHp, 80); assert.equal(g.player.hp, 80);
  g.reset(); assert.equal(g.selectCharacter('unknown'), false);
  assert.equal(g.characterId, 'female');
  assert.equal(g.selectCharacter('male'), true); g.start(); assert.equal(g.player.hp, 120);
});

test('medkits and health upgrades respect both survivors max health', () => {
  for (const id of ['female', 'male']) {
    const g = new Game(() => .5); g.selectCharacter(id); g.start(); g.spawnClock = 999;
    const max = g.player.maxHp; g.player.hp = max - 5;
    g.drops = [{ x: g.player.x, y: g.player.y, type: 'health', life: 10 }];
    g.update(.01); assert.equal(g.player.hp, max);
    g.state = 'upgrade'; g.choices = [{ id: 'health' }]; g.upgrade('health');
    assert.equal(g.player.maxHp, max + 25); assert.equal(g.player.hp, max + 25);
  }
});
