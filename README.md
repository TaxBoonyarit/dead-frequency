# DEAD FREQUENCY

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

เมื่อเปิดเว็บ กด **SOUND OFF** ให้เปลี่ยนเป็น **SOUND ON** เพื่อเปิดเสียง

## ควบคุม

- WASD / ปุ่มลูกศร: เดิน
- เมาส์: เล็ง, คลิกซ้ายค้าง / Space: ยิง
- R: รีโหลด, Shift: วิ่ง
- Esc / P: พักเกม
- มือถือ: ลากวงกลมซ้ายเพื่อเดิน กด FIRE ค้างเพื่อเล็งศัตรูที่มองเห็นและยิงอัตโนมัติ กด R เพื่อรีโหลด

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

เลือกความยากได้ก่อนเริ่มเกม มีระบบเสียงที่เปิดได้จาก SOUND OFF และบันทึกคะแนนสูงสุดใน localStorage ของเบราว์เซอร์ เกมหยุดอัตโนมัติเมื่อสลับหน้าต่าง

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

Click SOUND ON to enable procedural wind, a slowly beating low drone, occasional distant creaks, a boss warning sting, and a double heartbeat during boss fights or below 30% health. Low health speeds up the pulse. Ambience stops while paused, in the shop/manual, or outside the active tab; SOUND OFF also cancels scheduled effects immediately. Audio uses Web Audio after a user gesture. Recordings ship in dist/audio/. The selected horror-trailer MP3 loops quietly at gain 0.06 with a 1.5-second fade-in.

## Combat readability update

Late bosses alternate attack patterns and enter a faster second phase below half health. PATIENT ZERO cycles all three attacks and adds a third phase below 25%; enraged acid attacks mark three impact areas. Each area is shown before damage. Shotgun damage is 18 per pellet (108 per shell), with collision-safe knockback and a short stagger on regular enemies. Bosses resist knockback. The HUD counts active and pending enemies, and a three-second warning precedes the boss spawn. Gameplay controls, weapon stats and help text use larger labels.

Ordinary zombies use the selected zombie MP3; bosses use a separate screech MP3, including a full-speed entrance cue. Procedural voices are a load-failure fallback. The nearest living enemy within 560 world units vocalizes at intervals; volume increases nearby and stereo position follows its side of the player. Muting, pausing, or hiding the tab cancels vocalizations with the other game audio.

## Eight-weapon arsenal and audio checks

Added JUDGE .44 revolver (300 CR), VANGUARD A4 assault rifle (650 CR), BASTION M60 LMG (950 CR), and LONGWATCH .50 sniper (1200 CR). They use the existing shared reserve and run-only ownership. Shop range labels explain close-range versus long-range tradeoffs.

Every weapon card has a sound preview; the shop also previews all four zombie types. Preview buttons enable sound after the click, cancel stale preview requests, and stop playback when closing the shop. Gunshots use the selected user-supplied MP3s, with the AR-15 WAV retained for VANGUARD A4. See dist/audio/CREDITS.md for file assignments and processing. Failed loads fall back to synthesis and retry on the next load request. Preview buttons wait only for the selected effect, sharing in-flight requests with background preload; stalled downloads time out after 15 seconds. Decoded peaks above 0.9 are reduced with linear gain to preserve pitch and waveform shape. Proximity and stereo positioning apply to zombie voices.

## Zombie visuals

Canvas-drawn zombie silhouettes now have crooked limbs, torn clothes, exposed ribs, recessed eye sockets and broken jaws. Runners crouch with longer reaching arms, brutes have swollen shoulders, and bosses have bone spines plus an enraged glow. Gait follows each enemy's movement phase. FIELD MANUAL includes a scaled reference view of all four silhouettes. Rendering is separate from enemy collision and combat stats.

Each boss now carries a stable bossLook index from its wave definition, selecting one of ten separate horror silhouettes: iron cage, hound jaw, acid sacs, steel cleaver, spider limbs, parasite crown, multiple skulls, twin scythes, clustered eyes, or a toothed torso maw. Enraged stages add glowing fissures, with a distinct core on PATIENT ZERO phase three. FIELD MANUAL includes an expandable dossier for all ten wave bosses.

## Wave environments

Each new run shuffles all ten scenes without repeats; the order stays fixed during that run, including pause/resume. Every wave selects the next scene: quarantine block, red alley, abandoned hospital, ironworks, Blackwood, drowned docks, bone yard, slaughterhouse, biohazard lab, and Zero Ground. Scenes change ground and building materials, roof props, lighting, signage, and rain/mist/spores/embers. The scene is repainted only at wave changes; each wave also randomizes building positions and sizes, vehicles and barricades. The same per-run geometry drives rendering, collision, bullets and enemy navigation. Cover leaves 64 px gaps and a clear perimeter, and avoids the survivor’s current position. FIELD MANUAL has a preview of all ten scenes.

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

Runtime audio names match their purpose: `weapon-m19-sidearm.mp3`,
`weapon-v9-stinger.mp3`, `weapon-breacher-12.mp3`, `weapon-ranger-r8.mp3`,
`weapon-judge-44.mp3`, `weapon-vanguard-a4.wav`, `weapon-bastion-m60.mp3`,
`weapon-longwatch-50.mp3`, `reload-m19-sidearm.mp3`, `zombie-growl.mp3`,
`boss-screech.mp3`, `ambience-horror.mp3`. Original source filenames are mapped
in `dist/audio/CREDITS.md`; unused source clips are kept in `audio-source/`
and are not served or deployed.
