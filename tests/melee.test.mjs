import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, MELEE_WEAPONS } from '../dist/engine.mjs';
import { controlKey } from '../dist/input.mjs';
function running() { const g = new Game(() => .5); g.start(); g.obstacles = []; g.remaining = 999; g.spawnClock = 999; g.player.angle = 0; return g; }
function enemy(g, dx, dy = 0, hp = 500, type = 'walker') { return { x:g.player.x+dx,y:g.player.y+dy,hp,maxHp:hp,type,r:14,speed:0,phase:0,hit:0 }; }
function tick(g, seconds) { for (let t=0;t<seconds;t+=.01) g.update(.01); }
test('knife is free by default; melee purchases and equipment are wave-break only and reset per run', () => {
 const g=running(); assert.equal(MELEE_WEAPONS.length,6); assert.equal(g.meleeId,'knife'); assert.deepEqual([...g.ownedMelee],['knife']);
 g.credits=2000; assert.equal(g.buyMelee('katana'),false); g.state='upgrade';
 assert.equal(g.buyMelee('unknown'),false); g.credits=199; assert.equal(g.buyMelee('crowbar'),false);
 g.credits=2400; for(const w of MELEE_WEAPONS.slice(1)) { assert.equal(g.buyMelee(w.id),true); assert.equal(g.meleeId,w.id); assert.equal(g.buyMelee(w.id),false); }
 assert.equal(g.credits,0); assert.equal(g.equipMelee('knife'),true); assert.equal(g.equipMelee('unknown'),false);
 g.start(); assert.equal(g.meleeId,'knife'); assert.equal(g.ownedMelee.size,1);
});
test('knife strikes nearest target once after windup, respects angle and range', () => {
 const g=running(); const near=enemy(g,35), far=enemy(g,50), behind=enemy(g,-30), outside=enemy(g,100), side=enemy(g,10,40); g.enemies=[far,near,behind,outside,side];
 assert.equal(g.attackMelee(),true); assert.equal(near.hp,500); assert.equal(g.attackMelee(),false); tick(g,.31);
 assert.equal(near.hp,470); for(const e of [far,behind,outside,side]) assert.equal(e.hp,500);
});
test('katana sweeps multiple targets, walls block and a swing cannot damage twice', () => {
 const g=running(); g.meleeId='katana'; const a=enemy(g,80),b=enemy(g,65,40),c=enemy(g,-40);g.enemies=[a,b,c];g.attackMelee();tick(g,.65);
 assert.equal(a.hp,410);assert.equal(b.hp,410);assert.equal(c.hp,500);
 const h=running();h.obstacles=[{x:h.player.x+20,y:h.player.y-20,w:10,h:40}];const e=enemy(h,40);h.enemies=[e];h.attackMelee();tick(h,.4);assert.equal(e.hp,500);
});
test('melee cancels reload without spending ammo, blocks shooting/reload and freezes on pause', () => {
 const g=running();g.gun.ammo=2;g.reload();assert.ok(g.gun.reload>0);g.attackMelee();assert.equal(g.gun.reload,0);g.shoot();g.reload();assert.equal(g.gun.ammo,2);assert.equal(g.gun.reload,0);
 const cooldown=g.melee.cooldown;g.pause();tick(g,1);assert.equal(g.melee.cooldown,cooldown);assert.equal(g.attackMelee(),false);g.pause();tick(g,.4);g.shoot();assert.equal(g.gun.ammo,1);
 assert.equal(controlKey({code:'KeyF',key:'ด'}),'f');
});
test('melee kills award rewards once and last boss death clears hazards and finishes wave', () => {
 const g=running();g.random=()=>.49;g.wave=10;g.remaining=0;const e=enemy(g,30,0,20,'boss');e.reward=60;g.enemies=[e];g.hazards=[{x:0,y:0,r:2,life:10,damage:1}];g.attackMelee();tick(g,.15);
 assert.equal(g.kills,1);assert.equal(g.credits,72);assert.equal(g.hazards.length,0);assert.equal(g.enemies.length,0);assert.ok(g.events.some(e=>e.type==='pickup' && e.pickup==='ammo'));
 tick(g,3.2);assert.equal(g.state,'won');assert.equal(g.kills,1);
});
test('bosses resist push and never stagger, ordinary enemies do', () => {
 const g=running();g.meleeId='sledge';const a=enemy(g,60), b=enemy(g,65,15,500,'boss');b.attackClock=100;b.attacks=['slam'];b.stage=1;g.enemies=[a,b];g.attackMelee();tick(g,.46);assert.ok(a.stagger>0);assert.equal(b.stagger,0);assert.ok(a.x-g.player.x>80);assert.ok(b.x-g.player.x<75);
});

test('emergency knife and equipped melee cannot stack attacks and ammo pickup waits for recovery', () => {
 const g=running();g.gun.ammo=0;g.gun.reserve=0;
 g.attackMelee();g.shoot();assert.equal(g.slash,null);
 g.addReserve(12);assert.equal(g.gun.reload,0);tick(g,.35);assert.ok(g.gun.reload>0);
 g.gun.ammo=0;g.gun.reserve=0;g.gun.reload=0;g.shoot();assert.ok(g.slash);assert.equal(g.attackMelee(),false);
 tick(g,.5);assert.equal(g.attackMelee(),true);
});

test('empty gun uses each equipped melee instead of reverting to emergency knife after recovery', () => {
 for (const w of MELEE_WEAPONS.slice(1)) {
  const g=running();g.state='upgrade';g.credits=2000;assert.equal(g.buyMelee(w.id),true);g.state='playing';
  g.gun.ammo=0;g.gun.reserve=0;const e=enemy(g,40);g.enemies=[e];
  assert.equal(g.usingMelee,true);assert.equal(g.usingKnife,false);
  g.attackMelee();tick(g,w.interval+.05);
  assert.equal(g.meleeId,w.id);assert.equal(g.usingKnife,false);assert.equal(g.melee.swing,null);
  const hp=e.hp;g.shoot();assert.equal(g.melee.swing.weapon.id,w.id);assert.equal(g.slash,null);
  tick(g,w.windup+.01);assert.equal(e.hp,hp-w.damage);
  g.addReserve(12);tick(g,w.interval+.05);assert.equal(g.usingMelee,false);assert.ok(g.gun.reload>0);
  assert.equal(g.meleeId,w.id);assert.equal(g.weaponId,'pistol');
 }
});
