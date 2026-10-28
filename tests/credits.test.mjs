import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, AMMO } from '../dist/engine.mjs';

function running() {
  const g = new Game(() => .5); g.start(); g.obstacles = []; g.remaining = 999; g.spawnClock = 999;
  g.events = []; g.gun.reserve = AMMO.maxReserve;
  return g;
}
function money(g, x = g.player.x, life = 22) {
  g.drops.push({ x, y: g.player.y, type: 'credits', amount: 5, life });
}

test('money requires walking within pickup range and is collected once even with full supplies', () => {
  const g = running(), x = g.player.x; money(g, x + 60);
  g.update(.01); assert.equal(g.credits, 0); assert.equal(g.drops.length, 1);
  for (let i = 0; i < 4; i++) g.update(.05, { x: 1 });
  assert.equal(g.credits, 5); assert.equal(g.drops.length, 0);
  assert.equal(g.player.hp, g.player.maxHp); assert.equal(g.gun.reserve, AMMO.maxReserve);
  assert.deepEqual(g.events.filter(e => e.type === 'pickup'), [{ type: 'pickup', pickup: 'credits', amount: 5 }]);
  g.update(.01); assert.equal(g.credits, 5);
});

test('pause freezes money lifetime and collection; expired money awards nothing', () => {
  const g = running(); money(g, g.player.x, .01);
  g.pause(); g.update(.05); assert.equal(g.drops[0].life, .01); assert.equal(g.credits, 0);
  g.pause(); g.update(.02); assert.equal(g.drops.length, 0); assert.equal(g.credits, 0);
  assert.equal(g.events.some(e => e.type === 'pickup'), false);
});

test('wave changes and restarting remove uncollected money without crediting it', () => {
  const g = running(); money(g); g.nextWave();
  assert.equal(g.drops.length, 0); assert.equal(g.credits, 0);
  money(g); g.credits = 20; g.start();
  assert.equal(g.drops.length, 0); assert.equal(g.credits, 0);
});
