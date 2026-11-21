// Boids Core: deterministic flock dynamics. No organism or laboratory imports.
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function randomWorld(world){world.state=(Math.imul(world.state,1664525)+1013904223)>>>0;return world.state/4294967296}
export function createWorld(width,height,count=500,seed=7){
 const world={width,height,agents:[],seed:seed>>>0,state:seed>>>0,tick:0,nextId:count,births:0,deaths:0};
 for(let i=0;i<count;i++){const a=randomWorld(world)*Math.PI*2,s=.65+randomWorld(world)*.7;world.agents.push({id:i,x:randomWorld(world)*width,y:randomWorld(world)*height,vx:Math.cos(a)*s,vy:Math.sin(a)*s,energy:.65+randomWorld(world)*.35,age:0,traits:{speed:.8+randomWorld(world)*.4,perception:.8+randomWorld(world)*.4,metabolism:.8+randomWorld(world)*.4,fertility:.8+randomWorld(world)*.4,hue:155+randomWorld(world)*85}})}
 return world;
}
export function resizeWorld(world,width,height){const sx=width/world.width,sy=height/world.height;world.width=width;world.height=height;for(const a of world.agents){a.x*=sx;a.y*=sy}}
export function stepWorld(world,dt=1,settings={}){
 const {width,height,agents}=world,cell=80,cols=Math.max(1,Math.ceil(width/cell)),rows=Math.max(1,Math.ceil(height/cell)),grid=new Map();
 for(const a of agents){const k=Math.floor(a.x/cell)+","+Math.floor(a.y/cell);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(a)}
 const next=[],p=settings.perception??68,sep=settings.separation??24,align=settings.alignment??.035,cohesion=settings.cohesion??.0018,separate=settings.separationForce??.035;
 for(const a of agents){
  const cx=Math.floor(a.x/cell),cy=Math.floor(a.y/cell);let ax=0,ay=0,px=0,py=0,sx=0,sy=0,n=0,sn=0;const visited=new Set();
  for(let gy=cy-1;gy<=cy+1;gy++)for(let gx=cx-1;gx<=cx+1;gx++){const key=(((gx%cols)+cols)%cols)+","+(((gy%rows)+rows)%rows);if(visited.has(key))continue;visited.add(key);for(const b of(grid.get(key)||[])){
   if(a===b)continue;let dx=b.x-a.x,dy=b.y-a.y;if(dx>width/2)dx-=width;if(dx< -width/2)dx+=width;if(dy>height/2)dy-=height;if(dy< -height/2)dy+=height;const d2=dx*dx+dy*dy;if(d2>p*p)continue;
   ax+=b.vx;ay+=b.vy;px+=dx;py+=dy;n++;if(d2<sep*sep){sx-=dx/(d2+8);sy-=dy/(d2+8);sn++}
  }}
  let vx=a.vx,vy=a.vy;if(n){vx+=(ax/n-vx)*align+(px/n)*cohesion;vy+=(ay/n-vy)*align+(py/n)*cohesion}if(sn){vx+=sx*separate;vy+=sy*separate}
  const max=(settings.maxSpeed??1.65)*(a.traits.speed||1),mag=Math.hypot(vx,vy)||1;vx=vx/mag*max;vy=vy/mag*max;
  const energy=a.energy-.00055*(a.traits.metabolism||1)*dt,age=a.age+dt;
  if(energy<=0||age>(settings.maxAge??22000)){world.deaths++;continue}
  next.push({...a,x:(a.x+vx*dt+width)%width,y:(a.y+vy*dt+height)%height,vx,vy,energy,age});
 }
 world.agents=next;world.tick+=dt;
 if(settings.reproduction!==false&&world.agents.length<(settings.maxPopulation??1600)&&Math.floor(world.tick/(settings.birthInterval??90))>Math.floor((world.tick-dt)/(settings.birthInterval??90))){
  const parents=world.agents.filter(a=>a.energy>.78/(a.traits.fertility||1));
  for(const parent of parents.slice(0,Math.min(settings.birthsPerCycle??4,parents.length))){
   const mate=world.agents.filter(b=>b!==parent&&Math.hypot(Math.min(Math.abs(b.x-parent.x),width-Math.abs(b.x-parent.x)),Math.min(Math.abs(b.y-parent.y),height-Math.abs(b.y-parent.y)))<180).sort((a,b)=>Math.hypot(a.x-parent.x,a.y-parent.y)-Math.hypot(b.x-parent.x,b.y-parent.y))[0]||parent;
   parent.energy-=.18;const angle=randomWorld(world)*Math.PI*2,traits=settings.inheritTraits?settings.inheritTraits(parent.traits,mate.traits):{...parent.traits};
   world.agents.push({...parent,id:world.nextId++,x:(parent.x+Math.cos(angle)*8+width)%width,y:(parent.y+Math.sin(angle)*8+height)%height,vx:parent.vx+Math.cos(angle)*.2,vy:parent.vy+Math.sin(angle)*.2,energy:.38,age:0,traits});world.births++;
  }
 }
 return{births:world.births,deaths:world.deaths,population:world.agents.length};
}
export function snapshotWorld(world){return JSON.parse(JSON.stringify(world))}
