import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../dist/game.mjs', import.meta.url), 'utf8');
function setup(request) {
  const classes = new Set(), attributes = new Map(), listeners = new Map(), panel = { requestFullscreen: request };
  const button = { setAttribute: (key, value) => attributes.set(key, value) };
  const document = { fullscreenElement: null, fullscreenEnabled: true, body: { classList: { contains: c => classes.has(c), add: c => classes.add(c), remove: c => classes.delete(c) } }, addEventListener: (name, callback) => listeners.set(name, callback), async exitFullscreen() { this.fullscreenElement = null; listeners.get('fullscreenchange')(); } };
  const context = { document, $: () => button, canvas: { closest: () => panel }, resize() {}, toast() {} };
  runInNewContext(source.slice(source.indexOf('function syncFullscreen()'), source.indexOf("document.querySelectorAll('[data-difficulty]').forEach(b =>")), context);
  return { context, document, panel, button, attributes, classes, listeners };
}

test('phones without fullscreen support can expand and exit with the same button', async () => {
  const { context, classes, attributes } = setup();
  await context.toggleFullscreen();
  assert.equal(classes.has('game-expanded'), true); assert.equal(attributes.get('aria-label'), 'ออกจากเต็มหน้าจอ');
  await context.toggleFullscreen();
  assert.equal(classes.size, 0); assert.equal(attributes.get('aria-pressed'), 'false');
});
test('a rejected fullscreen request falls back to filling the web viewport', async () => {
  const { context, classes } = setup(async () => { throw new Error('Not allowed'); });
  await context.toggleFullscreen(); assert.equal(classes.has('game-expanded'), true);
});
test('disabled fullscreen avoids the native call', async () => {
  const { context, document, classes } = setup(() => { assert.fail('Native fullscreen disabled'); });
  document.fullscreenEnabled = false;
  await context.toggleFullscreen(); assert.equal(classes.has('game-expanded'), true);
});
test('native fullscreen includes the toolbar and synchronizes when the browser exits', async () => {
  const s = setup();
  s.panel.requestFullscreen = async () => { s.document.fullscreenElement = s.panel; s.listeners.get('fullscreenchange')(); };
  await s.context.toggleFullscreen();
  assert.equal(s.document.fullscreenElement, s.panel); assert.equal(s.classes.size, 0); assert.equal(s.attributes.get('aria-pressed'), 'true');
  await s.document.exitFullscreen(); assert.equal(s.attributes.get('aria-label'), 'เต็มหน้าจอ');
  await s.context.toggleFullscreen(); await s.context.toggleFullscreen();
  assert.equal(s.document.fullscreenElement, null); assert.equal(s.classes.size, 0);
});
test('Escape exits the fallback before it can toggle pause or other game input', () => {
  const { context, classes, attributes } = setup();
  let keydown, prevented = false;
  context.window = { addEventListener: (_, callback) => { keydown = callback; } };
  context.controlKey = event => event.key;
  classes.add('game-expanded');
  runInNewContext(source.slice(source.indexOf("window.addEventListener('keydown'"), source.indexOf("window.addEventListener('keyup'")), context);
  keydown({ key: 'escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true); assert.equal(classes.size, 0); assert.equal(attributes.get('aria-pressed'), 'false');
});
