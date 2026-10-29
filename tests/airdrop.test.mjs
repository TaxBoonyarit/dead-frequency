import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, AIRDROP_LOOT, rollAirdrop, AMMO, BOSSES, WEAPONS, blocked } from '../dist/engine.mjs';
import { controlKey } from '../dist/input.mjs';

function running(wave = 2) {
  const g = new Game(() => .5); g.start(); g.wave = wave; g.obstacles = [];
  g.remaining = 999; g.spawnClock = 999; g.events = [];
  return g;
}
function tick(g, seconds) { for (let i = 0; i < Math.ceil(seconds / .05); i++) g.update(.05); }
function lootRoll(id, seen = new Set()) {
  const pool = AIRDROP_LOOT.filter(item => !seen.has(item.id));
  const total = pool.reduce((sum, item) => sum + item.weight, 0);
  let weight = 0;
  for (const item of pool) { if (item.id === id) return (weight + item.weight / 2) / total; weight += item.weight; }
  throw new Error(id);
}
function crate(g, id) {
  g.airdrop = { x: g.player.x + 40, y: g.player.y, state: 'landed', life: 30 };
  const roll = lootRoll(id, g.airdropLootSeen);
  g.random = () => roll;
}
function rng(seed) { return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }

test('all 1000 loot slots match the agreed odds, including 25% enemies and 0.1% jackpot', () => {
  const counts = new Map();
  for (let i = 0; i < 1000; i++) { const id = rollAirdrop(() => (i + .5) / 1000).id; counts.set(id, (counts.get(id) || 0) + 1); }
  assert.equal(AIRDROP_LOOT.reduce((sum, item) => sum + item.weight, 0), 1000);
  assert.equal(counts.size, 13);
  assert.deepEqual(AIRDROP_LOOT.map(item => item.weight), [150, 70, 30, 300, 200, 150, 60, 15, 10, 6, 5, 3, 1]);
  for (const item of AIRDROP_LOOT) assert.equal(counts.get(item.id), item.weight);
  assert.equal(counts.get('zombies') + counts.get('horde') + counts.get('specialBoss'), 250);
  assert.equal(counts.get('jackpot'), 1);
  assert.equal(rollAirdrop(() => 0).id, 'zombies'); assert.equal(rollAirdrop(() => .999999).id, 'jackpot');
});

test('seen results are excluded and the remaining weights retain their proportions', () => {
  const seen = new Set(['zombies', 'ammo']);
  const pool = AIRDROP_LOOT.filter(item => !seen.has(item.id));
  const total = pool.reduce((sum, item) => sum + item.weight, 0), counts = new Map();
  for (let i = 0; i < total; i++) {
    const result = rollAirdrop(() => (i + .5) / total, seen);
    assert.equal(seen.has(result.id), false);
    counts.set(result.id, (counts.get(result.id) || 0) + 1);
  }
  for (const item of pool) assert.equal(counts.get(item.id), item.weight);
  assert.deepEqual([...seen], ['zombies', 'ammo']);
  assert.equal(rollAirdrop(() => 0, new Set(AIRDROP_LOOT.map(item => item.id))), undefined);
});

test('nine opened crates never repeat across waves, even with a constant random source', () => {
  const g = running(), results = [];
  g.random = () => 0;
  for (let wave = 2; wave <= 10; wave++) {
    assert.equal(g.wave, wave);
    g.airdrop = { x: g.player.x + 40, y: g.player.y, state: 'landed', life: 30 };
    assert.equal(g.openAirdrop(), true);
    results.push(g.events.findLast(event => event.type === 'airdropOpened').kind);
    assert.equal(g.airdropLootSeen.size, results.length);
    if (wave < 10) g.nextWave();
  }
  assert.equal(new Set(results).size, 9);
  assert.deepEqual(results, AIRDROP_LOOT.slice(0, 9).map(item => item.id));
  g.start(); assert.equal(g.airdropLootSeen.size, 0);
  g.wave = 2; g.random = () => 0;
  g.airdrop = { x: g.player.x + 40, y: g.player.y, state: 'landed', life: 30 };
  assert.equal(g.openAirdrop(), true);
  assert.equal(g.events.findLast(event => event.type === 'airdropOpened').kind, results[0]);
  g.reset(); assert.equal(g.airdropLootSeen.size, 0);
});

test('unopened and exhausted crates do not consume results', () => {
  const g = running(); g.airdropClock = null;
  g.airdrop = { x: g.player.x + 40, y: g.player.y, state: 'landed', life: .01 };
  g.update(.05); assert.equal(g.airdrop, null); assert.equal(g.airdropLootSeen.size, 0);
  g.airdropLootSeen = new Set(AIRDROP_LOOT.map(item => item.id));
  g.airdrop = { x: g.player.x + 40, y: g.player.y, state: 'landed', life: 30 };
  assert.equal(g.openAirdrop(), false); assert.equal(g.airdrop.state, 'landed');
  assert.equal(g.events.some(event => event.type === 'airdropOpened'), false);
});

test('wave one has no crate and later waves independently have a 40% chance', () => {
  for (const roll of [0, .399999, .4, .999999]) {
    const g = new Game(() => roll); g.start(); assert.equal(g.airdropClock, null);
    for (let wave = 2; wave <= 10; wave++) {
      g.nextWave();
      if (roll < .4) assert.ok(g.airdropClock >= 8 && g.airdropClock < 15);
      else assert.equal(g.airdropClock, null);
    }
  }
});

test('airdrop warns, descends for three seconds, expires, and never repeats in the wave', () => {
  const g = running(); g.random = rng(3); g.airdropClock = .01;
  g.update(.05); assert.equal(g.airdrop.state, 'falling'); assert.equal(g.canOpenAirdrop, false);
  assert.equal(g.events.filter(e => e.type === 'airdropIncoming').length, 1);
  tick(g, 2.8); assert.equal(g.airdrop.state, 'falling');
  tick(g, .3); assert.equal(g.airdrop.state, 'landed'); assert.equal(g.airdropClock, null);
  assert.equal(g.events.filter(e => e.type === 'airdropLanded').length, 1);
  tick(g, 30.1); assert.equal(g.airdrop, null);
  tick(g, 15); assert.equal(g.events.filter(e => e.type === 'airdropIncoming').length, 1);
});

test('opening is explicit, near the crate, unblocked, once only, and respects pause and attacks', () => {
  const g = running(); crate(g, 'ammo'); const reserve = g.gun.reserve;
  tick(g, .1); assert.equal(g.gun.reserve, reserve);
  g.player.x -= 100; assert.equal(g.openAirdrop(), false); g.player.x += 100;
  g.obstacles = [{ x:g.player.x + 15, y:g.player.y - 20, w:5, h:40 }]; assert.equal(g.openAirdrop(), false);
  g.obstacles = []; g.pause(); assert.equal(g.openAirdrop(), false); g.pause();
  g.melee.cooldown = 1; assert.equal(g.openAirdrop(), false); g.melee.cooldown = 0;
  assert.equal(g.airdropLootSeen.size, 0);
  assert.equal(g.openAirdrop(), true); assert.equal(g.gun.reserve, reserve + 24);
  assert.deepEqual([...g.airdropLootSeen], ['ammo']);
  assert.equal(g.openAirdrop(), false); assert.equal(g.gun.reserve, reserve + 24);
  assert.equal(controlKey({ code:'KeyE', key:'ำ' }), 'e');
});

test('all airdrop timers and buffs freeze on pause, reset on restart, and crates clear each wave', () => {
  const g = running(); crate(g, 'zombies'); g.openAirdrop(); g.buffs = { speed:8, shield:3 };
  g.pause(); tick(g, 5); assert.equal(g.ambush.delay, 3); assert.deepEqual(g.buffs, {speed:8,shield:3});
  g.pause(); g.nextWave(); assert.equal(g.airdrop, null); assert.equal(g.ambush, null);
  g.airdropClock = .01; g.pause(); tick(g, 1); assert.equal(g.airdropClock, .01);
  g.start(); assert.equal(g.airdropClock, null); assert.equal(g.airdrop, null); assert.equal(g.ambush, null);
  assert.deepEqual(g.buffs, {speed:0,shield:0});
});

test('unopened or scheduled crates do not block completion, but pending ambushes and spawned enemies do', () => {
  const g = running(); g.remaining = 0; crate(g, 'zombies');
  g.update(.05); assert.equal(g.clearClock, 3);
  g.openAirdrop(); assert.equal(g.clearClock, null);
  tick(g, 2.9); assert.equal(g.enemies.length, 0); assert.equal(g.state, 'playing'); assert.equal(g.clearClock, null);
  tick(g, .2); assert.ok(g.enemies.length >= 2 && g.enemies.length <= 4); assert.equal(g.remaining, 0);
  assert.equal(g.clearClock, null);
  for (const e of g.enemies) g.damageEnemy(e, 10000);
  tick(g, 3.2); assert.equal(g.state, 'upgrade');
  const h = running(); h.remaining = 0; h.airdropClock = 2; tick(h, 3.2);
  assert.equal(h.state, 'upgrade'); assert.equal(h.airdropClock, null); assert.equal(h.airdrop, null);
});

test('hordes respect count limits, difficulty, wave scaling, safe spawn positions and the main boss counter', () => {
  for (const wave of [2, 5, 10]) {
    const g = running(wave); g.scale = 1.35; crate(g, 'horde'); const remaining = g.remaining;
    g.openAirdrop(); tick(g, 3.1);
    assert.ok(g.enemies.length >= 5 && g.enemies.length <= 7); assert.equal(g.remaining, remaining);
    for (const e of g.enemies) {
      assert.ok(e.hp > 42); assert.equal(blocked(e.x, e.y, e.r, g.obstacles), false);
      assert.ok(Math.hypot(e.x - g.player.x, e.y - g.player.y) > 70);
    }
  }
});

test('special boss pays a guaranteed physical money bag once and grants ten seconds when killed last', () => {
  for (const wave of [2, 6, 10]) {
    const g = running(wave); crate(g, 'specialBoss'); g.openAirdrop(); tick(g, 3.1);
    const boss = g.enemies.find(e => e.special);
    assert.ok(boss); assert.equal(boss.name, 'THE COLLECTOR'); assert.equal(boss.maxHp, BOSSES[wave - 1].hp * 1.25);
    assert.equal(g.remaining, 999); g.remaining = 0; g.random = () => .999999;
    g.damageEnemy(boss, 100000); g.damageEnemy(boss, 100000);
    const money = g.drops.filter(d => d.type === 'credits'); assert.equal(money.length, 1);
    assert.equal(money[0].amount, 100 + wave * 20); assert.equal(g.credits, 0);
    g.update(.05); assert.equal(g.clearClock, 10);
    tick(g, 3.2); assert.equal(g.state, 'playing');
    g.player.x = boss.x; g.player.y = boss.y; g.update(.05); assert.equal(g.credits, 100 + wave * 20);
    tick(g, 7); assert.equal(g.state, wave === 10 ? 'won' : 'upgrade'); assert.equal(g.kills, 1);
  }
});

test('killing one of two bosses preserves the other boss and its hazards', () => {
  const g = running(5); g.remaining = 1; g.spawnBoss(); const main = g.enemies[0];
  crate(g, 'specialBoss'); g.openAirdrop(); tick(g, 3.1); const special = g.enemies.find(e => e.special);
  g.hazards = [{owner:main,life:10}, {owner:special,life:10}];
  g.damageEnemy(special, 10000);
  assert.equal(main.hp, main.maxHp); assert.deepEqual(g.hazards.map(h => h.owner), [main]);
  assert.equal(g.clearDelay, 3); assert.equal(g.enemies.filter(e => e.hp > 0).length, 1);
});

test('ammo, health and money rewards respect caps and full supplies convert to small credit rewards', () => {
  const g = running(3); g.gun.reserve = 115; crate(g, 'ammo'); g.openAirdrop(); assert.equal(g.gun.reserve, AMMO.maxReserve);
  g.grantSupply('ammo', g.player); assert.equal(g.credits, 8);
  g.player.hp = 1; crate(g, 'health'); g.openAirdrop(); assert.equal(g.player.hp, 41);
  g.player.hp = g.player.maxHp; g.grantSupply('health', g.player); assert.equal(g.credits, 16);
  crate(g, 'credits'); g.openAirdrop(); assert.ok(g.credits >= 35 && g.credits < 54);
});

test('stim and shield extend duration without stacking strength, expire, and do not damage the survivor', () => {
  const g = running(), speed = g.player.speed; g.player.stamina = 0;
  crate(g, 'stim'); g.openAirdrop(); g.grantSupply('stim', g.player);
  assert.equal(g.buffs.speed, 16); assert.equal(g.player.stamina, 100);
  const x = g.player.x; g.update(.05, {x:1}); assert.equal(g.player.x, x + speed * 1.25 * .05);
  crate(g, 'shield'); g.openAirdrop(); g.grantSupply('shield', g.player); assert.equal(g.buffs.shield, 6);
  g.hurtPlayer(1000); assert.equal(g.player.hp, g.player.maxHp);
  tick(g, 16.1); assert.equal(g.buffs.speed, 0); assert.equal(g.buffs.shield, 0); assert.equal(g.player.speed, speed);
  g.hurtPlayer(10); assert.ok(g.player.hp < g.player.maxHp);
});

test('blast damages nearby enemies only and upgrade rewards persist into later waves', () => {
  const g = running(4); g.createZombie('brute', g.player.x + 50, g.player.y); g.createZombie('brute', 100, 100);
  const far = g.enemies[1], hp = far.hp, playerHp = g.player.hp;
  crate(g, 'blast'); g.openAirdrop(); assert.ok(g.enemies[0].hp < hp); assert.equal(far.hp, hp); assert.equal(g.player.hp, playerHp);
  crate(g, 'upgrade'); g.openAirdrop(); const reload = g.gun.reloadTime;
  assert.ok(reload < WEAPONS[0].reloadTime); g.nextWave(); assert.equal(g.gun.reloadTime, reload);
});

test('weapon rewards equip unlocked weapons without losing old ammo, and duplicates become money', () => {
  const g = running(2); g.gun.ammo = 7; g.gun.reserve = 12; g.gun.reload = 1; g.autoReloadPending = true;
  crate(g, 'gun'); g.openAirdrop(); assert.equal(g.weaponId, 'smg'); assert.equal(g.gun.ammo, 30);
  assert.equal(g.ownedWeapons.get('pistol'), 7); assert.equal(g.gun.reserve, 12); assert.equal(g.gun.reload, 0); assert.equal(g.autoReloadPending, false);
  g.grantSupply('gun', g.player); assert.equal(g.credits, 7); assert.equal(g.ownedWeapons.size, 2);
  crate(g, 'melee'); g.openAirdrop(); assert.equal(g.meleeId, 'crowbar'); assert.ok(g.ownedMelee.has('crowbar'));
  g.grantSupply('melee', g.player); assert.equal(g.credits, 14);
  assert.equal(g.equipWeapon('pistol'), false); assert.equal(g.buyWeapon('rifle'), false);
  const h = running(8); crate(h, 'jackpot'); h.openAirdrop(); assert.equal(h.weaponId, 'sniper');
  assert.equal(h.gun.ammo, 5); assert.equal(h.gun.reserve, AMMO.start + 24); assert.equal(h.credits, 130);
});

test('random cover offers reachable drop and ambush sites even beside arena edges and walls', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const g = new Game(rng(seed)); g.start();
    for (const [x,y] of [[640,410], [14,400], [640,14]]) {
      g.player.x = x; g.player.y = y;
      for (const radius of [20,25]) {
        const point = g.supplyPoint(radius); assert.ok(point, `seed ${seed}, player ${x},${y}`);
        assert.equal(blocked(point.x, point.y, radius, g.obstacles), false);
        assert.ok(Math.hypot(point.x - x, point.y - y) >= 110);
      }
    }
  }
});
