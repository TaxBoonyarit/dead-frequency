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
