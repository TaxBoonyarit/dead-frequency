import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindWakeLock } from '../dist/wake-lock.mjs';
function setup(request) {
  const listeners = new Map(), attributes = new Map(), notifications = [], locks = [];
  const document = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn) };
  const button = { setAttribute: (name, value) => attributes.set(name, value) };
  const navigator = { wakeLock: { async request(type) {
    assert.equal(type, 'screen');
    if (request) return request();
    let onRelease;
    const lock = { released: false, addEventListener: (_, fn) => { onRelease = fn; }, async release() { this.released = true; onRelease?.(); } };
    locks.push(lock); return lock;
  } } };
  bindWakeLock(button, { document, navigator, notify: message => notifications.push(message) });
  return { button, document, attributes, notifications, locks, visible: async () => { document.hidden = false; listeners.get('visibilitychange')(); await new Promise(resolve => setImmediate(resolve)); } };
}
test('button enables a screen lock and releases it when turned off', async () => {
  const s = setup(); await s.button.onclick();
  assert.equal(s.attributes.get('aria-pressed'), 'true'); assert.equal(s.button.textContent, 'กันจอดับ ✓');
  await s.button.onclick(); assert.equal(s.locks[0].released, true); assert.equal(s.attributes.get('aria-pressed'), 'false');
  await s.visible(); assert.equal(s.locks.length, 1);
});
test('automatically released lock shows waiting and reacquires when returning to the page', async () => {
  const s = setup(); await s.button.onclick(); s.document.hidden = true; await s.locks[0].release();
  assert.equal(s.button.textContent, 'กันจอดับ รอ');
  await s.visible(); assert.equal(s.locks.length, 2); assert.equal(s.button.textContent, 'กันจอดับ ✓');
  await s.visible(); assert.equal(s.locks.length, 2);
});
test('request rejection resets the toggle and allows a retry', async () => {
  const s = setup(() => { throw new Error('Low battery'); }); await s.button.onclick();
  assert.equal(s.attributes.get('aria-pressed'), 'false'); assert.equal(s.button.disabled, false); assert.equal(s.notifications.length, 1);
});
test('a request completing after the page is hidden releases its new lock', async () => {
  let resolve; const lock = { released: false, async release() { this.released = true; } };
  const s = setup(() => new Promise(done => { resolve = done; }));
  const result = s.button.onclick(); assert.equal(s.button.disabled, true);
  s.document.hidden = true; resolve(lock); await result;
  assert.equal(lock.released, true); assert.equal(s.button.textContent, 'กันจอดับ รอ');
});
test('unsupported browsers disable the button with an explanation', () => {
  const button = { setAttribute() {} };
  bindWakeLock(button, { document: { addEventListener() {} }, navigator: {}, notify() {} });
  assert.equal(button.disabled, true); assert.match(button.title, /HTTPS/);
});
