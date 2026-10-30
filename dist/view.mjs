import { W, H, KNIFE } from './engine.mjs';

export function cameraOffset(playerX, viewWidth) {
  return viewWidth > W ? (W - viewWidth) / 2 : Math.max(0, Math.min(W - viewWidth, playerX - viewWidth / 2));
}

export function pointerToWorld(pointer, bounds, viewWidth, cameraX, viewHeight = H, cameraY = 0) {
  return {
    x: (pointer.clientX - bounds.left) / bounds.width * viewWidth + cameraX,
    y: (pointer.clientY - bounds.top) / bounds.height * viewHeight + cameraY,
  };
}

export function touchAimPoint(x, y, angle, width, height, scale = 1) {
  const dx = Math.cos(angle), dy = Math.sin(angle), margin = 26 * scale;
  let distance = Math.min(340, 160 * scale);
  if (dx > .001) distance = Math.min(distance, (width - margin - x) / dx);
  if (dx < -.001) distance = Math.min(distance, (margin - x) / dx);
  if (dy > .001) distance = Math.min(distance, (height - margin - y) / dy);
  if (dy < -.001) distance = Math.min(distance, (110 * scale - y) / dy);
  distance = Math.max(0, distance);
  return { x: x + dx * distance, y: y + dy * distance, distance };
}

export function drawTouchAim(c, { x, y, angle, width, height, scale, spread, active, targeted, reloading }) {
  const target = touchAimPoint(x, y, angle, width, height, scale);
  const radius = Math.max(10 * scale, Math.min(23 * scale, target.distance * Math.tan(spread / 2)));
  const color = reloading ? '#f3bd80' : targeted ? '#f4d58c' : '#a4f1e0';
  c.save(); c.globalAlpha = active ? 1 : .55;
  c.translate(x, y); c.rotate(angle);
  const gradient = c.createLinearGradient(0, 0, target.distance, 0);
  gradient.addColorStop(0, '#a4f1e000'); gradient.addColorStop(1, '#a4f1e027');
  c.fillStyle = gradient; c.beginPath(); c.moveTo(24 * scale, 0);
  c.lineTo(target.distance, -radius); c.lineTo(target.distance, radius); c.closePath(); c.fill();
  c.setLineDash([4 * scale, 7 * scale]); c.strokeStyle = color; c.lineWidth = scale;
  c.beginPath(); c.moveTo(30 * scale, 0); c.lineTo(Math.max(30 * scale, target.distance - radius - 7 * scale), 0); c.stroke();
  c.setLineDash([]); c.restore();
  c.save(); c.globalAlpha = active ? 1 : .7;
  c.translate(target.x, target.y); c.shadowColor = '#06120f'; c.shadowBlur = 4 * scale;
  c.strokeStyle = color; c.lineWidth = 2 * scale;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    c.beginPath(); c.arc(0, 0, radius, a + .18, a + Math.PI / 2 - .18); c.stroke();
    c.beginPath(); c.moveTo(Math.cos(a) * (radius + 4 * scale), Math.sin(a) * (radius + 4 * scale));
    c.lineTo(Math.cos(a) * (radius + 8 * scale), Math.sin(a) * (radius + 8 * scale)); c.stroke();
  }
  c.shadowBlur = 0; c.fillStyle = '#071610'; c.beginPath(); c.arc(0, 0, 3.5 * scale, 0, Math.PI * 2); c.fill();
  c.fillStyle = color; c.beginPath(); c.arc(0, 0, 1.8 * scale, 0, Math.PI * 2); c.fill(); c.restore();
}

export function viewportSize(width, height, touchMode) {
  const viewHeight = touchMode && width <= 800 ? Math.max(H, 620 * height / width) : H;
  return { width: Math.round(viewHeight * width / height), height: viewHeight, cameraY: (H - viewHeight) / 2 };
}

// The blade crosses the aim direction at windup, exactly when damage resolves.
export function meleePose(weapon, cooldown) {
  const elapsed = Math.max(0, Math.min(weapon.interval, weapon.interval - cooldown));
  const strike = Math.min(.075, weapon.windup * .45);
  const start = weapon.windup - strike;
  const smooth = t => t * t * (3 - 2 * t);
  const arc = weapon.arc * Math.PI / 180;
  let angle, reach, trail = 0;
  if (elapsed < start) {
    const t = smooth(elapsed / start);
    angle = -.2 - arc * .65 * t; reach = 1 - .25 * t;
  } else if (elapsed <= weapon.windup) {
    const t = (elapsed - start) / strike;
    angle = (-.2 - arc * .65) * (1 - t * t); reach = .75 + .35 * t * t; trail = t;
  } else {
    const recovery = weapon.interval - weapon.windup;
    const t = Math.min(1, (elapsed - weapon.windup) / Math.min(.09, recovery * .3));
    const settle = smooth(Math.max(0, (elapsed - weapon.windup - .09) / Math.max(.01, recovery - .09)));
    angle = arc * .45 * Math.sin(t * Math.PI / 2) * (1 - settle);
    reach = (1.1 - .15 * t) * (1 - settle) + settle;
    trail = (1 - t) * (1 - settle);
  }
  return { angle: weapon.single ? angle * .15 : angle, reach, trail, thrust: weapon.single ? (reach - 1) * 75 : 0, torso: angle * .22 };
}

export function drawMelee(c, weapon, pose) {
  const length = weapon.id === 'knife' ? 23 : weapon.range * .62;
  c.save(); c.translate(7 + pose.thrust, 0); c.rotate(pose.angle);
  // Bent forearms follow the grip; heavy tools use both hands.
  c.strokeStyle = '#526344'; c.lineWidth = 7; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-3, -10); c.lineTo(6, -13); c.lineTo(16, -3); c.stroke();
  if (weapon.id !== 'knife') { c.beginPath(); c.moveTo(-3, 10); c.lineTo(8, 13); c.lineTo(23, 2); c.stroke(); }
  c.scale(pose.reach, 1);
  c.fillStyle = '#745b3c'; c.fillRect(12, -3, length, 6);
  c.fillStyle = '#c7cebd';
  if (weapon.id === 'knife' || weapon.id === 'katana') {
    c.beginPath(); c.moveTo(23, -3); c.lineTo(length + 24, -2); c.quadraticCurveTo(length + 12, 7, 23, 3); c.fill();
    c.fillStyle = '#544a36'; c.fillRect(20, -6, 3, 12);
  } else if (weapon.id === 'axe') {
    c.beginPath(); c.moveTo(length - 2, -5); c.lineTo(length + 9, -14); c.quadraticCurveTo(length + 23, 0, length + 9, 15); c.lineTo(length - 2, 5); c.fill();
  } else if (weapon.id === 'sledge') {
    c.fillStyle = '#818d83'; c.fillRect(length - 2, -13, 17, 26); c.fillStyle = '#bcc5b7'; c.fillRect(length - 2, -13, 4, 26);
  } else if (weapon.id === 'crowbar') {
    c.strokeStyle = '#a5afa2'; c.lineWidth = 5; c.beginPath(); c.moveTo(22, 0); c.lineTo(length + 6, 0); c.quadraticCurveTo(length + 18, 0, length + 12, -10); c.stroke();
  } else {
    c.strokeStyle = '#b39568'; c.lineWidth = 10; c.beginPath(); c.moveTo(28, 0); c.lineTo(length + 7, 0); c.stroke();
  }
  c.fillStyle = '#c2ad88'; c.beginPath(); c.arc(16, -2, 4, 0, Math.PI * 2); c.fill();
  if (pose.trail > 0 && !weapon.single) {
    c.strokeStyle = `rgba(218,230,206,${pose.trail * .32})`; c.lineWidth = 4;
    c.beginPath(); c.arc(0, 0, length + 12, -.6, -.1); c.stroke();
  }
  c.restore();
}

export function knifePose(life = 0) {
  const t = Math.max(0, Math.min(1, 1 - life / KNIFE.swingTime));
  const ease = n => n * n * (3 - 2 * n);
  // Brief draw-back, fast thrust, contact hold, then a slower recovery.
  const reach = t < .16 ? -6 * ease(t / .16)
    : t < .38 ? -6 + 30 * ease((t - .16) / .22)
    : t < .5 ? 24 : 24 * (1 - ease((t - .5) / .5));
  const thrust = Math.max(0, reach / 24);
  return { reach, thrust, lean: thrust * 2, tilt: .12 * (1 - thrust) };
}
