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

test('all zombie types roll a 30% money drop chance once per kill, including bosses', () => {
  for (const [type, amount, score] of [['walker', 12, 100], ['runner', 20, 150], ['brute', 36, 300], ['boss', 72, 600]]) {
    for (const roll of [0, .299999, .3, .999999]) {
      const g = running(); let draws = 0;
      g.random = () => { draws++; return roll; };
      const e = { x: g.player.x + 100, y: g.player.y, hp: 1, r: 14, type, reward: 60 };
      g.damageEnemy(e, 1);
      const money = g.drops.filter(d => d.type === 'credits'), drops = roll < .3;
      assert.equal(money.length, drops ? 1 : 0, `${type}, roll ${roll}`);
      if (drops) assert.equal(money[0].amount, amount);
      assert.equal(g.kills, 1); assert.equal(g.score, score); assert.equal(g.credits, 0);
      if (type === 'boss') assert.equal(g.events.find(e => e.type === 'bossDown').reward, drops ? amount : 0);
      const drawsBefore = draws;
      g.damageEnemy(e, 1); assert.equal(draws, drawsBefore);
      assert.equal(g.kills, 1); assert.equal(g.score, score);
      g.player.x = e.x; g.update(.01); assert.equal(g.credits, drops ? amount : 0);
    }
  }
});

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
