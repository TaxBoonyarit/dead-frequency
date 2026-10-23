import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, blocked, OBSTACLES } from '../dist/engine.mjs';

function running() { const g = new Game(() => .5); g.start(); g.remaining = 999; g.spawnClock = 999; return g; }
function tick(g, seconds, input = {}) { for (let i = 0; i < seconds * 60; i++) g.update(1 / 60, input); }
function enemy(x, y, hp = 65) { return { x, y, hp, maxHp: hp, type: 'walker', r: 14, speed: 0, angle: 0, phase: 0, hit: 0 }; }

test('movement respects buildings and world boundaries, including sprint', () => {
  const g = running(); g.player.x = 380; g.player.y = 190;
  tick(g, 2, { x: -1, sprint: true });
  assert.ok(g.player.x >= 354); assert.equal(blocked(g.player.x, g.player.y, 14), false);
  g.player.x = 35; g.player.y = 400; tick(g, 3, { x: -1 }); assert.ok(g.player.x >= 14);
});
test('diagonal movement is normalized and stamina recovers', () => {
  const a = running(), b = running(); a.player.x = b.player.x = 640; a.player.y = b.player.y = 400;
  tick(a, .2, { x: 1 }); tick(b, .2, { x: 1, y: 1 });
  assert.ok(Math.abs(Math.hypot(b.player.x - 640, b.player.y - 400) - (a.player.x - 640)) < .01);
  tick(a, .3, { y: 1, sprint: true }); const low = a.player.stamina; tick(a, .3); assert.ok(a.player.stamina > low);
});
test('shots hit along their path, award a kill once, and obey cooldown', () => {
  const g = running(); g.player.angle = 0; g.enemies = [enemy(720, 410)];
  g.shoot(); g.shoot(); assert.equal(g.gun.ammo, 17);
  tick(g, .3); assert.equal(g.enemies[0].hp, 31);
  g.shoot(); tick(g, .2); assert.equal(g.kills, 1); assert.equal(g.score, 100); assert.equal(g.enemies.length, 0);
});
test('walls absorb bullets before they hit enemies behind them', () => {
  const g = running(); g.player.x = 400; g.player.y = 545; g.player.angle = 0; g.enemies = [enemy(600, 545)];
  g.shoot(); tick(g, .4); assert.equal(g.enemies[0].hp, 65); assert.equal(g.bullets.length, 0);
});
test('reload transfers only available reserve and cannot shoot during reload', () => {
  const g = running(); g.gun.ammo = 2; g.gun.reserve = 5; g.reload(); g.shoot(); assert.equal(g.gun.ammo, 2);
  tick(g, 1.6); assert.equal(g.gun.ammo, 7); assert.equal(g.gun.reserve, 0); assert.equal(g.gun.reload, 0);
  g.reload(); assert.equal(g.gun.reload, 0);
});
test('a completed wave offers valid upgrades and replenishes supplies', () => {
  const g = running(); g.remaining = 0; g.update(.01);
  assert.equal(g.state, 'upgrade'); assert.equal(g.choices.length, 3); assert.equal(new Set(g.choices.map(u => u.id)).size, 3);
  const wave = g.wave; g.upgrade('invalid'); assert.equal(g.state, 'upgrade');
  g.player.hp = 35; const reserve = g.gun.reserve; g.upgrade(g.choices[0].id);
  assert.equal(g.state, 'playing'); assert.equal(g.wave, wave + 1); assert.equal(g.gun.reserve, reserve + 36); assert.ok(g.player.hp >= 55);
});
test('wave ten ends with evacuation, and restart clears the run', () => {
  const g = running(); g.wave = 10; g.remaining = 0; g.update(.01);
  assert.equal(g.state, 'won'); assert.equal(g.score, 5000);
  g.start(); assert.equal(g.wave, 1); assert.equal(g.score, 0); assert.equal(g.kills, 0); assert.equal(g.player.hp, 100);
});
test('pause freezes time, damage, movement, and reload', () => {
  const g = running(); g.enemies.push(enemy(g.player.x, g.player.y)); g.gun.ammo = 1; g.reload(); g.pause();
  const snapshot = JSON.stringify({ time: g.time, player: g.player, gun: g.gun }); tick(g, 3, { x: 1, fire: true });
  assert.equal(JSON.stringify({ time: g.time, player: g.player, gun: g.gun }), snapshot);
  g.pause(); g.update(.01); assert.ok(g.player.hp < 100);
});
test('contact damage has a grace period and death stops the simulation', () => {
  const g = running(); g.enemies.push(enemy(g.player.x, g.player.y)); g.player.hp = 13;
  g.update(.01); assert.equal(g.player.hp, 1); tick(g, .5); assert.equal(g.player.hp, 1);
  tick(g, .3); assert.equal(g.state, 'dead'); assert.equal(g.player.hp, 0);
  const t = g.time; g.update(.05); assert.equal(g.time, t);
});
test('pickups heal up to max health and add ammunition once', () => {
  const g = running(); g.player.hp = 95; g.gun.reserve = 0;
  g.drops = ['health', 'ammo'].map(type => ({ x: g.player.x, y: g.player.y, type, life: 10 }));
  g.update(.01); assert.equal(g.player.hp, 100); assert.equal(g.gun.reserve, 30); assert.equal(g.drops.length, 0);
  g.update(.01); assert.equal(g.gun.reserve, 30);
});
test('zombies navigate around buildings toward a survivor', () => {
  const g = running(); g.player.x = 400; g.player.y = 200;
  g.enemies = [{ ...enemy(70, 185), speed: 80 }];
  const distance = () => Math.hypot(g.player.x - g.enemies[0].x, g.player.y - g.enemies[0].y);
  tick(g, 12); assert.ok(distance() < 45, `Zombie remained ${distance().toFixed(0)} units away`);
  assert.equal(blocked(g.enemies[0].x, g.enemies[0].y, 13), false);
});
test('difficulty changes enemy durability and contact damage', () => {
  const easy = new Game(() => .5), hard = new Game(() => .5);
  easy.reset('recruit'); hard.reset('nightmare'); easy.start(); hard.start(); easy.spawn(); hard.spawn();
  assert.ok(hard.enemies[0].hp > easy.enemies[0].hp); assert.ok(hard.enemies[0].speed > easy.enemies[0].speed);
});
