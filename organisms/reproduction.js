// Behaviour-driven sexual reproduction: mate choice, courtship, gestation and parental care.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const living=(a)=>a&&!a.dead;
const adult=(a)=>living(a)&&a.age>=(a.traits?.maturity??1)*900&&a.age<18000&&a.energy>1.02&&(a.health??1)>.4;
const clearPair=(a,b)=>{if(a){a.matePartner=null;a.courtshipProgress=0;a.reproductiveTarget=null;a.reproductiveState=null}if(b?.matePartner===a?.id){b.matePartner=null;b.courtshipProgress=0;b.reproductiveTarget=null;b.reproductiveState=null}};
export function updateReproduction(world,dt=1,{maxPopulation=800,random=Math.random,inheritTraits=(a)=>({...a}),inheritOrganism=()=>({}),selectParents=null,enabled=true}={}){
 if(!enabled)return{births:0,pregnancies:0,courting:0};
 const agents=world.agents.filter(living),byId=new Map(agents.map(a=>[a.id,a]));
 let births=0;
 // Gestation progresses independently of the mating search. Developing offspring cost energy.
 for(const mother of agents){
  if(!mother.pregnancy)continue;
  const pregnancy=mother.pregnancy;
  mother.energy-=.00018*dt;
  pregnancy.remaining-=dt;
  mother.reproductiveState="gestating";
  const father=byId.get(pregnancy.fatherId);
  if(pregnancy.remaining>0)continue;
  if(mother.energy<.3){mother.pregnancy=null;mother.reproductiveState=null;mother.reproductiveCooldown=900;continue}
  const count=Math.max(1,Math.min(4,pregnancy.clutchSize||1));let litter=0;
  for(let i=0;i<count&&world.agents.filter(living).length<maxPopulation;i++){
   const angle=random()*Math.PI*2,r=5+random()*8,traits=inheritTraits(mother.traits||{},father?.traits||mother.traits||{}),inherited=inheritOrganism(mother,father||mother)||{};
   const child={...mother,...inherited,id:world.nextId++,x:clamp(mother.x+Math.cos(angle)*r,0,world.width),y:clamp(mother.y+Math.sin(angle)*r,0,world.height),vx:mother.vx*.35+Math.cos(angle)*.12,vy:mother.vy*.35+Math.sin(angle)*.12,energy:.62,age:0,traits,parents:[mother.id,father?.id??mother.id],motherId:mother.id,fatherId:father?.id??mother.id,sex:random()<.5?"female":"male",pregnancy:null,matePartner:null,courtshipProgress:0,reproductiveTarget:null,reproductiveState:"juvenile",reproductiveCooldown:0,careUntil:1100,bornInitialized:false,activity:null,activityTarget:null,activityNodeTarget:null};
   world.agents.push(child);births++;litter++;
  }
  mother.energy=Math.max(0,mother.energy-.12);
  mother.pregnancy=null;mother.reproductiveState="parent";mother.reproductiveCooldown=2200;
  if(father){father.reproductiveState="parent";father.reproductiveCooldown=2200}
  world.births=(world.births||0)+litter;
 }
 const current=world.agents.filter(living),currentById=new Map(current.map(a=>[a.id,a]));
 // Young organisms receive a small, explicit energy subsidy from nearby parents.
 for(const child of current){
  if(!(child.age<(child.careUntil??0))||!child.parents)continue;
  const caregivers=child.parents.map(id=>currentById.get(id)).filter(p=>p&&distance(p,child)<105&&p.energy>.45);
  if(caregivers.length){const care=Math.min(.00022*dt,caregivers.reduce((n,p)=>n+Math.max(0,p.energy-.4)*.00008*dt,0));child.energy=Math.min(1.5,child.energy+care);for(const p of caregivers)p.energy-=care/caregivers.length*.35;child.parentalCare=clamp((child.parentalCare||0)+.001*dt,0,1)}
  else child.parentalCare=Math.max(0,(child.parentalCare||0)-.0007*dt);
 }
 // Expire invalid pairings and find nearby, unrelated, opposite-sex partners.
 for(const a of current){
  a.reproductiveCooldown=Math.max(0,(a.reproductiveCooldown||0)-dt);
  if(a.pregnancy)continue;
  if(!adult(a)||a.reproductiveCooldown>0){if(a.matePartner!=null)clearPair(a,currentById.get(a.matePartner));continue}
  const partner=currentById.get(a.matePartner);
  if(partner&&(!adult(partner)||partner.sex===a.sex||partner.pregnancy||partner.matePartner!==a.id)){clearPair(a,partner)}
  if(a.matePartner!=null)continue;
  let best=null,bestScore=-Infinity;
  for(const b of current){
   if(b===a||b.matePartner!=null||b.pregnancy||b.sex===a.sex||!adult(b)||b.reproductiveCooldown>0)continue;
   if(a.parents?.includes(b.id)||b.parents?.includes(a.id))continue;
   const d=distance(a,b);if(d>260)continue;
   const attraction=(a.traits?.sexDrive??1)*(b.traits?.sexDrive??1)*(b.traits?.fertility??1);
   const score=attraction/(1+d/70)+(random()-.5)*.04;
   if(score>bestScore){best=b;bestScore=score}
  }
  if(best){a.matePartner=best.id;best.matePartner=a.id;a.courtshipProgress=0;best.courtshipProgress=0;a.reproductiveState="seeking";best.reproductiveState="seeking"}
 }
 // Partners approach and court. Mating requires sustained close contact, not a timer that births organisms.
 for(const a of current){
  if(a.matePartner==null||a.pregnancy||a.id>a.matePartner)continue;
  const b=currentById.get(a.matePartner);if(!b||b.matePartner!==a.id)continue;
  const d=distance(a,b);
  if(d>22){a.reproductiveTarget=b.id;b.reproductiveTarget=a.id;a.reproductiveState="courtship";b.reproductiveState="courtship";a.courtshipProgress=Math.max(0,(a.courtshipProgress||0)-dt*.15);b.courtshipProgress=a.courtshipProgress;continue}
  a.reproductiveTarget=null;b.reproductiveTarget=null;
  const progress=Math.min(180,(Math.min(a.courtshipProgress||0,b.courtshipProgress||0)+dt));
  a.courtshipProgress=progress;b.courtshipProgress=progress;a.reproductiveState="courting";b.reproductiveState="courting";
  if(progress<180)continue;
  const mother=a.sex==="female"?a:b,father=mother===a?b:a;
  if(mother.pregnancy||father.pregnancy||mother.energy<.5||father.energy<.5){clearPair(a,b);continue}
  const fertility=(Number(mother.traits?.fertility??1)+Number(father.traits?.fertility??1))*.5;
  const gestationScale=clamp(mother.traits?.gestation??1,.5,2);
  const clutchSize=Math.round(clamp(mother.traits?.clutchSize??1.35,1,4));
  mother.energy-=.13;father.energy-=.09;
  mother.pregnancy={fatherId:father.id,remaining:Math.max(240,900*gestationScale/Math.max(.65,fertility*.5+.5)),clutchSize};
  mother.reproductiveState="gestating";father.reproductiveState="mated";
  mother.matePartner=null;father.matePartner=null;mother.reproductiveTarget=null;father.reproductiveTarget=null;
  mother.courtshipProgress=0;father.courtshipProgress=0;mother.reproductiveCooldown=1800;father.reproductiveCooldown=1800;
 }
 const courting=current.filter(a=>a.reproductiveState==="seeking"||a.reproductiveState==="courtship"||a.reproductiveState==="courting").length;
 return{births,pregnancies:current.filter(a=>a.pregnancy).length,courting};
}
