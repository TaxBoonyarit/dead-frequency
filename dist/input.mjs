export function initialTouchMode(media) {
  return media('(pointer:coarse)').matches && !media('(any-pointer:fine)').matches;
}

const PHYSICAL_KEYS = {
  KeyW: 'w', KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f', KeyR: 'r', KeyP: 'p', KeyE: 'e',
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
  let stickId = null, fireOrigin = null;
  const held = new Map();
  const input = { x: 0, y: 0, firing: false, sprinting: false, aim: null, reset };
  function reset() {
    stickId = null; held.clear(); input.x = input.y = 0;
    input.firing = input.sprinting = false; input.aim = null; knob.style.transform = '';
    fireOrigin = null; centerFireThumb();
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
      e.preventDefault(); held.set(action, e.pointerId); input[action] = action !== 'firing';
      if (action === 'firing') fireOrigin = { x: e.clientX, y: e.clientY };
      button.classList.add('held'); button.setPointerCapture(e.pointerId);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, e => {
      if (held.get(action) !== e.pointerId) return;
      held.delete(action); input[action] = false; button.classList.remove('held');
      if (action === 'firing') { fireOrigin = null; centerFireThumb(); }
    });
  }
  function centerFireThumb() {
    fire.style.setProperty('--aim-x', '0px'); fire.style.setProperty('--aim-y', '0px');
  }
  fire.addEventListener('pointermove', e => {
    if (held.get('firing') !== e.pointerId || !fireOrigin) return;
    e.preventDefault();
    const dx = e.clientX - fireOrigin.x, dy = e.clientY - fireOrigin.y, length = Math.hypot(dx, dy);
    // Choose a direction before arming; small finger shifts keep the last aim.
    if (length < 8) return;
    input.aim = { x: dx / length, y: dy / length };
    input.firing = true;
    const radius = Math.min(20, length);
    fire.style.setProperty('--aim-x', `${input.aim.x * radius}px`);
    fire.style.setProperty('--aim-y', `${input.aim.y * radius}px`);
  });
  return input;
}
