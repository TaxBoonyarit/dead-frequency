import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WEAPONS} from '../dist/engine.mjs';
import {GUN_AUDIO,GUN_RECORDINGS} from '../dist/audio.mjs';
test('every weapon ships its own nonempty PCM recording with headroom and prompt attack',()=>{
  const hashes=new Set(),sources=new Set();
  for(const weapon of WEAPONS){
    const [sample,rate,volume]=GUN_AUDIO[weapon.id];assert.ok(rate>0&&volume>0);assert.ok(GUN_RECORDINGS[weapon.id]);sources.add(sample);
    const data=readFileSync(new URL(`../dist/audio/${sample}.wav`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');
    assert.equal(data.readUInt16LE(22),1);assert.equal(data.readUInt32LE(24),24000);assert.equal(data.readUInt16LE(34),16);
    let peak=0,early=0;
    for(let i=44;i<data.length;i+=2){const value=Math.abs(data.readInt16LE(i));peak=Math.max(peak,value);if(i<44+960)early=Math.max(early,value);}
    assert.ok(peak>10000&&peak<27000,weapon.id);assert.ok(early>peak*.3,`${weapon.id} attack delayed`);
    hashes.add(createHash('sha256').update(data).digest('hex'));
  }
  assert.equal(sources.size,8);assert.equal(hashes.size,8);
});
