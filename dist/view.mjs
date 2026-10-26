import { W, H } from './engine.mjs';

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

export function drawTouchAim(c, { x, y, angle, width, height, scale, spread, active, reloading }) {
  const target = touchAimPoint(x, y, angle, width, height, scale);
  const radius = Math.max(10 * scale, Math.min(23 * scale, target.distance * Math.tan(spread / 2)));
  const color = reloading ? '#f3bd80' : '#a4f1e0';
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
