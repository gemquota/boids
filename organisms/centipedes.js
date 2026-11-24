// Each circle is one articulated body segment. A lineage starts from one of
// the seven inner sprites and advances through the connected 37-sprite field.
const rowLengths=[4,5,6,7,6,5,4];
export const CENTIPEDE_SPRITES=[];
const byCoord=new Map();
for(let row=1;row<=7;row++){
 const r=row-4,qMin=Math.max(-3,-r-3);
 for(let col=1;col<=rowLengths[row-1];col++){
  const q=qMin+col-1,file=row===4&&col===4?'hex_r4_c4_BASE.png':`hex_r${row}_c${col}.png`;
  const item={index:CENTIPEDE_SPRITES.length,row,col,q,r,src:`./art/parchment_37_circles/${file}`};
  CENTIPEDE_SPRITES.push(item);byCoord.set(`${q},${r}`,item);
 }
}
const hexDistance=(a,b)=>(Math.abs(a.q-b.q)+Math.abs(a.r-b.r)+Math.abs(a.q+a.r-b.q-b.r))/2;
export const INNER_CENTIPEDE_SPRITES=CENTIPEDE_SPRITES.filter(s=>hexDistance(s,{q:0,r:0})<=1).map(s=>s.index);
const directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
const progressions=new Map();
export function centipedeProgression(origin){
 if(progressions.has(origin))return progressions.get(origin);
 const start=CENTIPEDE_SPRITES[origin];if(!start)return [...CENTIPEDE_SPRITES.keys()];
 const queue=[start],seen=new Set([origin]),path=[];
 while(queue.length){const current=queue.shift();path.push(current.index);for(const[dx,dy]of directions){const next=byCoord.get(`${current.q+dx},${current.r+dy}`);if(next&&!seen.has(next.index)){seen.add(next.index);queue.push(next)}}}
 progressions.set(origin,path);return path;
}
export function createCentipedeMorphology(traits={}){
 const normalized=[(traits.hue-155)/85,(traits.speed-.8)/.4,(traits.perception-.8)/.4,(traits.metabolism-.8)/.4,(traits.fertility-.8)/.4].map(v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:.5)));
 const score=normalized.reduce((sum,v)=>sum+v,0)/normalized.length;
 return{origin:INNER_CENTIPEDE_SPRITES[Math.min(6,Math.floor(score*7))]};
}
export function centipedeSpriteIndex(morphology,segmentAge=0){
 const path=centipedeProgression(morphology?.origin??INNER_CENTIPEDE_SPRITES[3]);
 return path[Math.max(0,Math.min(36,Math.floor(Math.max(0,segmentAge)/600)))];
}
export function centipedeSegmentCount(mass=0.7){return Math.max(1,Math.min(14,1+Math.floor(Math.max(0,mass-.7)*4)))}
export function growCentipedeMass(mass=0.7,energy=.7,dt=1){return Math.max(.7,Math.min(4,(mass||.7)+(energy>.55?(energy-.55)*.00022:-.000015)*dt))}
export function initializeCentipede(agent){
 agent.morphology=createCentipedeMorphology(agent.traits);
 agent.mass=.7;
 agent.segments=[{bornAt:0}];
 agent.trail=[{x:agent.x,y:agent.y}];
 return agent;
}
export function advanceCentipede(agent,dt=1,width=Infinity,height=Infinity){
 if(!agent.segments?.length)initializeCentipede(agent);
 agent.mass=growCentipedeMass(agent.mass,agent.energy,dt);
 const desired=centipedeSegmentCount(agent.mass);
 while(agent.segments.length<desired)agent.segments.push({bornAt:agent.age});
 const trail=agent.trail||(agent.trail=[{x:agent.x,y:agent.y}]);
 const last=trail[0],headX=Number.isFinite(width)?((last.x%width)+width)%width:last.x,headY=Number.isFinite(height)?((last.y%height)+height)%height:last.y;let dx=agent.x-headX,dy=agent.y-headY;if(Number.isFinite(width)&&dx>width/2)dx-=width;if(Number.isFinite(width)&&dx< -width/2)dx+=width;if(Number.isFinite(height)&&dy>height/2)dy-=height;if(Number.isFinite(height)&&dy< -height/2)dy+=height;
 if(dx*dx+dy*dy>=4)trail.unshift({x:last.x+dx,y:last.y+dy});
 const maxPoints=Math.max(24,desired*8+8);if(trail.length>maxPoints)trail.length=maxPoints;
}
// Return the point and local heading at a distance behind the head.
export function sampleCentipedeTrail(trail,distance,spacing=10){
 if(!trail?.length)return{x:0,y:0,angle:0};
 let remaining=distance;
 for(let i=0;i<trail.length-1;i++){
  const a=trail[i],b=trail[i+1],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
  if(length>=remaining&&length>0){const t=remaining/length;return{x:a.x+dx*t,y:a.y+dy*t,angle:Math.atan2(dy,dx)}}
  remaining-=length;
 }
 const a=trail[trail.length-1],b=trail[Math.max(0,trail.length-2)];
 return{x:a.x,y:a.y,angle:Math.atan2(a.y-b.y,a.x-b.x)};
}
