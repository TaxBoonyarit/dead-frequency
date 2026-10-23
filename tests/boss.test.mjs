import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, BOSSES, blocked } from '../dist/engine.mjs';
function fight(wave = 1) {
  const g = new Game(() => .5); g.start(); g.wave = wave; g.remaining = 1; g.spawn(); g.spawnClock = 999;
  return g;
}
test('every wave ends with exactly one correctly scaled boss and waits for its defeat', () => {
  assert.equal(new Set(BOSSES.map(b => b.name)).size, 10);
  for (let wave = 1; wave <= 10; wave++) {
    const g = fight(wave), b = g.enemies[0];
    assert.equal(b.name, BOSSES[wave - 1].name); assert.equal(b.hp, BOSSES[wave - 1].hp);
    assert.equal(blocked(b.x, b.y, b.r), false); assert.equal(g.remaining, 0);
    g.update(.01); assert.equal(g.state, 'playing'); assert.equal(g.enemies.length, 1);
    g.player.x = b.x; g.player.y = b.y + 35; g.player.angle = -Math.PI / 2; b.hp = 1;
    g.update(.05, { fire: true });
    assert.equal(g.kills, 1); assert.equal(g.credits, b.reward);
    assert.equal(g.state, wave === 10 ? 'won' : 'upgrade');
  }
});
test('area attacks telegraph, allow escape, and cannot damage during pause', () => {
  const g = fight(3), b = g.enemies[0]; b.attackClock = 0;
  g.update(.05); assert.equal(b.windup, 1.1); assert.equal(g.hazards.length, 0);
  const x = b.targetX, y = b.targetY; g.player.x += 200;
  for (let i = 0; i < 23; i++) g.update(.05);
  assert.equal(g.player.hp, 100); assert.ok(g.hazards.length);
  g.player.x = x; g.player.y = y; g.pause(); g.update(.05); assert.equal(g.player.hp, 100);
  g.pause(); g.update(.05); assert.ok(g.player.hp < 100);
});
test('charge locks its direction after a warning and cannot cross buildings', () => {
  const g = fight(2), b = g.enemies[0]; b.attackClock = 0;
  g.update(.05); const angle = b.chargeAngle; g.player.x += 200;
  for (let i = 0; i < 22; i++) g.update(.05);
  assert.equal(b.chargeAngle, angle); assert.ok(b.dash > 0);
  for (let i = 0; i < 20; i++) { g.update(.05); assert.equal(blocked(b.x, b.y, b.r), false); }
});
test('boss health respects difficulty and restart clears attack effects', () => {
  const g = new Game(() => .5); g.reset('nightmare'); g.start(); g.remaining = 1; g.spawn();
  assert.equal(g.enemies[0].hp, BOSSES[0].hp * 1.35);
  g.hazards.push({life: 1}); g.start(); assert.equal(g.hazards.length, 0); assert.equal(g.enemies.length, 0);
});

test('bosses reach wall-hugging survivors through valid melee approaches', () => {
  for (const [x, y] of [[79,627], [77,588], [80,113], [251,732], [1189,602]]) {
    const g = fight(), b = g.enemies[0]; g.player.x = x; g.player.y = y; g.player.invulnerable = 1000;
    assert.equal(blocked(x, y, 14), false);
    for (let i = 0; i < 2400 && Math.hypot(b.x - x, b.y - y) >= b.r + 15; i++) {
      g.update(.05); assert.equal(blocked(b.x, b.y, b.r), false);
    }
    assert.ok(Math.hypot(b.x - x, b.y - y) < b.r + 15, `boss stuck approaching ${x},${y}`);
  }
});

test('charge covers its warned distance independent of frame duration', () => {
  for (const dt of [.05, 1/60, .017]) {
    const g = fight(2), b = g.enemies[0]; b.x = 640; b.y = 350; g.player.x = 640; g.player.y = 420;
    b.attackClock = 0; g.player.invulnerable = 100;
    g.update(dt); const startY = b.y;
    assert.ok(Math.abs(b.chargeEndY - startY - 234) < 1e-8);
    for (let i = 0; i < 200; i++) {
      g.update(dt);
      if (b.dashStep > 0 && b.dash === 0) break;
    }
    assert.ok(Math.abs(b.y - b.chargeEndY) < 1e-8, `charge misses warning at dt ${dt}`);
  }
});
