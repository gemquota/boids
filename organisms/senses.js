// Ray-cast perception and private, decaying world models. No omniscient target list is exposed to controllers.
export function castVision(agent, population, {rays= nine, range=150, fieldOfView=Math.PI*.9, dt=1, memoryDecay=.985, noise=0}={}) {
 const count=Math.max(3,Math.floor(rays)||9), heading=Math.atan2(agent.vy,agent.vx), prior=agent.senses||[];
 const next=[];
 for(let i=0;i<count;i++){
  const angle=heading-fieldOfView/2+fieldOfView*i/(count-1),dx=Math.cos(angle),dy=Math.sin(angle);
  let hit=null,best=range;
  for(const other of population){if(other.id===agent.id||other.dead)continue;
   const ox=other.x-agent.x,oy=other.y-agent.y,along=ox*dx+oy*dy;
   if(along<=0||along>best)continue;
   const lateral=Math.abs(ox*dy-oy*dx),radius=Math.max(2,(other.radius||other.traits?.size||3));
   if(lateral<=radius){best=along;hit=other}
  }
  const old=prior[i];
  if(hit){const n=(noise?((Math.sin(agent.id*17+i*31+agent.age)*.5+.5)-.5)*noise:0);next.push({visible:true,targetId:hit.id,distance:Math.max(0,best+n),bearing:angle-heading, x:hit.x,y:hit.y,vx:hit.vx,vy:hit.vy,confidence:1,age:0,kind:hit.kind||"boid"})}
  else if(old?.confidence>.025){const confidence=old.confidence*Math.pow(memoryDecay,dt);next.push({...old,visible:false,x:old.x+old.vx*dt,y:old.y+old.vy*dt,confidence,age:old.age+dt})}
  else next.push({visible:false,targetId:null,distance:range,bearing:angle-heading,x:0,y:0,vx:0,vy:0,confidence:0,age:0,kind:null});
 }
 agent.senses=next;
 return next;
}
const nine=9;
export function neuralSenseVector(agent, rays=9) {
 const senses=agent.senses||[],out=[];
 for(let i=0;i<rays;i++){const s=senses[i]||{};out.push(s.confidence||0,s.visible?1:0,s.confidence?Math.max(-1,Math.min(1,(s.distance||0)/150)):0)}
 const energy=agent.energy??0,health=agent.health??1,injury=agent.injury??0;
 return [...out.slice(0,12),energy,health,injury,Math.min(1,Math.hypot(agent.vx,agent.vy)/4)].slice(0,16);
}
export function rememberedTargets(agent){return(agent.senses||[]).filter(s=>s.confidence>.05).map(s=>({...s,estimated:true}));}
