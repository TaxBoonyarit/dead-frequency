import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.mjs';
import {SCENES,sceneForWave,shuffleScenes} from '../dist/scenes.mjs';
test('completing waves visits every shuffled environment exactly once',()=>{
  const g=new Game(()=>.5);g.start();const visited=[];
  for(let wave=1;wave<=10;wave++){
    assert.equal(g.wave,wave);visited.push(sceneForWave(g.wave,g.sceneOrder));
    g.remaining=0;g.enemies=[];for(let i=0;i<62;i++)g.update(.05);
    if(wave<10)g.upgrade(g.choices[0].id);
  }
  assert.equal(new Set(visited.map(s=>s.name)).size,10);assert.deepEqual(visited,g.sceneOrder);
  g.reset();assert.equal(sceneForWave(g.wave,g.sceneOrder),SCENES[0]);
});
test('scene previews have valid palettes and atmosphere for every wave',()=>{
  for(const s of SCENES){for(const field of ['ground','road','roof','accent'])assert.match(s[field],/^#[0-9a-f]{6}$/);assert.ok(['ash','rain','mist','embers','spores'].includes(s.weather));}
  assert.equal(sceneForWave(-1),SCENES[0]);assert.equal(sceneForWave(99),SCENES[9]);
});

test('scene shuffle preserves the catalogue and uses the supplied random source',()=>{
  const original=[...SCENES];
  const first=shuffleScenes(()=>0),second=shuffleScenes(()=>.999);
  assert.deepEqual(SCENES,original);
  assert.notDeepEqual(first,second);
  assert.equal(new Set(first).size,10);
  assert.ok(first.every(scene=>SCENES.includes(scene)));
});
test('scene order stays stable during play and pause, and is reshuffled on a new run',()=>{
  let value=0;const g=new Game(()=>value);g.start();const first=[...g.sceneOrder];
  g.update(.05);g.pause();g.update(.05);g.pause();assert.deepEqual(g.sceneOrder,first);
  value=.999;g.start();assert.notDeepEqual(g.sceneOrder,first);assert.equal(g.wave,1);
  assert.equal(new Set(g.sceneOrder).size,10);
});
