export const W = 1280, H = 800;
export const WEAPONS = [
  { id: 'pistol', name: 'M19 SIDEARM', type: 'ปืนพก', description: 'สมดุลและประหยัดกระสุน อาวุธเริ่มต้นของผู้รอดชีวิต', price: 0, damage: 34, interval: .19, mag: 18, reloadTime: 1.4, pellets: 1, spread: .035, range: .9 },
  { id: 'smg', name: 'V9 STINGER', type: 'ปืนกลมือ', description: 'ยิงรัว แมกกาซีนใหญ่ เหมาะกับฝูงซอมบี้ที่เข้ามาใกล้', price: 90, damage: 20, interval: .095, mag: 30, reloadTime: 1.6, pellets: 1, spread: .09, range: .75 },
  { id: 'shotgun', name: 'BREACHER 12', type: 'ลูกซอง', description: 'กระจาย 6 เม็ดต่อหนึ่งนัด หยุดศัตรูในระยะประชิด', price: 140, damage: 14, interval: .7, mag: 6, reloadTime: 1.8, pellets: 6, spread: .28, range: .38 },
  { id: 'rifle', name: 'RANGER R8', type: 'ไรเฟิล', description: 'ยิงหนักและแม่นยำ เหมาะกับซอมบี้ตัวถึกในระยะไกล', price: 180, damage: 80, interval: .38, mag: 10, reloadTime: 1.9, pellets: 1, spread: .012, range: 1.25 },
];
export const BOSSES = [
  ['THE WARDEN', 'slam'], ['RED HOUND', 'charge'], ['ACID MOTHER', 'acid'],
  ['IRON GRAVEDIGGER', 'slam'], ['NIGHT STALKER', 'charge'], ['PLAGUE HERALD', 'acid'],
  ['BONE COLOSSUS', 'slam'], ['BLOOD REAPER', 'charge'], ['THE CONTAMINATED', 'acid'], ['PATIENT ZERO', 'slam'],
].map(([name, ability], i) => ({ name, ability, hp: 300 + i * 100, reward: 60 + i * 15 }));
export const OBSTACLES = [
  { x: 95, y: 95, w: 245, h: 170, kind: 'building', label: 'WAREHOUSE 04' },
  { x: 920, y: 85, w: 255, h: 185, kind: 'building', label: 'NO ENTRY' },
  { x: 95, y: 565, w: 230, h: 150, kind: 'building', label: 'SUPPLY DEPOT' },
  { x: 970, y: 560, w: 205, h: 155, kind: 'building', label: 'BLOCK C' },
  { x: 500, y: 110, w: 100, h: 42, kind: 'car' },
  { x: 760, y: 625, w: 100, h: 42, kind: 'car' },
  { x: 462, y: 535, w: 105, h: 28, kind: 'barrier' },
  { x: 725, y: 285, w: 105, h: 28, kind: 'barrier' },
];
export const UPGRADES = [
  { id: 'damage', icon: '↗', title: 'HOLLOW POINT', th: 'กระสุนเจาะเกราะ', detail: 'เพิ่มความเสียหาย 35%' },
  { id: 'speed', icon: '»', title: 'LIGHT FOOTED', th: 'ก้าวให้ไวกว่าเดิม', detail: 'เพิ่มความเร็วเคลื่อนที่ 15%' },
  { id: 'mag', icon: '▥', title: 'EXTENDED MAG', th: 'แมกกาซีนเสริม', detail: 'เพิ่มกระสุนต่อแมกกาซีน 6 นัด' },
  { id: 'rate', icon: 'ϟ', title: 'QUICK TRIGGER', th: 'ลั่นไกให้เร็วขึ้น', detail: 'เพิ่มอัตราการยิง 20%' },
  { id: 'health', icon: '+', title: 'FIELD MEDIC', th: 'ชุดปฐมพยาบาล', detail: 'เพิ่มเลือดสูงสุด 25 และฟื้นฟูเต็ม' },
  { id: 'reload', icon: '⟳', title: 'SLEIGHT OF HAND', th: 'รีโหลดอย่างชำนาญ', detail: 'ลดเวลารีโหลด 25%' },
];
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export function blocked(x, y, r = 13) {
  if (x < r || x > W - r || y < r || y > H - r) return true;
  return OBSTACLES.some(o => x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h);
}
function move(body, dx, dy, r) {
  if (!blocked(body.x + dx, body.y, r)) body.x += dx;
  if (!blocked(body.x, body.y + dy, r)) body.y += dy;
}
function clearLine(x1, y1, x2, y2, radius = 3) {
  if (blocked(x1, y1, radius) || blocked(x2, y2, radius)) return false;
  // Sweep the body's full bounds along the segment, including obstacle corners.
  for (const o of OBSTACLES) {
    let enter = 0, leave = 1;
    for (const [start, delta, low, high] of [
      [x1, x2 - x1, o.x - radius, o.x + o.w + radius],
      [y1, y2 - y1, o.y - radius, o.y + o.h + radius],
    ]) {
      if (Math.abs(delta) < 1e-9) { if (start <= low || start >= high) { enter = Infinity; break; } }
      else {
        const a = (low - start) / delta, b = (high - start) / delta;
        enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
      }
    }
    if (enter < leave) return false;
  }
  return true;
}
const navigationGraphs = new Map();
function navigationGraph(radius) {
  if (navigationGraphs.has(radius)) return navigationGraphs.get(radius);
  const padding = radius + 1;
  const nodes = OBSTACLES.flatMap(o => [
    { x: o.x - padding, y: o.y - padding }, { x: o.x + o.w + padding, y: o.y - padding },
    { x: o.x - padding, y: o.y + o.h + padding }, { x: o.x + o.w + padding, y: o.y + o.h + padding },
  ]).filter(n => !blocked(n.x, n.y, radius));
  const edges = nodes.map(() => []);
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    const a = nodes[i], b = nodes[j];
    if (clearLine(a.x, a.y, b.x, b.y, radius)) {
      const cost = Math.hypot(a.x - b.x, a.y - b.y);
      edges[i].push({ index: j, cost }); edges[j].push({ index: i, cost });
    }
  }
  const graph = { nodes, edges }; navigationGraphs.set(radius, graph); return graph;
}
function approachPoint(from, player, radius) {
  const dx = from.x - player.x, dy = from.y - player.y, distance = Math.hypot(dx, dy);
  // Stop within attack range; the player can stand closer to a wall than a brute.
  const stop = radius + 12;
  return distance <= stop ? from : { x: player.x + dx / distance * stop, y: player.y + dy / distance * stop };
}
function segmentHit(ax, ay, bx, by, cx, cy, radius) {
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((cx - ax) * dx + (cy - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(ax + dx * t - cx, ay + dy * t - cy) < radius;
}
export class Game {
  constructor(random = Math.random) { this.random = random; this.events = []; this.reset(); }
  reset(difficulty = 'survivor') {
    this.difficulty = difficulty;
    this.scale = difficulty === 'recruit' ? .72 : difficulty === 'nightmare' ? 1.35 : 1;
    this.state = 'menu'; this.wave = 0; this.score = 0; this.kills = 0; this.time = 0;
    this.player = { x: 640, y: 410, angle: -.65, hp: 100, maxHp: 100, stamina: 100, speed: 190, invulnerable: 0 };
    this.credits = 0; this.weaponId = 'pistol'; this.ownedWeapons = new Map([['pistol', 18]]);
    this.weaponBonuses = { damage: 1, rate: 1, reload: 1, mag: 0 };
    this.gun = { ...this.weaponStats('pistol'), ammo: 18, reserve: 144, cooldown: 0, reload: 0 };
    this.hazards = []; this.enemies = []; this.bullets = []; this.particles = []; this.drops = []; this.stains = [];
    this.remaining = 0; this.total = 0; this.spawnClock = 0; this.pathClock = 0;
    this.paths = new Map(); this.events = []; this.banner = 0; this.hitFlash = 0;
    this.choices = [];
  }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  weaponStats(id) {
    const weapon = WEAPONS.find(w => w.id === id);
    if (!weapon) return null;
    const b = this.weaponBonuses;
    return { damage: weapon.damage * b.damage, interval: weapon.interval * b.rate, mag: weapon.mag + b.mag, reloadTime: weapon.reloadTime * b.reload, pellets: weapon.pellets, spread: weapon.spread, range: weapon.range };
  }
  buyWeapon(id) {
    const weapon = WEAPONS.find(w => w.id === id);
    if (this.state !== 'upgrade' || !weapon || this.ownedWeapons.has(id) || this.credits < weapon.price) return false;
    this.credits -= weapon.price;
    this.ownedWeapons.set(id, this.weaponStats(id).mag);
    this.equipWeapon(id); this.emit('purchase', { weapon: id }); return true;
  }
  equipWeapon(id) {
    if (this.state !== 'upgrade' || !this.ownedWeapons.has(id) || id === this.weaponId) return false;
    this.ownedWeapons.set(this.weaponId, this.gun.ammo);
    const stats = this.weaponStats(id);
    this.gun = { ...stats, ammo: Math.min(stats.mag, this.ownedWeapons.get(id)), reserve: this.gun.reserve, cooldown: 0, reload: 0 };
    this.weaponId = id; return true;
  }
  start() { this.reset(this.difficulty); this.state = 'playing'; this.nextWave(); }
  nextWave() {
    this.wave++; this.total = 7 + this.wave * 3; this.remaining = this.total;
    this.spawnClock = .3; this.banner = 3;
    this.emit('wave', { wave: this.wave });
  }
  pause() { if (this.state === 'playing') this.state = 'paused'; else if (this.state === 'paused') this.state = 'playing'; }
  reload() {
    const g = this.gun;
    if (this.state !== 'playing' || g.reload > 0 || g.ammo === g.mag || g.reserve <= 0) return;
    g.reload = g.reloadTime; this.emit('reload');
  }
  upgrade(id) {
    if (this.state !== 'upgrade' || !this.choices.some(c => c.id === id)) return;
    const g = this.gun, p = this.player;
    if (id === 'damage') this.weaponBonuses.damage *= 1.35;
    if (id === 'speed') p.speed *= 1.15;
    if (id === 'mag') this.weaponBonuses.mag += 6;
    if (id === 'rate') this.weaponBonuses.rate *= .8;
    if (id === 'health') p.maxHp += 25;
    if (id === 'reload') this.weaponBonuses.reload *= .75;
    Object.assign(g, this.weaponStats(this.weaponId));
    p.hp = Math.min(p.maxHp, p.hp + (id === 'health' ? p.maxHp : 20));
    g.ammo = g.mag; g.reload = 0; g.reserve += 36;
    this.state = 'playing'; this.nextWave();
  }
  shoot() {
    const g = this.gun, p = this.player;
    if (this.state !== 'playing' || g.cooldown > 0 || g.reload > 0) return;
    if (g.ammo <= 0) { this.reload(); return; }
    for (let i = 0; i < g.pellets; i++) {
      const spread = g.pellets === 1 ? (this.random() - .5) * g.spread : (i / (g.pellets - 1) - .5) * g.spread + (this.random() - .5) * .015;
      const angle = p.angle + spread;
      // Sweep from the survivor so even point-blank targets are hit.
      this.bullets.push({ x: p.x, y: p.y, vx: Math.cos(angle) * 980, vy: Math.sin(angle) * 980, life: g.range, damage: g.damage });
    }
    g.ammo--; g.cooldown = g.interval; this.emit('shot', { weapon: this.weaponId });
    this.burst(p.x + Math.cos(p.angle) * 31, p.y + Math.sin(p.angle) * 31, '#f5d88c', 4, 65);
  }
  burst(x, y, color, count, force = 70) {
    for (let i = 0; i < count; i++) { const a = this.random() * Math.PI * 2, s = this.random() * force; this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .2 + this.random() * .35, color }); }
  }
  spawnBoss() {
    const spec = BOSSES[this.wave - 1];
    const hp = spec.hp * this.scale;
    const boss = { ...spec, x: W / 2, y: 32, hp, maxHp: hp, type: 'boss', r: 25,
      speed: spec.ability === 'charge' ? 85 : 52, phase: 0, hit: 0, attackClock: 2.5, windup: 0, dash: 0 };
    this.enemies.push(boss); this.remaining--; this.emit('boss', { name: spec.name });
  }
  hurtPlayer(damage) {
    const p = this.player;
    if (p.invulnerable > 0 || this.state !== 'playing') return;
    p.hp = Math.max(0, p.hp - damage * this.scale); p.invulnerable = .75;
    this.hitFlash = .22; this.emit('hurt'); this.burst(p.x, p.y, '#c36f4f', 10);
    if (p.hp <= 0) { this.state = 'dead'; this.emit('dead'); }
  }
  updateBoss(e, dt) {
    if (e.windup > 0) {
      e.windup = Math.max(0, e.windup - dt);
      if (e.windup === 0) {
        if (e.ability === 'charge') e.dash = .65;
        else this.hazards.push({ x: e.targetX, y: e.targetY, r: e.ability === 'acid' ? 72 : 105, life: .35, damage: 24 + this.wave, color: e.ability === 'acid' ? '#bddc65' : '#ef986f' });
      }
    } else if (e.dash > 0) e.dash = Math.max(0, e.dash - dt);
    else {
      e.attackClock -= dt;
      if (e.attackClock <= 0) {
        e.targetX = e.ability === 'slam' ? e.x : this.player.x;
        e.targetY = e.ability === 'slam' ? e.y : this.player.y;
        e.chargeAngle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        e.windup = 1.1; e.attackClock = this.wave === 10 ? 2 : 3.5;
      }
    }
  }
  spawn() {
    if (this.remaining === 1) { this.spawnBoss(); return; }
    const edge = Math.floor(this.random() * 4), inset = 22;
    let x = edge < 2 ? inset + this.random() * (W - inset * 2) : edge === 2 ? inset : W - inset;
    let y = edge >= 2 ? inset + this.random() * (H - inset * 2) : edge === 0 ? inset : H - inset;
    const roll = this.random(), type = this.wave >= 4 && roll < .17 ? 'brute' : this.wave >= 2 && roll < .4 ? 'runner' : 'walker';
    const hp = (type === 'brute' ? 160 : type === 'runner' ? 42 : 65) * (1 + (this.wave - 1) * .1) * this.scale;
    this.enemies.push({ x, y, hp, maxHp: hp, type, r: type === 'brute' ? 21 : 14, speed: (type === 'runner' ? 125 : type === 'brute' ? 48 : 65) * (1 + this.wave * .025) * Math.sqrt(this.scale), phase: this.random() * 6.28, hit: 0 });
    this.remaining--;
  }
  updatePaths(radius) {
    const graph = navigationGraph(radius), visited = new Set();
    const costs = graph.nodes.map(n => {
      const target = approachPoint(n, this.player, radius);
      return clearLine(n.x, n.y, target.x, target.y, radius) ? Math.hypot(n.x - target.x, n.y - target.y) : Infinity;
    });
    for (let i = 0; i < graph.nodes.length; i++) {
      let current = -1;
      for (let j = 0; j < costs.length; j++) if (!visited.has(j) && costs[j] < Infinity && (current === -1 || costs[j] < costs[current])) current = j;
      if (current === -1) break;
      visited.add(current);
      for (const edge of graph.edges[current]) costs[edge.index] = Math.min(costs[edge.index], costs[current] + edge.cost);
    }
    const paths = { ...graph, costs }; this.paths.set(radius, paths); return paths;
  }
  update(dt, input = {}) {
    if (this.state !== 'playing') return;
    dt = Math.min(dt, .05); this.time += dt; this.banner = Math.max(0, this.banner - dt); this.hitFlash = Math.max(0, this.hitFlash - dt);
    const p = this.player, g = this.gun;
    p.invulnerable = Math.max(0, p.invulnerable - dt); g.cooldown = Math.max(0, g.cooldown - dt);
    if (g.reload > 0) {
      g.reload = Math.max(0, g.reload - dt);
      if (g.reload === 0) { const n = Math.min(g.mag - g.ammo, g.reserve); g.ammo += n; g.reserve -= n; this.emit('loaded'); }
    }
    let dx = input.x || 0, dy = input.y || 0; const length = Math.hypot(dx, dy);
    if (length > 1) { dx /= length; dy /= length; }
    const sprint = input.sprint && length > 0 && p.stamina > 2;
    p.stamina = clamp(p.stamina + (sprint ? -29 : 20) * dt, 0, 100);
    move(p, dx * p.speed * (sprint ? 1.65 : 1) * dt, dy * p.speed * (sprint ? 1.65 : 1) * dt, 14);
    const aim = typeof input.aim === 'function' ? input.aim(p) : input.aim;
    if (aim) p.angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    if (input.autoAim && this.enemies.length) {
      const nearest = this.enemies.filter(e => clearLine(p.x, p.y, e.x, e.y)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      if (nearest) p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
    }
    if (input.fire) this.shoot();
    this.spawnClock -= dt;
    if (this.remaining > 0 && this.spawnClock <= 0) { this.spawn(); this.spawnClock = Math.max(.23, 1.05 - this.wave * .065); }
    this.pathClock -= dt;
    if (this.pathClock <= 0) { this.paths.clear(); this.pathClock = .35; }
    for (const e of this.enemies) {
      if (e.type === 'boss') this.updateBoss(e, dt);
      e.hit = Math.max(0, e.hit - dt); e.phase += dt * e.speed / 12;
      let target = approachPoint(e, p, e.r);
      if (!clearLine(e.x, e.y, target.x, target.y, e.r)) {
        const paths = this.paths.get(e.r) || this.updatePaths(e.r);
        let best = Infinity;
        target = e;
        for (let i = 0; i < paths.nodes.length; i++) {
          const n = paths.nodes[i], distance = Math.hypot(n.x - e.x, n.y - e.y), cost = distance + paths.costs[i];
          if (distance > .1 && cost < best && clearLine(e.x, e.y, n.x, n.y, e.r)) { best = cost; target = n; }
        }
      }
      const a = Math.atan2(target.y - e.y, target.x - e.x); e.angle = a;
      const step = e.windup > 0 ? 0 : e.dash > 0 ? 360 * dt : Math.min(e.speed * dt, Math.hypot(target.x - e.x, target.y - e.y));
      const direction = e.dash > 0 ? e.chargeAngle : a;
      move(e, Math.cos(direction) * step, Math.sin(direction) * step, e.r);
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + 15 && p.invulnerable === 0) {
        this.hurtPlayer(e.type === 'boss' ? 28 : e.type === 'brute' ? 24 : 12);
        if (this.state === 'dead') return;
      }
    }
    for (const h of this.hazards) {
      h.life -= dt;
      if (Math.hypot(h.x - p.x, h.y - p.y) < h.r + 14) this.hurtPlayer(h.damage);
    }
    this.hazards = this.hazards.filter(h => h.life > 0);
    if (this.state === 'dead') return;
    for (const b of this.bullets) {
      const nx = b.x + b.vx * dt, ny = b.y + b.vy * dt;
      b.life -= dt;
      // Resolve the first collision along the trajectory, including walls.
      const steps = Math.ceil(Math.hypot(nx - b.x, ny - b.y) / 5);
      for (let s = 1; s <= steps && b.life > 0; s++) {
        const sx = b.x + (nx - b.x) * s / steps, sy = b.y + (ny - b.y) * s / steps;
        if (blocked(sx, sy, 1)) { b.life = 0; this.burst(sx, sy, '#b8a676', 3); break; }
        const e = this.enemies.find(e => e.hp > 0 && segmentHit(sx, sy, sx, sy, e.x, e.y, e.r + 3));
        if (e) {
          e.hp -= b.damage; e.hit = .1; b.life = 0; this.emit('hit'); this.burst(sx, sy, '#a0ab64', 6);
          if (e.hp <= 0) {
            const reward = e.type === 'boss' ? e.reward : e.type === 'brute' ? 30 : e.type === 'runner' ? 15 : 10;
            this.kills++; this.score += reward * 10; this.credits += reward;
            this.stains.push({ x: e.x, y: e.y, r: e.r + this.random() * 9 });
            if (this.stains.length > 80) this.stains.shift();
            const roll = this.random();
            if (roll < .22) this.drops.push({ x: e.x, y: e.y, type: roll < .065 ? 'health' : 'ammo', life: 22 });
            if (e.type === 'boss') { this.hazards = []; this.drops.push({ x: e.x, y: e.y, type: 'ammo', life: 30 }); this.emit('bossDown', { reward }); }
            this.emit('kill');
          }
        }
      }
      b.x = nx; b.y = ny;
    }
    this.enemies = this.enemies.filter(e => e.hp > 0); this.bullets = this.bullets.filter(b => b.life > 0);
    for (const d of this.drops) {
      d.life -= dt;
      if (Math.hypot(d.x - p.x, d.y - p.y) < 34) {
        if (d.type === 'health') p.hp = Math.min(p.maxHp, p.hp + 30); else g.reserve += 30;
        d.life = 0; this.emit('pickup', { pickup: d.type });
      }
    }
    this.drops = this.drops.filter(d => d.life > 0);
    for (const a of this.particles) { a.x += a.vx * dt; a.y += a.vy * dt; a.life -= dt; }
    this.particles = this.particles.filter(a => a.life > 0);
    if (this.remaining === 0 && this.enemies.length === 0) {
      if (this.wave >= 10) { this.state = 'won'; this.score += 5000; this.emit('won'); }
      else {
        this.state = 'upgrade';
        const pool = [...UPGRADES]; this.choices = [];
        for (let i = 0; i < 3; i++) this.choices.push(pool.splice(Math.floor(this.random() * pool.length), 1)[0]);
        this.emit('upgrade');
      }
    }
  }
}
