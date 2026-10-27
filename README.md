# DEAD FREQUENCY

ประวัติการเปลี่ยนแปลง: [CHANGELOG.md](CHANGELOG.md)

เกมเอาตัวรอดจากซอมบี้มุมมองด้านบน เล่นคนเดียวในเบราว์เซอร์ รอดให้ครบ 10 ระลอกเพื่อจบภารกิจ

## เปิดเล่นในเครื่อง

ต้องมี Node.js รุ่น 20 ขึ้นไป ไม่มีแพ็กเกจที่ต้องติดตั้ง

```sh
npm run dev
```

เปิด http://127.0.0.1:4173

## เผยแพร่บน GitHub Pages

ใน GitHub repository ไปที่ Settings → Pages → Build and deployment แล้วเลือก Source เป็น **GitHub Actions** จากนั้น push เข้า `main` หรือสั่งรัน **Deploy to GitHub Pages** จากแท็บ Actions

Workflow จะตรวจ syntax และรันเทสต์ก่อนเผยแพร่เฉพาะ `dist/` พร้อมไฟล์เสียง เว็บจะอยู่ที่ https://taxboonyarit.github.io/dead-frequency/ หลัง deploy สำเร็จ

เมื่อเปิดเว็บ กด **เสียง: ปิด** ให้เปลี่ยนเป็น **เสียง: เปิด** เพื่อเปิดเสียง

## ควบคุม

- WASD / ปุ่มลูกศร: เดิน
- เมาส์: เล็ง, คลิกซ้ายค้าง / Space: ยิง
- R: รีโหลด, Shift: วิ่ง
- Esc / P: พักเกม
- มือถือ: ลากวงกลมซ้ายเพื่อเดิน กด FIRE ค้างแล้วลากเพื่อเล็งและยิงเอง กด R เพื่อรีโหลด

จบแต่ละระลอกจะได้เลือกอัปเกรด 1 อย่าง กระสุนสำรอง 36 นัด และฟื้นฟูเลือด 20 หน่วย ศัตรูมี 3 ชนิด: walker, runner และ brute เสบียงที่ตกอยู่บนพื้นจะหายไปหลัง 22 วินาที

## ร้านอาวุธ

ฆ่า walker ได้ 10 CR, runner 15 CR และ brute 30 CR เปิด ARMORY เพื่อดูปืนได้ทุกเวลา ซื้อและสลับปืนได้ระหว่างระลอกก่อนเลือกอัปเกรด

| ปืน | ราคา | จุดเด่น |
| --- | --- | --- |
| M19 Sidearm | เริ่มต้น | ปืนพก 18 นัด สมดุล |
| V9 Stinger | 220 CR | ปืนกลมือ 30 นัด ยิงรัว |
| Breacher 12 | 350 CR | ลูกซอง 6 นัด กระจาย 6 เม็ดต่อการยิง |
| Ranger R8 | 450 CR | ไรเฟิล 10 นัด ความเสียหายสูง |

ปืนใหม่มีกระสุนเต็มแมกกาซีน ใช้กระสุนสำรองร่วมกัน สลับปืนที่ซื้อแล้วได้ฟรี อัปเกรดมีผลกับทุกกระบอก เงินและปืนจะรีเซ็ตเมื่อเริ่มเล่นรอบใหม่

เลือกความยากได้ก่อนเริ่มเกม มีระบบเสียงที่เปิดได้จาก เสียง: ปิด และบันทึกคะแนนสูงสุดใน localStorage ของเบราว์เซอร์ เกมหยุดอัตโนมัติเมื่อสลับหน้าต่าง

## ตรวจสอบ

```sh
npm run check
npm test
```

`dist/` เป็นเว็บ static พร้อมเผยแพร่: `engine.mjs` ดูแล simulation, `game.mjs` วาด Canvas และเชื่อม UI, `style.css` จัดหน้าจอ ภาพทั้งหมดวาดด้วย Canvas เสียงบันทึกและเสียงสังเคราะห์เล่นผ่าน Web Audio ฟอนต์โหลดจาก Google Fonts และมีฟอนต์สำรองในเครื่อง

การตั้งค่า Sites อยู่ใน `.openai/hosting.json` ใช้ source workflow ของ Sites เพื่อ commit, push และบรรจุไฟล์ก่อนเผยแพร่

## Wave bosses

Each of the 10 waves ends with a named boss, from THE WARDEN to PATIENT ZERO. Bosses use a telegraphed ground slam, a locked-direction charge, or a targeted acid burst. Move out of the orange warning area before the attack lands. The boss health bar stays visible during combat. Boss health rises from 300 to 1,200 before difficulty scaling; kills grant 60–195 CR and an ammo pickup. Defeat the boss and remaining zombies to unlock the next upgrade/shop break; defeat the final wave to win.

## Horror audio

Click เสียง: เปิด to enable procedural wind, a slowly beating low drone, occasional distant creaks, a boss warning sting, and a double heartbeat during boss fights or below 30% health. Low health speeds up the pulse. Ambience stops while paused, in the shop/manual, or outside the active tab; เสียง: ปิด also cancels scheduled effects immediately. Audio uses Web Audio after a user gesture. Recordings ship in dist/audio/. The selected horror-trailer MP3 loops quietly at gain 0.06 with a 1.5-second fade-in.

## Combat readability update

Late bosses alternate attack patterns and enter a faster second phase below half health. PATIENT ZERO cycles all three attacks and adds a third phase below 25%; enraged acid attacks mark three impact areas. Each area is shown before damage. Shotgun damage is 18 per pellet (108 per shell), with collision-safe knockback and a short stagger on regular enemies. Bosses resist knockback. The HUD counts active and pending enemies, and a three-second warning precedes the boss spawn. Gameplay controls, weapon stats and help text use larger labels.

Ordinary zombies use the selected zombie MP3; bosses use a separate screech MP3, including a full-speed entrance cue. Procedural voices are a load-failure fallback. The nearest living enemy within 560 world units vocalizes at intervals; volume increases nearby and stereo position follows its side of the player. Muting, pausing, or hiding the tab cancels vocalizations with the other game audio.

## Eight-weapon arsenal and audio checks

Added JUDGE .44 revolver (300 CR), VANGUARD A4 assault rifle (650 CR), BASTION M60 LMG (950 CR), and LONGWATCH .50 sniper (1200 CR). They use the existing shared reserve and run-only ownership. Shop range labels explain close-range versus long-range tradeoffs.

Every weapon card has a sound preview; the shop also previews all four zombie types. Preview buttons enable sound after the click, cancel stale preview requests, and stop playback when closing the shop. Gunshots use the selected user-supplied MP3s, with the AR-15 WAV retained for VANGUARD A4. See dist/audio/CREDITS.md for file assignments and processing. Failed loads fall back to synthesis and retry on the next load request. Preview buttons wait only for the selected effect, sharing in-flight requests with background preload; stalled downloads time out after 15 seconds. Decoded peaks above 0.9 are reduced with linear gain to preserve pitch and waveform shape. Proximity and stereo positioning apply to zombie voices.

## Zombie visuals

Canvas-drawn zombie silhouettes now have crooked limbs, torn clothes, exposed ribs, recessed eye sockets and broken jaws. Runners crouch with longer reaching arms, brutes have swollen shoulders, and bosses have bone spines plus an enraged glow. Gait follows each enemy's movement phase. คู่มือ includes a scaled reference view of all four silhouettes. Rendering is separate from enemy collision and combat stats.

Each boss now carries a stable bossLook index from its wave definition, selecting one of ten separate horror silhouettes: iron cage, hound jaw, acid sacs, steel cleaver, spider limbs, parasite crown, multiple skulls, twin scythes, clustered eyes, or a toothed torso maw. Enraged stages add glowing fissures, with a distinct core on PATIENT ZERO phase three. คู่มือ includes an expandable dossier for all ten wave bosses.

## Wave environments

Each new run shuffles all ten scenes without repeats; the order stays fixed during that run, including pause/resume. Every wave selects the next scene: quarantine block, red alley, abandoned hospital, ironworks, Blackwood, drowned docks, bone yard, slaughterhouse, biohazard lab, and Zero Ground. Scenes change ground and building materials, roof props, lighting, signage, and rain/mist/spores/embers. The scene is repainted only at wave changes; each wave also randomizes building positions and sizes, vehicles and barricades. The same per-run geometry drives rendering, collision, bullets and enemy navigation. Cover leaves 64 px gaps and a clear perimeter, and avoids the survivor’s current position. คู่มือ has a preview of all ten scenes.

Reloads now use CC0 handling recordings by BMacZero: extraction, insertion and chamber handling follow reload progress, so pausing freezes the sequence and reload-speed upgrades adjust its timing. Each weapon card includes a reload preview. Ammo pickups also play an insertion sound.

After the final enemy dies, the arena stays active for three seconds with AREA SECURED. Players can move, collect supplies and reload before the upgrade/result screen; holding fire does not waste ammunition during this interval. Pausing freezes the delay.

## Interface refinements

The armory prioritizes purchase/equip actions, groups audio previews as secondary controls, and keeps balance and return navigation visible while scrolling. Filters show all, affordable unowned, or owned weapons, with a clear empty state. Zombie previews are collapsible. Active runs collapse the introduction to give the game more screen space, use larger touch targets, and display credits on the shop shortcut. Keyboard Space/Enter retain native button activation; toggling sound returns focus to the game. Health uses a labeled progressbar with current/max values.

## Matched firearm recordings

Seven weapons now use user-selected MP3 recordings; VANGUARD A4 retains the CC0 AR-15 WAV. Shop previews identify the selected source. MP3s keep their original playback speed; the M249 source assigned to BASTION M60 uses the selected 0.5-second cut and tail fade. M19 uses its own full 9mm reload recording with a 2.22-second base reload time. See dist/audio/CREDITS.md for current mappings; recording-manifest.json describes the legacy WAV preparation only.

## Survivor selection

Before starting, choose a female Scout (80 HP, speed 225) or male Guard
(120 HP, speed 175). Movement and sprint use the selected speed; health
pickups and upgrades respect that character's maximum HP. The choice stays
selected through retries and difficulty changes and can be changed in the menu.

## Versioning

`package.json` is the version source. Run `npm run version:patch` to advance
1.0.0 → 1.0.1 → 1.0.2 for each prepared release. This runs checks and tests,
then npm updates the package version and synchronizes the label in the game.
It does not commit, create a Git tag, push or deploy. `npm run version:sync`
refreshes the label without incrementing. `npm run check` rejects a stale label;
`npm run dev` synchronizes it before starting. Reloading the page does not bump
the version.

To prepare a release, run `npm run version:patch` first, then add the new
version's player-facing notes at the top of `dist/changelog.mjs` and run
`npm test`. Tests fail until the newest notes match `package.json`, so CI does
not deploy a version without release notes.

Runtime audio names match their purpose: `weapon-m19-sidearm.mp3`,
`weapon-v9-stinger.mp3`, `weapon-breacher-12.mp3`, `weapon-ranger-r8.mp3`,
`weapon-judge-44.mp3`, `weapon-vanguard-a4.wav`, `weapon-bastion-m60.mp3`,
`weapon-longwatch-50.mp3`, `reload-m19-sidearm.mp3`, `zombie-growl.mp3`,
`boss-screech.mp3`, `ambience-horror.mp3`. Original source filenames are mapped
in `dist/audio/CREDITS.md`; unused source clips are kept in `audio-source/`
and are not served or deployed.

## Ammo and accuracy balance

Start with 18 rounds loaded and 54 spare. Ammo boxes add 12 rounds, capped at
120 spare; boxes stay on the ground when the reserve is full. Each wave break
supplies 18 rounds and fills the magazine from that reserve rather than granting
a second free magazine. New weapon purchases still include their first magazine.

Standing shots have the tightest spread. Movement, sprinting and continuous fire
widen the cone, which recovers when firing stops. Precision rifles retain tighter
spread than SMGs/LMGs; shotgun pellets retain their fixed fan. The reticle expands
with the current spread at the aim distance. Short bursts conserve ammunition
and restore accuracy.

## Touchscreen controls

Touch-only devices enable on-screen controls automatically. Computers with a mouse, including touchscreen laptops, default to mouse and keyboard controls. Touching the interface enables touch mode; clicking the arena with a mouse switches back and fires in the same click. The “สัมผัส” toolbar button toggles them on any
device. Drag the left stick to move; hold and drag FIRE to aim and shoot in that direction,
hold RUN to sprint, and tap R to reload. Each held action tracks its own finger,
so walking and firing work together. Releasing or cancelling that finger stops
only its action; pausing, switching modes or leaving the app resets all controls.
Buttons have at least 48px targets and the layout supports portrait and landscape.

Touch FIRE uses the initial finger position as its aiming center, so the thumb
can slide outside the button while pointer capture keeps control. A 24px start zone ignores small finger movements before firing begins. Returning within 16px of the initial touch stops firing and clears the direction. No automatic target locking is used. A direction arrow and spread cone
show the shot direction. Lifting the firing finger, cancelling touch, pausing
or switching control mode clears the manual aim and stops firing.

The mobile reticle uses a cyan segmented sight, center dot and subtle dashed
line instead of the large arrow. Its spread ring reflects current accuracy,
changes to amber while reloading, stays within the visible screen and remains
faintly visible between shots. FIRE has a matching movable sight thumb and a
Thai “ลากยิง” label. This is a visual aiming aid; it does not lock onto enemies.

On phones the active arena spans the full screen width, with a compact header
and no sidebar/footer below the match. Portrait framing fills the available screen and shows at least 620 world units horizontally. The scene scales uniformly and centers vertically, so controls have space without stretching sprites. Joystick,
action buttons and HUD panels use softer translucent colors; text and aim markers
retain contrast. Desktop layout and landscape controls keep their existing layout.

## Mission setup and safe exit

Character and difficulty choices now appear together before the start button.
The setup menu uses normal page scrolling and keeps the start controls visible
on a 390×844 screen. Touch mode shows a drag-to-aim illustration before the first
mission in each page session; enemies start only after the player confirms they
are ready. Cancelling the lesson preserves the selected character and difficulty.
Wave breaks focus their named status region for keyboard access and explicitly
label upgrades as starting the next wave immediately. Leaving an unfinished run
asks for confirmation, with staying in the mission as the default action; finished
runs return directly to setup. Escape dismisses either dialog without starting or
resetting a run.

## Phone fullscreen

The fullscreen button expands the entire game panel, keeping its toolbar and exit
button available. Browsers that reject or lack the Fullscreen API use a fixed panel
that fills the available web viewport. Tap the same button or press Escape to exit
that fallback. It follows dynamic viewport height and allows for display safe areas;
the fallback cannot hide browser chrome controlled by the phone browser.

## Keep the phone screen awake

Tap **กันจอดับ** in the game toolbar to prevent the screen from sleeping while
this page is visible. A checkmark means the system granted the screen wake lock;
“รอ” means the system released it. Returning to the page requests it again while
the toggle remains on. Tap again to turn it off. Unsupported browsers disable the
button; requests may fail on insecure connections or under system power policies.

## Interface typography

Thai and English interface text share Noto Sans Thai. Buttons, body copy and
secondary labels use consistent size and weight rules; headings retain a size
hierarchy. Numeric HUD values use tabular digits for stable alignment.

## Release notes

Tap the version badge in the header to read what changed in each version. Each
release shows its date and changes labelled ใหม่ (new), ปรับ (improved) or แก้
(fixed); the newest release is expanded and older ones are collapsed. Opening the
notes during a mission pauses it and closing them resumes. A dot on the badge
marks a version this browser has not viewed; the last viewed version is stored in
`localStorage` and the notes still open when site data is blocked.

## Melee weapons

Every run starts with a free field knife alongside the pistol. Press physical F
or tap ตี to attack along the current aim. Swings have windup and recovery,
cancel reloads and block shooting/reloading until recovery finishes. They use
no ammunition or stamina. Walls block hits; each target is hit once per swing.
The knife hits only the nearest target. Bosses resist push and never stagger.

The armory has firearm and melee categories with shared ownership/affordability
filters. Buy and equip melee only between waves: crowbar (200 CR), baseball bat
(300), fire axe (450), sledgehammer (650), katana (800). One melee weapon is
equipped alongside the gun; ownership resets on a new run. Firearm upgrades do
not affect melee stats.
