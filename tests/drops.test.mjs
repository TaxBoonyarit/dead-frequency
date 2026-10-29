import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, W, H, blocked } from '../dist/engine.mjs';

function running() {
  const g = new Game(() => .1); g.start(); g.obstacles = []; g.remaining = 999; g.spawnClock = 999;
  return g;
}
function separated(g) {
  for (const [i, d] of g.drops.entries()) {
    assert.equal(blocked(d.x, d.y, 14, g.obstacles), false);
    for (const other of g.drops.slice(i + 1)) assert.ok(Math.hypot(d.x - other.x, d.y - other.y) >= 56 - 1e-6);
    if (g.airdrop) assert.ok(Math.hypot(d.x - g.airdrop.x, d.y - g.airdrop.y) >= 72);
  }
}

test('boss money, random supplies and guaranteed ammo occupy separate nearby spots', () => {
  const g = running(), e = {x:640,y:410,hp:1,r:25,type:'boss',reward:60};
  g.damageEnemy(e, 1); g.damageEnemy(e, 1);
  assert.equal(g.drops.length, 3); separated(g);
  assert.deepEqual(g.drops.map(d => [d.type,d.amount,d.life]), [['credits',72,22],['ammo',undefined,22],['ammo',undefined,30]]);
  assert.ok(g.drops.every(d => Math.hypot(d.x - e.x, d.y - e.y) <= 56 + 1e-6));
  assert.equal(g.kills, 1); assert.equal(g.score, 600);
});

test('crowded kills retain every drop and leave all items individually collectible', () => {
  const g = running(); g.gun.reserve = 0; g.player.x = 300; g.player.y = 300;
  for (let i = 0; i < 30; i++) g.damageEnemy({x:640,y:410,hp:1,r:14,type:'walker'}, 1);
  assert.equal(g.drops.length, 60); separated(g);
  for (const d of [...g.drops].filter(d => d.type === 'credits')) {
    g.player.x = d.x; g.player.y = d.y; g.update(.01);
  }
  assert.equal(g.credits, 360); assert.equal(g.drops.some(d => d.type === 'credits'), false);
});

test('items spread inside arena edges and around walls without dropping inside cover', () => {
  for (const [x,y] of [[14,14], [W-14,H-14], [640,410]]) {
    const g = running();
    g.obstacles = [{x:655,y:350,w:100,h:120}, {x:500,y:425,w:140,h:70}];
    for (let i = 0; i < 40; i++) assert.equal(g.addDrop({x,y,type:'credits',amount:i+1,life:22}), true);
    assert.equal(g.drops.length, 40); separated(g);
    assert.equal(g.drops.reduce((sum,d) => sum+d.amount, 0), 820);
  }
});

test('drops avoid existing Airdrops and incoming crates avoid existing items', () => {
  const g = running(); g.airdrop = {x:640,y:410,state:'landed',life:30};
  for (const type of ['credits','health','ammo']) g.addDrop({x:640,y:410,type,amount:3,life:22});
  assert.equal(g.drops.length, 3); separated(g);
  g.airdrop = null; const point = g.supplyPoint(); assert.ok(point);
  g.addDrop({...point,type:'ammo',life:22});
  const next = g.supplyPoint(); assert.ok(next);
  assert.ok(g.drops.every(d => Math.hypot(d.x-next.x,d.y-next.y) >= 72));
});

test('expired items free their spot without consuming another random draw', () => {
  const g = running(); let draws = 0; g.random = () => {draws++;return .1;};
  g.drops = [{x:640,y:410,type:'ammo',life:0}];
  g.addDrop({x:640,y:410,type:'credits',amount:9,life:22});
  assert.equal(draws, 0); assert.deepEqual(g.drops[1], {x:640,y:410,type:'credits',amount:9,life:22});
});
