import { W, H } from './engine.mjs';

export function cameraOffset(playerX, viewWidth) {
  return viewWidth > W ? (W - viewWidth) / 2 : Math.max(0, Math.min(W - viewWidth, playerX - viewWidth / 2));
}

export function pointerToWorld(pointer, bounds, viewWidth, cameraX) {
  return {
    x: (pointer.clientX - bounds.left) / bounds.width * viewWidth + cameraX,
    y: (pointer.clientY - bounds.top) / bounds.height * H,
  };
}
