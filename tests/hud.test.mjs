import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Game, WEAPONS, MELEE_WEAPONS } from '../dist/engine.mjs';

const source=readFileSync(new URL('../dist/game.mjs',import.meta.url),'utf8');
const updateHUD=source.slice(source.indexOf('function updateHUD()'),source.indexOf('function renderState()'));

function setup() {
  const game=new Game(()=>.5);game.start();
  const elements=new Map();
  function $(id) {
    if(!elements.has(id)) {
      let html='';
      elements.set(id,{style:{},children:[],writes:0,textContent:'',
        setAttribute(){},classes:new Map(),classList:{toggle(name,value){elements.get(id).classes.set(name,value);}},querySelector(){return this;},
        get innerHTML(){return html;},set innerHTML(value){html=value;this.writes++;}});
    }
    return elements.get(id);
  }
  const context={game,$,WEAPONS,MELEE_WEAPONS,touchInput:{firing:false},timeText:()=> '00:00:00'};
  runInNewContext(updateHUD,context);
  return {game,$,context};
}

test('HUD preserves label nodes until wave, ammo, reserve or melee display changes', () => {
  const {game,$,context}=setup();
  for(let i=0;i<100;i++)context.updateHUD();
  assert.equal($('wave-label').writes,1);assert.equal($('ammo-label').writes,1);
  assert.match($('wave-label').innerHTML,/01/);assert.match($('ammo-label').innerHTML,/18/);
  game.gun.ammo--;context.updateHUD();assert.equal($('ammo-label').writes,2);
  game.gun.reserve--;context.updateHUD();assert.equal($('ammo-label').writes,3);
  game.wave++;context.updateHUD();assert.equal($('wave-label').writes,2);
  game.gun.ammo=game.gun.reserve=0;context.updateHUD();
  assert.match($('ammo-label').innerHTML,/∞.*ประชิด/);assert.equal($('ammo-label').writes,4);
  context.updateHUD();assert.equal($('ammo-label').writes,4);
  game.gun.reserve=12;context.updateHUD();
  assert.match($('ammo-label').innerHTML,/12/);assert.equal($('ammo-label').writes,5);
});

test('touch feedback distinguishes aiming, firing, reload and release without a stale firing state', () => {
  const {game,$,context}=setup();
  const check=(label,shooting)=>{
    context.updateHUD();
    assert.equal($('touch-fire').textContent,label);
    assert.equal($('touch-fire').classes.get('auto-firing'),shooting);
  };
  check('ลากเล็ง',false);
  context.touchInput.firing=true;check('หาเป้าหมาย',false);
  game.fireTarget={hp:100};check('กำลังยิง',true);
  game.gun.reload=1;check('รีโหลด…',false);
  game.gun.reload=0;game.fireTarget.hp=0;check('หาเป้าหมาย',false);
  game.fireTarget.hp=100;context.touchInput.firing=false;check('ลากเล็ง',false);
  context.touchInput.firing=true;game.pause();check('หาเป้าหมาย',false);
  game.gun.ammo=game.gun.reserve=0;check('ลากเพื่อตี',false);
});
