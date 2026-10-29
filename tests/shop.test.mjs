import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, WEAPONS } from '../dist/engine.mjs';

function shop(credits = 220) {
  const g = new Game(() => .5); g.start(); g.remaining = 0; for(let i=0;i<62;i++) g.update(.05);
  g.credits = credits; return g;
}
function target(g, type = 'walker', hp = 10) {
  return { x: g.player.x + 5, y: g.player.y, hp, maxHp: hp, type, r: 14, speed: 0, phase: 0, hit: 0 };
}

test('early kills require saving before an SMG purchase equips it', () => {
  const g = new Game(() => .5); g.start(); g.remaining = 0; g.player.angle = 0;
  g.random = () => .29;
  g.enemies = Array.from({ length: 9 }, () => target(g));
  while (g.state === 'playing') g.update(.05, { fire: true });
  assert.equal(g.state, 'upgrade'); assert.equal(g.credits, 218); assert.equal(g.score, 900);
  assert.equal(g.buyWeapon('smg'), false);
  assert.equal(g.credits, 218);
  g.credits = 220;
  assert.equal(g.buyWeapon('smg'), true);
  assert.equal(g.credits, 0); assert.equal(g.weaponId, 'smg'); assert.equal(g.gun.mag, 30); assert.equal(g.gun.ammo, 30);
  assert.equal(g.score, 900); assert.equal(g.wave, 1);
  g.upgrade(g.choices[0].id); assert.equal(g.wave, 2); assert.equal(g.state, 'playing'); assert.equal(g.weaponId, 'smg');
});

test('transactions reject insufficient funds, unknown IDs, duplicates, and combat', () => {
  const g = shop(219); const original = JSON.stringify(g.gun);
  for (const id of ['smg', 'shotgun', 'rifle', 'unknown', '__proto__']) assert.equal(g.buyWeapon(id), false);
  assert.equal(g.credits, 219); assert.equal(JSON.stringify(g.gun), original);
  g.credits = 500; assert.equal(g.buyWeapon('smg'), true); assert.equal(g.buyWeapon('smg'), false); assert.equal(g.credits, 280);
  for (const state of ['menu', 'playing', 'paused', 'dead', 'won']) {
    g.state = state; assert.equal(g.buyWeapon('rifle'), false); assert.equal(g.equipWeapon('pistol'), false);
  }
  assert.equal(g.credits, 280); assert.equal(g.weaponId, 'smg');
});

test('switching owned weapons does not charge credits or manufacture ammunition', () => {
  const g = shop(330); g.gun.ammo = 5; const reserve = g.gun.reserve;
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
  const g = shop(350); g.buyWeapon('shotgun'); g.state = 'playing'; g.remaining = 999; g.spawnClock = 999;
  g.random = () => .29;
  g.player.angle = 0; g.enemies = [target(g)];
  g.shoot(); assert.equal(g.bullets.length, 6); assert.equal(g.gun.ammo, 5);
  assert.ok(g.bullets[0].vy < 0); assert.ok(g.bullets[5].vy > 0);
  g.update(.01); assert.equal(g.kills, 1); assert.equal(g.credits, 12); assert.equal(g.score, 100);
});

test('zombie money starts small and increases each wave, while scores stay unchanged', () => {
  for (const [type, rewards, score] of [
    ['walker', [12, 16, 20, 24, 28, 32, 36, 40, 44, 48], 100],
    ['runner', [20, 24, 32, 36, 44, 48, 56, 60, 68, 72], 150],
    ['brute', [36, 48, 60, 72, 84, 96, 108, 120, 132, 144], 300],
  ]) {
    rewards.forEach((amount, index) => {
      const g = new Game(() => .5); g.start(); g.wave = index + 1; g.obstacles = [];
      g.random = () => .29;
      const e = target(g, type); e.x += 100; g.enemies = [e];
      g.damageEnemy(e, 10); g.damageEnemy(e, 10);
      assert.equal(g.credits, 0); assert.equal(g.kills, 1); assert.equal(g.score, score);
      assert.deepEqual(g.drops, [{ x: e.x, y: e.y, type: 'credits', amount, life: 35 }]);
      g.update(.01); assert.equal(g.credits, 0);
      g.player.x = e.x; g.update(.01); assert.equal(g.credits, amount);
      g.update(.01); assert.equal(g.credits, amount);
    });
  }
});

test('restart clears money, purchased weapons, and weapon upgrades', () => {
  const g = shop(500); g.buyWeapon('rifle'); g.choices = [{ id: 'damage' }]; g.upgrade('damage'); g.start();
  assert.equal(g.credits, 0); assert.equal(g.weaponId, 'pistol'); assert.deepEqual([...g.ownedWeapons.keys()], ['pistol']);
  assert.equal(g.gun.damage, 34); assert.equal(g.gun.mag, 18);
});

test('shotgun pellets knock back and stagger without pushing an enemy through a wall', () => {
  const g = shop(350); g.buyWeapon('shotgun'); g.state = 'playing'; g.remaining = 999; g.spawnClock = 999;
  g.player.x = 640; g.player.y = 410; g.player.angle = 0;
  const e = target(g, 'walker', 1000); e.x = 685; e.speed = 65; g.enemies = [e];
  g.shoot(); g.update(.05);
  assert.ok(e.x > 685); assert.ok(e.stagger > 0); const x = e.x; g.bullets = [];
  g.update(.05); assert.equal(e.x, x);
  g.player.x = 680; g.player.y = 300; g.player.angle = 0;
  e.x = 709; e.y = 300; e.stagger = 0; g.gun.cooldown = 0;
  g.shoot(); g.update(.05);
  assert.ok(e.x <= 711, 'barrier at x725 must stop radius14 body');
});

test('all eight weapons purchase, equip and shoot with finite ballistics and correct ammo', () => {
  assert.equal(WEAPONS.length,8);
  const g=shop(5000);
  for(const w of WEAPONS) {
    g.state='upgrade'; if(w.price) assert.equal(g.buyWeapon(w.id),true);
    assert.equal(g.weaponId,w.id); g.state='playing'; g.gun.cooldown=0;
    const before=g.gun.ammo;g.bullets=[];g.shoot(); assert.equal(g.gun.ammo,before-1);assert.equal(g.bullets.length,w.pellets);
    assert.ok(g.bullets.every(b=>Number.isFinite(b.vx)&&Number.isFinite(b.vy)&&b.damage===w.damage));
  }
});
