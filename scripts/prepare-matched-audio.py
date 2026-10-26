"""Prepare selected CC0 Free Firearm Sound Library recordings. Requires ffmpeg.
Pass the extracted 'Prepared SFX Library' directory as argv[1].
"""
import array, json, pathlib, subprocess, sys, wave
out=pathlib.Path(__file__).resolve().parents[1]/'dist'/'audio'
choices={
 'pistol':('Walther PPQ/X_39P.wav',1.2), 'smg':('Carl Gustav M45/G_31P.wav',.8),
 'shotgun':('Nova/O_21P.wav',1.6), 'rifle':('SKS/U_14P.wav',1.3),
 'revolver':('Smith & Wesson 642/V_27P.wav',1.3), 'assault':('AR-15/D_32P.wav',1.1),
 'lmg':('AK-47/C_28P.wav',1.2), 'sniper':('Tikka/W_29P.wav',1.8),
}
manifest={}
for key,(source,duration) in choices.items():
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(pathlib.Path(sys.argv[1])/source),'-ac','1','-ar','48000','-f','s16le','pipe:1'])
 samples=array.array('h',raw);peak=max(abs(v) for v in samples)
 onset=next(i for i,v in enumerate(samples) if abs(v)>peak*.3)
 start=max(0,onset-192);clip=samples[start:start+int(duration*48000)];peak=max(abs(v) for v in clip) or 1
 # Linear gain preserves the original attack and timbre; only fade the clip edges.
 result=array.array('h', (round(v/peak*.78*32767*min(1,i/24,(len(clip)-1-i)/3840)) for i,v in enumerate(clip)))
 with wave.open(str(out/('shot-'+key+'.wav')),'wb') as w:
  w.setparams((1,2,48000,0,'NONE','not compressed'));w.writeframes(result.tobytes())
 manifest[key]={'source':source,'start_seconds':round(start/48000,4),'duration':duration,'peak':.78,'sample_rate':48000,'processing':'linear peak normalization; 0.5ms fade-in; 80ms fade-out'}
(out/'recording-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
