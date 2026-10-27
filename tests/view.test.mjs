import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, KNIFE } from '../dist/engine.mjs';
import { cameraOffset, pointerToWorld, knifePose } from '../dist/view.mjs';

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

test('mobile reticle remains on screen in every aim direction and scales with the display', async () => {
  const {touchAimPoint}=await import('../dist/view.mjs');
  for(const [width,height,scale] of [[494,800,1.35],[1732,800,2.66]]) {
    for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8) {
      const point=touchAimPoint(width/2,height/2,angle,width,height,scale);
      assert.ok(point.x>=26*scale-.01&&point.x<=width-26*scale+.01);
      assert.ok(point.y>=110*scale-.01&&point.y<=height-26*scale+.01);
      assert.ok(point.distance>0&&Number.isFinite(point.distance));
    }
  }
});

test('phone framing widens the view without stretching and desktop zoom remains unchanged', async () => {
  const {viewportSize,pointerToWorld}=await import('../dist/view.mjs');
  for(const [width,height] of [[320,652],[390,756],[844,300]]) {
    const view=viewportSize(width,height,true);
    assert.ok(view.width>=620);assert.ok(Math.abs(view.width/view.height-width/height)<.002);
    const world=pointerToWorld({clientX:width/2,clientY:height/2},{left:0,top:0,width,height},view.width,0,view.height,view.cameraY);
    assert.ok(Math.abs(world.y-400)<1e-6);
  }
  assert.equal(viewportSize(390,756,false).height,800);
  assert.equal(viewportSize(1280,800,true).height,800);
});

test('melee poses align impact with damage and recover smoothly for every weapon', async () => {
  const { meleePose } = await import('../dist/view.mjs');
  const { MELEE_WEAPONS } = await import('../dist/engine.mjs');
  for (const w of MELEE_WEAPONS) {
    const impact = meleePose(w, w.interval - w.windup);
    assert.ok(Math.abs(impact.angle) < 1e-8);
    assert.ok(impact.reach > 1);
    const rest = meleePose(w, 0);
    assert.ok(Math.abs(rest.angle) < 1e-8);
    assert.ok(Math.abs(rest.reach - 1) < 1e-8);
    for (let t = 0; t <= w.interval; t += .005) {
      const a = meleePose(w, w.interval - t), b = meleePose(w, w.interval - t - .00001);
      for (const key of ['angle', 'reach', 'thrust', 'torso']) {
        assert.ok(Number.isFinite(a[key]));
        assert.ok(Math.abs(a[key] - b[key]) < .05, `${w.id}: ${key} jumps`);
      }
    }
  }
});

test('knife pose draws back, thrusts to range, holds and recovers continuously', () => {
  const at = progress => knifePose(KNIFE.swingTime * (1 - progress));
  assert.ok(Math.abs(at(0).reach) < 1e-9);
  assert.ok(at(.1).reach < 0);
  assert.equal(at(.16).reach, -6);
  assert.equal(at(.38).reach, 24);
  assert.equal(at(.45).reach, 24);
  assert.ok(at(.75).reach > 0 && at(.75).reach < 24);
  assert.equal(at(1).reach, 0);
  assert.equal(at(.45).lean, 2);
  assert.equal(at(.45).tilt, 0);
  assert.equal(14 + at(.45).reach + 25 + at(.45).lean, KNIFE.range);
  for (const boundary of [.16, .38, .5]) {
    assert.ok(Math.abs(at(boundary - .00001).reach - at(boundary + .00001).reach) < .001);
  }
  assert.deepEqual(knifePose(), at(1));
});
