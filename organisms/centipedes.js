// Visual morphology for the articulated centipede population.
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
export function centipedeSpriteIndex(morphology,age,segmentIndex=0){
 const path=centipedeProgression(morphology?.origin??INNER_CENTIPEDE_SPRITES[3]);
 return path[Math.max(0,Math.min(36,Math.floor(Math.max(0,age)/600+segmentIndex*.28)))];
}
export function centipedeSegmentCount(mass=1){return Math.max(4,Math.min(14,4+Math.floor(Math.max(.1,mass)*2)));}
export function growCentipedeMass(mass=1,energy=.7,dt=1){return Math.max(.45,Math.min(5,(mass||1)+(energy>.55?(energy-.55)*.00022:-.000015)*dt));}
