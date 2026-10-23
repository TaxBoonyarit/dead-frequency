export const W = 1280, H = 800;
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
function clearLine(x1, y1, x2, y2) {
  const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 16);
  for (let i = 1; i <= n; i++) if (blocked(x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n, 3)) return false;
  return true;
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
    this.gun = { ammo: 18, mag: 18, reserve: 144, damage: 34, interval: .19, cooldown: 0, reload: 0, reloadTime: 1.4 };
    this.enemies = []; this.bullets = []; this.particles = []; this.drops = []; this.stains = [];
    this.remaining = 0; this.total = 0; this.spawnClock = 0; this.flowClock = 0;
    this.flow = []; this.events = []; this.banner = 0; this.hitFlash = 0;
    this.choices = []; this.flowField();
  }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  start() { this.reset(this.difficulty); this.state = 'playing'; this.nextWave(); }
  nextWave() {
    this.wave++; this.total = 6 + this.wave * 3; this.remaining = this.total;
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
    if (id === 'damage') g.damage *= 1.35;
    if (id === 'speed') p.speed *= 1.15;
    if (id === 'mag') g.mag += 6;
    if (id === 'rate') g.interval *= .8;
    if (id === 'health') p.maxHp += 25;
    if (id === 'reload') g.reloadTime *= .75;
    p.hp = Math.min(p.maxHp, p.hp + (id === 'health' ? p.maxHp : 20));
    g.ammo = g.mag; g.reload = 0; g.reserve += 36;
    this.state = 'playing'; this.nextWave();
  }
  shoot() {
    const g = this.gun, p = this.player;
    if (this.state !== 'playing' || g.cooldown > 0 || g.reload > 0) return;
    if (g.ammo <= 0) { this.reload(); return; }
    const angle = p.angle + (this.random() - .5) * .035;
    this.bullets.push({ x: p.x + Math.cos(angle) * 28, y: p.y + Math.sin(angle) * 28, vx: Math.cos(angle) * 980, vy: Math.sin(angle) * 980, life: .9 });
    g.ammo--; g.cooldown = g.interval; this.emit('shot');
    this.burst(p.x + Math.cos(angle) * 31, p.y + Math.sin(angle) * 31, '#f5d88c', 4, 65);
  }
  burst(x, y, color, count, force = 70) {
    for (let i = 0; i < count; i++) { const a = this.random() * Math.PI * 2, s = this.random() * force; this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .2 + this.random() * .35, color }); }
  }
  spawn() {
    const edge = Math.floor(this.random() * 4), inset = 22;
    let x = edge < 2 ? inset + this.random() * (W - inset * 2) : edge === 2 ? inset : W - inset;
    let y = edge >= 2 ? inset + this.random() * (H - inset * 2) : edge === 0 ? inset : H - inset;
    const roll = this.random(), type = this.wave >= 4 && roll < .17 ? 'brute' : this.wave >= 2 && roll < .4 ? 'runner' : 'walker';
    const hp = (type === 'brute' ? 160 : type === 'runner' ? 42 : 65) * (1 + (this.wave - 1) * .1) * this.scale;
    this.enemies.push({ x, y, hp, maxHp: hp, type, r: type === 'brute' ? 21 : 14, speed: (type === 'runner' ? 125 : type === 'brute' ? 48 : 65) * (1 + this.wave * .025) * Math.sqrt(this.scale), phase: this.random() * 6.28, hit: 0 });
    this.remaining--;
  }
  flowField() {
    const cols = 32, rows = 20, size = 40;
    const dist = new Int16Array(cols * rows).fill(-1);
    const px = clamp(Math.floor(this.player.x / size), 0, cols - 1), py = clamp(Math.floor(this.player.y / size), 0, rows - 1);
    const queue = [py * cols + px]; dist[queue[0]] = 0;
    for (let i = 0; i < queue.length; i++) {
      const idx = queue[i], x = idx % cols, y = Math.floor(idx / cols);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, ni = ny * cols + nx;
        if (nx < 0 || nx >= cols || ny < 0 || ny >= rows || dist[ni] !== -1 || blocked(nx * size + 20, ny * size + 20, 14)) continue;
        dist[ni] = dist[idx] + 1; queue.push(ni);
      }
    }
    this.flow = dist;
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
    if (input.aim) p.angle = Math.atan2(input.aim.y - p.y, input.aim.x - p.x);
    if (input.autoAim && this.enemies.length) {
      const nearest = this.enemies.filter(e => clearLine(p.x, p.y, e.x, e.y)).sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
      if (nearest) p.angle = Math.atan2(nearest.y - p.y, nearest.x - p.x);
    }
    if (input.fire) this.shoot();
    this.spawnClock -= dt;
    if (this.remaining > 0 && this.spawnClock <= 0) { this.spawn(); this.spawnClock = Math.max(.23, 1.05 - this.wave * .065); }
    this.flowClock -= dt;
    if (this.flowClock <= 0) { this.flowField(); this.flowClock = .35; }
    for (const e of this.enemies) {
      e.hit = Math.max(0, e.hit - dt); e.phase += dt * e.speed / 12;
      let tx = p.x, ty = p.y;
      if (!clearLine(e.x, e.y, p.x, p.y)) {
        const cx = Math.floor(e.x / 40), cy = Math.floor(e.y / 40);
        let best = Infinity;
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const nx = cx + ox, ny = cy + oy;
          if (nx < 0 || nx >= 32 || ny < 0 || ny >= 20) continue;
          const value = this.flow[ny * 32 + nx];
          if (value >= 0 && value < best && clearLine(e.x, e.y, nx * 40 + 20, ny * 40 + 20)) { best = value; tx = nx * 40 + 20; ty = ny * 40 + 20; }
        }
      }
      const a = Math.atan2(ty - e.y, tx - e.x); e.angle = a;
      move(e, Math.cos(a) * e.speed * dt, Math.sin(a) * e.speed * dt, e.r);
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + 15 && p.invulnerable === 0) {
        p.hp = Math.max(0, p.hp - (e.type === 'brute' ? 24 : 12) * this.scale);
        p.invulnerable = .75; this.hitFlash = .22; this.emit('hurt');
        this.burst(p.x, p.y, '#c36f4f', 10);
        if (p.hp <= 0) { this.state = 'dead'; this.emit('dead'); return; }
      }
    }
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
          e.hp -= g.damage; e.hit = .1; b.life = 0; this.emit('hit'); this.burst(sx, sy, '#a0ab64', 6);
          if (e.hp <= 0) {
            this.kills++; this.score += e.type === 'brute' ? 300 : e.type === 'runner' ? 150 : 100;
            this.stains.push({ x: e.x, y: e.y, r: e.r + this.random() * 9 });
            if (this.stains.length > 80) this.stains.shift();
            const roll = this.random();
            if (roll < .22) this.drops.push({ x: e.x, y: e.y, type: roll < .065 ? 'health' : 'ammo', life: 22 });
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
