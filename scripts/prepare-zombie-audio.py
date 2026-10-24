"""Convert ArcadeParty's CC0 voice pack to game-ready recordings.
Usage: python3 scripts/prepare-zombie-audio.py <extracted pack directory>
"""
import array, pathlib, subprocess, sys, wave
out = pathlib.Path(__file__).resolve().parents[1] / 'dist/audio'
for index in range(1, 9):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(pathlib.Path(sys.argv[1]) / f'zombieYell{index}.wav'), '-ac', '1', '-ar', '24000', '-f', 's16le', 'pipe:1'])
    samples = array.array('h', raw)
    peak = max(abs(v) for v in samples)
    active = [i for i, v in enumerate(samples) if abs(v) > peak * .015]
    clip = samples[max(0, active[0]-240):min(len(samples), active[-1]+2400)]
    result = array.array('h', (round(v / peak * .78 * 32767 * min(1, i/120, (len(clip)-1-i)/480)) for i,v in enumerate(clip)))
    with wave.open(str(out / f'zombie-{index}.wav'), 'wb') as w:
        w.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
        w.writeframes(result.tobytes())
