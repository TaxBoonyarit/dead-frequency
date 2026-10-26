import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, OBSTACLES, W, H, blocked, randomObstacles } from '../dist/engine.mjs';
function rng(seed) { return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }

test('random cover keeps perimeter, gaps and the current survivor position clear', () => {
  const layouts = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    const player = seed % 2 ? { x:640, y:410 } : { x:200, y:150 };
    const layout = randomObstacles(rng(seed), player); layouts.add(JSON.stringify(layout));
    assert.ok(layout.length >= 4); assert.equal(blocked(player.x, player.y, 25, layout), false);
    for (const o of layout) {
      assert.ok(o.x >= 64 && o.y >= 64 && o.x + o.w <= W - 64 && o.y + o.h <= H - 64);
      for (const b of layout) if (o !== b) assert.ok(o.x >= b.x + b.w + 64 || o.x + o.w + 64 <= b.x || o.y >= b.y + b.h + 64 || o.y + o.h + 64 <= b.y);
    }
  }
  assert.equal(layouts.size, 100);
});

test('new waves replace cover without moving the survivor or changing other games', () => {
  const a = new Game(rng(11)), b = new Game(rng(12)); a.start(); b.start();
  const other = JSON.stringify(b.obstacles), previous = a.obstacles, position = [a.player.x,a.player.y];
  a.updatePaths(21); assert.ok(a.paths.size > 0);
  a.nextWave(); assert.notDeepEqual(a.obstacles, previous); assert.equal(a.paths.size,0);
  assert.deepEqual([a.player.x,a.player.y],position); assert.equal(JSON.stringify(b.obstacles),other);
  assert.notEqual(a.obstacles,OBSTACLES);
  const current=a.obstacles;a.pause();a.update(.05);a.pause();assert.equal(a.obstacles,current);
});

test('movement and bullets collide with the current layout rather than the default map', () => {
  const g=new Game(rng(1));g.start();g.spawnClock=999;
  g.obstacles=[{x:680,y:350,w:60,h:120,kind:'barrier'}];g.player.x=650;g.player.y=410;g.player.angle=0;
  g.shoot();for(let i=0;i<30;i++)g.update(.05,{x:1});
  assert.ok(g.player.x<=666);assert.equal(g.bullets.length,0);
});

test('large enemies can navigate random cover from every arena edge', () => {
  for (let seed=1;seed<=12;seed++) {
    const g=new Game(rng(seed));g.start();g.remaining=999;g.spawnClock=999;
    for(const [x,y] of [[32,200],[1248,600],[200,32],[1100,768]]) {
      const e={x,y,hp:999,maxHp:999,type:'brute',r:21,speed:90,phase:0,hit:0};g.enemies=[e];
      for(let i=0;i<2400&&Math.hypot(e.x-g.player.x,e.y-g.player.y)>34;i++) {
        g.player.invulnerable=100;g.update(1/60);assert.equal(blocked(e.x,e.y,e.r,g.obstacles),false);
      }
      assert.ok(Math.hypot(e.x-g.player.x,e.y-g.player.y)<=34,`seed ${seed}, edge ${x},${y}`);
    }
  }
});
