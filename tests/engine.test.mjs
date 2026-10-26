import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, AMMO, blocked, OBSTACLES } from '../dist/engine.mjs';

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
  tick(g, g.gun.reloadTime + .2); assert.equal(g.gun.ammo, 7); assert.equal(g.gun.reserve, 0); assert.equal(g.gun.reload, 0);
  g.reload(); assert.equal(g.gun.reload, 0);
});
test('a completed wave offers valid upgrades and replenishes supplies', () => {
  const g = running(); g.remaining = 0; for(let i=0;i<62;i++) g.update(.05);
  assert.equal(g.state, 'upgrade'); assert.equal(g.choices.length, 3); assert.equal(new Set(g.choices.map(u => u.id)).size, 3);
  const wave = g.wave; g.upgrade('invalid'); assert.equal(g.state, 'upgrade');
  g.player.hp = 35; const totalAmmo = g.gun.reserve + g.gun.ammo; g.upgrade(g.choices[0].id);
  assert.equal(g.state, 'playing'); assert.equal(g.wave, wave + 1); assert.equal(g.gun.reserve + g.gun.ammo, totalAmmo + AMMO.wave); assert.ok(g.player.hp >= 55);
});
test('wave ten ends with evacuation, and restart clears the run', () => {
  const g = running(); g.wave = 10; g.remaining = 0; for(let i=0;i<62;i++) g.update(.05);
  assert.equal(g.state, 'won'); assert.equal(g.score, 5000);
  g.start(); assert.equal(g.wave, 1); assert.equal(g.score, 0); assert.equal(g.kills, 0); assert.equal(g.player.hp, g.player.maxHp);
});
test('pause freezes time, damage, movement, and reload', () => {
  const g = running(); g.enemies.push(enemy(g.player.x, g.player.y)); g.gun.ammo = 1; g.reload(); g.pause();
  const snapshot = JSON.stringify({ time: g.time, player: g.player, gun: g.gun }); tick(g, 3, { x: 1, fire: true });
  assert.equal(JSON.stringify({ time: g.time, player: g.player, gun: g.gun }), snapshot);
  g.pause(); g.update(.01); assert.ok(g.player.hp < g.player.maxHp);
});
test('contact damage has a grace period and death stops the simulation', () => {
  const g = running(); g.enemies.push(enemy(g.player.x, g.player.y)); g.player.hp = 13;
  g.update(.01); assert.equal(g.player.hp, 1); tick(g, .5); assert.equal(g.player.hp, 1);
  tick(g, .3); assert.equal(g.state, 'dead'); assert.equal(g.player.hp, 0);
  const t = g.time; g.update(.05); assert.equal(g.time, t);
});
test('pickups heal up to max health and add ammunition once', () => {
  const g = running(); g.player.hp = g.player.maxHp - 5; g.gun.reserve = 0;
  g.drops = ['health', 'ammo'].map(type => ({ x: g.player.x, y: g.player.y, type, life: 10 }));
  g.update(.01); assert.equal(g.player.hp, g.player.maxHp); assert.equal(g.gun.reserve, AMMO.pickup); assert.equal(g.drops.length, 0);
  g.update(.01); assert.equal(g.gun.reserve, AMMO.pickup);
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

test('point-blank shots damage overlapping enemies in every direction', () => {
  for (const angle of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) for (const distance of [0, 5, 20]) {
    const g = running(); g.player.angle = angle;
    g.enemies = [enemy(g.player.x + Math.cos(angle) * distance, g.player.y + Math.sin(angle) * distance)];
    g.shoot(); g.update(1 / 60);
    assert.equal(g.enemies[0].hp, 31, `Missed at distance ${distance}, angle ${angle}`);
    assert.equal(g.gun.ammo, 17);
  }
});

test('a close shot hits only the first enemy along its trajectory', () => {
  const g = running(); g.player.angle = 0;
  g.enemies = [enemy(645, 410), enemy(680, 410)]; g.shoot(); tick(g, .3);
  assert.equal(g.enemies[0].hp, 31); assert.equal(g.enemies[1].hp, 65);
});

test('walkers and brutes reach targets around corners without clipping obstacles', () => {
  const targets = [[640, 410], [400, 200], [350, 300], [880, 290], [600, 180], [600, 550]];
  const starts = [[22, 200], [22, 600], [1258, 200], [1258, 600], [200, 22], [1100, 22], [200, 778], [1100, 778]];
  for (const radius of [14, 21]) for (const [px, py] of targets) for (const [x, y] of starts) {
    const g = running(); g.player.x = px; g.player.y = py;
    const e = { ...enemy(x, y), r: radius, speed: 65, type: radius === 21 ? 'brute' : 'walker' };
    g.enemies = [e];
    const context = `radius=${radius} start=${x},${y} target=${px},${py}`;
    for (let i = 0; i < 3600 && Math.hypot(e.x - px, e.y - py) >= radius + 15; i++) {
      g.player.invulnerable = 100; g.update(1 / 60);
      assert.equal(blocked(e.x, e.y, e.r), false, `Clipped obstacle: ${context}`);
    }
    assert.ok(Math.hypot(e.x - px, e.y - py) < radius + 15, `Stuck at ${e.x},${e.y}: ${context}`);
  }
});

test('brutes can attack a player standing closer to a wall than their radius', () => {
  const g = running(); g.player.x = 355; g.player.y = 200;
  const e = { ...enemy(400, 400), r: 21, speed: 65, type: 'brute' }; g.enemies = [e];
  for (let i = 0; i < 1200 && g.player.hp === g.player.maxHp; i++) g.update(1 / 60);
  assert.ok(g.player.hp < g.player.maxHp); assert.equal(blocked(e.x, e.y, e.r), false);
});

test('wave clear leaves three seconds to collect supplies and pauses its countdown', () => {
  const g=running();g.remaining=0;g.player.hp=50;g.update(.01);
  assert.equal(g.state,'playing');assert.equal(g.clearClock,3);
  assert.equal(g.events.filter(e=>e.type==='waveCleared').length,1);
  const ammo=g.gun.ammo;g.shoot();assert.equal(g.gun.ammo,ammo);
  const start=g.player.x;g.drops=[{x:start+25,y:g.player.y,type:'ammo',life:20}];const reserve=g.gun.reserve;
  g.update(.05,{x:1});assert.ok(g.player.x>start);assert.equal(g.gun.reserve,reserve+AMMO.pickup);
  const clock=g.clearClock;g.pause();g.update(.05);assert.equal(g.clearClock,clock);g.pause();
  tick(g,2);assert.equal(g.state,'playing');tick(g,1.1);assert.equal(g.state,'upgrade');
  assert.equal(g.events.filter(e=>e.type==='waveCleared').length,1);
  g.upgrade(g.choices[0].id);assert.equal(g.clearClock,null);
});
