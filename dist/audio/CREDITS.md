# Matched gunshot recordings

The Free Firearm Sound Library by Ben Jaszczak, Brian Nelson, Kevin Heras, and Matthew Nanney. CC0 public-domain dedication.
Source and license: https://opengameart.org/content/the-free-firearm-sound-library
Archive: https://opengameart.org/sites/default/files/Prepared%20SFX%20Library.7z

| Game weapon | Recording source | Archive file |
|---|---|---|
| M19 SIDEARM | Walther PPQ, 9mm pistol | Walther PPQ/X_39P.wav |
| V9 STINGER | Carl Gustav M45, 9mm SMG | Carl Gustav M45/G_31P.wav |
| BREACHER 12 | Benelli Nova, 12 gauge pump shotgun | Nova/O_21P.wav |
| RANGER R8 | Norinco SKS, semi-automatic rifle | SKS/U_14P.wav |
| JUDGE .44 | Smith & Wesson 642, .38 revolver | Smith & Wesson 642/V_27P.wav |
| VANGUARD A4 | AR-15 / M4, 5.56 carbine | AR-15/D_32P.wav |
| BASTION M60 | AK-47, 7.62 automatic rifle | AK-47/C_28P.wav |
| LONGWATCH .50 | Tikka T3, .30-06 bolt-action rifle | Tikka/W_29P.wav |

These are sound-design matches for fictional game weapons, not recordings of their displayed model or caliber. The LMG uses a heavier automatic-rifle report; it is not an M60 recording.
Processing: choose one near-field shot, trim pre-shot silence, mono 24 kHz PCM16, normalize peak to 0.78, fade the tail. The SMG has a shorter tail to avoid clutter during rapid fire. LMG playback rate is 0.96; other weapons preserve recorded pitch, with ±1.5% per-shot variation. All eight weapons have separate source recordings.
Rebuild: python3 scripts/prepare-matched-audio.py /path/to/Prepared\ SFX\ Library
See recording-manifest.json for selected offsets and duration.

# Reload handling recordings

Gun Reload Sound Effects by BMacZero / Brian MacIntosh, CC0.
https://opengameart.org/content/gun-reload-sound-effects
Original files: clipload2.wav, clipload1.wav, singlebullet1.wav.
Stored as reload-out.wav, reload-in.wav, reload-bolt.wav. Playback pitch and timing vary by weapon.

## Recorded zombie voices

ArcadeParty — Zombie / Skeleton / Monster Voice Effects (CC0).
https://opengameart.org/content/zombie-skeleton-monster-voice-effects

`zombie-1.wav` through `zombie-8.wav` derive from `zombieYell1.wav` through
`zombieYell8.wav` respectively. Trimmed quiet edges, normalized with headroom,
converted to mono PCM16 at 24 kHz; slight fades prevent edge clicks.
Walker uses 1/2, runner 3/4, brute 5/6, boss 7/8. Each type alternates takes;
brute/boss playback is slowed modestly. Procedural growls remain a load-failure fallback.
Rebuild: `python3 scripts/prepare-zombie-audio.py <extracted-pack-directory>`.

Gun recordings additionally use gentle amplitude compression (power 0.8)
to lift the body and decay, preserving peak headroom and original playback pitch.
