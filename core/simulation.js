// Boids Core: standalone flock dynamics. No organism or laboratory imports.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createWorld(width,height,count=500,seed=7){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const agents=Array.from({length:count},(_,i)=>{const a=random()*Math.PI*2,s=.65+random()*.7;return{id:i,x:random()*width,y:random()*height,vx:Math.cos(a)*s,vy:Math.sin(a)*s,energy:.55+random()*.4,age:0,traits:{speed:.8+random()*.4,perception:.8+random()*.4,metabolism:.8+random()*.4,fertility:.8+random()*.4,hue:165+random()*65}}});
 return{width,height,agents,seed,state,tick:0,nextId:count,births:0,deaths:0};
}
export function resizeWorld(world,width,height){const sx=width/world.width,sy=height/world.height;world.width=width;world.height=height;for(const a of world.agents){a.x*=sx;a.y*=sy}}
export function stepWorld(world,dt=1,settings={}){
 const {width,height,agents}=world,cell=80,cols=Math.max(1,Math.ceil(width/cell)),grid=new Map();
 for(const a of agents){const k=Math.floor(a.x/cell)+","+Math.floor(a.y/cell);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(a)}
 const next=[],dead=[];const p=settings.perception??68,sep=settings.separation??24;
 for(const a of agents){
  const cx=Math.floor(a.x/cell),cy=Math.floor(a.y/cell);let ax=0,ay=0,px=0,py=0,sx=0,sy=0,n=0,sn=0;
  for(let gy=cy-1;gy<=cy+1;gy++)for(let gx=cx-1;gx<=cx+1;gx++)for(const b of(grid.get(((gx%cols)+cols)%cols+","+((gy%Math.ceil(height/cell))+Math.ceil(height/cell))%Math.ceil(height/cell))||[])){
   if(a===b)continue;let dx=b.x-a.x,dy=b.y-a.y;if(dx>width/2)dx-=width;if(dx< -width/2)dx+=width;if(dy>height/2)dy-=height;if(dy< -height/2)dy+=height;const d2=dx*dx+dy*dy;if(d2>p*p)continue;
   ax+=b.vx;ay+=b.vy;px+=dx;py+=dy;n++;if(d2<sep*sep){sx-=dx/(d2+8);sy-=dy/(d2+8);sn++}
  }
  let vx=a.vx,vy=a.vy;if(n){vx+=(ax/n-vx)*.035+(px/n)*.0018;vy+=(ay/n-vy)*.035+(py/n)*.0018}if(sn){vx+=sx*.035;vy+=sy*.035}
  const max=1.65*(a.traits.speed||1),mag=Math.hypot(vx,vy)||1;vx=vx/mag*max;vy=vy/mag*max;
  const energy=a.energy-.00065*(a.traits.metabolism||1)*dt;
  if(energy<=0||a.age>22000){world.deaths++;dead.push(a.id);continue}
  next.push({...a,x:(a.x+vx*dt+width)%width,y:(a.y+vy*dt+height)%height,vx,vy,energy,age:a.age+dt});
 }
 world.agents=next;world.tick+=dt;
 if(settings.reproduction!==false&&world.agents.length<1200&&world.tick%90<dt){const parents=world.agents.filter(a=>a.energy>.82);for(const parent of parents.slice(0,Math.min(3,parents.length))){parent.energy-=.22;const angle=Math.random()*Math.PI*2;world.agents.push({...parent,id:world.nextId++,x:parent.x+Math.cos(angle)*8,y:parent.y+Math.sin(angle)*8,vx:parent.vx+Math.cos(angle)*.2,vy:parent.vy+Math.sin(angle)*.2,energy:.3,age:0,traits:{...parent.traits}});world.births++}}
 return{births:world.births,deaths:world.deaths,population:world.agents.length};
}
export function snapshotWorld(world){return JSON.parse(JSON.stringify(world))}
