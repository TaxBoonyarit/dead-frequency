import {test} from 'node:test';
import assert from 'node:assert/strict';
import {controlKey, keyboardMovement} from '../dist/input.mjs';
import {Game} from '../dist/engine.mjs';
test('Thai-layout WASD events move the survivor in all four physical directions', () => {
  for (const [code, key, x, y] of [['KeyW','ไ',0,-1],['KeyA','ฟ',-1,0],['KeyS','ห',0,1],['KeyD','ก',1,0]]) {
    const game = new Game(); game.start(); game.spawnClock = 999;
    const keys = new Set([controlKey({code,key})]);
    const input = keyboardMovement(keys); assert.deepEqual(input,{x,y});
    game.update(.05,input); assert.equal(game.player.x,640+x*game.player.speed*.05); assert.equal(game.player.y,410+y*game.player.speed*.05);
    keys.delete(controlKey({code,key:key.toUpperCase()})); assert.deepEqual(keyboardMovement(keys),{x:0,y:0});
  }
});
test('physical key release survives switching keyboard layouts mid-press', () => {
  const keys = new Set([controlKey({code:'KeyW',key:'ไ'})]);
  keys.delete(controlKey({code:'KeyW',key:'w'})); assert.equal(keys.size,0);
  assert.equal(controlKey({code:'KeyR',key:'พ'}),'r'); assert.equal(controlKey({code:'KeyP',key:'ย'}),'p');
  assert.equal(controlKey({code:'KeyW',key:'W'}),'w'); assert.equal(controlKey({code:'Space',key:' '}),' ');
});
test('arrow keys and key-only fallback retain existing controls', () => {
  assert.deepEqual(keyboardMovement(new Set([controlKey({code:'ArrowLeft',key:'ArrowLeft'}),controlKey({code:'ArrowUp',key:'ArrowUp'})])),{x:-1,y:-1});
  assert.equal(controlKey({key:'W'}),'w'); assert.equal(controlKey({code:'ShiftRight',key:'Shift'}),'shift');
});

function element() {
  const listeners = new Map(), classes = new Set();
  return {
    style: {setProperty(name,value){this[name]=value;}}, offsetWidth:37,
    classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
    addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},
    getBoundingClientRect(){return {left:0,top:0,width:92,height:92};},
    setPointerCapture(id){this.captured=id;},
    send(type,id,x=46,y=46){for(const fn of listeners.get(type)||[])fn({pointerId:id,button:0,clientX:x,clientY:y,preventDefault(){}});},
  };
}

test('touch joystick and fire track separate fingers and ignore unrelated releases', async () => {
  const {bindTouchControls}=await import('../dist/input.mjs');
  const stick=element(),knob=element(),fire=element(),sprint=element();
  const input=bindTouchControls({stick,knob,fire,sprint,canUse:()=>true});
  stick.send('pointerdown',1,200,46);fire.send('pointerdown',2);fire.send('pointermove',2,80,46);sprint.send('pointerdown',3);
  assert.equal(input.x,1);assert.equal(input.y,0);assert.equal(input.firing,true);assert.equal(input.sprinting,true);
  stick.send('pointerdown',4,0,0);stick.send('pointerup',4);fire.send('pointerup',4);
  assert.equal(input.x,1);assert.equal(input.firing,true);
  stick.send('pointerup',1);assert.equal(input.x,0);assert.equal(input.firing,true);
  fire.send('pointercancel',2);sprint.send('lostpointercapture',3);
  assert.equal(input.firing,false);assert.equal(input.sprinting,false);
});

test('touch reset clears every held action and inactive controls cannot restart it', async () => {
  const {bindTouchControls}=await import('../dist/input.mjs');
  let active=true;const stick=element(),knob=element(),fire=element(),sprint=element();
  const input=bindTouchControls({stick,knob,fire,sprint,canUse:()=>active});
  stick.send('pointerdown',1,46,10);fire.send('pointerdown',2);input.reset();active=false;
  stick.send('pointermove',1,200,46);fire.send('pointerdown',3);sprint.send('pointerdown',4);
  assert.equal(input.x,0);assert.equal(input.y,0);assert.equal(input.firing,false);assert.equal(input.sprinting,false);
  assert.equal(knob.style.transform,'');
  active=true;stick.send('pointerdown',5,46,200);assert.equal(input.y,1);
});

test('simultaneous movement, manual aim, sprint and fire work in the engine', () => {
  const game=new Game(()=>.5);game.start();game.obstacles=[];game.remaining=999;game.spawnClock=999;
  const x=game.player.x;game.player.angle=Math.PI;
  game.enemies=[{x:x+150,y:game.player.y,hp:100,maxHp:100,type:'walker',r:14,speed:0,phase:0,hit:0}];
  game.update(.05,{x:1,sprint:true,fire:true,aim:{x:x+150,y:game.player.y}});
  assert.ok(game.player.x>x);assert.ok(game.player.stamina<100);assert.equal(game.gun.ammo,17);
  assert.ok(Math.abs(game.player.angle)<.01);assert.ok(game.bullets[0].vx>0);
});

test('dragging FIRE aims relative to the initial touch, independently of walking', async () => {
  const {bindTouchControls}=await import('../dist/input.mjs');
  const stick=element(),knob=element(),fire=element(),sprint=element();
  const input=bindTouchControls({stick,knob,fire,sprint,canUse:()=>true});
  stick.send('pointerdown',1,200,46);fire.send('pointerdown',2,35,50);
  fire.send('pointermove',2,40,50);assert.equal(input.aim,null);
  fire.send('pointermove',2,35,-50);assert.deepEqual(input.aim,{x:0,y:-1});assert.equal(input.x,1);
  fire.send('pointermove',3,200,50);assert.deepEqual(input.aim,{x:0,y:-1});
  fire.send('pointermove',2,135,50);assert.deepEqual(input.aim,{x:1,y:0});
  fire.send('pointerup',2);assert.equal(input.aim,null);assert.equal(input.firing,false);assert.equal(input.x,1);
  fire.send('pointerdown',4);fire.send('pointermove',4,0,46);input.reset();
  assert.equal(input.aim,null);assert.equal(fire.style['--aim-x'],'0px');
});

test('manual drag direction controls actual bullets even when an enemy is in another direction', async () => {
  const {bindTouchControls}=await import('../dist/input.mjs');
  for(const [dx,dy] of [[100,0],[-100,0],[0,100],[0,-100]]) {
    const stick=element(),knob=element(),fire=element(),sprint=element();
    const input=bindTouchControls({stick,knob,fire,sprint,canUse:()=>true});
    fire.send('pointerdown',2);fire.send('pointermove',2,46+dx,46+dy);
    const g=new Game(()=>.5);g.start();g.obstacles=[];g.spawnClock=999;g.remaining=999;
    g.enemies=[{x:g.player.x+150,y:g.player.y,hp:100,maxHp:100,type:'walker',r:14,speed:0,phase:0,hit:0}];
    g.update(.01,{fire:input.firing,aim:p=>({x:p.x+input.aim.x*1000,y:p.y+input.aim.y*1000})});
    const bullet=g.bullets[0];assert.ok(bullet.vx*dx+bullet.vy*dy>0);
    assert.ok(Math.abs(bullet.vx*dy-bullet.vy*dx)<1e-6);
  }
});

test('holding FIRE does not shoot or target an enemy until a drag direction is selected', async () => {
  const {bindTouchControls}=await import('../dist/input.mjs');
  const stick=element(),knob=element(),fire=element(),sprint=element();
  const input=bindTouchControls({stick,knob,fire,sprint,canUse:()=>true});
  const g=new Game(()=>.5);g.start();g.obstacles=[];g.spawnClock=999;g.remaining=999;
  g.player.angle=Math.PI/2;
  g.enemies=[{x:g.player.x+150,y:g.player.y,hp:100,maxHp:100,type:'walker',r:14,speed:0,phase:0,hit:0}];
  fire.send('pointerdown',2);fire.send('pointermove',2,50,46);
  g.update(.01,{fire:input.firing});
  assert.equal(input.aim,null);assert.equal(g.gun.ammo,18);assert.equal(g.player.angle,Math.PI/2);
  fire.send('pointermove',2,46,-54);
  g.update(.01,{fire:input.firing,aim:p=>({x:p.x+input.aim.x*1000,y:p.y+input.aim.y*1000})});
  assert.equal(g.gun.ammo,17);assert.ok(g.bullets[0].vy<0);assert.ok(Math.abs(g.player.angle+Math.PI/2)<1e-9);
  g.enemies[0].x=g.player.x-150;g.update(.01);
  assert.ok(Math.abs(g.player.angle+Math.PI/2)<1e-9);
  fire.send('pointerup',2);assert.equal(input.firing,false);assert.equal(input.aim,null);
});
