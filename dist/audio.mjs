// Procedural horror score: no downloads, loops, or background timers.
export class HorrorAudio {
  constructor(context) {
    this.context = context; this.master = context.createGain();
    this.master.gain.value = 0; this.master.connect(context.destination);
    this.enabled = false; this.nodes = []; this.sources = []; this.voices = new Set();
    this.nextPulse = 0; this.nextCreak = 0;
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
  stopVoices() {
    for (const { osc, gain } of this.voices) { osc.onended = null; osc.stop(); osc.disconnect(); gain.disconnect(); }
    this.voices.clear();
  }
  startAmbience() {
    if (this.sources.length) return;
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
    this.nextPulse = c.currentTime; this.nextCreak = c.currentTime + 5;
  }
  stopAmbience() {
    this.sources.forEach(n => { n.stop(); n.disconnect(); }); this.nodes.forEach(n => n.disconnect());
    this.sources = []; this.nodes = []; this.droneGain = null;
  }
  update({ playing, health, boss, wave }) {
    if (!this.enabled || !playing) {
      if (this.sources.length) { this.stopAmbience(); this.stopVoices(); }
      return;
    }
    this.startAmbience();
    const t = this.context.currentTime, danger = health <= .3;
    this.droneGain.gain.setTargetAtTime(boss ? .032 : .018 + wave * .0005, t, .5);
    if (t >= this.nextPulse) {
      if (danger || boss) {
        const volume = danger ? .075 : .035;
        this.tone(65, .15, 'sine', volume, 36); this.tone(57, .12, 'sine', volume * .65, 32, .19);
      }
      this.nextPulse = t + (danger ? .72 : 1.4);
    }
    if (t >= this.nextCreak) {
      this.tone(180 + Math.random() * 90, 1.8, 'triangle', .012, 75);
      this.nextCreak = t + 7 + Math.random() * 6;
    }
  }
  bossWarning() {
    this.tone(110, 1.5, 'sawtooth', .035, 41);
    this.tone(116, 1.8, 'triangle', .025, 43, .12);
  }
}
