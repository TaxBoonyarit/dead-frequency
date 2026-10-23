import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, WEAPONS } from '../dist/engine.mjs';

function shop(credits = 90) {
  const g = new Game(() => .5); g.start(); g.remaining = 0; g.update(.01);
  g.credits = credits; return g;
}
function target(g, type = 'walker', hp = 10) {
  return { x: g.player.x + 5, y: g.player.y, hp, maxHp: hp, type, r: 14, speed: 0, phase: 0, hit: 0 };
}

test('first-wave kills fund an SMG and the purchase equips it before the next wave', () => {
  const g = new Game(() => .5); g.start(); g.remaining = 0; g.player.angle = 0;
  g.enemies = Array.from({ length: 9 }, () => target(g));
  while (g.state === 'playing') g.update(.05, { fire: true });
  assert.equal(g.state, 'upgrade'); assert.equal(g.credits, 90); assert.equal(g.score, 900);
  assert.equal(g.buyWeapon('smg'), true);
  assert.equal(g.credits, 0); assert.equal(g.weaponId, 'smg'); assert.equal(g.gun.mag, 30); assert.equal(g.gun.ammo, 30);
  assert.equal(g.score, 900); assert.equal(g.wave, 1);
  g.upgrade(g.choices[0].id); assert.equal(g.wave, 2); assert.equal(g.state, 'playing'); assert.equal(g.weaponId, 'smg');
});

test('transactions reject insufficient funds, unknown IDs, duplicates, and combat', () => {
  const g = shop(89); const original = JSON.stringify(g.gun);
  for (const id of ['smg', 'shotgun', 'rifle', 'unknown', '__proto__']) assert.equal(g.buyWeapon(id), false);
  assert.equal(g.credits, 89); assert.equal(JSON.stringify(g.gun), original);
  g.credits = 500; assert.equal(g.buyWeapon('smg'), true); assert.equal(g.buyWeapon('smg'), false); assert.equal(g.credits, 410);
  for (const state of ['menu', 'playing', 'paused', 'dead', 'won']) {
    g.state = state; assert.equal(g.buyWeapon('rifle'), false); assert.equal(g.equipWeapon('pistol'), false);
  }
  assert.equal(g.credits, 410); assert.equal(g.weaponId, 'smg');
});

test('switching owned weapons does not charge credits or manufacture ammunition', () => {
  const g = shop(200); g.gun.ammo = 5; const reserve = g.gun.reserve;
  g.buyWeapon('smg'); g.gun.ammo = 7;
  assert.equal(g.equipWeapon('pistol'), true); assert.equal(g.gun.ammo, 5);
  assert.equal(g.equipWeapon('smg'), true); assert.equal(g.gun.ammo, 7);
  assert.equal(g.gun.reserve, reserve); assert.equal(g.credits, 110);
  assert.equal(g.equipWeapon('rifle'), false);
});

test('weapon upgrades carry across purchases and switches without multiplying twice', () => {
  const g = shop(500);
  for (const id of ['damage', 'mag', 'rate', 'reload']) {
    g.state = 'upgrade'; g.choices = [{ id }]; g.upgrade(id);
  }
  g.state = 'upgrade'; g.buyWeapon('rifle');
  const rifle = WEAPONS.find(w => w.id === 'rifle');
  assert.equal(g.gun.damage, rifle.damage * 1.35); assert.equal(g.gun.mag, rifle.mag + 6);
  assert.equal(g.gun.interval, rifle.interval * .8); assert.equal(g.gun.reloadTime, rifle.reloadTime * .75);
  g.equipWeapon('pistol'); g.equipWeapon('rifle'); assert.equal(g.gun.damage, rifle.damage * 1.35);
});

test('shotguns spread six pellets while using one shell and rewarding a kill once', () => {
  const g = shop(140); g.buyWeapon('shotgun'); g.state = 'playing'; g.remaining = 999; g.spawnClock = 999;
  g.player.angle = 0; g.enemies = [target(g)];
  g.shoot(); assert.equal(g.bullets.length, 6); assert.equal(g.gun.ammo, 5);
  assert.ok(g.bullets[0].vy < 0); assert.ok(g.bullets[5].vy > 0);
  g.update(.01); assert.equal(g.kills, 1); assert.equal(g.credits, 10); assert.equal(g.score, 100);
});

test('each zombie type awards its advertised credits', () => {
  for (const [type, reward] of [['walker', 10], ['runner', 15], ['brute', 30]]) {
    const g = new Game(() => .5); g.start(); g.enemies = [target(g, type)]; g.player.angle = 0;
    g.shoot(); g.update(.01); assert.equal(g.credits, reward);
    g.update(.01); assert.equal(g.credits, reward);
  }
});

test('restart clears money, purchased weapons, and weapon upgrades', () => {
  const g = shop(500); g.buyWeapon('rifle'); g.choices = [{ id: 'damage' }]; g.upgrade('damage'); g.start();
  assert.equal(g.credits, 0); assert.equal(g.weaponId, 'pistol'); assert.deepEqual([...g.ownedWeapons.keys()], ['pistol']);
  assert.equal(g.gun.damage, 34); assert.equal(g.gun.mag, 18);
});
