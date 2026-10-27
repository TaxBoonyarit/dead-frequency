import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { CHANGELOG, CHANGE_TYPES, SEEN_VERSION_KEY, bindChangelog, releaseDate } from '../dist/changelog.mjs';
import { Game } from '../dist/engine.mjs';

const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const source = readFileSync(new URL('../dist/game.mjs', import.meta.url), 'utf8');
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
function newer(a, b) {
  const [x, y] = [a, b].map(v => v.split('.').map(Number));
  const i = x.findIndex((part, index) => part !== y[index]);
  return i >= 0 && x[i] > y[i];
}
function element(tagName) {
  const classes = new Set(), attributes = new Map();
  return { tagName, children: [], className: '', textContent: '', classes, attributes,
    classList: { toggle: (name, on) => on ? classes.add(name) : classes.delete(name) },
    setAttribute: (name, value) => attributes.set(name, value),
    append(...nodes) { this.children.push(...nodes); }, replaceChildren(...nodes) { this.children = nodes; } };
}
function setup(seen, getStorage) {
  const stored = new Map(seen ? [[SEEN_VERSION_KEY, seen]] : []), button = element('button'), list = element('div');
  let opened = 0;
  getStorage ??= () => ({ getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) });
  bindChangelog(button, list, { document: { createElement: element }, getStorage, open: () => opened++ });
  return { button, list, stored, opened: () => opened };
}

test('the newest release notes match the package version', () => {
  assert.equal(CHANGELOG[0].version, version, 'Add release notes for the new version at the top of dist/changelog.mjs');
});

test('releases are unique, newest first, dated and describe at least one known change type', () => {
  CHANGELOG.forEach(({ version, date, changes }, i) => {
    assert.match(version, /^\d+\.\d+\.\d+$/);
    assert.equal(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), date);
    if (i) { assert.ok(newer(CHANGELOG[i - 1].version, version), `${CHANGELOG[i - 1].version} must be newer than ${version}`); assert.ok(CHANGELOG[i - 1].date >= date); }
    assert.ok(changes.length > 0);
    for (const { type, text } of changes) { assert.ok(Object.hasOwn(CHANGE_TYPES, type), type); assert.ok(text.trim()); }
  });
});

test('dates use Thai month abbreviations without timezone shifts', () => {
  assert.equal(releaseDate('2026-10-27'), '27 ต.ค. 2026');
  assert.equal(releaseDate('2027-01-01'), '1 ม.ค. 2027');
});

test('every release renders newest first with only the latest expanded and labelled changes', () => {
  const { list } = setup();
  assert.equal(list.children.length, CHANGELOG.length);
  list.children.forEach((release, i) => {
    const [summary, items] = release.children, [name, time, latest] = summary.children;
    assert.equal(release.open, i === 0);
    assert.equal(name.textContent, `V${CHANGELOG[i].version}`); assert.equal(time.dateTime, CHANGELOG[i].date);
    assert.equal(latest?.textContent, i === 0 ? 'ล่าสุด' : undefined);
    assert.deepEqual(items.children.map(item => [item.children[0].textContent, item.children[1].textContent]),
      CHANGELOG[i].changes.map(change => [CHANGE_TYPES[change.type], change.text]));
  });
});

test('an unviewed latest version is marked until the notes are opened', () => {
  const s = setup('1.0.0');
  assert.equal(s.button.classes.has('has-update'), true); assert.match(s.button.attributes.get('aria-label'), /มีอัปเดตใหม่/);
  s.button.onclick();
  assert.equal(s.opened(), 1); assert.equal(s.stored.get(SEEN_VERSION_KEY), CHANGELOG[0].version);
  assert.equal(s.button.classes.has('has-update'), false); assert.equal(s.button.attributes.get('aria-label'), `V${CHANGELOG[0].version} · ดูบันทึกการอัปเดต`);
  assert.equal(setup(CHANGELOG[0].version).button.classes.has('has-update'), false);
});

test('blocked site data still opens the notes', () => {
  const s = setup(null, () => { throw new Error('SecurityError'); });
  assert.equal(s.button.classes.has('has-update'), true);
  s.button.onclick(); assert.equal(s.opened(), 1); assert.equal(s.button.classes.has('has-update'), false);
});

test('the version badge opens the notes dialog', () => {
  assert.match(html, /<button id="changelog-button"[^>]*><span id="game-version">V[\d.]+<\/span><\/button>/);
  assert.match(html, /<dialog id="changelog"[\s\S]*id="close-changelog"[\s\S]*id="changelog-list"[\s\S]*id="changelog-done"[\s\S]*<\/dialog>/);
});

function dialogSetup() {
  const game = new Game(), elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, { open: false, listeners: {}, focus() {}, showModal() { this.open = true; }, close() { this.open = false; this.listeners.close?.(); }, addEventListener(name, fn) { this.listeners[name] = fn; } });
    return elements.get(id);
  };
  let open;
  const context = { game, $, document: {}, canvas: { focus() {} }, renderState() {}, bindChangelog: (button, list, options) => { open = options.open; } };
  runInNewContext(`let pausedForDialog = false;${source.slice(source.indexOf('function openPausingDialog('), source.indexOf("window.addEventListener('keydown'"))}`, context);
  return { game, $, open: () => open() };
}

test('opening the notes during a mission pauses it and closing resumes', () => {
  const { game, $, open } = dialogSetup();
  game.start(); open();
  assert.equal($('changelog').open, true); assert.equal(game.state, 'paused');
  $('changelog-done').onclick();
  assert.equal($('changelog').open, false); assert.equal(game.state, 'playing');
  game.pause(); open(); $('close-changelog').onclick();
  assert.equal(game.state, 'paused');
});

test('opening the notes from setup leaves the menu unchanged', () => {
  const { game, $, open } = dialogSetup();
  open(); assert.equal(game.state, 'menu');
  $('changelog').close(); assert.equal(game.state, 'menu');
});

test('game keys are ignored while the notes are open', () => {
  let keydown, prevented = false;
  const keys = new Set();
  const context = { $: id => ({ open: id === 'changelog' }), keys, controlKey: event => event.key, window: { addEventListener: (_, callback) => { keydown = callback; } } };
  runInNewContext(source.slice(source.indexOf("window.addEventListener('keydown'"), source.indexOf("window.addEventListener('keyup'")), context);
  keydown({ key: 'w', preventDefault() { prevented = true; } });
  assert.equal(keys.size, 0); assert.equal(prevented, false);
});
