const PHYSICAL_KEYS = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyR: 'r', KeyP: 'p',
  ArrowUp: 'arrowup', ArrowDown: 'arrowdown', ArrowLeft: 'arrowleft', ArrowRight: 'arrowright',
  ShiftLeft: 'shift', ShiftRight: 'shift', Space: ' ', Escape: 'escape',
};
// Use physical positions so Thai input, Caps Lock, and layout changes cannot break controls.
export function controlKey(event) {
  return PHYSICAL_KEYS[event.code] ?? (event.key || '').toLowerCase();
}
export function keyboardMovement(keys) {
  return {
    x: Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')),
    y: Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')),
  };
}
