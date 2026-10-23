import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HorrorAudio } from '../dist/audio.mjs';
function context() {
  const param = () => ({ value: 0, cancelScheduledValues() {}, setValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime() {}, linearRampToValueAtTime(v) { this.peak = v; }, setTargetAtTime(v) { this.value = v; } });
  const nodes = [];
  const node = () => { const n = { gain: param(), frequency: param(), Q: param(), connect() {}, disconnect() { this.disconnected = true; }, start() { this.started = true; }, stop() { this.stopped = true; } }; nodes.push(n); return n; };
  return { currentTime: 0, sampleRate: 100, destination: {}, nodes, createGain: node, createOscillator: node, createBufferSource: node, createBiquadFilter: node, createBuffer: (_, size) => ({ getChannelData: () => new Float32Array(size) }) };
}
const calm = { playing: true, health: 1, boss: false, wave: 1 };
test('mute stops and disconnects ambience and scheduled effects, then safely restarts', () => {
  const c = context(), a = new HorrorAudio(c); a.update(calm); assert.equal(a.sources.length, 0);
  a.setEnabled(true); a.update(calm); a.tone(100, 1);
  const active = [...a.sources, ...a.nodes], voices = [...a.voices];
  a.setEnabled(false); assert.equal(a.master.gain.value, 0); assert.equal(a.sources.length, 0); assert.equal(a.voices.size, 0);
  assert.ok(active.every(n => n.disconnected)); assert.ok(voices.every(v => v.osc.stopped && v.osc.disconnected));
  a.setEnabled(true); a.update(calm); assert.equal(a.sources.length, 4);
});
test('continuous updates do not multiply ambience, and pause releases it', () => {
  const a = new HorrorAudio(context()); a.setEnabled(true); a.update(calm);
  const sources = [...a.sources]; for (let i = 0; i < 100; i++) a.update(calm);
  assert.deepEqual(a.sources, sources); assert.equal(a.voices.size, 0);
  a.update({ ...calm, playing: false }); assert.equal(a.sources.length, 0); assert.ok(sources.every(n => n.stopped));
});
test('low health and bosses trigger heartbeat, with faster low-health pacing', () => {
  for (const [health, boss, interval] of [[.2, false, .72], [1, true, 1.4]]) {
    const c = context(), a = new HorrorAudio(c); a.setEnabled(true); a.update({ ...calm, health, boss });
    assert.equal(a.voices.size, 2); assert.equal(a.nextPulse, interval);
    c.currentTime = interval - .01; a.update({ ...calm, health, boss }); assert.equal(a.voices.size, 2);
    c.currentTime = interval; a.update({ ...calm, health, boss }); assert.equal(a.voices.size, 4);
    a.update({ ...calm, playing: false }); assert.equal(a.voices.size, 0);
  }
});

test('only living nearby zombies vocalize and repeated frames do not stack growls', () => {
  const c = context(), a = new HorrorAudio(c); a.setEnabled(true);
  const player = {x:0,y:0}; a.update({...calm, player}); c.currentTime = 1;
  a.update({...calm, player, enemies:[{x:600,y:0,hp:10,type:'walker'},{x:30,y:0,hp:0,type:'runner'}]});
  assert.equal(a.voices.size,0);
  const enemies = [{x:100,y:0,hp:10,type:'walker'}]; a.update({...calm,player,enemies}); assert.equal(a.voices.size,1);
  for(let i=0;i<60;i++) a.update({...calm,player,enemies}); assert.equal(a.voices.size,1);
  const voice = [...a.voices][0]; voice.osc.onended(); assert.equal(a.voices.size,0); assert.ok(voice.extras.every(n=>n.disconnected));
});
test('zombie types have distinct lengths, proximity controls volume and mute cancels them', () => {
  const c=context(), a=new HorrorAudio(c); a.setEnabled(true);
  const lengths=[];
  for(const type of ['walker','runner','brute','boss']) { a.zombieGrowl(type,50); lengths.push([...a.voices].at(-1).osc.buffer.getChannelData(0).length); }
  assert.equal(new Set(lengths).size,4);
  a.zombieGrowl('walker',30); const near=[...a.voices].at(-1).gain.gain.peak;
  a.zombieGrowl('walker',500); const far=[...a.voices].at(-1).gain.gain.peak; assert.ok(near > far);
  const voices=[...a.voices]; a.setEnabled(false); assert.equal(a.voices.size,0);
  assert.ok(voices.every(v=>v.osc.stopped && v.extras.every(n=>n.disconnected)));
  a.zombieGrowl('walker',10); assert.equal(a.voices.size,0);
});
