# Matched gunshot recordings

The Free Firearm Sound Library by Ben Jaszczak, Brian Nelson, Kevin Heras, and Matthew Nanney. CC0 public-domain dedication.
Source and license: https://opengameart.org/content/the-free-firearm-sound-library
Archive: https://opengameart.org/sites/default/files/Prepared%20SFX%20Library.7z

| Game weapon | Recording source | Archive file |
|---|---|---|
| M19 SIDEARM | User-selected 9mm pistol shot | weapon-m19-sidearm.mp3 |
| V9 STINGER | User-selected SMG shot | weapon-v9-stinger.mp3 |
| BREACHER 12 | User-selected Dragon Studio gunshot | weapon-breacher-12.mp3 |
| RANGER R8 | User-selected machine gun recording | weapon-ranger-r8.mp3 |
| JUDGE .44 | User-selected single gunshot | weapon-judge-44.mp3 |
| VANGUARD A4 | AR-15 / M4, 5.56 carbine | AR-15/D_32P.wav |
| BASTION M60 | User-selected M249, 0.5 s cut | weapon-bastion-m60.mp3 |
| LONGWATCH .50 | User-selected sniper rifle | weapon-longwatch-50.mp3 |

These are sound-design matches for fictional game weapons, not recordings of their displayed model or caliber. The LMG uses a heavier automatic-rifle report; it is not an M60 recording.
Processing: select one near-field shot, trim pre-shot silence with 4 ms pre-roll,
mono 48 kHz PCM16, linear peak normalization to 0.78, 0.5 ms fade-in and 80 ms
fade-out. Keep 0.8–1.8 seconds of the recorded decay without including another
shot. No nonlinear waveform shaping, artificial pitch changes or synthetic
layers; every weapon plays at the recording's original speed. All eight weapons
have separate source recordings. Existing source-model substitutions still apply.
Rebuild: python3 scripts/prepare-matched-audio.py /path/to/Prepared\ SFX\ Library
See recording-manifest.json for selected offsets and duration.

# Reload handling recordings

Gun Reload Sound Effects by BMacZero / Brian MacIntosh, CC0.
https://opengameart.org/content/gun-reload-sound-effects
Original files: clipload2.wav, clipload1.wav, singlebullet1.wav.
Stored as reload-out.wav, reload-in.wav, reload-bolt.wav. Playback pitch and timing vary by weapon.

## Active zombie recording (user-selected)

Ordinary zombies (walker, runner, brute) use `zombie-growl.mp3`, supplied
by the user. Loaded directly from the original MP3 (stereo, 24 kHz, 1.824 s),
without re-encoding. Walkers/runners preserve its original speed; brutes
play it at 0.9 speed. Proximity and stereo positioning still apply.
The filename alone does not establish a source URL or license; no license is
inferred for this supplied file.

## Active boss screech (user-selected)

`boss-screech.mp3`, supplied by the
user, plays at original speed when a boss appears and for boss voice previews.
Original MP3: stereo, 44.1 kHz, about 8.124 s; no re-encoding. Ambient growls
wait until after the entrance clip. Ordinary zombies keep the previously
selected `zombie-growl.mp3`. No source URL or license has
been inferred from the supplied filename.

## Active shotgun recording (user-selected)

BREACHER 12 uses `weapon-breacher-12.mp3`, supplied by the user.
The original stereo 44.1 kHz MP3 (about 3.082 s) is loaded directly and played
at its original speed. It replaces the Benelli Nova WAV in the game; other
weapons and reload sounds are unchanged. No source URL or license is inferred
from the supplied filename.

## Active pistol recording (user-selected)

M19 SIDEARM uses `weapon-m19-sidearm.mp3`, supplied by
the user. The MP3 is loaded directly without re-encoding and played at original
speed. The previous Walther PPQ WAV is no longer loaded. No source URL or
license is inferred from the supplied filename.

## Active 9mm pistol reload (user-selected)

M19 SIDEARM uses `reload-m19-sidearm.mp3`,
supplied by the user. The full clip plays once per reload, replacing the three
staged handling sounds for this weapon. Base reload time is 2.22 s to match
the original recording; reload upgrades shorten playback to match game timing.
Other weapons retain their staged reload sounds. No source URL or license is
inferred from the supplied filename.

## Active SMG recording (user-selected)

V9 STINGER uses `weapon-v9-stinger.mp3`, supplied
by the user. The original MP3 (about 0.522 s) plays once per fired round at
original speed, including automatic fire. The Carl Gustav M45 WAV is no longer
loaded. No source URL or license is inferred from the supplied filename.

## Active LMG recording (user-selected)

BASTION M60 uses `weapon-bastion-m60.mp3`.
Derived from the user-supplied `sovetsky_rastov72-m249-sound-effects-244559.mp3`:
keep 0–0.5 s and fade out from 0.44–0.5 s. Playback stays at original speed.
The previous AK-47 WAV is no longer loaded. This is an M249 source recording
assigned to the fictional BASTION M60, not an actual M60 recording.
No source URL or license is inferred from the supplied filename.

## Active sniper recording (user-selected)

LONGWATCH .50 uses `weapon-longwatch-50.mp3`, supplied by
the user. Loaded directly without re-encoding and played once per shot at
original speed. The Tikka WAV is no longer loaded. No source URL or license
is inferred from the supplied filename.

## Active revolver recording (user-selected)

JUDGE .44 uses `weapon-judge-44.mp3`, supplied
by the user. Loaded directly without re-encoding and played once per shot at
original speed. The Smith & Wesson WAV is no longer loaded. No source URL or
license is inferred from the supplied filename.

## Active Ranger R8 recording (user-selected)

RANGER R8 uses `weapon-ranger-r8.mp3`, supplied by the user.
Loaded directly without re-encoding and played once per shot at original speed.
The SKS WAV is no longer loaded. No source URL or license is inferred from
the supplied filename.

## Quiet horror ambience (user-selected)

`ambience-horror.mp3`, supplied by the user, loops during
active play at gain 0.06 before the master gain, with a 1.5-second fade-in.
It stops on pause, menu, run end, tab hiding or mute alongside other ambience.
The original MP3 (about 33.28 seconds) is loaded directly without re-encoding.
No source URL or license is inferred from the supplied filename.

## Playback level and loading

After decoding, any recording whose peak exceeds 0.9 is attenuated linearly
across all channels to peak 0.9. Quieter recordings are unchanged. This prevents
over-range MP3 decoding from overdriving the existing weapon mix without
changing pitch. Previews await only their selected effect; background preload
shares per-file requests. Downloads time out after 15 seconds and can retry.

## Runtime filenames and original sources

| Game file | Original supplied/source filename |
|---|---|
| `weapon-m19-sidearm.mp3` | `freesound_community-9mm-pistol-shot-6349.mp3` |
| `weapon-v9-stinger.mp3` | `moniker_subriquet-gunshot_smg_shot_1-203471.mp3` |
| `weapon-breacher-12.mp3` | `dragon-studio-gunshot-372470.mp3` |
| `weapon-ranger-r8.mp3` | `49053354-machine-gun-307468.mp3` |
| `weapon-judge-44.mp3` | `freesound_community-single-gunshot-62-hp-37188.mp3` |
| `weapon-vanguard-a4.wav` | `shot-assault.wav` |
| `weapon-bastion-m60.mp3` | `sovetsky_rastov72-m249-sound-effects-244559-short.mp3` |
| `weapon-longwatch-50.mp3` | `freesound_community-sniper-rifle-5989.mp3` |
| `reload-m19-sidearm.mp3` | `freesound_community-9mm-pistol-load-and-chamber-98830.mp3` |
| `zombie-growl.mp3` | `freesound_community-zombie-6851.mp3` |
| `boss-screech.mp3` | `u_klymi2aebc-zombie-screech-sound-effect-312865-446996.mp3` |
| `ambience-horror.mp3` | `simplesound-horror-trailer-443327.mp3` |

Unused legacy clips and untrimmed source files are retained in `audio-source/`, outside the published `dist/` directory.
