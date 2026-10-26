import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, AMMO } from '../dist/engine.mjs';
function running(random = () => .9) {
  const g = new Game(random); g.start(); g.obstacles = []; g.remaining = 999; g.spawnClock = 999;
  g.player.angle = 0; return g;
}
function pickup(g) { g.drops = [{x:g.player.x,y:g.player.y,type:'ammo',life:10}];g.update(.01); }
function angle(g) { const b=g.bullets.at(-1);return Math.abs(Math.atan2(b.vy,b.vx)); }

test('starting ammo is three spare magazines and pickups respect the reserve cap', () => {
  const g=running();assert.equal(g.gun.reserve,54);assert.equal(g.gun.ammo,18);
  g.gun.reserve=AMMO.maxReserve-4;pickup(g);
  assert.equal(g.gun.reserve,AMMO.maxReserve);assert.equal(g.events.at(-1).amount,4);
  const events=g.events.length;pickup(g);assert.equal(g.drops.length,1);assert.equal(g.events.length,events);
  g.gun.reserve-=20;g.update(.01);assert.equal(g.gun.reserve,AMMO.maxReserve-8);
});

test('wave upgrades supply 18 rounds total and refill from reserve rather than creating a free magazine', () => {
  const g=running();g.gun.ammo=0;g.gun.reserve=0;g.state='upgrade';g.choices=[{id:'mag'}];
  g.upgrade('mag');assert.equal(g.gun.mag,24);assert.equal(g.gun.ammo,18);assert.equal(g.gun.reserve,0);
  const loaded=g.gun.ammo;g.reload();assert.equal(g.gun.reload,0);assert.equal(g.gun.ammo,loaded);
});

test('ammo pickups grant twelve rounds and swapping weapons cannot bypass the reserve cap', () => {
  const g=running();g.gun.reserve=0;pickup(g);assert.equal(g.gun.reserve,12);
  g.gun.reserve=AMMO.maxReserve;g.state='upgrade';g.credits=1000;g.buyWeapon('lmg');
  g.equipWeapon('pistol');g.equipWeapon('lmg');assert.equal(g.gun.reserve,AMMO.maxReserve);
});

test('standing shots are tighter than moving shots, and sprinting is least accurate', () => {
  const deviations=[];
  for (const input of [{},{x:1},{x:1,sprint:true}]) {
    const g=running();g.update(.05,{...input,fire:true});deviations.push(angle(g));
  }
  assert.ok(deviations[0]<deviations[1]);assert.ok(deviations[1]<deviations[2]);
});

test('rapid shots widen the cone and a brief pause restores first-shot accuracy', () => {
  const g=running();g.shoot();const first=angle(g);
  for(let i=0;i<8;i++){g.gun.cooldown=0;g.shoot();}
  assert.ok(angle(g)>first*2);assert.ok(g.gun.bloom<=1);
  for(let i=0;i<60;i++)g.update(1/60);
  assert.equal(g.gun.bloom,0);g.shoot();assert.ok(Math.abs(angle(g)-first)<1e-9);
  g.pause();const before=g.gun.bloom;g.update(.05);assert.equal(g.gun.bloom,before);
});

test('precision rifles remain tighter than automatic weapons and shotgun pellets stay a spread', () => {
  const cones={};
  for(const id of ['rifle','sniper','smg','lmg','shotgun']) {
    const g=running();g.state='upgrade';g.credits=5000;g.buyWeapon(id);g.state='playing';
    cones[id]=g.accuracySpread();g.shoot();
    if(id==='shotgun'){assert.equal(g.bullets.length,6);assert.ok(g.bullets[0].vy<0&&g.bullets[5].vy>0);assert.equal(g.gun.ammo,5);}
  }
  assert.ok(cones.sniper<cones.rifle&&cones.rifle<cones.smg&&cones.smg<cones.lmg);
});
