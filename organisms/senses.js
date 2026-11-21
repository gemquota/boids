// Ray-cast perception and private, decaying world models. Controllers receive no omniscient population list.
export function createVisionField(population,width,height,cellSize=110){
 const cols=Math.max(1,Math.ceil(width/cellSize)),rows=Math.max(1,Math.ceil(height/cellSize)),grid=new Map();
 for(const a of population){if(a.dead)continue;const key=Math.floor(a.x/cellSize)+":"+Math.floor(a.y/cellSize);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a)}
 return{grid,width,height,cellSize,cols,rows};
}
export function castVision(agent,population,{rays=9,range=150,fieldOfView=Math.PI*.9,dt=1,memoryDecay=.985,noise=0,field=null}={}){
 const count=Math.max(3,Math.floor(rays)||9),heading=Math.atan2(agent.vy,agent.vx),prior=agent.senses||[],candidates=[];
 if(field){const reach=Math.ceil(range/field.cellSize),cx=Math.floor(agent.x/field.cellSize),cy=Math.floor(agent.y/field.cellSize),seen=new Set();for(let y=cy-reach;y<=cy+reach;y++)for(let x=cx-reach;x<=cx+reach;x++){const key=(((x%field.cols)+field.cols)%field.cols)+":"+(((y%field.rows)+field.rows)%field.rows);for(const a of field.grid.get(key)||[])if(!seen.has(a.id)){seen.add(a.id);candidates.push(a)}}}
 else candidates.push(...population);
 const next=[];
 for(let i=0;i<count;i++){
  const angle=heading-fieldOfView/2+fieldOfView*i/(count-1),dx=Math.cos(angle),dy=Math.sin(angle);let hit=null,best=range,hitRadius=3;
  for(const other of candidates){if(other.id===agent.id||other.dead)continue;let ox=other.x-agent.x,oy=other.y-agent.y;if(field){if(ox>field.width/2)ox-=field.width;if(ox< -field.width/2)ox+=field.width;if(oy>field.height/2)oy-=field.height;if(oy< -field.height/2)oy+=field.height}
   const along=ox*dx+oy*dy;if(along<=0||along>best)continue;const radius=Math.max(2,(other.radius||other.traits?.size||3)),lateral=Math.abs(ox*dy-oy*dx);
   if(lateral<=radius){best=along;hit=other;hitRadius=radius}
  }
  const old=prior[i];
  if(hit){const n=noise?((Math.sin(agent.id*17+i*31+agent.age)*.5+.5)-.5)*noise:0;next.push({visible:true,targetId:hit.id,distance:Math.max(0,best+n),bearing:angle-heading,x:hit.x,y:hit.y,vx:hit.vx,vy:hit.vy,size:hitRadius,confidence:1,age:0,kind:hit.kind||"boid"})}
  else if(old?.confidence>.025){const confidence=old.confidence*Math.pow(memoryDecay,dt),px=old.x+old.vx*dt,py=old.y+old.vy*dt,rx=px-agent.x,ry=py-agent.y;next.push({...old,visible:false,x:px,y:py,distance:Math.hypot(rx,ry),bearing:Math.atan2(ry,rx)-heading,confidence,age:old.age+dt})}
  else next.push({visible:false,targetId:null,distance:range,bearing:angle-heading,x:0,y:0,vx:0,vy:0,size:0,confidence:0,age:0,kind:null});
 }
 agent.senses=next;return next;
}
export function neuralSenseVector(agent,rays=4){
 const senses=agent.senses||[],out=[];
 for(let i=0;i<rays;i++){const s=senses[i]||{};out.push(s.confidence||0,s.visible?1:0,s.confidence?Math.max(-1,Math.min(1,(s.distance||0)/150)):0,s.confidence?Math.max(-1,Math.min(1,(s.bearing||0)/Math.PI)):0,s.confidence?Math.max(-1,Math.min(1,(s.vx||0)/3)):0,s.confidence?Math.max(-1,Math.min(1,(s.vy||0)/3)):0,s.confidence?Math.max(0,Math.min(1,(s.size||3)/12)):0,s.kind==="plant"?1:0)}
 return[...out.slice(0,32),agent.energy??0,agent.health??1,agent.injury??0,Math.min(1,Math.hypot(agent.vx,agent.vy)/4)].slice(0,36);
}
export function rememberedTargets(agent){return(agent.senses||[]).filter(s=>s.confidence>.05).map(s=>({...s,estimated:true}))}
