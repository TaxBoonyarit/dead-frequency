"""Prepare Tabasco's CC0 Gunshot Sounds archive; pass sounds.zip as argv[1]."""
import array, io, math, pathlib, sys, wave, zipfile
root = pathlib.Path(__file__).resolve().parents[1] / 'dist' / 'audio'
with zipfile.ZipFile(sys.argv[1]) as archive:
    for source, output, start, duration in [('cz','pistol',.18,.65),('mosin','rifle',.39,1.05),('shotty','shotgun',.10,.58),('sks','assault',.28,.65)]:
        with wave.open(io.BytesIO(archive.read('sounds/'+source+'.wav'))) as wav:
            rate, channels = wav.getframerate(), wav.getnchannels()
            raw = array.array('h', wav.readframes(wav.getnframes()))
        mono = [(raw[i]+raw[i+1])/2/32768 for i in range(0,len(raw),channels)]
        # High-pass outdoor rumble, normalize peaks, and fade the trimmed tail.
        filtered=[]; previous=0; last=0
        for sample in mono:
            value=.985*(last+sample-previous); filtered.append(value); previous=sample; last=value
        clip=[filtered[min(len(filtered)-1,int((start+i/24000)*rate))] for i in range(int(duration*24000))]
        peak=max(abs(v) for v in clip) or 1
        pcm=array.array('h')
        for i,v in enumerate(clip):
            fade=min(1,i/24,(len(clip)-1-i)/1200)
            pcm.append(round(v/peak*.8*max(0,fade)*32767))
        with wave.open(str(root/(output+'.wav')),'wb') as out:
            out.setparams((1,2,24000,0,'NONE','not compressed'));out.writeframes(pcm.tobytes())
