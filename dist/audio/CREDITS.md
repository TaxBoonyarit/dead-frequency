# Matched gunshot recordings

The Free Firearm Sound Library by Ben Jaszczak, Brian Nelson, Kevin Heras, and Matthew Nanney. CC0 public-domain dedication.
Source and license: https://opengameart.org/content/the-free-firearm-sound-library
Archive: https://opengameart.org/sites/default/files/Prepared%20SFX%20Library.7z

| Game weapon | Recording source | Archive file |
|---|---|---|
| M19 SIDEARM | User-selected 9mm pistol shot | freesound_community-9mm-pistol-shot-6349.mp3 |
| V9 STINGER | User-selected SMG shot | moniker_subriquet-gunshot_smg_shot_1-203471.mp3 |
| BREACHER 12 | User-selected Dragon Studio gunshot | dragon-studio-gunshot-372470.mp3 |
| RANGER R8 | Norinco SKS, semi-automatic rifle | SKS/U_14P.wav |
| JUDGE .44 | Smith & Wesson 642, .38 revolver | Smith & Wesson 642/V_27P.wav |
| VANGUARD A4 | AR-15 / M4, 5.56 carbine | AR-15/D_32P.wav |
| BASTION M60 | AK-47, 7.62 automatic rifle | AK-47/C_28P.wav |
| LONGWATCH .50 | Tikka T3, .30-06 bolt-action rifle | Tikka/W_29P.wav |

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

Ordinary zombies (walker, runner, brute) use `freesound_community-zombie-6851.mp3`, supplied
by the user. Loaded directly from the original MP3 (stereo, 24 kHz, 1.824 s),
without re-encoding. Walkers/runners preserve its original speed; brutes
play it at 0.9 speed. Proximity and stereo positioning still apply.
The filename alone does not establish a source URL or license; no license is
inferred for this supplied file.

## Active boss screech (user-selected)

`u_klymi2aebc-zombie-screech-sound-effect-312865-446996.mp3`, supplied by the
user, plays at original speed when a boss appears and for boss voice previews.
Original MP3: stereo, 44.1 kHz, about 8.124 s; no re-encoding. Ambient growls
wait until after the entrance clip. Ordinary zombies keep the previously
selected `freesound_community-zombie-6851.mp3`. No source URL or license has
been inferred from the supplied filename.

## Active shotgun recording (user-selected)

BREACHER 12 uses `dragon-studio-gunshot-372470.mp3`, supplied by the user.
The original stereo 44.1 kHz MP3 (about 3.082 s) is loaded directly and played
at its original speed. It replaces the Benelli Nova WAV in the game; other
weapons and reload sounds are unchanged. No source URL or license is inferred
from the supplied filename.

## Active pistol recording (user-selected)

M19 SIDEARM uses `freesound_community-9mm-pistol-shot-6349.mp3`, supplied by
the user. The MP3 is loaded directly without re-encoding and played at original
speed. The previous Walther PPQ WAV is no longer loaded. No source URL or
license is inferred from the supplied filename.

## Active 9mm pistol reload (user-selected)

M19 SIDEARM uses `freesound_community-9mm-pistol-load-and-chamber-98830.mp3`,
supplied by the user. The full clip plays once per reload, replacing the three
staged handling sounds for this weapon. Base reload time is 2.22 s to match
the original recording; reload upgrades shorten playback to match game timing.
Other weapons retain their staged reload sounds. No source URL or license is
inferred from the supplied filename.

## Active SMG recording (user-selected)

V9 STINGER uses `moniker_subriquet-gunshot_smg_shot_1-203471.mp3`, supplied
by the user. The original MP3 (about 0.522 s) plays once per fired round at
original speed, including automatic fire. The Carl Gustav M45 WAV is no longer
loaded. No source URL or license is inferred from the supplied filename.
