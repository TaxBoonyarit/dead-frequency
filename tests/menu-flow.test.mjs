import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { Game } from '../dist/engine.mjs';

const source = readFileSync(new URL('../dist/game.mjs', import.meta.url), 'utf8');
const menuActions = source.slice(source.indexOf('function startGame()'), source.indexOf("$('pause-button').onclick"));
function setup(touchMode = false) {
  const game = new Game(), elements = new Map();
  const $ = id => {
    if (!elements.has(id)) elements.set(id, { open: false, focus() {}, showModal() { this.open = true; }, close() { this.open = false; } });
    return elements.get(id);
  };
  let saved = 0;
  const context = { game, $, touchMode, touchTutorialSeen: false, canvas: $('game'), initAudio() {}, renderState() {}, updateHUD() {}, storeBest() { saved++; } };
  runInNewContext(menuActions, context);
  return { game, $, context, saved: () => saved };
}

test('touch tutorial gates the simulation, cancellation preserves setup, and retry skips the lesson', () => {
  const { game, $, context } = setup(true);
  game.selectCharacter('female'); game.reset('recruit');
  context.startGame();
  assert.equal($('touch-tutorial').open, true); assert.equal(game.state, 'menu');
  game.update(10); assert.equal(game.time, 0);
  $('touch-tutorial-cancel').onclick();
  assert.equal($('touch-tutorial').open, false); assert.equal(game.state, 'menu');
  assert.equal(game.characterId, 'female'); assert.equal(game.difficulty, 'recruit');
  context.startGame(); $('touch-tutorial-done').onclick();
  assert.equal($('touch-tutorial').open, false); assert.equal(game.state, 'playing');
  game.state = 'dead'; context.startGame();
  assert.equal($('touch-tutorial').open, false); assert.equal(game.state, 'playing');
});

test('cancel leaving preserves the run; confirmed leaving resets it and saves the best', () => {
  for (const state of ['paused', 'upgrade']) {
    const { game, $, context, saved } = setup();
    game.start(); game.state = state; game.credits = 500; game.score = 1200;
    context.returnMenu();
    assert.equal($('quit-confirm').open, true); assert.equal(game.state, state);
    $('quit-cancel').onclick();
    assert.equal(game.credits, 500); assert.equal(game.score, 1200); assert.equal(game.state, state); assert.equal(saved(), 0);
    context.returnMenu(); $('quit-confirm-done').onclick();
    assert.equal($('quit-confirm').open, false); assert.equal(game.state, 'menu');
    assert.equal(game.credits, 0); assert.equal(saved(), 1);
  }
});

test('desktop starts directly and completed runs return without an exit warning', () => {
  const { game, $, context, saved } = setup();
  context.startGame(); assert.equal(game.state, 'playing'); assert.equal($('touch-tutorial').open, false);
  for (const state of ['dead', 'won']) {
    game.state = state; context.returnMenu();
    assert.equal(game.state, 'menu'); assert.equal($('quit-confirm').open, false);
  }
  assert.equal(saved(), 2);
});

test('wave break focuses its named region before the player chooses an upgrade', () => {
  const { game, $ } = setup();
  game.start(); game.state = 'upgrade'; game.choices = [{ id: 'damage', icon: '+', title: 'Damage', th: 'แรงขึ้น', detail: '+20%' }];
  const attributes = new Map(); let focused = false;
  const region = $('state-content');
  region.setAttribute = (key, value) => attributes.set(key, value);
  region.removeAttribute = key => attributes.delete(key);
  region.querySelectorAll = () => [];
  region.focus = () => { focused = true; };
  const canvas = { style: {} };
  const context = { game, $, canvas, touchMode: false, lastState: '', releaseInput() {}, openShop() {}, tone() {}, document: { body: { classList: { toggle() {} } }, querySelectorAll: () => [] }, AMMO: { wave: 18 } };
  runInNewContext(source.slice(source.indexOf('function renderState()'), source.indexOf('function weaponArt(')), context);
  context.renderState();
  assert.equal(focused, true); assert.equal(attributes.get('aria-labelledby'), 'state-title');
  assert.match(region.innerHTML, /เลือกแล้วเริ่มระลอก/);
  assert.equal(game.state, 'upgrade');
});
