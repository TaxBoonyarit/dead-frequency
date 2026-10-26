export const AMBIENCE_RECORDING = 'ambience-horror';
export const RIFLE_RECORDING = 'weapon-ranger-r8';
export const REVOLVER_RECORDING = 'weapon-judge-44';
export const SNIPER_RECORDING = 'weapon-longwatch-50';
export const LMG_RECORDING = 'weapon-bastion-m60';
export const SMG_RECORDING = 'weapon-v9-stinger';
export const PISTOL_RELOAD_RECORDING = 'reload-m19-sidearm';
export const PISTOL_RECORDING = 'weapon-m19-sidearm';
export const SHOTGUN_RECORDING = 'weapon-breacher-12';
export const GUN_AUDIO = {
  pistol: [PISTOL_RECORDING, 1, .66], smg: [SMG_RECORDING, 1, .48], shotgun: [SHOTGUN_RECORDING, 1, .78],
  rifle: [RIFLE_RECORDING, 1, .69], revolver: [REVOLVER_RECORDING, 1, .72], assault: ['weapon-vanguard-a4', 1, .57],
  lmg: [LMG_RECORDING, 1, .63], sniper: [SNIPER_RECORDING, 1, .81],
};
export const GUN_RECORDINGS = {
  pistol: 'Freesound Community · 9mm pistol shot', smg: 'Moniker Subriquet · SMG shot', shotgun: 'Dragon Studio · gunshot-372470',
  rifle: '49053354 · machine gun', revolver: 'Freesound Community · single gunshot 62 HP', assault: 'AR-15 · carbine',
  lmg: 'Sovetsky Rastov72 · M249 · 0.5s cut', sniper: 'Freesound Community · sniper rifle',
};
export const ZOMBIE_RECORDING = 'zombie-growl';
export const BOSS_RECORDING = 'boss-screech';
// MP3 decoding can produce peaks above 1; linear attenuation preserves its timbre.
export function normalizeRecording(buffer) {
  let peak = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (const value of samples) peak = Math.max(peak, Math.abs(value));
  }
  if (peak > .9) for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel), scale = .9 / peak;
    for (let i = 0; i < samples.length; i++) samples[i] *= scale;
  }
  return buffer;
}
// Local firearm recordings and procedural horror ambience; no background timers.
export class HorrorAudio {
  constructor(context) {
    this.context = context; this.master = context.createGain();
    this.master.gain.value = 0; this.master.connect(context.destination);
    this.ambienceTrack = null;
    this.enabled = false; this.nodes = []; this.sources = []; this.voices = new Set();
    this.reloadStep = -1; this.gunBuffers = new Map(); this.audioLoads = new Map();
    this.nextPulse = 0; this.nextCreak = 0; this.nextGrowl = 0;
    const length = context.sampleRate * 3;
    this.noise = context.createBuffer(1, length, context.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  }
  setEnabled(enabled) {
    this.enabled = enabled;
    const t = this.context.currentTime;
    this.master.gain.cancelScheduledValues(t); this.master.gain.setValueAtTime(enabled ? .7 : 0, t);
    if (!enabled) { this.stopAmbience(); this.stopVoices(); }
  }
  tone(frequency, duration, type = 'sine', volume = .035, endFrequency = frequency, delay = 0) {
    if (!this.enabled) return;
    const c = this.context, start = c.currentTime + delay, osc = c.createOscillator(), gain = c.createGain();
    osc.type = type; osc.frequency.setValueAtTime(frequency, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    gain.gain.setValueAtTime(0, c.currentTime); gain.gain.setValueAtTime(.0001, start);
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(.025, duration / 4));
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(gain); gain.connect(this.master);
    const voice = { osc, gain }; this.voices.add(voice);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); this.voices.delete(voice); };
    osc.start(start); osc.stop(start + duration);
  }
  loadWeaponAudio(ids = [...Object.values(GUN_AUDIO).map(profile => profile[0]), 'reload-out', 'reload-in', 'reload-bolt', PISTOL_RELOAD_RECORDING, ZOMBIE_RECORDING, BOSS_RECORDING, AMBIENCE_RECORDING]) {
    return Promise.allSettled([...new Set(ids)].filter(id => !this.gunBuffers.has(id)).map(id => {
      if (!this.audioLoads.has(id)) {
        const loading = (async () => {
          const extension = [ZOMBIE_RECORDING, BOSS_RECORDING, SHOTGUN_RECORDING, PISTOL_RECORDING, PISTOL_RELOAD_RECORDING, SMG_RECORDING, LMG_RECORDING, SNIPER_RECORDING, REVOLVER_RECORDING, RIFLE_RECORDING, AMBIENCE_RECORDING].includes(id) ? 'mp3' : 'wav';
          const response = await fetch(new URL(`./audio/${id}.${extension}`, import.meta.url), { signal: AbortSignal.timeout(15000) });
          if (!response.ok) throw new Error('Audio unavailable');
          const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
          this.gunBuffers.set(id, normalizeRecording(buffer));
        })().finally(() => this.audioLoads.delete(id));
        this.audioLoads.set(id, loading);
      }
      return this.audioLoads.get(id);
    }));
  }
  gunshot(id) {
    if (!this.enabled) return false;
    const [sample, rate, volume] = GUN_AUDIO[id] || GUN_AUDIO.pistol;
    const buffer = this.gunBuffers.get(sample);
    if (!buffer) { this.tone(95, .12, 'triangle', .06, 32); return false; }
    const c = this.context, osc = c.createBufferSource(), gain = c.createGain();
    osc.buffer = buffer; osc.playbackRate.value = rate;
    gain.gain.value = volume; osc.connect(gain); gain.connect(this.master);
    const voice = { osc, gain }; this.voices.add(voice);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); this.voices.delete(voice); };
    osc.start(); osc.stop(c.currentTime + buffer.duration / osc.playbackRate.value);
    return true;
  }
  reloadEffect(id, step, delay = 0, duration) {
    if (!this.enabled) return false;
    const fullReload = id === 'pistol' && this.gunBuffers.has(PISTOL_RELOAD_RECORDING);
    if (fullReload && step > 0) return true;
    const key = fullReload ? PISTOL_RELOAD_RECORDING : step === 0 ? 'reload-out' : step === 1 ? 'reload-in' : 'reload-bolt';
    const buffer = this.gunBuffers.get(key), c = this.context;
    const rate = fullReload ? buffer.duration / (duration || buffer.duration) : id === 'lmg' ? .75 : id === 'shotgun' || id === 'revolver' ? .9 : id === 'sniper' ? .8 : 1.15;
    if (!buffer) { this.tone(step === 0 ? 160 : 310, .08, 'triangle', .035, 90, delay); return false; }
    const osc = c.createBufferSource(), gain = c.createGain(); osc.buffer = buffer; osc.playbackRate.value = rate;
    gain.gain.value = .4; osc.connect(gain); gain.connect(this.master);
    const voice = {osc,gain}; this.voices.add(voice);
    osc.onended = () => {osc.disconnect();gain.disconnect();this.voices.delete(voice);};
    osc.start(c.currentTime + delay); osc.stop(c.currentTime + delay + buffer.duration / rate); return true;
  }
  reloadProgress(id, remaining, duration) {
    if (remaining <= 0) { this.reloadStep = -1; return; }
    const progress = 1 - remaining / duration, step = progress >= .78 ? 2 : progress >= .4 ? 1 : 0;
    if (step > this.reloadStep) { this.reloadStep = step; this.reloadEffect(id, step, 0, duration); }
  }
  stopVoices() {
    for (const { osc, gain, extras = [] } of this.voices) { osc.onended = null; osc.stop(); osc.disconnect(); gain.disconnect(); extras.forEach(n => n.disconnect()); }
    this.voices.clear();
  }
  zombieGrowl(type, distance, horizontal = 0) {
    if (!this.enabled) return;
    const recorded = this.gunBuffers.get(type === 'boss' ? BOSS_RECORDING : ZOMBIE_RECORDING);
    if (recorded) {
      const c = this.context, osc = c.createBufferSource(), gain = c.createGain(), extras = [];
      osc.buffer = recorded;
      osc.playbackRate.value = type === 'brute' ? .9 : 1;
      gain.gain.value = .06 + .34 * Math.max(0, 1 - distance / 560);
      osc.connect(gain);
      if (c.createStereoPanner) {
        const pan = c.createStereoPanner(); pan.pan.value = Math.max(-.85, Math.min(.85, horizontal / 300));
        gain.connect(pan); pan.connect(this.master); extras.push(pan);
      } else gain.connect(this.master);
      const voice = { osc, gain, extras }; this.voices.add(voice);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); extras.forEach(n => n.disconnect()); this.voices.delete(voice); };
      osc.start(); osc.stop(c.currentTime + osc.buffer.duration / osc.playbackRate.value);
      return true;
    }
    const [pitch, duration] = ({ walker: [83, 1.15], runner: [155, .65], brute: [54, 1.5], boss: [42, 1.9] })[type] || [83, 1.15];
    const c = this.context, t = c.currentTime;
    const buffer = c.createBuffer(1, Math.ceil(duration * c.sampleRate), c.sampleRate), data = buffer.getChannelData(0);
    let phase = 0;
    for (let i = 0; i < data.length; i++) {
      const seconds = i / c.sampleRate, progress = seconds / duration;
      phase += 2 * Math.PI * pitch * (1 - .3 * progress + .05 * Math.sin(seconds * 29)) / c.sampleRate;
      const throat = Math.sin(phase) * .5 + Math.sin(phase * 2) * .22 + Math.sin(phase * 3) * .12;
      data[i] = (throat + (Math.random() * 2 - 1) * .17) * (.7 + .3 * Math.sin(seconds * 38));
    }
    const osc = c.createBufferSource(), filter = c.createBiquadFilter(), gain = c.createGain();
    osc.buffer = buffer; filter.type = 'lowpass'; filter.frequency.value = type === 'runner' ? 1300 : 650; filter.Q.value = 2;
    const volume = .012 + .085 * Math.max(0, 1 - distance / 560);
    gain.gain.setValueAtTime(.0001, t); gain.gain.linearRampToValueAtTime(volume, t + .12);
    gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(filter); filter.connect(gain); const extras = [filter];
    if (c.createStereoPanner) {
      const pan = c.createStereoPanner(); pan.pan.value = Math.max(-.85, Math.min(.85, horizontal / 300));
      gain.connect(pan); pan.connect(this.master); extras.push(pan);
    } else gain.connect(this.master);
    const voice = { osc, gain, extras }; this.voices.add(voice);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); extras.forEach(n => n.disconnect()); this.voices.delete(voice); };
    osc.start(); osc.stop(t + duration);
  }
  startHorrorBed() {
    const buffer = this.gunBuffers.get(AMBIENCE_RECORDING);
    if (!this.enabled || this.ambienceTrack || !buffer) return;
    const c = this.context, source = c.createBufferSource(), gain = c.createGain();
    source.buffer = buffer; source.loop = true;
    gain.gain.setValueAtTime(0, c.currentTime); gain.gain.linearRampToValueAtTime(.06, c.currentTime + 1.5);
    source.connect(gain); gain.connect(this.master); source.start();
    this.sources.push(source); this.nodes.push(gain); this.ambienceTrack = source;
  }
  startAmbience() {
    if (this.sources.length) { this.startHorrorBed(); return; }
    const c = this.context, bus = c.createGain(); bus.gain.value = .022; bus.connect(this.master);
    const filter = c.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 370; filter.Q.value = .7;
    filter.connect(bus);
    const wind = c.createBufferSource(); wind.buffer = this.noise; wind.loop = true; wind.connect(filter);
    const drone = c.createOscillator(), detuned = c.createOscillator();
    drone.frequency.value = 49; detuned.frequency.value = 50.3;
    const droneGain = c.createGain(); droneGain.gain.value = .018; droneGain.connect(this.master);
    drone.connect(droneGain); detuned.connect(droneGain);
    const breath = c.createOscillator(), depth = c.createGain();
    breath.frequency.value = .13; depth.gain.value = .007; breath.connect(depth); depth.connect(droneGain.gain);
    this.sources = [wind, drone, detuned, breath]; this.nodes = [bus, filter, droneGain, depth];
    this.sources.forEach(n => n.start()); this.droneGain = droneGain;
    this.nextGrowl = c.currentTime + .5;
    this.nextPulse = c.currentTime; this.nextCreak = c.currentTime + 5;
    this.startHorrorBed();
  }
  stopAmbience() {
    this.sources.forEach(n => { n.stop(); n.disconnect(); }); this.nodes.forEach(n => n.disconnect());
    this.sources = []; this.nodes = []; this.droneGain = null; this.ambienceTrack = null;
  }
  update({ playing, health, boss, wave, enemies = [], player, weapon, reload = 0, reloadTime = 1 }) {
    if (!this.enabled || !playing) {
      if (this.sources.length) { this.stopAmbience(); this.stopVoices(); }
      return;
    }
    this.startAmbience();
    this.reloadProgress(weapon, reload, reloadTime);
    const t = this.context.currentTime, danger = health <= .3;
    this.droneGain.gain.setTargetAtTime(boss ? .032 : .018 + wave * .0005, t, .5);
    if (t >= this.nextPulse) {
      if (danger || boss) {
        const volume = danger ? .075 : .035;
        this.tone(65, .15, 'sine', volume, 36); this.tone(57, .12, 'sine', volume * .65, 32, .19);
      }
      this.nextPulse = t + (danger ? .72 : 1.4);
    }
    if (player && t >= this.nextGrowl) {
      let nearest = null, distance = 560;
      for (const enemy of enemies) {
        const d = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        if (enemy.hp > 0 && d < distance) { nearest = enemy; distance = d; }
      }
      if (nearest) {
        this.zombieGrowl(nearest.type, distance, nearest.x - player.x);
        const duration = nearest.type === 'boss' ? (this.gunBuffers.get(BOSS_RECORDING)?.duration || 1.9) : 0;
        this.nextGrowl = t + Math.max(duration + 1, nearest.type === 'runner' ? 1.5 : 2.6) + Math.random() * 1.2;
      }
    }
    if (t >= this.nextCreak) {
      this.tone(180 + Math.random() * 90, 1.8, 'triangle', .012, 75);
      this.nextCreak = t + 7 + Math.random() * 6;
    }
  }
  bossEntrance() {
    if (!this.enabled) return;
    const recorded = this.zombieGrowl('boss', 0);
    this.nextGrowl = this.context.currentTime + (this.gunBuffers.get(BOSS_RECORDING)?.duration || 1.9) + 1;
    return recorded;
  }
  bossWarning() {
    this.tone(110, 1.5, 'sawtooth', .035, 41);
    this.tone(116, 1.8, 'triangle', .025, 43, .12);
  }
}
