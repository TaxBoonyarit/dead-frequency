import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, AMMO } from '../dist/engine.mjs';

function running() {
  const g = new Game(() => .5); g.start(); g.obstacles = []; g.remaining = 999; g.spawnClock = 999;
  g.events = []; g.gun.reserve = AMMO.maxReserve;
  return g;
}
function money(g, x = g.player.x, life = 35) {
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

test('each completed wave pays its bonus once after the collection countdown, including the finale', () => {
  for (let wave = 1; wave <= 10; wave++) {
    const g = running(); g.wave = wave; g.remaining = 0; g.credits = 20;
    g.update(.05); assert.equal(g.credits, 20);
    for (let i = 0; i < 40; i++) g.update(.05);
    assert.equal(g.state, 'playing'); assert.equal(g.credits, 20);
    g.pause(); for (let i = 0; i < 80; i++) g.update(.05);
    assert.equal(g.credits, 20); g.pause();
    for (let i = 0; i < 25; i++) g.update(.05);
    assert.equal(g.state, wave === 10 ? 'won' : 'upgrade');
    assert.equal(g.credits, 120 + wave * 10);
    for (let i = 0; i < 100; i++) g.update(.05);
    assert.equal(g.credits, 120 + wave * 10);
  }
});

test('two wave bonuses alone pay for an SMG and restart clears that income', () => {
  const g = new Game(() => .99); g.start();
  for (let wave = 1; wave <= 2; wave++) {
    g.remaining = 0; g.spawnClock = 999;
    for (let i = 0; i < 65; i++) g.update(.05);
    assert.equal(g.state, 'upgrade'); assert.equal(g.drops.length, 0);
    if (wave === 1) {
      assert.equal(g.credits, 110); assert.equal(g.buyWeapon('smg'), false);
      g.upgrade(g.choices[0].id);
    }
  }
  assert.equal(g.credits, 230); assert.equal(g.buyWeapon('smg'), true);
  assert.equal(g.credits, 10); assert.equal(g.weaponId, 'smg');
  g.start(); assert.equal(g.credits, 0); assert.equal(g.weaponId, 'pistol');
});

test('opening a zombie crate during the countdown defers the bonus until its enemies die', () => {
  const g = running(); g.wave = 2; g.remaining = 0;
  g.update(.05); for (let i = 0; i < 40; i++) g.update(.05);
  assert.equal(g.credits, 0);
  g.airdrop = { x:g.player.x+40, y:g.player.y, state:'landed', life:30 }; g.random = () => .2;
  assert.equal(g.openAirdrop(), true);
  for (let i = 0; i < 65; i++) g.update(.05);
  assert.ok(g.enemies.length > 0); assert.equal(g.state, 'playing'); assert.equal(g.credits, 0);
  g.random = () => .99;
  for (const e of g.enemies) g.damageEnemy(e, 100000);
  for (let i = 0; i < 65; i++) g.update(.05);
  assert.equal(g.state, 'upgrade'); assert.equal(g.credits, 120);
  for (let i = 0; i < 100; i++) g.update(.05);
  assert.equal(g.credits, 120);
});

test('dying during the collection countdown awards no wave bonus', () => {
  const g = running(); g.remaining = 0; g.update(.05); g.hurtPlayer(10000);
  for (let i = 0; i < 100; i++) g.update(.05);
  assert.equal(g.state, 'dead'); assert.equal(g.credits, 0);
});

test('only coins use the wider pickup radius; ammo and health still require close contact', () => {
  const g = running(); g.player.hp -= 20; g.gun.reserve = 0;
  g.drops = ['credits','ammo','health'].map(type => ({ x:g.player.x+49, y:g.player.y, type, amount:5, life:35 }));
  const hp = g.player.hp; g.update(.01);
  assert.equal(g.credits, 5); assert.equal(g.player.hp, hp); assert.equal(g.gun.reserve, 0);
  assert.deepEqual(g.drops.map(d => d.type), ['ammo','health']);
  g.player.x += 16; g.update(.01);
  assert.equal(g.player.hp, g.player.maxHp); assert.equal(g.gun.reserve, AMMO.pickup);
  assert.equal(g.drops.length, 0);
});

test('dropped coins last 35 seconds and can be collected after ordinary supplies expire', () => {
  const g = running(); g.random = () => .1;
  g.damageEnemy({x:g.player.x+150,y:g.player.y,hp:1,r:14,type:'walker'}, 1);
  assert.equal(g.drops.find(d => d.type === 'credits').life, 35);
  for (let i = 0; i < 460; i++) g.update(.05);
  assert.equal(g.drops.length, 1); assert.equal(g.drops[0].type, 'credits');
  g.player.x = g.drops[0].x - 49; g.update(.01);
  assert.equal(g.credits, 12); assert.equal(g.drops.length, 0);
});
