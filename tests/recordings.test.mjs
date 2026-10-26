import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WEAPONS} from '../dist/engine.mjs';
import {GUN_AUDIO,GUN_RECORDINGS,SMG_RECORDING,PISTOL_RELOAD_RECORDING,PISTOL_RECORDING,SHOTGUN_RECORDING,ZOMBIE_RECORDING,BOSS_RECORDING} from '../dist/audio.mjs';
test('every weapon ships a distinct recording, with PCM headroom and prompt attack',()=>{
  const hashes=new Set(),sources=new Set();
  for(const weapon of WEAPONS){
    const [sample,rate,volume]=GUN_AUDIO[weapon.id];assert.ok(rate>0&&volume>0);assert.ok(GUN_RECORDINGS[weapon.id]);sources.add(sample);
    if (['shotgun','pistol','smg'].includes(weapon.id)) {
      assert.equal(sample,({pistol:PISTOL_RECORDING,shotgun:SHOTGUN_RECORDING,smg:SMG_RECORDING})[weapon.id]);assert.equal(rate,1);
      const mp3=readFileSync(new URL(`../dist/audio/${sample}.mp3`,import.meta.url));
      assert.ok(mp3.length>1000);
      assert.ok(mp3.toString('ascii',0,3)==='ID3' || (mp3[0]===0xff && (mp3[1]&0xe0)===0xe0));
      hashes.add(createHash('sha256').update(mp3).digest('hex'));continue;
    }
    const data=readFileSync(new URL(`../dist/audio/${sample}.wav`,import.meta.url));
    assert.equal(data.toString('ascii',0,4),'RIFF');assert.equal(data.toString('ascii',8,12),'WAVE');
    assert.equal(data.readUInt16LE(22),1);assert.equal(data.readUInt32LE(24),48000);assert.equal(data.readUInt16LE(34),16);
    let peak=0,early=0;
    for(let i=44;i<data.length;i+=2){const value=Math.abs(data.readInt16LE(i));peak=Math.max(peak,value);if(i<44+1920)early=Math.max(early,value);}
    assert.ok(peak>10000&&peak<27000,weapon.id);assert.ok(early>peak*.3,`${weapon.id} attack delayed`);
    hashes.add(createHash('sha256').update(data).digest('hex'));
  }
  assert.equal(sources.size,8);assert.equal(hashes.size,8);
});

test('the supplied zombie MP3 is included as the active recording',()=>{
  const data=readFileSync(new URL(`../dist/audio/${ZOMBIE_RECORDING}.mp3`,import.meta.url));
  assert.ok(data.length>1000);
  assert.ok(data.toString('ascii',0,3)==='ID3' || (data[0]===0xff && (data[1]&0xe0)===0xe0));
});

test('boss screech MP3 is included separately from the ordinary zombie voice',()=>{
  assert.notEqual(BOSS_RECORDING,ZOMBIE_RECORDING);
  const data=readFileSync(new URL(`../dist/audio/${BOSS_RECORDING}.mp3`,import.meta.url));
  assert.ok(data.length>1000);
  assert.ok(data.toString('ascii',0,3)==='ID3' || (data[0]===0xff && (data[1]&0xe0)===0xe0));
});

test('the selected 9mm reload MP3 is included',()=>{
  const data=readFileSync(new URL(`../dist/audio/${PISTOL_RELOAD_RECORDING}.mp3`,import.meta.url));
  assert.ok(data.length>1000);
  assert.ok(data.toString('ascii',0,3)==='ID3' || (data[0]===0xff && (data[1]&0xe0)===0xe0));
});
