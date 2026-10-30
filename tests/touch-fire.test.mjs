import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Game, WEAPONS } from '../dist/engine.mjs';
import { cameraOffset } from '../dist/view.mjs';

function running() {
  const g = new Game(() => .5); g.start(); g.obstacles = [];
  g.remaining = 999; g.spawnClock = 999; g.player.invulnerable = 999;
  g.player.x = 300; g.player.y = 400; g.player.angle = 0;
  return g;
}
function enemy(x = 450, y = 400) {
  return { x, y, hp: 10000, maxHp: 10000, type: 'walker', r: 14, speed: 0, phase: 0, hit: 0 };
}
const aiming = { fire: true, autoFire: true };

test('mobile aiming at empty space spends no ammo; a target entering and leaving starts and stops fire', () => {
  const g = running(), e = enemy(450, 460); g.enemies = [e];
  for (let i = 0; i < 60; i++) g.update(1 / 60, aiming);
  assert.equal(g.gun.ammo, 18); assert.equal(g.fireTarget, null);
  e.y = 400;
  for (let i = 0; i < 60; i++) g.update(1 / 60, aiming);
  assert.ok(g.gun.ammo < 17); assert.equal(g.fireTarget, e);
  const ammo = g.gun.ammo; e.y = 460;
  for (let i = 0; i < 60; i++) g.update(1 / 60, aiming);
  assert.equal(g.gun.ammo, ammo); assert.equal(g.fireTarget, null);
  assert.equal(g.player.angle, 0, 'The gun must never turn towards a target by itself');
});

test('mobile target detection rejects dead, behind, off-axis and hidden enemies', () => {
  const g = running();
  for (const e of [enemy(200), enemy(450, 418), { ...enemy(), hp: 0 }]) {
    g.enemies = [e]; g.update(.01, aiming);
    assert.equal(g.gun.ammo, 18); assert.equal(g.fireTarget, null);
  }
  g.enemies = [enemy()];
  g.update(.01, { ...aiming, targetVisible: () => false });
  assert.equal(g.gun.ammo, 18); assert.equal(g.fireTarget, null);
});

test('cover blocks auto fire, including a thin wall, while a partly exposed enemy can be hit', () => {
  const g = running(), e = enemy(); g.enemies = [e];
  for (const wall of [{ x: 370, y: 350, w: 60, h: 100 }, { x: 370, y: 399, w: .1, h: 2 }]) {
    g.obstacles = [wall]; g.update(.05, aiming);
    assert.equal(g.gun.ammo, 18); assert.equal(g.fireTarget, null);
  }
  g.obstacles = [{ x: 445, y: 350, w: 60, h: 100 }];
  assert.equal(g.aimTarget(), e, 'The near side of the enemy is exposed in front of cover');
});

test('the nearest target surface wins and overlapping enemies remain targetable', () => {
  const g = running(), far = enemy(550), near = enemy(450);
  g.enemies = [far, near]; assert.equal(g.aimTarget(), near);
  near.hp = 0; assert.equal(g.aimTarget(), far);
  g.enemies = [enemy(g.player.x, g.player.y)];
  g.update(.01, aiming); assert.equal(g.gun.ammo, 17);
});

test('shotgun auto fire checks the actual remaining weapon range and strict hit radius', () => {
  const g = running(); g.state = 'upgrade'; g.credits = 1000; g.buyWeapon('shotgun'); g.state = 'playing';
  const e = enemy(g.player.x + g.gun.range * 980 + 17 + .1); g.enemies = [e];
  g.update(.01, aiming); assert.equal(g.gun.ammo, 6);
  e.x -= .2;
  g.update(.01, aiming); assert.equal(g.gun.ammo, 5);
  e.x = 450; e.y = 417; g.gun.cooldown = 0;
  g.update(.01, aiming); assert.equal(g.gun.ammo, 5, 'A tangent is outside the strict hit radius');
});

test('all eight guns keep their ammo cost, pellet count, cooldown and manual direction', () => {
  for (const weapon of WEAPONS) {
    const g = running(); g.state = 'upgrade'; g.credits = 9999;
    if (weapon.id !== 'pistol') g.buyWeapon(weapon.id);
    g.state = 'playing'; const e = enemy(600, 408); g.enemies = [e];
    const ammo = g.gun.ammo;
    g.update(.001, aiming);
    assert.equal(g.fireTarget, e); assert.equal(g.gun.ammo, ammo - 1);
    assert.equal(g.bullets.length, weapon.pellets); assert.equal(g.player.angle, 0);
    g.update(.001, aiming); assert.equal(g.gun.ammo, ammo - 1);
  }
});

test('targeting uses this frame movement and manual aim, with the current viewport predicate', () => {
  const g = running(), e = enemy(500, 410); g.enemies = [e];
  let checkedX;
  g.update(.05, { ...aiming, x: 1, aim: { x: 500, y: 410 }, targetVisible: () => { checkedX = g.player.x; return true; } });
  assert.ok(checkedX > 300); assert.equal(g.fireTarget, e); assert.equal(g.gun.ammo, 17);
  assert.equal(g.player.angle, Math.atan2(e.y - g.player.y, e.x - g.player.x));
});

test('release, pause and restart cannot cause a queued or extra shot', () => {
  const g = running(); g.enemies = [enemy()]; g.update(.01, aiming);
  const ammo = g.gun.ammo;
  g.pause(); for (let i = 0; i < 60; i++) g.update(.05, aiming);
  assert.equal(g.gun.ammo, ammo);
  g.pause(); for (let i = 0; i < 60; i++) g.update(.05, { autoFire: true, fire: false });
  assert.equal(g.gun.ammo, ammo); assert.equal(g.fireTarget, null);
  g.start(); assert.equal(g.fireTarget, null);
});

test('auto fire respects reloading and melee recovery; empty-ammo melee remains available', () => {
  const g = running(); g.enemies = [enemy()]; g.gun.ammo = 1; g.reload();
  g.update(.05, aiming); assert.equal(g.gun.ammo, 1);
  g.gun.reload = 0; g.attackMelee(); g.update(.01, aiming); assert.equal(g.gun.ammo, 1);
  g.melee.cooldown = 0; g.melee.swing = null; g.gun.ammo = g.gun.reserve = 0;
  g.update(.01, aiming); assert.ok(g.knifeCooldown > 0);
});

test('desktop fire remains immediate in empty space', () => {
  const g = running(); g.update(.01, { fire: true });
  assert.equal(g.gun.ammo, 17); assert.equal(g.fireTarget, null);
});

test('mobile viewport filtering follows the player camera and includes the expanded portrait height', () => {
  const game = running(); game.player.x = 640;
  const source = readFileSync(new URL('../dist/game.mjs', import.meta.url), 'utf8');
  const context = { game, cameraOffset, viewWidth: 620, viewHeight: 1300, cameraY: -250 };
  runInNewContext(source.slice(source.indexOf('function touchTargetVisible('), source.indexOf('function frame(')), context);
  assert.equal(context.touchTargetVisible({x:329,y:400}),false);
  assert.equal(context.touchTargetVisible({x:951,y:400}),false);
  assert.equal(context.touchTargetVisible({x:640,y:-200}),true);
  assert.equal(context.touchTargetVisible({x:640,y:1051}),false);
  game.player.x=100;
  assert.equal(context.touchTargetVisible({x:100,y:400}),true);
  assert.equal(context.touchTargetVisible({x:621,y:400}),false);
});
