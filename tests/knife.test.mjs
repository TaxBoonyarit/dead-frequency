import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, KNIFE } from '../dist/engine.mjs';
function running() {
  const g = new Game(() => .1); g.start(); g.obstacles = []; g.remaining = 999; g.spawnClock = 999;
  g.player.angle = 0; g.gun.ammo = 0; g.gun.reserve = 0; g.events = []; return g;
}
function enemy(g, x, y = 0, hp = 100, type = 'walker') {
  const e = { x: g.player.x + x, y: g.player.y + y, hp, maxHp: hp, r: 15, type, speed: 0, phase: 0, hit: 0 };
  g.enemies.push(e); return e;
}
test('knife replaces an empty gun immediately, ignores gun bonuses and has its own cooldown', () => {
  const g = running(); g.gun.cooldown = 1; g.weaponBonuses.damage = 10;
  const e = enemy(g, 40); assert.equal(g.usingKnife, true);
  g.shoot(); assert.equal(e.hp, 60); assert.equal(g.bullets.length, 0); assert.equal(g.gun.ammo, 0);
  g.shoot(); assert.equal(e.hp, 60);
  for (let i = 0; i < 10; i++) g.update(.05);
  g.shoot(); assert.equal(e.hp, 20); assert.equal(g.knifeCooldown, KNIFE.interval);
});
test('knife hits multiple living enemies in its arc but respects range, direction and walls', () => {
  const g = running();
  const front = enemy(g, 65), side = enemy(g, 40, 30), far = enemy(g, 66), behind = enemy(g, -30), outside = enemy(g, 20, 30);
  g.shoot(); assert.deepEqual([front.hp, side.hp, far.hp, behind.hp, outside.hp], [60, 60, 100, 100, 100]);
  g.knifeCooldown = 0; g.obstacles = [{x:g.player.x+20,y:g.player.y-10,w:5,h:20}];
  g.shoot(); assert.equal(front.hp, 60); assert.equal(side.hp, 20);
});
test('last shot switches to knife, reserve ammo keeps normal reload, pickup restores the same gun automatically', () => {
  const g = running(); g.gun.ammo = 1; g.shoot(); assert.equal(g.usingKnife, true);
  g.drops = [{x:g.player.x,y:g.player.y,type:'ammo',life:10}]; g.update(.01);
  assert.equal(g.usingKnife, false); assert.equal(g.weaponId, 'pistol'); assert.equal(g.gun.reserve, 12); assert.equal(g.gun.reload, g.gun.reloadTime);
  for (let i=0;i<50;i++) g.update(.05);
  assert.equal(g.gun.ammo, 12); assert.equal(g.gun.reserve, 0);
  g.gun.ammo = 0; g.gun.reserve = 2; g.gun.cooldown = 0; g.shoot();
  assert.equal(g.usingKnife, false); assert.ok(g.gun.reload > 0);
});
test('knife kills award credits and drops once, including boss rewards and wave completion', () => {
  const g = running(); const e = enemy(g, 30, 0, 40); g.shoot(); g.knifeCooldown = 0; g.shoot();
  assert.equal(e.hp, 0); assert.equal(g.kills, 1); assert.equal(g.credits, 0); assert.equal(g.score, 100); assert.equal(g.drops[0].type, 'credits'); assert.equal(g.drops[1].type, 'ammo');
  g.update(.01); assert.equal(g.credits, 3); assert.equal(g.enemies.length, 0); assert.equal(g.player.hp, g.player.maxHp);
  g.gun.ammo = 0; g.gun.reserve = 0; g.gun.reload = 0;
  const boss = enemy(g, 50, 0, 40, 'boss'); boss.reward = 60; g.remaining = 0; g.knifeCooldown = 0; g.shoot(); g.update(.01);
  assert.equal(g.credits, 3); g.player.x = boss.x; g.update(.01);
  assert.equal(g.kills, 2); assert.equal(g.credits, 21); assert.ok(g.events.some(e=>e.type==='bossDown')); assert.ok(g.clearClock > 0);
});
test('pause and wave clear block attacks; pause freezes swing and cooldown; restart clears knife state', () => {
  const g = running(); const e = enemy(g, 40); g.pause(); g.shoot(); assert.equal(e.hp, 100);
  g.pause(); g.shoot(); const life = g.slash.life; g.pause(); g.update(.05); assert.equal(g.slash.life, life); assert.equal(g.knifeCooldown, KNIFE.interval);
  g.pause(); g.knifeCooldown = 0; g.clearClock = 1; g.shoot(); assert.equal(e.hp, 60);
  g.start(); assert.equal(g.usingKnife, false); assert.equal(g.slash, null); assert.equal(g.knifeCooldown, 0);
});
test('ammo restores an equipped rifle and wave supplies leave no reload in progress', () => {
  const g = running(); g.state = 'upgrade'; g.credits = 1000; g.buyWeapon('rifle'); g.state = 'playing';
  g.gun.ammo = 0; g.gun.reserve = 0;
  g.addReserve(12); assert.equal(g.weaponId, 'rifle'); assert.equal(g.gun.reload, g.gun.reloadTime);
  g.gun.reserve = 0; g.gun.reload = 0; g.state = 'upgrade'; g.choices = [{id:'damage'}]; g.upgrade('damage');
  assert.equal(g.usingKnife, false); assert.equal(g.gun.reload, 0); assert.equal(g.gun.ammo, 10); assert.equal(g.gun.reserve, 8);
});
