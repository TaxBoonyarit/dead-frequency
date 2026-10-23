export const SCENES = [
  { name:'QUARANTINE BLOCK', th:'เขตกักกัน', ground:'#282e24', road:'#30372c', roof:'#434b38', accent:'#c9bb53', kind:'quarantine', weather:'ash' },
  { name:'RED ALLEY', th:'ตรอกโลหิต', ground:'#352025', road:'#402b30', roof:'#60383b', accent:'#ea6957', kind:'alley', weather:'rain' },
  { name:'ST. MERCY HOSPITAL', th:'โรงพยาบาลร้าง', ground:'#263537', road:'#3b4b4c', roof:'#586b69', accent:'#99dbce', kind:'hospital', weather:'mist' },
  { name:'IRONWORKS', th:'โรงถลุงเหล็ก', ground:'#302720', road:'#42382d', roof:'#62513c', accent:'#f1a64d', kind:'factory', weather:'embers' },
  { name:'BLACKWOOD', th:'ป่าต้องห้าม', ground:'#1b2c28', road:'#293a30', roof:'#344c3c', accent:'#9ac3a0', kind:'forest', weather:'mist' },
  { name:'DROWNED DOCKS', th:'ท่าเรือจม', ground:'#1f303c', road:'#304454', roof:'#3c5868', accent:'#88c1e8', kind:'docks', weather:'rain' },
  { name:'BONE YARD', th:'สุสานกระดูก', ground:'#33312e', road:'#454038', roof:'#686354', accent:'#d7c695', kind:'graveyard', weather:'mist' },
  { name:'THE SLAUGHTERHOUSE', th:'โรงเชือด', ground:'#35252c', road:'#46353b', roof:'#634650', accent:'#e98079', kind:'slaughter', weather:'ash' },
  { name:'BIOHAZARD LAB', th:'ห้องทดลองเชื้อ', ground:'#273326', road:'#39452d', roof:'#53613e', accent:'#c8e976', kind:'lab', weather:'spores' },
  { name:'ZERO GROUND', th:'รังต้นกำเนิด', ground:'#2b2035', road:'#3d2e47', roof:'#5a3e5b', accent:'#ee9a8d', kind:'nest', weather:'embers' },
];
export function sceneForWave(wave) { return SCENES[Math.max(0, Math.min(9, Math.floor(wave || 1)-1))]; }
function line(c,x,y,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
export function sceneFloor(c,s,w,h){
  c.save();
  if(['hospital','slaughter','lab'].includes(s.kind)) {
    for(let x=0;x<w;x+=42)for(let y=0;y<h;y+=42){c.fillStyle=(x+y)%84===0?'#c4d7ce10':'#0b161614';c.fillRect(x,y,40,40);}
  }
  if(s.kind==='docks') {
    for(let x=0;x<w;x+=30)line(c,x,0,x,h,'#bcbdad16',2);
    for(let i=0;i<12;i++){c.fillStyle='#729bc126';c.beginPath();c.ellipse((i*237)%w,(i*163)%h,45+i%4*12,12,0,0,Math.PI*2);c.fill();}
  }
  if(s.kind==='forest'||s.kind==='graveyard')for(let i=0;i<90;i++){
    const x=(i*239)%w,y=(i*173)%h;
    line(c,x,y,x+8,y-5,s.kind==='forest'?'#8aab5a35':'#b1a08428',2);
    if(s.kind==='forest'){line(c,x+2,y,x+3,y-9,'#5d794044',2);}
  }
  if(s.kind==='factory'||s.kind==='quarantine')for(let i=0;i<15;i++){c.fillStyle=i%2?'#c9a45b28':'#0b121428';c.fillRect(575+i*9,470,7,26);}
  if(s.kind==='alley'){for(let i=0;i<15;i++){c.fillStyle='#cd655722';c.fillRect(400+(i*67)%450,80+(i*93)%620,23,5);}}
  if(s.kind==='nest') {
    c.translate(w/2,h/2); c.strokeStyle='#e49e8766';c.lineWidth=3;
    for(const radius of [105,155,200]){c.beginPath();c.ellipse(0,0,radius,radius,0,0,Math.PI*2);c.stroke();}
    for(let i=0;i<8;i++){const a=i*Math.PI/4;line(c,Math.cos(a)*105,Math.sin(a)*105,Math.cos(a+.3)*190,Math.sin(a+.3)*190,'#b9787444',3);}
  }
  c.restore();
}
export function sceneStructures(c,s,obstacles){
  c.save();
  for(const o of obstacles.filter(o=>o.kind==='building')){
    const x=o.x+o.w/2,y=o.y+o.h/2;
    if(s.kind==='hospital') {
      c.fillStyle='#d7d6bd';c.fillRect(x-25,y-25,50,50);c.fillStyle='#a14e48';c.fillRect(x-6,y-17,12,34);c.fillRect(x-17,y-6,34,12);
    } else if(s.kind==='forest') {
      c.fillStyle='#14271d';c.fillRect(o.x+5,o.y+5,o.w-10,o.h-10);
      for(let i=0;i<9;i++){const tx=o.x+25+(i%3)*(o.w-50)/2,ty=o.y+25+Math.floor(i/3)*(o.h-50)/2;c.fillStyle='#1d3a29';c.beginPath();c.ellipse(tx,ty,31,26,0,0,Math.PI*2);c.fill();c.fillStyle='#36543a';c.beginPath();c.ellipse(tx-5,ty-6,20,16,0,0,Math.PI*2);c.fill();}
    } else if(s.kind==='graveyard') {
      c.fillStyle='#383830';c.fillRect(o.x+8,o.y+8,o.w-16,o.h-16);
      for(let i=0;i<8;i++){const tx=o.x+30+(i%4)*(o.w-60)/3,ty=o.y+25+Math.floor(i/4)*(o.h-65);c.fillStyle='#8a8977';c.fillRect(tx-8,ty,16,27);line(c,tx-4,ty+10,tx+4,ty+10,'#44463b',2);line(c,tx,ty+5,tx,ty+16,'#44463b',2);}
    } else if(s.kind==='factory') {
      for(let i=0;i<3;i++){line(c,o.x+20,o.y+35+i*38,o.x+o.w-20,o.y+35+i*38,'#252827',16);line(c,o.x+20,o.y+31+i*38,o.x+o.w-20,o.y+31+i*38,'#8c7860',5);}
    } else if(s.kind==='docks') {
      c.fillStyle='#365363';c.fillRect(o.x+6,o.y+6,o.w-12,o.h-12);
      for(let i=0;i<4;i++){c.fillStyle=i%2?'#70554a':'#516b70';c.fillRect(o.x+16+i*(o.w-30)/4,o.y+20,(o.w-60)/4,o.h-40);}
    } else if(s.kind==='slaughter') {
      for(let i=0;i<4;i++){line(c,o.x+24+i*50,o.y+20,o.x+24+i*50,o.y+o.h-20,'#aa8f8c55',3);c.fillStyle='#763b42';c.fillRect(o.x+15+i*50,o.y+40,18,50);}
    } else if(s.kind==='lab') {
      for(let i=0;i<4;i++){const tx=o.x+30+i*(o.w-60)/3;c.fillStyle='#152b28';c.fillRect(tx-13,o.y+30,26,o.h-60);c.fillStyle='#b5d97866';c.fillRect(tx-8,o.y+38,16,o.h-76);}
    } else if(s.kind==='nest') {
      c.fillStyle='#433044';c.fillRect(o.x+5,o.y+5,o.w-10,o.h-10);
      for(let i=0;i<7;i++){const tx=o.x+25+(i*39)%(o.w-50),ty=o.y+25+(i*47)%(o.h-50);c.fillStyle='#835354';c.beginPath();c.ellipse(tx,ty,20,15,i,0,Math.PI*2);c.fill();line(c,tx-10,ty,tx+10,ty,'#c18c7844',3);}
    } else if(s.kind==='alley') {c.fillStyle='#b5655e';c.font='bold 22px monospace';c.fillText('NO EXIT',o.x+25,o.y+o.h/2);}
  }
  c.restore();
}
export function sceneWeather(c,s,now,w,h){
  c.save();
  for(let i=0;i<35;i++){
    const x=(i*113.7+now*.009)%w,y=(i*71.3+now*(s.weather==='rain'?.4:.012))%h;
    if(s.weather==='rain')line(c,x,y,x-5,y+18,'#c2d4dc35',1);
    else if(s.weather==='mist'){c.fillStyle='#c5d8cf06';c.beginPath();c.ellipse(x,y,90,25,0,0,Math.PI*2);c.fill();}
    else {c.fillStyle=s.weather==='embers'?'#efb08766':s.weather==='spores'?'#c3e18055':'#bcc89c33';c.beginPath();c.arc(x,y,i%3===0?1.8:.8,0,Math.PI*2);c.fill();}
  }
  c.restore();
}
