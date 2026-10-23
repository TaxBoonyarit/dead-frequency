# DEAD FREQUENCY

เกมเอาตัวรอดจากซอมบี้มุมมองด้านบน เล่นคนเดียวในเบราว์เซอร์ รอดให้ครบ 10 ระลอกเพื่อจบภารกิจ

## เปิดเล่นในเครื่อง

ต้องมี Node.js รุ่น 20 ขึ้นไป ไม่มีแพ็กเกจที่ต้องติดตั้ง

```sh
npm run dev
```

เปิด http://127.0.0.1:4173

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
| V9 Stinger | 90 CR | ปืนกลมือ 30 นัด ยิงรัว |
| Breacher 12 | 140 CR | ลูกซอง 6 นัด กระจาย 6 เม็ดต่อการยิง |
| Ranger R8 | 180 CR | ไรเฟิล 10 นัด ความเสียหายสูง |

ปืนใหม่มีกระสุนเต็มแมกกาซีน ใช้กระสุนสำรองร่วมกัน สลับปืนที่ซื้อแล้วได้ฟรี อัปเกรดมีผลกับทุกกระบอก เงินและปืนจะรีเซ็ตเมื่อเริ่มเล่นรอบใหม่

เลือกความยากได้ก่อนเริ่มเกม มีระบบเสียงที่เปิดได้จาก SOUND OFF และบันทึกคะแนนสูงสุดใน localStorage ของเบราว์เซอร์ เกมหยุดอัตโนมัติเมื่อสลับหน้าต่าง

## ตรวจสอบ

```sh
npm run check
npm test
```

`dist/` เป็นเว็บ static พร้อมเผยแพร่: `engine.mjs` ดูแล simulation, `game.mjs` วาด Canvas และเชื่อม UI, `style.css` จัดหน้าจอ ภาพทั้งหมดวาดด้วย Canvas เสียงสังเคราะห์ด้วย Web Audio ฟอนต์โหลดจาก Google Fonts และมีฟอนต์สำรองในเครื่อง

การตั้งค่า Sites อยู่ใน `.openai/hosting.json` ใช้ source workflow ของ Sites เพื่อ commit, push และบรรจุไฟล์ก่อนเผยแพร่

## Wave bosses

Each of the 10 waves ends with a named boss, from THE WARDEN to PATIENT ZERO. Bosses use a telegraphed ground slam, a locked-direction charge, or a targeted acid burst. Move out of the orange warning area before the attack lands. The boss health bar stays visible during combat. Boss health rises from 300 to 1,200 before difficulty scaling; kills grant 60–195 CR and an ammo pickup. Defeat the boss and remaining zombies to unlock the next upgrade/shop break; defeat the final wave to win.

## Horror audio

Click SOUND ON to enable procedural wind, a slowly beating low drone, occasional distant creaks, a boss warning sting, and a double heartbeat during boss fights or below 30% health. Low health speeds up the pulse. Ambience stops while paused, in the shop/manual, or outside the active tab; SOUND OFF also cancels scheduled effects immediately. Audio uses Web Audio after a user gesture and needs no external audio files.

## Combat readability update

Late bosses alternate attack patterns and enter a faster second phase below half health. PATIENT ZERO cycles all three attacks and adds a third phase below 25%; enraged acid attacks mark three impact areas. Each area is shown before damage. Shotgun damage is 18 per pellet (108 per shell), with collision-safe knockback and a short stagger on regular enemies. Bosses resist knockback. The HUD counts active and pending enemies, and a three-second warning precedes the boss spawn. Gameplay controls, weapon stats and help text use larger labels.

Zombie vocalizations are synthesized locally: walkers groan, runners snarl briefly, and brutes/bosses use deeper growls. The nearest living enemy within 560 world units vocalizes at intervals; volume increases nearby and stereo position follows its side of the player. Muting, pausing, or hiding the tab cancels vocalizations with the other game audio.

## Eight-weapon arsenal and audio checks

Added JUDGE .44 revolver (120 CR), VANGUARD A4 assault rifle (240 CR), BASTION M60 LMG (320 CR), and LONGWATCH .50 sniper (380 CR). They use the existing shared reserve and run-only ownership. Shop range labels explain close-range versus long-range tradeoffs.

Every weapon card has a sound preview; the shop also previews all four zombie types. Preview buttons enable sound after the click, cancel stale preview requests, and stop playback when closing the shop. Gunshots use four edited CC0 live-fire recordings by Tabasco (pistol, shotgun, rifle, SKS), with per-weapon pitch/level variations. See dist/audio/CREDITS.md for source and processing. Failed sample loads fall back to synthesis and can retry. Zombie voices remain procedural, with proximity and stereo positioning.

## Zombie visuals

Canvas-drawn zombie silhouettes now have crooked limbs, torn clothes, exposed ribs, recessed eye sockets and broken jaws. Runners crouch with longer reaching arms, brutes have swollen shoulders, and bosses have bone spines plus an enraged glow. Gait follows each enemy's movement phase. FIELD MANUAL includes a scaled reference view of all four silhouettes. Rendering is separate from enemy collision and combat stats.
