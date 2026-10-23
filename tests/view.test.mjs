import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game } from '../dist/engine.mjs';
import { cameraOffset, pointerToWorld } from '../dist/view.mjs';

test('a stationary pointer stays under the reticle as the camera follows the player', () => {
  const bounds = { left: 13, top: 200, width: 364, height: 423 };
  const pointer = { clientX: 280, clientY: 400 }, width = 688;
  for (const playerX of [14, 200, 640, 740, 1100, 1266]) {
    const camera = cameraOffset(playerX, width), world = pointerToWorld(pointer, bounds, width, camera);
    const screenX = (world.x - camera) / width * bounds.width + bounds.left;
    const screenY = world.y / 800 * bounds.height + bounds.top;
    assert.ok(Math.abs(screenX - pointer.clientX) < 1e-9);
    assert.ok(Math.abs(screenY - pointer.clientY) < 1e-9);
  }
});

test('a moving shot uses the current camera position in the same frame', () => {
  const g = new Game(() => .5); g.start(); g.spawnClock = 999;
  const bounds = { left: 0, top: 0, width: 688, height: 800 };
  const pointer = { clientX: 500, clientY: 300 };
  const aim = player => pointerToWorld(pointer, bounds, 688, cameraOffset(player.x, 688));
  const oldAim = aim(g.player);
  g.update(.05, { x: 1, fire: true, aim });
  const expected = aim(g.player);
  assert.ok(expected.x > oldAim.x);
  const bulletAngle = Math.atan2(g.bullets[0].vy, g.bullets[0].vx);
  assert.ok(Math.abs(bulletAngle - Math.atan2(expected.y - g.player.y, expected.x - g.player.x)) < 1e-9);
});

test('pointer conversion handles resized and scrolled canvas bounds', () => {
  const pointer = { clientX: 300, clientY: 200 };
  const result = pointerToWorld(pointer, { left: 100, top: -200, width: 400, height: 800 }, 400, 440);
  assert.deepEqual(result, { x: 640, y: 400 });
  assert.equal(cameraOffset(640, 1600), -160);
  assert.equal(cameraOffset(1266, 688), 592);
});
