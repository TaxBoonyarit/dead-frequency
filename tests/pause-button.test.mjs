import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { bindPauseButton } from '../dist/input.mjs';

function setup(touch = true) {
  const listeners = new Map(), classes = new Set(); let pauses = 0;
  const button = {
    classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
    addEventListener(type, fn) { listeners.set(type, fn); },
    setPointerCapture(id) { this.captured = id; },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 92, height: 44 }),
  };
  const reset = bindPauseButton(button, { needsHold: () => touch, onPause: () => pauses++ });
  const send = (type, timeStamp = 0, extra = {}) => listeners.get(type)?.({
    pointerId: 1, button: 0, clientX: 46, clientY: 22, timeStamp, detail: 1, preventDefault() {}, ...extra,
  });
  return { button, classes, reset, send, count: () => pauses };
}

test('a mobile pause tap or short hold is ignored, including the following click', () => {
  for (const duration of [0, 100, 399]) {
    const s = setup(); s.send('pointerdown'); s.send('pointerup', duration); s.send('click', duration);
    assert.equal(s.count(), 0); assert.equal(s.classes.has('pause-holding'), false);
  }
});

test('holding for 400 ms then releasing pauses exactly once; waiting alone never pauses', () => {
  for (const duration of [400, 1000]) {
    const s = setup(); s.send('pointerdown', 100);
    assert.equal(s.classes.has('pause-holding'), true); assert.equal(s.button.captured, 1);
    assert.equal(s.count(), 0);
    s.send('pointerup', 100 + duration); s.send('click', 100 + duration);
    assert.equal(s.count(), 1); assert.equal(s.classes.has('pause-holding'), false);
    s.send('pointerup', 2000); assert.equal(s.count(), 1);
  }
});

test('dragging cancels the hold even after returning; releasing outside the button also cancels', () => {
  const s = setup(); s.send('pointerdown'); s.send('pointermove', 200, { clientX: 59 });
  s.send('pointermove', 500); s.send('pointerup', 600); s.send('click', 600);
  assert.equal(s.count(), 0);
  const outside = setup(); outside.send('pointerdown', 0, { clientX: 85 });
  outside.send('pointerup', 500, { clientX: 94 }); outside.send('click', 500);
  assert.equal(outside.count(), 0);
});

test('small finger jitter is allowed and other fingers cannot hijack or release the hold', () => {
  const s = setup(); s.send('pointerdown'); s.send('pointerdown', 10, { pointerId: 2 });
  s.send('pointerup', 500, { pointerId: 2 }); assert.equal(s.count(), 0);
  s.send('pointermove', 500, { clientX: 55, clientY: 24 });
  s.send('pointerup', 600, { clientX: 55, clientY: 24 }); assert.equal(s.count(), 1);
});

test('cancellation, capture loss and input reset cannot leave a pending pause', () => {
  for (const cancel of ['pointercancel', 'lostpointercapture', 'reset']) {
    const s = setup(); s.send('pointerdown');
    if (cancel === 'reset') s.reset(); else s.send(cancel, 100);
    s.send('pointerup', 1000); s.send('click', 1000);
    assert.equal(s.count(), 0); assert.equal(s.classes.has('pause-holding'), false);
  }
});

test('desktop clicks and keyboard or accessibility activation still pause immediately', () => {
  const desktop = setup(false); desktop.send('pointerdown'); desktop.send('pointerup', 10); desktop.send('click', 10);
  assert.equal(desktop.count(), 1);
  const keyboard = setup(); keyboard.send('click', 0, { detail: 0 }); assert.equal(keyboard.count(), 1);
});

test('releasing game inputs also clears a pending pause gesture', () => {
  const source = readFileSync(new URL('../dist/game.mjs', import.meta.url), 'utf8');
  const s = setup(); s.send('pointerdown');
  const context = { keys: new Set(), firing: true, touchInput: { reset() {} }, resetPausePress: s.reset };
  runInNewContext(source.slice(source.indexOf('function releaseInput()'), source.indexOf("window.addEventListener('blur'")), context);
  context.releaseInput(); s.send('pointerup', 1000);
  assert.equal(s.count(), 0); assert.equal(s.classes.has('pause-holding'), false);
});
