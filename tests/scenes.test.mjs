import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../dist/engine.mjs';
import {SCENES,sceneForWave} from '../dist/scenes.mjs';
test('completing waves advances through all ten environments and restart restores quarantine',()=>{
  const g=new Game(()=>.5);g.start();const visited=[];
  for(let wave=1;wave<=10;wave++){
    assert.equal(g.wave,wave);visited.push(sceneForWave(g.wave));
    g.remaining=0;g.enemies=[];for(let i=0;i<62;i++)g.update(.05);
    if(wave<10)g.upgrade(g.choices[0].id);
  }
  assert.equal(new Set(visited.map(s=>s.name)).size,10);assert.equal(visited[9].kind,'nest');
  g.start();assert.equal(sceneForWave(g.wave),SCENES[0]);g.reset();assert.equal(sceneForWave(g.wave),SCENES[0]);
});
test('scene previews have valid palettes and atmosphere for every wave',()=>{
  for(const s of SCENES){for(const field of ['ground','road','roof','accent'])assert.match(s[field],/^#[0-9a-f]{6}$/);assert.ok(['ash','rain','mist','embers','spores'].includes(s.weather));}
  assert.equal(sceneForWave(-1),SCENES[0]);assert.equal(sceneForWave(99),SCENES[9]);
});
