import {test} from 'node:test';
import assert from 'node:assert/strict';
import {controlKey, keyboardMovement} from '../dist/input.mjs';
import {Game} from '../dist/engine.mjs';
test('Thai-layout WASD events move the survivor in all four physical directions', () => {
  for (const [code, key, x, y] of [['KeyW','ไ',0,-1],['KeyA','ฟ',-1,0],['KeyS','ห',0,1],['KeyD','ก',1,0]]) {
    const game = new Game(); game.start(); game.spawnClock = 999;
    const keys = new Set([controlKey({code,key})]);
    const input = keyboardMovement(keys); assert.deepEqual(input,{x,y});
    game.update(.05,input); assert.equal(game.player.x,640+x*9.5); assert.equal(game.player.y,410+y*9.5);
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
