import { Game, W, H, OBSTACLES, WEAPONS, BOSSES } from './engine.mjs';
import { drawZombie, BOSS_PORTRAITS } from './zombie-art.mjs';
import { SCENES, sceneForWave, sceneFloor, sceneStructures, sceneWeather } from './scenes.mjs';
import { controlKey, keyboardMovement } from './input.mjs';
import { HorrorAudio, GUN_RECORDINGS } from './audio.mjs';
import { cameraOffset, pointerToWorld } from './view.mjs';
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d'), viewport = $('viewport');
const game = new Game();
const coarse = matchMedia('(pointer:coarse)').matches;
const keys = new Set();
let firing = false, pointer = null, joystick = { x: 0, y: 0 }, viewWidth = W, cameraX = 0;
let previous = performance.now(), lastState = '', toastTimer, best = 0, lastHud = 0;
let soundEnabled = false, audio = null, soundscape = null, joystickId = null, pausedForManual = false, pausedForShop = false, previewRequest = 0, shopFilter = 'all';
try { best = Number(localStorage.getItem('dead-frequency-best') || 0) || 0; } catch {}
$('best').textContent = String(best).padStart(5, '0');
for (let i = 0; i < 10; i++) $('progress-segments').append(document.createElement('i'));

// The city is painted once; moving characters and light are drawn each frame.
const ground = document.createElement('canvas'); ground.width = W; ground.height = H;
const bg = ground.getContext('2d');
let seed = 17;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function rect(c, x, y, w, h, color) { c.fillStyle = color; c.fillRect(x, y, w, h); }
function circle(c, x, y, r, color) { c.fillStyle = color; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function line(c, points, color, width = 1) { c.strokeStyle = color; c.lineWidth = width; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
let activeScene = sceneForWave(1);
function paintGround(scene = activeScene, target = bg) {
  const bg = target; seed = 17;

  rect(bg, 0, 0, W, H, scene.ground);
  rect(bg, 370, 0, 535, H, scene.road);
  rect(bg, 0, 320, W, 170, scene.road);
  for (let i = 0; i < 12500; i++) { const v = rand(); rect(bg, rand() * W, rand() * H, 1 + rand() * 3, 1 + rand() * 2, v > .5 ? '#8991760a' : '#090e0b22'); }
  for (let x = 15; x < W; x += 65) for (let y = 20; y < H; y += 60) line(bg, [[x, y], [x + 65, y + 1], [x + 69, y + 60]], '#161f1822');
  // Broken lane markings and faded parking bays.
  for (let y = 0; y < H; y += 110) { rect(bg, 635, y, 3, 49, '#a9ac7040'); rect(bg, 647, y, 3, 49, '#a9ac702b'); }
  for (let x = 25; x < 380; x += 75) line(bg, [[x, 330], [x, 370], [x + 53, 370]], '#a6b19923', 2);
  for (let x = 920; x < W; x += 70) line(bg, [[x, 440], [x, 480], [x + 52, 480]], '#a6b19923', 2);
  line(bg, [[365, 0], [365, 310], [0, 310]], '#a6ac8a25', 3);
  line(bg, [[914, 0], [914, 310], [1280, 310]], '#a6ac8a25', 3);
  line(bg, [[360, 800], [360, 503], [0, 503]], '#a6ac8a25', 3);
  line(bg, [[920, 800], [920, 505], [1280, 505]], '#a6ac8a25', 3);
  // Crosswalk and a warning zone.
  for (let i = 0; i < 7; i++) rect(bg, 390 + i * 29, 340, 16, 62, '#b9b69416');
  bg.save(); bg.translate(700, 446); bg.rotate(-Math.PI / 2); bg.font = 'bold 28px monospace'; bg.fillStyle = '#d1d5b51a'; bg.fillText('KEEP CLEAR', -90, 0); bg.restore();
  bg.save(); bg.translate(482, 702); bg.strokeStyle = '#b9bf8b38'; bg.lineWidth = 3; bg.strokeRect(-52, -28, 104, 56); bg.font = 'bold 14px monospace'; bg.fillStyle = '#b9bf8b44'; bg.textAlign = 'center'; bg.fillText('EVAC 07', 0, 5); bg.restore();
  // Cracks, gravel and windblown paper.
  for (let i = 0; i < 90; i++) {
    const x = rand() * W, y = rand() * H;
    line(bg, [[x, y], [x + 7, y - 4], [x + 13, y + 1], [x + 19, y - 5]], '#0b130f55', 1);
    if (i % 3 === 0) { bg.save(); bg.translate(x, y); bg.rotate(rand() * 6); rect(bg, 0, 0, 5 + rand() * 5, 4, '#a8ab8b55'); bg.restore(); }
  }
  sceneFloor(bg, scene, W, H);
  for (const o of OBSTACLES) {
    rect(bg, o.x + 12, o.y + 16, o.w + 8, o.h + 7, '#060d0b66');
    if (o.kind === 'building') {
      rect(bg, o.x - 4, o.y - 4, o.w + 8, o.h + 8, '#121c17');
      rect(bg, o.x, o.y, o.w, o.h, scene.roof);
      rect(bg, o.x + 9, o.y + 9, o.w - 18, o.h - 18, '#353f30');
      rect(bg, o.x + 11, o.y + 11, o.w - 22, 3, '#69715455');
      for (let y = o.y + 25; y < o.y + o.h - 10; y += 22) line(bg, [[o.x + 10, y], [o.x + o.w - 10, y]], '#171f1955');
      for (let x = o.x + 16; x < o.x + o.w - 30; x += 54) {
        rect(bg, x + 3, o.y + 29, 35, 49, '#17211b77'); rect(bg, x, o.y + 25, 32, 47, '#505947');
        rect(bg, x + 3, o.y + 28, 26, 41, '#3c4939');
        for (let k = 0; k < 6; k++) rect(bg, x + 5, o.y + 31 + k * 6, 22, 2, '#202d22');
      }
      bg.font = '9px monospace'; bg.fillStyle = '#a3b28a66'; bg.fillText(`${scene.name} / ${o.label}`,  o.x + 18, o.y + o.h - 23);
      rect(bg, o.x + o.w - 48, o.y + o.h - 50, 30, 32, '#252f24');
      circle(bg, o.x + o.w - 33, o.y + o.h - 34, 10, '#46513a');
      line(bg, [[o.x + o.w - 40, o.y + o.h - 41], [o.x + o.w - 26, o.y + o.h - 27]], '#1d2a20', 3);
    } else if (o.kind === 'car') {
      rect(bg, o.x + 6, o.y - 3, 17, 5, '#101713'); rect(bg, o.x + 68, o.y - 3, 17, 5, '#101713');
      rect(bg, o.x + 6, o.y + o.h - 2, 17, 5, '#101713'); rect(bg, o.x + 68, o.y + o.h - 2, 17, 5, '#101713');
      rect(bg, o.x, o.y, o.w, o.h, '#667158'); rect(bg, o.x + 6, o.y + 5, o.w - 12, o.h - 10, '#4d5b43');
      rect(bg, o.x + 25, o.y + 4, 9, o.h - 8, '#14241f'); rect(bg, o.x + 61, o.y + 4, 12, o.h - 8, '#14241f');
      rect(bg, o.x + 36, o.y + 5, 22, o.h - 10, '#68765a'); rect(bg, o.x + 85, o.y + 5, 11, o.h - 10, '#3b4937');
      line(bg, [[o.x + 4, o.y + 2], [o.x + 96, o.y + 2]], '#8a967066');
      rect(bg, o.x + 2, o.y + 4, 3, 7, '#a4aa65'); rect(bg, o.x + 2, o.y + 30, 3, 7, '#a4aa65');
    } else {
      rect(bg, o.x, o.y, o.w, o.h, '#5b6346');
      for (let x = o.x + 4; x < o.x + o.w - 4; x += 18) { rect(bg, x, o.y + 3, 14, 10, '#727653'); rect(bg, x + 4, o.y + 15, 12, 9, '#404d35'); }
    }
  }
  sceneStructures(bg, scene, OBSTACLES);
  // Wire fence and pools of sodium light.
  for (const [x, y, length] of [[30, 44, 310], [938, 760, 290]]) {
    line(bg, [[x, y], [x + length, y]], '#7b8c6066', 2);
    for (let s = 0; s <= length; s += 20) { line(bg, [[x + s, y - 9], [x + s, y + 9]], '#6d7f5155'); circle(bg, x + s, y, 2, '#9bab7666'); }
  }
  for (const [x, y] of [[360, 300], [910, 500], [53, 530]]) {
    const light = bg.createRadialGradient(x, y, 0, x, y, 130); light.addColorStop(0, scene.accent+'30'); light.addColorStop(1, scene.accent+'00'); bg.fillStyle = light; bg.fillRect(x - 130, y - 130, 260, 260);
    line(bg, [[x + 17, y + 20], [x, y]], '#0c160e88', 5); circle(bg, x, y, 5, '#b2bd70'); circle(bg, x, y, 2, '#edf0b2');
  }
  // Blood stains are deliberately abstract and subdued.
  for (const [x, y] of [[575, 230], [870, 436], [389, 598], [185, 403]]) {
    circle(bg, x, y, 14, '#5b3b2f66'); for (let i = 0; i < 9; i++) circle(bg, x + rand() * 48 - 24, y + rand() * 40 - 20, rand() * 4, '#623c2e66');
  }
}
paintGround();
const enemySheet = $('enemy-preview'), enemyCtx = enemySheet.getContext('2d');
enemyCtx.fillStyle = '#171f18'; enemyCtx.fillRect(0, 0, 800, 190);
for (const [i, type] of ['walker', 'runner', 'brute', 'boss'].entries()) {
  enemyCtx.save(); enemyCtx.translate(100 + i * 200, 92); enemyCtx.scale(type === 'boss' ? 1.65 : 2.2, type === 'boss' ? 1.65 : 2.2);
  drawZombie(enemyCtx, { x: 0, y: 0, angle: -.8, type, phase: i * 1.4, stage: type === 'boss' ? 2 : 1 }); enemyCtx.restore();
}
SCENES.forEach((scene, index) => {
  const figure=document.createElement('figure'), image=document.createElement('canvas'), caption=document.createElement('figcaption');
  figure.className='scene-card'; image.width=320; image.height=200; image.setAttribute('aria-label', `ด่าน ${index+1} ${scene.th}`);
  const map=image.getContext('2d'); map.scale(.25,.25); paintGround(scene,map);
  caption.textContent=`${String(index+1).padStart(2,'0')} / ${scene.th}`; figure.append(image,caption); $('scene-gallery').append(figure);
});
const bossGallery = $('boss-gallery');
BOSSES.forEach((boss, index) => {
  const card = document.createElement('figure'); card.className = 'boss-portrait';
  const image = document.createElement('canvas'); image.width = 360; image.height = 220;
  image.setAttribute('aria-label', `ด่าน ${index + 1} ${boss.name}`);
  const caption = document.createElement('figcaption');
  const name = document.createElement('strong'); name.textContent = `${String(index+1).padStart(2,'0')} / ${boss.name}`;
  const description = document.createElement('span'); description.textContent = BOSS_PORTRAITS[index][1];
  caption.append(name, description); card.append(image, caption); bossGallery.append(card);
  const art = image.getContext('2d'); art.fillStyle = '#14191a'; art.fillRect(0, 0, 360, 220);
  art.save(); art.translate(180,110); art.scale(1.45,1.45);
  drawZombie(art, {...boss, type:'boss', x:0, y:0, angle:-.5, phase:index*.7, stage:index===9?3:2}); art.restore();
});
function drawBody(e, isPlayer = false) {
  if (!isPlayer) {
    drawZombie(ctx, e, game.time);
    if (e.hp < e.maxHp) { rect(ctx, e.x - 17, e.y - e.r - 10, 34, 3, '#121b12'); rect(ctx, e.x - 17, e.y - e.r - 10, 34 * e.hp / e.maxHp, 3, '#b9cd80'); }
    return;
  }
  ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle || 0);
  const s = isPlayer ? 1 : e.type === 'boss' ? 1.8 : e.type === 'brute' ? 1.45 : 1; ctx.scale(s, s);
  const step = Math.sin(e.phase || game.time * 12) * 3;
  ctx.shadowColor = '#000a'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
  circle(ctx, 0, 0, 15, '#080e0b44'); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  rect(ctx, -9 + step, -8, 13, 6, '#202d24'); rect(ctx, -9 - step, 3, 13, 6, '#202d24');
  if (isPlayer) {
    circle(ctx, 0, 0, 12, '#687d52'); rect(ctx, -9, -9, 9, 18, '#364b35');
    circle(ctx, 7, -10, 5, '#7b8a59'); circle(ctx, 9, 9, 5, '#7b8a59');
    const barrel = ({ pistol: 21, smg: 25, shotgun: 30, rifle: 35, revolver: 24, assault: 32, lmg: 37, sniper: 43 })[game.weaponId];
    rect(ctx, 10, -4, barrel, game.weaponId === 'shotgun' ? 7 : 5, '#171f1a'); rect(ctx, 11, -4, barrel - 10, 3, '#9a9d75');
    circle(ctx, 1, 0, 8, '#a1a97b'); circle(ctx, 0, -1, 7, '#6e8158');
    line(ctx, [[-3, -6], [4, -4]], '#bac38c88', 2);
    if (game.gun.cooldown > game.gun.interval - .055 && game.gun.reload === 0) {
      ctx.fillStyle = '#ffe4a2'; ctx.beginPath(); ctx.moveTo(31, -4); ctx.lineTo(48, -9); ctx.lineTo(42, 0); ctx.lineTo(49, 6); ctx.lineTo(31, 3); ctx.fill();
    }
  }
  ctx.restore();
}
const demo = [{x:431,y:230,angle:1.1},{x:800,y:160,angle:1.8},{x:891,y:448,angle:3.2},{x:384,y:616,angle:-.8},{x:1040,y:380,angle:3.1},{x:655,y:708,angle:-1.4}].map(e => ({...e,hp:65,maxHp:65,type:'walker',phase:0}));
function render(now) {
  const nextScene = sceneForWave(game.wave);
  if (nextScene !== activeScene) { activeScene = nextScene; paintGround(); $('scene-label').textContent = activeScene.name; }
  const p = game.player;
  cameraX = cameraOffset(p.x, viewWidth);
  ctx.clearRect(0, 0, canvas.width, H); rect(ctx, 0, 0, canvas.width, H, '#1c251b');
  ctx.save(); ctx.translate(-cameraX, 0); ctx.drawImage(ground, 0, 0);
  for (const s of game.stains) { circle(ctx, s.x, s.y, s.r, '#3d492b99'); circle(ctx, s.x + 4, s.y, s.r * .6, '#4a492c55'); }
  for (const d of game.drops) {
    if (d.life < 4 && Math.sin(now / 90) < 0) continue;
    const c = d.type === 'health' ? '#b6da8a' : '#dec98c';
    circle(ctx, d.x, d.y, 18 + Math.sin(now / 220) * 2, d.type === 'health' ? '#b6da8a10' : '#dec98c10');
    rect(ctx, d.x - 9, d.y - 8, 18, 16, '#202e1ddd'); ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(d.x - 9, d.y - 8, 18, 16);
    if (d.type === 'health') { rect(ctx, d.x - 2, d.y - 5, 4, 10, c); rect(ctx, d.x - 5, d.y - 2, 10, 4, c); }
    else for (let i = -1; i <= 1; i++) rect(ctx, d.x + i * 4 - 1, d.y - 4, 2, 8, c);
  }
  const enemies = game.state === 'menu' ? demo : game.enemies;
  for (const h of game.hazards) { circle(ctx, h.x, h.y, h.r, h.color + '66'); }
  for (const e of enemies) if (e.type === 'boss' && e.windup > 0) {
    if (e.activeAbility === 'charge') {
      ctx.save(); ctx.lineCap = 'round';
      line(ctx, [[e.x, e.y], [e.chargeEndX, e.chargeEndY]], '#ffab7833', (e.r + 14) * 2);
      line(ctx, [[e.x, e.y], [e.chargeEndX, e.chargeEndY]], '#ffab78', 3); ctx.restore();
    } else {
      ctx.strokeStyle = '#ffab78'; ctx.lineWidth = 3;
      for (const target of e.attackTargets || []) { ctx.beginPath(); ctx.arc(target.x, target.y, e.activeAbility === 'acid' ? 72 : 105, 0, Math.PI * 2); ctx.stroke(); }
    }
  }
  enemies.forEach(e => drawBody(e));
  // A flashlight gives direction without hiding the paths around the survivor.
  ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
  const beam = ctx.createRadialGradient(0, 0, 18, 0, 0, 340); beam.addColorStop(0, '#e2e6ac27'); beam.addColorStop(1, '#e2e6ac00');
  ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(5, 0); ctx.arc(0, 0, 340, -.38, .38); ctx.closePath(); ctx.fill(); ctx.restore();
  if (p.invulnerable <= 0 || Math.floor(now / 65) % 2 === 0) drawBody({ ...p, phase: (keys.size || Math.hypot(joystick.x, joystick.y) > .1) ? game.time * 14 : 0 }, true);
  if (game.gun.reload > 0) {
    ctx.strokeStyle = '#d1e69a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + (1 - game.gun.reload / game.gun.reloadTime) * Math.PI * 2); ctx.stroke();
  }
  for (const b of game.bullets) line(ctx, [[b.x - b.vx * .017, b.y - b.vy * .017], [b.x, b.y]], '#f5dfa2', 2);
  for (const a of game.particles) { ctx.globalAlpha = Math.min(1, a.life * 4); circle(ctx, a.x, a.y, 2, a.color); } ctx.globalAlpha = 1;
  sceneWeather(ctx, activeScene, now, W, H);
  ctx.restore();
  const vignette = ctx.createRadialGradient(viewWidth / 2, H * .48, H * .2, viewWidth / 2, H * .5, Math.max(viewWidth, H) * .7);
  vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#071009b3'); ctx.fillStyle = vignette; ctx.fillRect(0, 0, viewWidth, H);
  if (game.hitFlash > 0) { ctx.fillStyle = `rgba(145,43,25,${game.hitFlash * 1.3})`; ctx.fillRect(0, 0, viewWidth, H); }
  // Subtle surveillance scan lines.
  ctx.fillStyle = '#0000000a'; for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, viewWidth, 1);
  if (pointer && game.state === 'playing' && !coarse) {
    const aim = pointerAim(p), x = aim.x - cameraX, y = aim.y;
    ctx.strokeStyle = '#d5e69a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.stroke();
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) line(ctx, [[x + dx * 10, y + dy * 10], [x + dx * 15, y + dy * 15]], '#d5e69a', 1);
  }
}
function resize() {
  viewWidth = Math.round(H * viewport.clientWidth / viewport.clientHeight);
  canvas.width = viewWidth; canvas.height = H;
}
new ResizeObserver(resize).observe(viewport); resize();
function initAudio() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    soundscape ||= new HorrorAudio(audio); soundscape.setEnabled(soundEnabled); soundscape.loadWeaponAudio();
    audio.resume().catch(() => {});
  } catch {}
}
function tone(...args) { soundscape?.tone(...args); }

function toast(text) { $('toast').textContent = text; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 2000); }
function storeBest() {
  if (game.score > best) { best = game.score; try { localStorage.setItem('dead-frequency-best', String(best)); } catch {} }
  $('best').textContent = String(best).padStart(5, '0');
}
function timeText(seconds) { const t = Math.floor(seconds); return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60].map(n => String(n).padStart(2, '0')).join(':'); }
function updateHUD() {
  const p = game.player, g = game.gun;
  $('health-meter').setAttribute('aria-valuenow', String(Math.ceil(p.hp))); $('health-meter').setAttribute('aria-valuemax', String(p.maxHp));
  $('shop-button').textContent = game.state === 'menu' ? 'ร้านปืน' : `ร้าน · ${game.credits} CR`;
  $('health-label').textContent = Math.ceil(p.hp); $('health-bar').style.width = `${p.hp / p.maxHp * 100}%`; $('health-bar').style.background = p.hp < 30 ? '#d98d67' : '';
  $('stamina-bar').style.width = `${p.stamina}%`;
  $('threat-count').textContent = `เหลือ ${game.remaining + game.enemies.length} ตัว${game.remaining === 1 ? ' · บอสกำลังมา' : ''}`;
  $('wave-label').innerHTML = `${String(game.wave).padStart(2, '0')} <small>/ 10</small>`;
  $('ammo-label').innerHTML = `${String(g.ammo).padStart(2, '0')} <small>/ ${g.reserve}</small>`;
  $('gun-status').textContent = g.reload > 0 ? 'RELOADING…' : g.ammo === 0 && g.reserve === 0 ? 'FIND AMMO' : WEAPONS.find(w => w.id === game.weaponId).name;
  const boss = game.enemies.find(e => e.type === 'boss');
  $('boss-hud').hidden = !boss || !['playing', 'paused'].includes(game.state);
  if (boss) { $('boss-name').textContent = `${boss.name} · PHASE ${boss.stage} · ${Math.ceil(boss.hp)} / ${Math.ceil(boss.maxHp)}`; $('boss-health').style.width = `${boss.hp / boss.maxHp * 100}%`; }
  $('credits').textContent = `${game.credits} CR`;
  const shopLink = $('wave-shop-button');
  if (shopLink) shopLink.textContent = `ร้านอาวุธ · ${game.credits} CR ↗`;
  $('kills').textContent = String(game.kills).padStart(3, '0'); $('score').textContent = String(game.score).padStart(5, '0');
  $('session-time').textContent = timeText(game.time);
  const completed = game.state === 'won' ? 10 : game.state === 'upgrade' ? game.wave : Math.max(0, game.wave - 1);
  $('progress-label').textContent = `${completed * 10}%`;
  [...$('progress-segments').children].forEach((el, i) => el.classList.toggle('filled', i < completed));
  $('wave-banner').hidden = game.banner <= 0 || game.state !== 'playing';
}
function renderState() {
  const s = game.state;
  if (s === lastState) return;
  document.body.classList.toggle('game-active', s !== 'menu');
  lastState = s; keys.clear(); firing = false; joystick.x = joystick.y = 0; $('joystick-knob').style.transform = '';
  $('menu-overlay').hidden = s !== 'menu';
  $('state-overlay').hidden = ['menu', 'playing'].includes(s);
  $('hud').hidden = s === 'menu'; $('pause-button').hidden = s !== 'playing';
  $('touch-controls').hidden = s !== 'playing';
  if (s === 'playing') canvas.focus({ preventScroll: true });
  canvas.style.cursor = s === 'playing' && !coarse ? 'none' : '';
  $('feed-status').textContent = ({ menu: 'AWAITING SURVIVOR', playing: 'SURVIVOR ACTIVE', paused: 'FEED PAUSED', upgrade: 'AREA SECURED', dead: 'SIGNAL TERMINATED', won: 'EVACUATION COMPLETE' })[s];
  document.querySelectorAll('[data-difficulty]').forEach(b => b.disabled = s !== 'menu');
  const c = $('state-content');
  if (s === 'paused') {
    c.innerHTML = '<div class="state-eyebrow">TAKE A BREATH.</div><h2 class="state-title">SIGNAL PAUSED.</h2><p class="state-copy">พักได้ แต่อย่าลืมกลับมา</p><button class="primary" id="resume-button">กลับไปลุยต่อ <span>↗</span></button><button class="secondary" id="quit-button">กลับหน้าเริ่มต้น</button>';
    $('resume-button').onclick = () => game.pause(); $('quit-button').onclick = returnMenu;
  } else if (s === 'upgrade') {
    c.innerHTML = `<div class="state-eyebrow">WAVE ${String(game.wave).padStart(2, '0')} / AREA SECURED</div><h2 class="state-title">LIVE. LEARN. RELOAD.</h2><p class="state-copy">ซื้อปืนก่อน แล้วเลือกอัปเกรดเพื่อเริ่มระลอกถัดไป<br>ฟื้นฟูเลือด 20 และรับกระสุนสำรอง 36 นัด</p><button id="wave-shop-button" class="shop-link">ร้านอาวุธ · ${game.credits} CR ↗</button><div class="upgrade-grid">${game.choices.map((u, i) => `<button class="upgrade-card" data-upgrade="${u.id}"><span class="upgrade-icon">${u.icon}</span><strong>${u.title}</strong><em>${u.th}</em><small>${u.detail}</small><span class="select-label">SELECT UPGRADE <span>0${i + 1} ↗</span></span></button>`).join('')}</div>`;
    $('wave-shop-button').onclick = openShop;
    c.querySelectorAll('[data-upgrade]').forEach(b => b.onclick = () => { game.upgrade(b.dataset.upgrade); tone(550, .15, 'sine', .04, 900); });
  } else if (s === 'dead' || s === 'won') {
    storeBest();
    c.innerHTML = `<div class="state-eyebrow">${s === 'won' ? 'TRANSMISSION RECEIVED / YOU MADE IT' : 'CONNECTION LOST / SURVIVOR DOWN'}</div><h2 class="state-title">${s === 'won' ? 'SEE YOU AT DAWN.' : 'THE SIGNAL DIED.'}</h2><p class="state-copy">${s === 'won' ? 'คุณรอดแล้ว หน่วยอพยพได้รับสัญญาณของคุณ' : 'คืนนี้อาจไม่ใช่คืนของคุณ ลองส่งสัญญาณอีกครั้ง'}</p><div class="result-stats"><div><b>${String(game.wave).padStart(2, '0')}</b><span>WAVE REACHED</span></div><div><b>${game.kills}</b><span>ELIMINATIONS</span></div><div><b>${game.score.toLocaleString()}</b><span>FINAL SCORE</span></div></div><button class="primary" id="retry-button">ลองอีกครั้ง <span>↗</span></button><button class="secondary" id="quit-button">กลับหน้าเริ่มต้น</button>`;
    $('retry-button').onclick = startGame; $('quit-button').onclick = returnMenu;
  }
  if (s !== 'playing') { $('wave-banner').hidden = true; $('toast').hidden = true; }
  if (s === 'paused' || s === 'dead' || s === 'won') c.querySelector('button')?.focus({ preventScroll: true });
}
function weaponArt(id) {
  const shapes = {
    pistol: '<path d="M28 22h72v16H69l-8 27H43l4-27H28z"/><path d="M96 24h11v8H96z"/>',
    smg: '<path d="M17 27h75v17H70l-3 23H54l2-23H39l-5 18H20l7-25H17zM92 30h25v6H92zM7 20h18v26H7z"/>',
    shotgun: '<path d="M7 35l25-11h51v12H42l-9 18H19l4-13-16 5zM81 24h40v6H81zM81 33h40v5H81zM50 39h37v8H50z"/>',
    rifle: '<path d="M6 28l27-5h50v17H61l-5 22H42l3-22H29l-23 9zM82 26h41v6H82zM56 12h25v7H56zM65 18h5v8h-5z"/>',
  };
  return `<svg viewBox="0 0 130 80" aria-hidden="true">${shapes[({revolver:'pistol',assault:'rifle',lmg:'smg',sniper:'rifle'})[id] || id]}</svg>`;
}
function renderShop() {
  const canTrade = game.state === 'upgrade';
  $('shop-balance').textContent = `${game.credits} CR`;
  $('shop-equipped').textContent = `กำลังใช้ ${WEAPONS.find(w => w.id === game.weaponId).name}`;
  document.querySelectorAll('[data-shop-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.shopFilter === shopFilter)));
  const visibleWeapons = WEAPONS.filter(w => shopFilter === 'owned' ? game.ownedWeapons.has(w.id) : shopFilter === 'affordable' ? !game.ownedWeapons.has(w.id) && game.credits >= w.price : true);
  $('shop-description').textContent = canTrade ? 'พื้นที่ปลอดภัยแล้ว ซื้อหรือสลับปืนได้ก่อนเริ่มระลอกถัดไป' : 'ดูอาวุธได้ที่นี่ ซื้อและสลับปืนได้หลังจบระลอก · กำจัดซอมบี้รับ 10–30 CR';
  $('armory-done').firstChild.textContent = canTrade ? 'เลือกอัปเกรดต่อ ' : game.state === 'menu' ? 'กลับหน้าเริ่มต้น ' : 'กลับไปยังเกม ';
  $('weapon-grid').innerHTML = visibleWeapons.map(w => {
    const stats = game.weaponStats(w.id), owned = game.ownedWeapons.has(w.id), equipped = game.weaponId === w.id;
    const disabled = !canTrade || equipped || (!owned && game.credits < w.price);
    const action = equipped ? 'กำลังใช้งาน' : owned ? 'สลับมาใช้' : !canTrade ? `ซื้อหลังจบระลอก · ${w.price} CR` : game.credits < w.price ? `ขาดอีก ${w.price - game.credits} CR` : `ซื้อและใช้ · ${w.price} CR`;
    return `<article class="weapon-card ${equipped ? 'equipped' : ''}"><div class="weapon-top"><span>${w.type}</span><b>${owned ? equipped ? 'EQUIPPED' : 'OWNED' : `${w.price} CR`}</b></div>${weaponArt(w.id)}<div class="weapon-range">${w.range < .5 ? 'ระยะประชิด · ต้องเข้าหาเป้าหมาย' : w.range > 1.2 ? 'ระยะไกล · เล็งเป้าหมายสำคัญ' : 'ระยะกลาง'}</div><h3>${w.name}</h3><p>${w.description}</p><dl><div><dt>DMG</dt><dd>${Math.round(stats.damage)}${stats.pellets > 1 ? ` × ${stats.pellets}` : ''}</dd></div><div><dt>MAG</dt><dd>${stats.mag}</dd></div><div><dt>นัด/วินาที</dt><dd>${(1 / stats.interval).toFixed(1)}</dd></div><div><dt>รีโหลด</dt><dd>${stats.reloadTime.toFixed(1)}s</dd></div></dl><button class="weapon-buy" data-weapon="${w.id}" ${disabled ? 'disabled' : ''}>${action}</button><div class="weapon-sound-actions"><button class="sound-preview" data-preview="${w.id}" aria-label="ลองเสียง ${w.name}" title="เสียงต้นแบบ ${GUN_RECORDINGS[w.id]}">▶ เสียงยิง</button><button class="sound-preview reload-preview" data-reload-preview="${w.id}" aria-label="ลองเสียงรีโหลด ${w.name}">↻ รีโหลด</button></div></article>`;
  }).join('') || '<p class="shop-empty">เครดิตยังไม่พอซื้อปืนใหม่ กำจัดซอมบี้และบอสเพื่อสะสมเครดิต หรือเลือกดูปืนทั้งหมด</p>';
  $('weapon-grid').querySelectorAll('[data-reload-preview]').forEach(button => button.onclick = () => previewSound(button.dataset.reloadPreview, false, true));
  $('weapon-grid').querySelectorAll('[data-preview]').forEach(button => button.onclick = () => previewSound(button.dataset.preview));
  $('weapon-grid').querySelectorAll('[data-weapon]').forEach(button => button.onclick = () => {
    const id = button.dataset.weapon, owned = game.ownedWeapons.has(id);
    const success = owned ? game.equipWeapon(id) : game.buyWeapon(id);
    if (!success) return;
    $('shop-feedback').textContent = `${owned ? 'เปลี่ยนเป็น' : 'ซื้อแล้ว'} ${WEAPONS.find(w => w.id === id).name}`;
    tone(700, .16, 'sine', .035, 1000); renderShop(); updateHUD();
    $('armory-done').focus({ preventScroll: true });
  });
}
document.querySelectorAll('[data-shop-filter]').forEach(button => button.onclick = () => { shopFilter = button.dataset.shopFilter; renderShop(); });
function openShop() {
  shopFilter = 'all';
  pausedForShop = game.state === 'playing';
  if (pausedForShop) { game.pause(); renderState(); }
  $('shop-feedback').textContent = ''; renderShop(); $('armory').showModal();
}
async function previewSound(id, zombie = false, reload = false) {
  const request = ++previewRequest;
  soundEnabled = true; initAudio();
  $('sound-button').textContent = 'SOUND ON'; $('sound-button').setAttribute('aria-label', 'ปิดเสียงเกม');
  if (!soundscape) { $('shop-feedback').textContent = 'เบราว์เซอร์นี้เปิดเสียงไม่ได้'; return; }
  await audio.resume().catch(() => {});
  await soundscape.loadWeaponAudio();
  if (request !== previewRequest || !$('armory').open || !soundEnabled) return;
  soundscape.stopVoices();
  if (reload) { const duration = game.weaponStats(id).reloadTime; [0,.4,.78].forEach((part, step) => soundscape.reloadEffect(id, step, duration * part)); $('shop-feedback').textContent = 'กำลังลองเสียงรีโหลด · ถอด / เติม / ขึ้นลำ'; }
  else if (zombie) { const recorded = soundscape.zombieGrowl(id, 70, 0); $('shop-feedback').textContent = recorded ? `เสียงซอมบี้บันทึกจริง · ${id}` : 'โหลดเสียงซอมบี้ไม่สำเร็จ · กำลังใช้เสียงสำรอง'; }
  else { const recorded = soundscape.gunshot(id); $('shop-feedback').textContent = recorded ? `เสียงบันทึกจริง · ${GUN_RECORDINGS[id]}` : 'โหลดเสียงบันทึกไม่สำเร็จ · กำลังใช้เสียงสำรอง'; }
}
document.querySelectorAll('[data-zombie-preview]').forEach(button => button.onclick = () => previewSound(button.dataset.zombiePreview, true));
$('shop-button').onclick = openShop;
$('close-armory').onclick = $('armory-done').onclick = () => $('armory').close();
$('armory').addEventListener('close', () => {
  previewRequest++; soundscape?.stopVoices();
  if (pausedForShop && game.state === 'paused') { game.pause(); renderState(); }
  pausedForShop = false;
});
function startGame() { initAudio(); game.start(); renderState(); canvas.focus({ preventScroll: true }); updateHUD(); }
function returnMenu() { storeBest(); game.reset(game.difficulty); renderState(); updateHUD(); $('start-button').focus({ preventScroll: true }); }
$('start-button').onclick = startGame;
$('pause-button').onclick = () => { game.pause(); renderState(); };
$('sound-button').onclick = () => { soundEnabled = !soundEnabled; initAudio(); $('sound-button').textContent = soundEnabled ? 'SOUND ON' : 'SOUND OFF'; $('sound-button').setAttribute('aria-label', soundEnabled ? 'ปิดเสียงเกม' : 'เปิดเสียงเกม'); tone(660, .12); if (game.state === 'playing') canvas.focus({ preventScroll: true }); };
$('fullscreen-button').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await viewport.requestFullscreen(); } catch { toast('เบราว์เซอร์นี้ไม่รองรับโหมดเต็มหน้าจอ'); } };
document.querySelectorAll('[data-difficulty]').forEach(b => {
  b.setAttribute('aria-pressed', String(b.classList.contains('selected')));
  b.onclick = () => {
    game.reset(b.dataset.difficulty);
    document.querySelectorAll('[data-difficulty]').forEach(el => { el.classList.toggle('selected', el === b); el.setAttribute('aria-pressed', String(el === b)); });
    $('difficulty-description').textContent = ({ recruit: 'ศัตรูอ่อนลง เหมาะกับการฝึกเอาตัวรอด', survivor: 'ภัยคุกคามมาตรฐาน สำหรับคนที่พร้อมสู้', nightmare: 'ศัตรูถึกขึ้น เร็วขึ้น และโจมตีหนักขึ้น' })[game.difficulty];
  };
});
function openManual() { pausedForManual = game.state === 'playing'; if (pausedForManual) { game.pause(); renderState(); } $('manual').showModal(); }
$('manual-button').onclick = openManual;
$('close-manual').onclick = $('manual-done').onclick = () => $('manual').close();
$('manual').addEventListener('close', () => { if (pausedForManual && game.state === 'paused') { game.pause(); renderState(); canvas.focus({ preventScroll: true }); } pausedForManual = false; });
window.addEventListener('keydown', e => {
  if ($('manual').open || $('armory').open) return;
  const key = controlKey(e);
  if (e.target.closest?.('button, summary, input, select, textarea, a') && [' ', 'enter'].includes(key)) return;
  if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift','r','escape','p'].includes(key) && game.state !== 'menu') e.preventDefault();
  if (!e.repeat && (key === 'escape' || key === 'p')) { game.pause(); renderState(); return; }
  if (key === 'r') game.reload();
  if (key === ' ' && !e.repeat) game.shoot();
  keys.add(key);
});
window.addEventListener('keyup', e => keys.delete(controlKey(e)));
function releaseInput() { keys.clear(); firing = false; joystick = { x: 0, y: 0 }; $('joystick-knob').style.transform = ''; }
window.addEventListener('blur', () => { soundscape?.stopAmbience(); soundscape?.stopVoices(); releaseInput(); if (game.state === 'playing') { game.pause(); renderState(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'playing') { soundscape?.stopAmbience(); soundscape?.stopVoices(); releaseInput(); game.pause(); renderState(); } });
function setPointer(e) { pointer = { clientX: e.clientX, clientY: e.clientY }; }
function pointerAim(player) { return pointer && pointerToWorld(pointer, canvas.getBoundingClientRect(), viewWidth, cameraOffset(player.x, viewWidth)); }
canvas.addEventListener('pointermove', setPointer);
canvas.addEventListener('pointerdown', e => { if (e.button !== 0 || coarse) return; setPointer(e); const aim = pointerAim(game.player); game.player.angle = Math.atan2(aim.y - game.player.y, aim.x - game.player.x); firing = true; game.shoot(); canvas.setPointerCapture(e.pointerId); canvas.focus({ preventScroll: true }); });
canvas.addEventListener('pointerup', () => firing = false); canvas.addEventListener('pointercancel', () => firing = false);
canvas.addEventListener('contextmenu', e => e.preventDefault());
const stick = $('joystick');
function dragStick(e) { const r = stick.getBoundingClientRect(), dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2, l = Math.hypot(dx, dy), scale = Math.min(1, 30 / (l || 1)); joystick = { x: dx * scale / 30, y: dy * scale / 30 }; $('joystick-knob').style.transform = `translate(${dx * scale}px,${dy * scale}px)`; }
stick.addEventListener('pointerdown', e => { joystickId = e.pointerId; stick.setPointerCapture(e.pointerId); dragStick(e); });
stick.addEventListener('pointermove', e => { if (e.pointerId === joystickId) dragStick(e); });
for (const ev of ['pointerup','pointercancel','lostpointercapture']) stick.addEventListener(ev, () => { joystickId = null; joystick = { x: 0, y: 0 }; $('joystick-knob').style.transform = ''; });
$('touch-fire').addEventListener('pointerdown', e => { e.preventDefault(); firing = true; $('touch-fire').setPointerCapture(e.pointerId); });
for (const ev of ['pointerup','pointercancel','lostpointercapture']) $('touch-fire').addEventListener(ev, () => firing = false);
$('touch-reload').onclick = () => game.reload();
function frame(now) {
  const dt = Math.min((now - previous) / 1000, .05); previous = now;
  const movement = keyboardMovement(keys);
  game.update(dt, { x: movement.x + joystick.x, y: movement.y + joystick.y, sprint: keys.has('shift'), fire: firing || keys.has(' '), aim: coarse ? null : pointerAim, autoAim: coarse && firing });
  for (const e of game.events.splice(0)) {
    if (e.type === 'shot') soundscape?.gunshot(e.weapon);
    if (e.type === 'hit') tone(80, .04, 'triangle', .025, 35);
    if (e.type === 'hurt') tone(90, .18, 'sawtooth', .06, 32);
    if (e.type === 'reload') { soundscape?.reloadEffect(e.weapon, 0); if (soundscape) soundscape.reloadStep = 0; }
    if (e.type === 'loaded') tone(620, .04, 'triangle', .015, 310);
    if (e.type === 'waveCleared') { $('wave-banner').innerHTML = 'AREA SECURED<small>พื้นที่ปลอดภัย · เดินเก็บเสบียงก่อนขึ้นหน้าถัดไป</small>'; }
    if (e.type === 'bossIncoming') { game.banner = 3; $('wave-banner').innerHTML = 'BOSS INCOMING<small>บอสกำลังมา · เตรียมอาวุธ</small>'; }
    if (e.type === 'bossPhase') { toast(`${e.name} · PHASE ${e.stage} · ระวังท่าโจมตีต่อเนื่อง`); soundscape?.bossWarning(); }
    if (e.type === 'boss') { game.banner = 3; $('wave-banner').textContent = `BOSS / ${e.name}`; soundscape?.bossWarning(); }
    if (e.type === 'wave') { $('wave-banner').innerHTML = `WAVE ${String(e.wave).padStart(2, '0')}<small>${sceneForWave(e.wave).th}</small>`; tone(180, .6, 'sine', .05, 120); }
    if (e.type === 'pickup') { toast(e.pickup === 'health' ? '+30 เลือด / FIELD MEDKIT' : '+30 กระสุน / SUPPLY FOUND'); if(e.pickup === 'ammo') soundscape?.reloadEffect(game.weaponId, 1); else tone(550, .15, 'sine', .04, 900); }
    if (e.type === 'dead') tone(130, .8, 'triangle', .05, 30);
    if (e.type === 'won') tone(440, 1, 'sine', .04, 880);
  }
  soundscape?.update({ playing: game.state === 'playing' && !document.hidden, health: game.player.hp / game.player.maxHp, boss: game.enemies.some(e => e.type === 'boss'), wave: game.wave, weapon: game.weaponId, reload: game.gun.reload, reloadTime: game.gun.reloadTime, enemies: game.enemies, player: game.player });
  renderState(); render(now);
  if (now - lastHud > 80) { updateHUD(); lastHud = now; }
  requestAnimationFrame(frame);
}
renderState(); updateHUD(); requestAnimationFrame(frame);
