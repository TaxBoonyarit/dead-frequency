"""Prepare selected CC0 Free Firearm Sound Library recordings. Requires ffmpeg.
Pass the extracted 'Prepared SFX Library' directory as argv[1].
"""
import array, json, math, pathlib, subprocess, sys, wave
out=pathlib.Path(__file__).resolve().parents[1]/'dist'/'audio'
choices={
 'pistol':('Walther PPQ/X_39P.wav',.6), 'smg':('Carl Gustav M45/G_31P.wav',.35),
 'shotgun':('Nova/O_21P.wav',.8), 'rifle':('SKS/U_14P.wav',.75),
 'revolver':('Smith & Wesson 642/V_27P.wav',.7), 'assault':('AR-15/D_32P.wav',.5),
 'lmg':('AK-47/C_28P.wav',.65), 'sniper':('Tikka/W_29P.wav',1.05),
}
manifest={}
for key,(source,duration) in choices.items():
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(pathlib.Path(sys.argv[1])/source),'-ac','1','-ar','24000','-f','s16le','pipe:1'])
 samples=array.array('h',raw);peak=max(abs(v) for v in samples)
 onset=next(i for i,v in enumerate(samples) if abs(v)>peak*.3)
 start=max(0,onset-96);clip=samples[start:start+int(duration*24000)];peak=max(abs(v) for v in clip) or 1
 # Gentle compression lifts the recorded body/tail without removing the attack.
 clip=array.array('h',(round(math.copysign((abs(v)/peak)**.8,v)*peak) for v in clip))
 result=array.array('h', (round(v/peak*.78*32767*min(1,i/12,(len(clip)-1-i)/1440)) for i,v in enumerate(clip)))
 with wave.open(str(out/('shot-'+key+'.wav')),'wb') as w:
  w.setparams((1,2,24000,0,'NONE','not compressed'));w.writeframes(result.tobytes())
 manifest[key]={'source':source,'start_seconds':round(start/24000,4),'duration':duration,'peak':.78}
(out/'recording-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
