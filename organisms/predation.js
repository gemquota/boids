// Physical predator/prey encounters. Operates as an optional organism system after Core movement.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const radius=a=>Math.max(2,(a.radius||a.traits?.size||3)*(a.massScale||1));
const randOf=(rng)=>rng();
export function updateCombat(world,dt=1,{random=Math.random,collisionRestitution=.42,injuryRecovery=.0016,consumeRate=.012}={}){
 const agents=world.agents,byId=new Map(agents.map(a=>[a.id,a])),events=world.combatEvents||(world.combatEvents=[]);
 let hits=0,kills=0,consumed=0;world.detritus??=0;world.sicknessEvents??=0;world.meatChunks??=[];const cell=28,cols=Math.max(1,Math.ceil(world.width/cell)),rows=Math.max(1,Math.ceil(world.height/cell)),grid=new Map();for(const a of agents){if(a.dead)continue;const add=(x,y)=>{const key=Math.floor(x/cell)+":"+Math.floor(y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a)};add(a.x,a.y);for(const part of a.bodySegments||[])add(part.x,part.y)}const nearby=(x,y,r)=>{const out=[];for(let gy=Math.floor((y-r)/cell);gy<=Math.floor((y+r)/cell);gy++)for(let gx=Math.floor((x-r)/cell);gx<=Math.floor((x+r)/cell);gx++)for(const a of grid.get((((gx%cols)+cols)%cols)+":"+(((gy%rows)+rows)%rows))||[])out.push(a);return out};
 for(const a of agents){
  a.health??=1;a.injury??=0;a.dead??=false;a.attackCooldown=Math.max(0,(a.attackCooldown||0)-dt);
  if(a.dead){a.vx=0;a.vy=0;a.energy=0;a.rot??=0;a.sickness??=0;if(a.consumedBy!=null&&a.consumedBy!==-1){const killer=byId.get(a.consumedBy);if(killer){a.headMass??=(a.initialMass||a.mass||1)*.12;const bite=Math.min(a.mass||1,consumeRate*dt*(killer.traits?.attackSpeed||1)),headBite=Math.min(a.headMass,bite);a.headMass=Math.max(0,a.headMass-headBite);a.mass=Math.max(0,(a.mass||1)-bite);killer.acquiredMass=(killer.acquiredMass||0)+bite*.82;killer.mass=(killer.mass||1)+bite*.82;killer.massScale=Math.cbrt(killer.mass/Math.max(.01,killer.baseMass||1));killer.energy=Math.min(3,(killer.energy||0)+bite*.72);killer.health=Math.min(1,(killer.health||1)+bite*.08);consumed+=bite;if(a.kind==="centipede"&&!a.headConsumed&&a.headMass<=.0001){a.headConsumed=true;assimilateHead(killer,a);killer.headMeals=(killer.headMeals||0)+1;world.headMeals=(world.headMeals||0)+1}if(a.mass<=.015){killer.consumedMass=(killer.consumedMass||0)+(a.initialMass||1);killer.attachedPrey=null;a.consumedBy=-1}}}if(a.consumedBy==null&&a.mass>.015&&world.tick-(a.deathTick||world.tick)<900){const scavenger=nearby(a.x,a.y,radius(a)+12).find(k=>!k.dead&&k.id!==a.id&&Math.hypot(k.x-a.x,k.y-a.y)<radius(k)+radius(a)+5);if(scavenger){const bite=Math.min(a.mass,.006*dt*(scavenger.traits?.tracking||1));a.mass-=bite;scavenger.energy=Math.min(3,(scavenger.energy||0)+bite*.62);scavenger.mass=(scavenger.mass||1)+bite*.3;scavenger.massScale=Math.cbrt(scavenger.mass/Math.max(.01,scavenger.baseMass||1));consumed+=bite}}const age=Math.max(0,world.tick-(a.deathTick||world.tick));a.rot=Math.min(1,Math.max(0,(age-900)/5200));if(a.rot>0){const decay=Math.min(a.mass||0,(a.initialMass||1)*(.000025+.00011*a.rot)*dt);a.mass=Math.max(0,(a.mass||0)-decay);world.detritus+=decay;if(a.mass<=.01){a.consumedBy=-1;a.decomposed=true}}if(a.rot>.12&&random()<(.000015+a.rot*.00012)*dt){a.sickness=Math.min(1,(a.sickness||0)+.12);world.sicknessEvents++}continue}
  a.injury=Math.max(0,a.injury-injuryRecovery*dt);a.health=Math.min(1,a.health+injuryRecovery*.30*dt);a.headSenseBoost=Math.max(0,(a.headSenseBoost||0)-dt);
  if(a.kind==="centipede"&&(a.segments||1)>1&&a.energy<.16){a.starvationShedding=(a.starvationShedding||0)+dt;const interval=clamp(34+Math.max(0,a.energy)*110,34,52);if(a.starvationShedding>=interval){a.starvationShedding-=interval;dropTailSegments(world,a,1,true)}}else a.starvationShedding=Math.max(0,(a.starvationShedding||0)-dt*.5);
  for(let i=world.meatChunks.length-1;i>=0;i--){const chunk=world.meatChunks[i];if(Math.hypot(a.x-chunk.x,a.y-chunk.y)<=radius(a)+chunk.radius){const bite=Math.min(chunk.mass,.018*dt*(a.traits?.attackSpeed||1));chunk.mass-=bite;a.energy=Math.min(2.8,(a.energy||0)+bite*.8);a.mass=(a.mass||a.baseMass||1)+bite*.65;a.acquiredMass=(a.acquiredMass||0)+bite*.65;a.massScale=Math.cbrt(a.mass/Math.max(.01,a.baseMass||1));consumed+=bite;if(chunk.mass<=.002)world.meatChunks.splice(i,1)}}
  if(a.attachedPrey!=null){const corpse=byId.get(a.attachedPrey);if(corpse?.dead){a.x=corpse.x;a.y=corpse.y;a.vx=0;a.vy=0}else a.attachedPrey=null}
 }
 // Spatial hash prevents an all-pairs cost as the ecosystem grows.
 const seen=new Set();
 for(const a of agents){if(a.dead)continue;const gx=Math.floor(a.x/cell),gy=Math.floor(a.y/cell);
  for(let y=gy-1;y<=gy+1;y++)for(let x=gx-1;x<=gx+1;x++)for(const b of grid.get((((x%cols)+cols)%cols)+":"+(((y%rows)+rows)%rows))||[]){
   if(a.id>=b.id)continue;const key=a.id+":"+b.id;if(seen.has(key))continue;seen.add(key);
   let dx=b.x-a.x,dy=b.y-a.y;if(dx>world.width/2)dx-=world.width;if(dx< -world.width/2)dx+=world.width;if(dy>world.height/2)dy-=world.height;if(dy< -world.height/2)dy+=world.height;let d=Math.hypot(dx,dy)||.001,min=radius(a)+radius(b);const aBodyContact=(b.bodySegments||[]).some((part,index)=>index>0&&Math.hypot(part.x-a.x,part.y-a.y)<radius(a)+radius(b)*.72),bBodyContact=(a.bodySegments||[]).some((part,index)=>index>0&&Math.hypot(part.x-b.x,part.y-b.y)<radius(b)+radius(a)*.72);if(d>=min&&(aBodyContact||bBodyContact))d=min-.001;if(d>=min)continue;
   const nx=dx/d,ny=dy/d,overlap=min-d;
   // Mass-weighted positional correction and damped elastic response.
   const ma=Math.max(.2,a.mass||1),mb=Math.max(.2,b.mass||1),sum=ma+mb;
   a.x-=nx*overlap*(mb/sum);a.y-=ny*overlap*(mb/sum);b.x+=nx*overlap*(ma/sum);b.y+=ny*overlap*(ma/sum);a.x=(a.x+world.width)%world.width;a.y=(a.y+world.height)%world.height;b.x=(b.x+world.width)%world.width;b.y=(b.y+world.height)%world.height;
   const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(rel<0){const impulse=-(1+collisionRestitution)*rel/(1/ma+1/mb);a.vx-=impulse*nx/ma;a.vy-=impulse*ny/ma;b.vx+=impulse*nx/mb;b.vy+=impulse*ny/mb}
   const ta=a.traits||{},tb=b.traits||{},aTarget=(a.senses||[]).some(s=>s.visible&&s.targetId===b.id),bTarget=(b.senses||[]).some(s=>s.visible&&s.targetId===a.id);
   const aAgg=ta.aggression||0,bAgg=tb.aggression||0;
   if((aTarget||aBodyContact)&&a.attackCooldown<=0&&!b.dead&&(ta.carnivory||0)>.18){strike(a,b,random,1,world.tick,world);const severed=damageBody(b,a,b.lastDamage||0,world);if(severed)markSevered(world,b,severed,world.tick);a.attackCooldown=1/Math.max(.2,ta.attackSpeed||1);hits++}
   if((bTarget||bBodyContact)&&b.attackCooldown<=0&&!a.dead&&(tb.carnivory||0)>.18){strike(b,a,random,1,world.tick,world);const severed=damageBody(a,b,a.lastDamage||0,world);if(severed)markSevered(world,a,severed,world.tick);b.attackCooldown=1/Math.max(.2,tb.attackSpeed||1);hits++}
   // Head-on defensive clashes: both commit to the contact; the better attack/defence balance wins probabilistically.
   if((ta.carnivory||0)>.18&&(tb.carnivory||0)>.18&&aAgg>.55&&bAgg>.55&&((a.vx*nx+a.vy*ny)/(Math.hypot(a.vx,a.vy)||1)>.5)&&((b.vx*-nx+b.vy*-ny)/(Math.hypot(b.vx,b.vy)||1)>.5)&&randOf(random)<.22){
    const sa=(ta.attack||1)*(0.5+randOf(random))-(tb.defense||1)*.35,sb=(tb.attack||1)*(0.5+randOf(random))-(ta.defense||1)*.35;
    if(sa>sb){strike(a,b,random,.65,world.tick,world);const severed=damageBody(b,a,b.lastDamage||0,world);if(severed)markSevered(world,b,severed,world.tick)}else if(sb>sa){strike(b,a,random,.65,world.tick,world);const severed=damageBody(a,b,a.lastDamage||0,world);if(severed)markSevered(world,a,severed,world.tick)}else{strike(a,b,random,.3,world.tick,world);const severedA=damageBody(b,a,b.lastDamage||0,world);if(severedA)markSevered(world,b,severedA,world.tick);strike(b,a,random,.3,world.tick,world);const severedB=damageBody(a,b,a.lastDamage||0,world);if(severedB)markSevered(world,a,severedB,world.tick)}hits++;
   }
  }
 }
 const corpseGrid=new Map();for(const corpse of agents){if(!corpse.dead||corpse.rot<=.12)continue;const key=Math.floor(corpse.x/cell)+":"+Math.floor(corpse.y/cell);if(!corpseGrid.has(key))corpseGrid.set(key,[]);corpseGrid.get(key).push(corpse)}const nearbyCorpse=(x,y)=>{const out=[];for(let gy=Math.floor((y-18)/cell);gy<=Math.floor((y+18)/cell);gy++)for(let gx=Math.floor((x-18)/cell);gx<=Math.floor((x+18)/cell);gx++)for(const corpse of corpseGrid.get((((gx%cols)+cols)%cols)+":"+(((gy%rows)+rows)%rows))||[])if(Math.hypot(corpse.x-x,corpse.y-y)<18)out.push(corpse);return out};const killerByTarget=new Map();for(const hunter of agents){if(hunter.dead)continue;for(const sense of hunter.senses||[])if(sense.visible)killerByTarget.set(sense.targetId,hunter)}
 for(const a of agents){if(!a.dead&&nearbyCorpse(a.x,a.y).length&&random()<.000018*dt){a.sickness=Math.min(1,(a.sickness||0)+.08);a.health=Math.max(0,(a.health||1)-.003)}if(a.sickness>.05&&!a.dead){a.health=Math.max(0,(a.health||1)-a.sickness*.00008*dt);a.energy=Math.max(0,(a.energy||0)-a.sickness*.00012*dt)}if(a.health<=0&&!a.dead){if(a.kind==="centipede"){a.segments=1;a.bodySegments=(a.bodySegments||[]).slice(0,1);a.segmentTrail=(a.segmentTrail||[]).slice(0,2)}a.dead=true;a.vx=0;a.vy=0;a.deathTick=world.tick;a.rot=0;a.sickness??=0;a.mass??=1;a.initialMass??=a.mass;a.headMass??=a.kind==="centipede"?a.initialMass*.12:0;world.deaths=(world.deaths||0)+1;kills++;const killer=killerByTarget.get(a.id)||byId.get(a.lastAttacker);if(killer){a.consumedBy=killer.id;killer.attachedPrey=a.id;killer.energy=Math.min(3,killer.energy+.28)}}}
 for(const chunk of world.meatChunks){chunk.x+=chunk.vx||0;chunk.y+=chunk.vy||0;chunk.vx=(chunk.vx||0)*.94;chunk.vy=(chunk.vy||0)*.94;chunk.age=(chunk.age||0)+dt;chunk.mass=Math.max(0,chunk.mass-.000025*dt)}world.meatChunks=world.meatChunks.filter(c=>c.mass>.002&&c.age<900);
 world.totalPredation=(world.totalPredation||0)+hits;world.totalKills=(world.totalKills||0)+kills;world.totalConsumed=(world.totalConsumed||0)+consumed;world.combat={hits,kills,consumed,totalPredation:world.totalPredation,totalKills:world.totalKills,population:agents.filter(a=>!a.dead).length,injured:agents.filter(a=>!a.dead&&a.injury>.05).length,biomass:agents.filter(a=>a.dead).reduce((n,a)=>n+(a.mass||0),0)};
 for(let i=events.length-1;i>=0;i--)if(world.tick-events[i].tick>24)events.splice(i,1);if(events.length>500)events.splice(0,events.length-500);
 return world.combat;
}
function strike(attacker,prey,random,multiplier=1,tick=0,world=null){
 const at=attacker.traits||{},pt=prey.traits||{},damage=Math.max(.012,(at.damage||.4)*(at.attack||1)*multiplier*.82/(1+(pt.defense||1)*.55));
 prey.health=Math.max(0,(prey.health??1)-damage);prey.injury=Math.min(1,(prey.injury||0)+damage*.8);prey.lastDamage=damage;prey.lastAttacker=attacker.id;
 // A strike is a real momentum exchange: the target is knocked away, the attacker
 // recoils, and an off-centre body hit adds angular velocity instead of a canned shove.
 const dx=prey.x-attacker.x,dy=prey.y-attacker.y,distance=Math.hypot(dx,dy)||1,nx=dx/distance,ny=dy/distance;
 const attackerMass=Math.max(.1,attacker.mass||1),preyMass=Math.max(.1,prey.mass||1),closing=Math.max(0,-((prey.vx||0)-(attacker.vx||0))*nx-((prey.vy||0)-(attacker.vy||0))*ny);
 const impulse=damage*(.32+Math.min(5,closing)*.16)*Math.min(attackerMass,preyMass);
 prey.vx=(prey.vx||0)+nx*impulse/preyMass;prey.vy=(prey.vy||0)+ny*impulse/preyMass;
 attacker.vx=(attacker.vx||0)-nx*impulse/attackerMass;attacker.vy=(attacker.vy||0)-ny*impulse/attackerMass;
 const contact=(prey.bodySegments||[]).slice(1).reduce((best,part)=>{const d=Math.hypot(part.x-attacker.x,part.y-attacker.y);return !best||d<best.d?{part,d}:best},null)?.part;
 if(contact){const armX=contact.x-prey.x,armY=contact.y-prey.y,inertia=Math.max(.05,preyMass*Math.max(4,(prey.segments||1)*Math.pow(prey.radius||3,2))/12);prey.spin=(prey.spin||0)+(armX*(ny*impulse)-armY*(nx*impulse))/inertia}const heading=Math.atan2(prey.vy||0,prey.vx||1),side=Math.sin(Math.atan2(ny,nx)-heading);prey.spin=(prey.spin||0)+side*damage*(contact?.12:.055);
 if(world)recordImpact(world,attacker,prey,damage,tick);
 const flee=Math.max(0,(pt.flee||1)*(pt.speed||1)-at.tracking*.2);
 if(random()<clamp(.18+flee*.13,0,.78)){prey.fleeing=true;prey.vx+=(prey.x-attacker.x)*.012;prey.vy+=(prey.y-attacker.y)*.012}
 attacker.energy=Math.max(0,attacker.energy-.00035*(at.attackCost||1));attacker.lastAttack=prey.id;attacker.lastAttackTick=tick;
}

function recordImpact(world,attacker,prey,damage,tick){
 const parts=prey.bodySegments||[];let point=null,best=Infinity;for(let i=1;i<parts.length;i++){const d=Math.hypot(parts[i].x-attacker.x,parts[i].y-attacker.y);if(d<best){best=d;point=parts[i]}}
 const x=point?.x??(attacker.x+prey.x)*.5,y=point?.y??(attacker.y+prey.y)*.5;world.combatEvents??=[];world.combatEvents.push({x,y,tick,attackerId:attacker.id,targetId:prey.id,damage,radius:Math.max(4,(prey.radius||3)*.9),angle:Math.atan2(prey.y-attacker.y,prey.x-attacker.x),severed:false});
}
function markSevered(world,prey,count,tick){const event=[...(world.combatEvents||[])].reverse().find(e=>e.targetId===prey.id&&e.tick===tick);if(event){event.severed=true;event.segments=count;event.radius*=1.45}}
function assimilateHead(killer,prey){
 const candidates=["tracking","perception","visionRange","attack","defense","maneuverability"],key=candidates.filter(k=>Number.isFinite(prey.traits?.[k])).sort((a,b)=>(prey.traits[b]||0)-(prey.traits[a]||0))[0];
 if(key){const current=killer.traits?.[key]??1,donor=prey.traits[key],gain=Math.max(0,donor-current)*.22;if(gain>0){killer.traits[key]=Math.min(key==="attack"?2.5:key==="defense"?2.5:2.2,current+gain);killer.headTraitAssimilation=key;killer.headTraitAssimilations=(killer.headTraitAssimilations||0)+1}}
 killer.headSenseBoost=Math.max(killer.headSenseBoost||0,2400);
}
function dropTailSegments(world,prey,count=1,selfConsume=false){
 const before=Math.max(1,prey.segments||1),loss=Math.min(before-1,Math.max(1,count));if(!loss)return 0;
 const points=prey.bodySegments||[],tail=points.slice(Math.max(1,before-loss)),point=tail[0]||points[points.length-1]||{x:prey.x,y:prey.y};
 const scale=Math.max(.35,prey.juvenileScale||1),mass=Math.max(.012,(prey.baseMass||prey.mass||1)*loss*.055*scale**3);
 world.meatChunks??=[];world.meatChunks.push({id:world.nextMeatId=(world.nextMeatId||0)+1,x:point.x,y:point.y,vx:(prey.vx||0)*.35,vy:(prey.vy||0)*.35,mass,initialMass:mass,radius:Math.max(2,(prey.radius||3)*.38),age:0,sourceId:prey.id});
 prey.segments=before-loss;prey.lostSegments=(prey.lostSegments||0)+loss;prey.mass=Math.max(.02,(prey.mass||prey.baseMass||1)-mass);prey.acquiredMass=Math.max(0,(prey.acquiredMass||0)-mass);const keep=Math.max(1,prey.segments);prey.segmentTrail=prey.segmentTrail?.slice(0,Math.max(2,Math.floor(prey.segmentTrail.length*keep/before)));prey.bodySegments=points.slice(0,keep);
 if(selfConsume){prey.energy=Math.min(.24,(prey.energy||0)+mass*.8);prey.selfCannibalisedMass=(prey.selfCannibalisedMass||0)+mass}return loss;
}
function damageBody(prey,attacker,damage,world){if(prey.kind!=="centipede"||(prey.segments||1)<=1||damage<.10)return 0;const loss=Math.min(prey.segments-1,Math.max(1,Math.floor(damage*prey.segments*1.1)));return dropTailSegments(world,prey,loss)}

export function combatSummary(agents){const living=agents.filter(a=>!a.dead),dead=agents.filter(a=>a.dead),mean=k=>living.length?living.reduce((n,a)=>n+(a.traits?.[k]||0),0)/living.length:0;return{living:living.length,dead:dead.length,injured:living.filter(a=>a.injury>.05).length,meanHealth:living.length?living.reduce((n,a)=>n+(a.health??1),0)/living.length:0,meanAttack:mean("attack"),meanDefense:mean("defense"),meanAggression:mean("aggression")}}
