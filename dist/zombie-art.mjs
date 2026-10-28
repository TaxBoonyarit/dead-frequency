// Top-down silhouettes are drawn in world units so attacks and silhouettes stay legible.
const PALETTES = {
  walker: { skin: '#929b7c', shade: '#4b5847', cloth: '#303b3b', wound: '#6c2929', eye: '#efc28c' },
  runner: { skin: '#b29b90', shade: '#65534d', cloth: '#352d33', wound: '#813d3d', eye: '#f2a080' },
  brute: { skin: '#999777', shade: '#585b43', cloth: '#3a3c31', wound: '#783f35', eye: '#f3ce82' },
  boss: { skin: '#b4a18f', shade: '#66534d', cloth: '#352b30', wound: '#8e3438', eye: '#ff7656' },
};
function oval(c,x,y,rx,ry,color) { c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill(); }
function shape(c,points,color,edge='#101612',width=1.2) {
  c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();
  c.fillStyle=color;c.fill();if(edge){c.strokeStyle=edge;c.lineWidth=width;c.stroke();}
}
function stroke(c,points,color,width=1) { c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke(); }
export function drawZombie(c, e, time = 0) {
  if (e.type === 'boss') { drawBoss(c, e, time); return; }
  const type=e.type || 'walker', boss=type==='boss', brute=type==='brute', runner=type==='runner';
  const palette=PALETTES[type] || PALETTES.walker, skin=e.hit>0?'#e8ddca':palette.skin;
  const phase=e.phase ?? time*6, limp=Math.sin(phase)*2.8, twitch=Math.sin(phase*2.3+(e.x||0))*.7;
  const size=boss?1.8:brute?1.45:1;
  c.save();c.translate(e.x,e.y);c.rotate(e.angle||0);c.scale(size,size);c.lineJoin='round';c.lineCap='round';
  // A grounded shadow, torn trousers, and uneven feet establish the shuffling silhouette.
  oval(c,-2,2,21,16,'#080b0b66');
  for(const side of [-1,1]) {
    const gait=side===1?limp:-limp*.55;
    shape(c,[[-6,side*3],[-15+gait,side*5],[-19+gait,side*9],[-11+gait,side*12],[-3,side*8]],palette.cloth);
    stroke(c,[[-12+gait,side*7],[-17+gait,side*8]],palette.skin,2);
    oval(c,-19+gait,side*9,4,2.5,'#171a18');
  }
  // Shoulders are asymmetric; runners crouch while heavy enemies have swollen backs.
  shape(c,[[-14,-6],[-7,-14], [3,-13],[10,-7],[9,8],[0,14],[-11,10],[-16,3]],palette.shade);
  shape(c,[[-12,-5],[-5,-11],[5,-9],[8,3],[1,10],[-9,7]],runner?palette.wound:palette.cloth);
  shape(c,[[-6,-7],[1,-8],[4,-2],[1,6],[-4,7],[-2,0]],palette.wound,null);
  for(let i=0;i<4;i++) stroke(c,[[-4+i*2,-5],[-1+i*1.7,-2],[0+i*1.4,2]],'#c6b79a',.9);
  stroke(c,[[-10,-7],[-8,0],[-11,7]],'#161c19',2);
  // Long crooked arms and individual fingers replace the old block-shaped hands.
  for(const side of [-1,1]) {
    const reach=runner?5:boss?3:0, wobble=side===1?limp*.7:twitch;
    shape(c,[[1,side*10],[8,side*(16+wobble)],[17+reach,side*(12+wobble)],[20+reach,side*(9+wobble)],[15+reach,side*(8+wobble)],[9,side*11],[6,side*7]],skin);
    stroke(c,[[8,side*13],[12,side*11],[16+reach,side*10]],palette.wound,2.2);
    for(let finger=0;finger<3;finger++) {
      const y=side*(8+wobble+finger*2);
      stroke(c,[[18+reach,y],[24+reach-finger,y+side],[26+reach-finger,y+side*3]],finger===1?'#d7c7a4':palette.shade,1.1);
    }
  }
  if(brute||boss) {
    for(const [x,y,r] of [[-8,-11,4],[-12,5,3.7],[0,12,3]]) {
      oval(c,x,y,r,r*.8,palette.shade);oval(c,x-1,y-1,r*.6,r*.5,skin);
      stroke(c,[[x-2,y],[x+1,y+2]],palette.wound,1.5);
    }
  }
  if(boss) {
    // Bone spikes and a split jaw make the boss recognizable even in shadow.
    for(const side of [-1,1]) for(let i=0;i<3;i++) shape(c,[[-10+i*5,side*11],[-13+i*5,side*(19-i)],[-4+i*5,side*12]],'#c9bda4');
    if(e.stage>=2) { c.shadowColor='#e45038';c.shadowBlur=12;oval(c,-2,0,3.5,5,e.stage>=3?'#f7ab62':'#b94332');c.shadowBlur=0; }
  }
  c.save();c.translate(runner?9:7,twitch);c.rotate(runner?-.12:.1*Math.sin(phase*.7));
  shape(c,[[-5,-6],[0,-9],[7,-7],[10,-2],[9,5],[3,9],[-4,6],[-7,0]],skin);
  shape(c,[[1,-7],[7,-6],[9,-2],[5,0],[1,-2]],palette.shade,null);
  // Recessed sockets, one damaged eye, an open jaw, and tiny exposed teeth.
  oval(c,5,-4,3,2.2,'#191b17');oval(c,6,4,2.6,2.1,'#191b17');
  c.shadowColor=palette.eye;c.shadowBlur=boss?7:3;
  oval(c,6,-4,1.15,.9,palette.eye);oval(c,7,4,boss?1.2:.6,.8,palette.eye);c.shadowBlur=0;
  shape(c,[[7,-1],[12,-2],[14,1],[12,5],[8,5],[9,1]],'#241516');
  for(let i=0;i<3;i++) stroke(c,[[10+i,0],[10+i,1.8]],'#c9bca3',.8);
  stroke(c,[[11,5],[8,9],[4,8]],palette.wound,2);
  stroke(c,[[-3,-5],[0,-2],[-2,2]],palette.wound,1.4);
  if(runner) stroke(c,[[12,3],[17,5],[19,3]],'#b7716b',1.5);
  c.restore();c.restore();
}

export const BOSS_PORTRAITS = [
  ['THE WARDEN', 'ผู้คุมกรงเหล็ก · หัวถูกตรึงด้วยเหล็กและโซ่', '#92998c', '#eeb47a'],
  ['RED HOUND', 'หมาล่าเนื้อ · ขากรรไกรยาวและขาหน้าเกี่ยวเหยื่อ', '#9d6259', '#ff825e'],
  ['ACID MOTHER', 'แม่เชื้อกรด · ถุงพิษโป่งและปากดูดสามแฉก', '#8d9e62', '#d1ed6b'],
  ['IRON GRAVEDIGGER', 'คนขุดหลุม · แขนเหล็กและใบมีดฝังในร่าง', '#827c71', '#e6a360'],
  ['NIGHT STALKER', 'เงาล่าเหยื่อ · แขนแมงมุมและใบหน้าไร้ดวงตา', '#77728a', '#d5b7e6'],
  ['PLAGUE HERALD', 'ผู้นำโรค · มงกุฎกาฝากและหนวดแพร่เชื้อ', '#7a927f', '#b2d7a0'],
  ['BONE COLOSSUS', 'ยักษ์กระดูก · กะโหลกหลายหัวและกรงซี่โครง', '#b4ab8e', '#f3ce84'],
  ['BLOOD REAPER', 'มัจจุราช · แขนเคียวยาวและหัวแตกสองซีก', '#a17370', '#ff6860'],
  ['THE CONTAMINATED', 'ร่างปนเปื้อน · ตาพองหลายดวงและถุงเชื้อแตก', '#82905d', '#dfeb75'],
  ['PATIENT ZERO', 'ต้นกำเนิด · ปากกลางลำตัวและหนวดกระดูก', '#a78987', '#ff775c'],
];
function skull(c,x,y,size,color,glow) {
  c.save();c.translate(x,y);c.scale(size,size);
  shape(c,[[-6,-7],[2,-9],[8,-5],[10,2],[7,7],[1,8],[-6,5],[-9,-1]],color);
  oval(c,3,-4,3,2.3,'#151515');oval(c,4,3,2.8,2,'#151515');
  oval(c,4,-4,1,.9,glow);oval(c,5,3,1,.9,glow);
  shape(c,[[6,-1],[12,0],[12,5],[6,6]],'#28191b');
  for(let i=0;i<3;i++) stroke(c,[[7+i*1.8,1],[7+i*1.8,3]],'#ded1ad',.8);
  c.restore();
}
function drawBoss(c,e,time) {
  const id=Math.max(0,Math.min(9,e.bossLook ?? 0)), [, ,baseSkin,baseEye]=BOSS_PORTRAITS[id];
  const skin=e.special?'#72b7bd':baseSkin, eye=e.special?'#9ffaff':baseEye;
  const stage=e.stage||1, phase=e.phase ?? time*4, sway=Math.sin(phase)*2;
  const flesh=e.hit>0?'#f2e0c8':skin, wound='#763033', dark='#201c20', bone='#c5baa0';
  c.save();c.translate(e.x,e.y);c.rotate(e.angle||0);c.scale(1.65,1.65);c.lineJoin='round';c.lineCap='round';
  oval(c,-3,3,id===6?29:25,24,'#08090b88');
  if(stage>=2) {c.shadowColor=eye;c.shadowBlur=12;oval(c,-1,0,6,9,stage>=3?'#f2b48a':wound);c.shadowBlur=0;}
  // Every monster has its own outline before facial details are drawn.
  const width=[17,12,23,20,12,18,25,15,23,23][id];
  shape(c,[[-23,-8],[-15,-width],[0,-width-1],[12,-9],[11,10],[-2,width],[-18,width-2],[-25,4]],dark);
  shape(c,[[-20,-6],[-11,-width+3],[3,-width+4],[9,0],[1,width-4],[-18,width-5]],flesh);
  for(const side of [-1,1]) {
    shape(c,[[-15,side*7],[-23+sway,side*12],[-29+sway,side*9],[-28,side*4]],'#3d3632');
    const long=id===1||id===4||id===7, reach=long?33:25;
    const elbow=side*(width+4+Math.sin(phase+side)*2);
    stroke(c,[[0,side*(width-3)],[12,elbow],[reach,side*13]],'#151718',9);
    stroke(c,[[0,side*(width-3)],[12,elbow],[reach,side*13]],flesh,id===6?8:5);
    stroke(c,[[9,elbow],[14,elbow-2*side]],wound,3);
    for(let finger=0;finger<3;finger++) stroke(c,[[reach,side*(12+finger*2)],[reach+7-finger,side*(10+finger*3)]],bone,1.3);
  }
  // A different core and face for each wave, rather than recoloring a shared head.
  if(id===0) {
    skull(c,9,0,1.15,flesh,eye);
    shape(c,[[0,-13],[18,-13],[21,10],[0,13]],'#383e3b');
    for(let i=0;i<4;i++) stroke(c,[[3+i*4,-12],[5+i*4,11]],'#9ba398',2);
    for(const side of [-1,1]) for(let i=0;i<4;i++){c.strokeStyle='#7e877c';c.lineWidth=1.5;c.beginPath();c.ellipse(-14+i*4,side*(19+i%2),3,2,0,0,Math.PI*2);c.stroke();}
  } else if(id===1) {
    shape(c,[[0,-9],[16,-7],[31,-3],[34,3],[22,8],[7,9]],flesh);
    shape(c,[[13,-2],[35,0],[29,7],[12,6]],'#29171b');
    for(let i=0;i<7;i++) shape(c,[[14+i*2.6,0],[16+i*2.6,0],[15+i*2.6,4]],bone,null);
    oval(c,11,-6,2,1.5,eye);stroke(c,[[25,6],[28,12],[23,13]],wound,2);
  } else if(id===2) {
    for(const [x,y,r] of [[-13,-12,8],[-17,8,9],[-2,14,7],[1,-16,6]]) {oval(c,x,y,r,r*.8,'#4b5835');oval(c,x-1,y-1,r*.7,r*.55,'#9bad64');oval(c,x+2,y,2,2,'#d6e68e');}
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;shape(c,[[13,0],[15+Math.cos(a)*13,Math.sin(a)*13],[21+Math.cos(a+.6)*9,Math.sin(a+.6)*9]],flesh);}
    oval(c,17,0,6,6,'#283222');oval(c,18,0,3,3,eye);
  } else if(id===3) {
    skull(c,10,0,1.1,'#aaa58f',eye);
    shape(c,[[4,-17],[19,-24],[35,-20],[37,-12],[14,-10]],'#68706c');stroke(c,[[19,-23],[35,-19]],'#c1c5b0',2);
    shape(c,[[-19,-10],[-5,-14],[-3,10],[-18,12]],'#4b5049');
    for(let i=0;i<3;i++)stroke(c,[[-15+i*4,-9],[-13+i*4,9]],'#a8a991',1.5);
  } else if(id===4) {
    for(const side of [-1,1]) for(let i=0;i<2;i++) stroke(c,[[-12+i*8,side*9],[-21+i*7,side*(25+i*3)],[-4+i*13,side*(33-i*2)],[14+i*9,side*22]],'#787283',2.4);
    shape(c,[[1,-8],[15,-7],[21,0],[13,9],[1,7]],'#9b93a8');
    stroke(c,[[7,-5],[11,-1],[8,5]],'#342b39',3);oval(c,17,0,2,4,'#211b28');
  } else if(id===5) {
    skull(c,12,0,1,flesh,eye);
    for(let i=0;i<7;i++){const a=i*Math.PI/3.5;stroke(c,[[-5,0],[-10+Math.cos(a)*20,Math.sin(a)*23],[-5+Math.cos(a)*29,Math.sin(a)*29]],'#a9b391',2);oval(c,-5+Math.cos(a)*29,Math.sin(a)*29,2,2,'#748361');}
    oval(c,-5,0,8,7,'#36483b');stroke(c,[[-10,0],[-4,-4],[2,2]],eye,2);
  } else if(id===6) {
    for(let i=0;i<6;i++)stroke(c,[[-18+i*4,-15],[-12+i*4,-5],[-18+i*4,13]],bone,2.6);
    skull(c,14,0,1.2,bone,eye);skull(c,-5,-18,.7,'#a99f88',eye);skull(c,-8,17,.8,'#a99f88',eye);
  } else if(id===7) {
    for(const side of [-1,1])shape(c,[[23,side*14],[37,side*9],[42,side*2],[40,side*15],[28,side*23],[18,side*22]],bone);
    skull(c,11,-3,.9,flesh,eye);stroke(c,[[9,-10],[5,-1],[13,7]],'#381c26',3);stroke(c,[[-17,-7],[-5,0],[-13,11]],wound,4);
  } else if(id===8) {
    for(const [x,y,r] of [[-15,-12,8],[-16,8,9],[-2,15,7],[0,-13,8],[12,-7,6],[14,8,7]]){oval(c,x,y,r,r*.8,'#4b5534');oval(c,x,y,r*.7,r*.6,'#b4ba74');oval(c,x+1,y,r*.35,r*.5,'#252b1d');oval(c,x+2,y,1.2,1.5,eye);}
    stroke(c,[[-13,8],[-7,4],[-2,11]],wound,2);
  } else {
    for(let i=0;i<8;i++){const a=i*Math.PI/4;stroke(c,[[-4,0],[Math.cos(a)*26,Math.sin(a)*23],[Math.cos(a+.25)*34,Math.sin(a+.25)*29]],flesh,3);}
    oval(c,-3,0,18,17,'#3a1c27');oval(c,-3,0,12,12,'#100e16');
    for(let i=0;i<12;i++){const a=i*Math.PI/6;shape(c,[[-3+Math.cos(a)*16,Math.sin(a)*15],[-3+Math.cos(a+.18)*16,Math.sin(a+.18)*15],[-3+Math.cos(a+.08)*9,Math.sin(a+.08)*8]],bone,null);}
    for(const side of [-1,1]){oval(c,14,side*10,4,4,'#453137');oval(c,15,side*10,2,2,eye);}
    if(stage>=3){c.shadowColor=eye;c.shadowBlur=12;oval(c,-3,0,5,6,'#ee795e');c.shadowBlur=0;}
  }
  if(stage>=2){stroke(c,[[-17,-7],[-7,-3],[-12,6]],eye,1.2);stroke(c,[[1,-12],[-3,-4],[2,5]],wound,2);}
  c.restore();
}
