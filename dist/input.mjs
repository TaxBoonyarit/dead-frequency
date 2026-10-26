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

export function bindTouchControls({ stick, knob, fire, sprint, canUse }) {
  let stickId = null;
  const held = new Map();
  const input = { x: 0, y: 0, firing: false, sprinting: false, reset };
  function reset() {
    stickId = null; held.clear(); input.x = input.y = 0;
    input.firing = input.sprinting = false; knob.style.transform = '';
    fire.classList.remove('held'); sprint.classList.remove('held');
  }
  function drag(e) {
    const r = stick.getBoundingClientRect(), radius = Math.max(1, (r.width - knob.offsetWidth) / 2);
    const dx = e.clientX - r.left - r.width / 2, dy = e.clientY - r.top - r.height / 2;
    const length = Math.hypot(dx, dy), scale = Math.min(1, radius / (length || 1));
    input.x = dx * scale / radius; input.y = dy * scale / radius;
    knob.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
  }
  stick.addEventListener('pointerdown', e => {
    if (!canUse() || stickId !== null || e.button !== 0) return;
    e.preventDefault(); stickId = e.pointerId; stick.setPointerCapture(e.pointerId); drag(e);
  });
  stick.addEventListener('pointermove', e => { if (e.pointerId === stickId) { e.preventDefault(); drag(e); } });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(event, e => {
    if (e.pointerId !== stickId) return;
    stickId = null; input.x = input.y = 0; knob.style.transform = '';
  });
  for (const [button, action] of [[fire, 'firing'], [sprint, 'sprinting']]) {
    button.addEventListener('pointerdown', e => {
      if (!canUse() || held.has(action) || e.button !== 0) return;
      e.preventDefault(); held.set(action, e.pointerId); input[action] = true;
      button.classList.add('held'); button.setPointerCapture(e.pointerId);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => {
      if (held.get(action) !== e.pointerId) return;
      held.delete(action); input[action] = false; button.classList.remove('held');
    });
  }
  return input;
}
