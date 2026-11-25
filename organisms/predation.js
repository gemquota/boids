// Physical predator/prey encounters. Operates as an optional organism system after Core movement.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const radius=a=>Math.max(2,(a.radius||a.traits?.size||3)*(a.massScale||1));
const randOf=(rng)=>rng();
export function updateCombat(world,dt=1,{random=Math.random,collisionRestitution=.42,injuryRecovery=.0008,consumeRate=.012}={}){
 const agents=world.agents,byId=new Map(agents.map(a=>[a.id,a])),events=world.combatEvents||(world.combatEvents=[]);
 let hits=0,kills=0,consumed=0;world.detritus??=0;world.sicknessEvents??=0;const cell=28,cols=Math.max(1,Math.ceil(world.width/cell)),rows=Math.max(1,Math.ceil(world.height/cell)),grid=new Map();for(const a of agents){if(a.dead)continue;const add=(x,y)=>{const key=Math.floor(x/cell)+":"+Math.floor(y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a)};add(a.x,a.y);for(const part of a.bodySegments||[])add(part.x,part.y)}const nearby=(x,y,r)=>{const out=[];for(let gy=Math.floor((y-r)/cell);gy<=Math.floor((y+r)/cell);gy++)for(let gx=Math.floor((x-r)/cell);gx<=Math.floor((x+r)/cell);gx++)for(const a of grid.get((((gx%cols)+cols)%cols)+":"+(((gy%rows)+rows)%rows))||[])out.push(a);return out};
 for(const a of agents){
  a.health??=1;a.injury??=0;a.dead??=false;a.attackCooldown=Math.max(0,(a.attackCooldown||0)-dt);
  if(a.dead){a.vx=0;a.vy=0;a.energy=0;a.rot??=0;a.sickness??=0;if(a.consumedBy!=null&&a.consumedBy!==-1){const killer=byId.get(a.consumedBy);if(killer){const bite=Math.min(a.mass||1,consumeRate*dt*(killer.traits?.attackSpeed||1));a.mass=Math.max(0,(a.mass||1)-bite);killer.acquiredMass=(killer.acquiredMass||0)+bite*.82;killer.mass=(killer.mass||1)+bite*.82;killer.massScale=Math.cbrt(killer.mass/Math.max(.01,killer.baseMass||1));killer.energy=Math.min(3,(killer.energy||0)+bite*.72);killer.health=Math.min(1,(killer.health||1)+bite*.08);consumed+=bite;if(a.mass<=.015){killer.consumedMass=(killer.consumedMass||0)+(a.initialMass||1);killer.attachedPrey=null;a.consumedBy=-1;if(a.kind==="centipede"&&!a.headConsumed){a.headConsumed=true;killer.headMeals=(killer.headMeals||0)+1;killer.energy=Math.min(3,killer.energy+.48);killer.health=Math.min(1,killer.health+.18);killer.injury=Math.max(0,(killer.injury||0)-.22);killer.headMealBuff=Math.max(killer.headMealBuff||0,1800)}}}}if(a.consumedBy==null&&a.mass>.015&&world.tick-(a.deathTick||world.tick)<900){const scavenger=nearby(a.x,a.y,radius(a)+12).find(k=>!k.dead&&k.id!==a.id&&Math.hypot(k.x-a.x,k.y-a.y)<radius(k)+radius(a)+5);if(scavenger){const bite=Math.min(a.mass,.006*dt*(scavenger.traits?.tracking||1));a.mass-=bite;scavenger.energy=Math.min(3,(scavenger.energy||0)+bite*.62);scavenger.mass=(scavenger.mass||1)+bite*.3;scavenger.massScale=Math.cbrt(scavenger.mass/Math.max(.01,scavenger.baseMass||1));consumed+=bite}}const age=Math.max(0,world.tick-(a.deathTick||world.tick));a.rot=Math.min(1,Math.max(0,(age-900)/5200));if(a.rot>0){const decay=Math.min(a.mass||0,(a.initialMass||1)*(.000025+.00011*a.rot)*dt);a.mass=Math.max(0,(a.mass||0)-decay);world.detritus+=decay;if(a.mass<=.01){a.consumedBy=-1;a.decomposed=true}}if(a.rot>.12&&random()<(.000015+a.rot*.00012)*dt){a.sickness=Math.min(1,(a.sickness||0)+.12);world.sicknessEvents++}continue}
  a.injury=Math.max(0,a.injury-injuryRecovery*dt);a.health=Math.min(1,a.health+injuryRecovery*.15*dt);a.headMealBuff=Math.max(0,(a.headMealBuff||0)-dt);if(a.attachedPrey!=null){const corpse=byId.get(a.attachedPrey);if(corpse?.dead){a.x=corpse.x;a.y=corpse.y;a.vx=0;a.vy=0}else a.attachedPrey=null}
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
   if((aTarget||aBodyContact)&&a.attackCooldown<=0&&!b.dead&&(ta.carnivory||0)>.18){strike(a,b,random,1,world.tick);damageBody(b,a,b.lastDamage||0);a.attackCooldown=1/Math.max(.2,ta.attackSpeed||1);hits++}
   if((bTarget||bBodyContact)&&b.attackCooldown<=0&&!a.dead&&(tb.carnivory||0)>.18){strike(b,a,random,1,world.tick);damageBody(a,b,a.lastDamage||0);b.attackCooldown=1/Math.max(.2,tb.attackSpeed||1);hits++}
   // Head-on defensive clashes: both commit to the contact; the better attack/defence balance wins probabilistically.
   if((ta.carnivory||0)>.18&&(tb.carnivory||0)>.18&&aAgg>.55&&bAgg>.55&&((a.vx*nx+a.vy*ny)/(Math.hypot(a.vx,a.vy)||1)>.5)&&((b.vx*-nx+b.vy*-ny)/(Math.hypot(b.vx,b.vy)||1)>.5)&&randOf(random)<.22){
    const sa=(ta.attack||1)*(0.5+randOf(random))-(tb.defense||1)*.35,sb=(tb.attack||1)*(0.5+randOf(random))-(ta.defense||1)*.35;
    if(sa>sb){strike(a,b,random,.65,world.tick);damageBody(b,a,b.lastDamage||0)}else if(sb>sa){strike(b,a,random,.65,world.tick);damageBody(a,b,a.lastDamage||0)}else{strike(a,b,random,.3,world.tick);damageBody(b,a,b.lastDamage||0);strike(b,a,random,.3,world.tick);damageBody(a,b,a.lastDamage||0)}hits++;
   }
  }
 }
 const corpseGrid=new Map();for(const corpse of agents){if(!corpse.dead||corpse.rot<=.12)continue;const key=Math.floor(corpse.x/cell)+":"+Math.floor(corpse.y/cell);if(!corpseGrid.has(key))corpseGrid.set(key,[]);corpseGrid.get(key).push(corpse)}const nearbyCorpse=(x,y)=>{const out=[];for(let gy=Math.floor((y-18)/cell);gy<=Math.floor((y+18)/cell);gy++)for(let gx=Math.floor((x-18)/cell);gx<=Math.floor((x+18)/cell);gx++)for(const corpse of corpseGrid.get((((gx%cols)+cols)%cols)+":"+(((gy%rows)+rows)%rows))||[])if(Math.hypot(corpse.x-x,corpse.y-y)<18)out.push(corpse);return out};const killerByTarget=new Map();for(const hunter of agents){if(hunter.dead)continue;for(const sense of hunter.senses||[])if(sense.visible)killerByTarget.set(sense.targetId,hunter)}
 for(const a of agents){if(!a.dead&&nearbyCorpse(a.x,a.y).length&&random()<.000018*dt){a.sickness=Math.min(1,(a.sickness||0)+.08);a.health=Math.max(0,(a.health||1)-.003)}if(a.sickness>.05&&!a.dead){a.health=Math.max(0,(a.health||1)-a.sickness*.00008*dt);a.energy=Math.max(0,(a.energy||0)-a.sickness*.00012*dt)}if(a.health<=0&&!a.dead){a.dead=true;a.vx=0;a.vy=0;a.deathTick=world.tick;a.rot=0;a.sickness??=0;a.mass??=1;a.initialMass??=a.mass;world.deaths=(world.deaths||0)+1;kills++;const killer=killerByTarget.get(a.id)||byId.get(a.lastAttacker);if(killer){a.consumedBy=killer.id;killer.attachedPrey=a.id;killer.energy=Math.min(3,killer.energy+.28)}}}
 world.totalPredation=(world.totalPredation||0)+hits;world.totalKills=(world.totalKills||0)+kills;world.totalConsumed=(world.totalConsumed||0)+consumed;world.combat={hits,kills,consumed,totalPredation:world.totalPredation,totalKills:world.totalKills,population:agents.filter(a=>!a.dead).length,injured:agents.filter(a=>!a.dead&&a.injury>.05).length,biomass:agents.filter(a=>a.dead).reduce((n,a)=>n+(a.mass||0),0)};
 if(events.length>500)events.splice(0,events.length-500);
 return world.combat;
}
function strike(attacker,prey,random,multiplier=1,tick=0){
 const at=attacker.traits||{},pt=prey.traits||{},damage=Math.max(.015,(at.damage||.4)*(at.attack||1)*multiplier/(1+(pt.defense||1)*.45));
 prey.health=Math.max(0,(prey.health??1)-damage);prey.injury=Math.min(1,(prey.injury||0)+damage*.8);prey.lastDamage=damage;prey.lastAttacker=attacker.id;
 const flee=Math.max(0,(pt.flee||1)*(pt.speed||1)-at.tracking*.2);
 if(random()<clamp(.18+flee*.13,0,.78)){prey.fleeing=true;prey.vx+=(prey.x-attacker.x)*.012;prey.vy+=(prey.y-attacker.y)*.012}
 attacker.energy=Math.max(0,attacker.energy-.00035*(at.attackCost||1));if(attacker.headMealBuff>0)prey.health=Math.max(0,prey.health-damage*.2);attacker.lastAttack=prey.id;attacker.lastAttackTick=tick;
}

function damageBody(prey,attacker,damage){
 if(prey.kind!=="centipede"||(prey.segments||1)<=1||damage<.08)return 0;
 const before=prey.segments,loss=Math.min(before-1,Math.max(1,Math.floor(damage*before*1.5)));
 if(!loss)return 0;
 const fraction=Math.min(.35,loss*.055*(prey.juvenileScale||1)**3),tissue=Math.max(0,(prey.baseMass||prey.mass||1)*fraction);
 prey.segments=before-loss;prey.lostSegments=(prey.lostSegments||0)+loss;prey.mass=Math.max(.02,(prey.mass||prey.baseMass||1)-tissue);prey.acquiredMass=Math.max(0,(prey.acquiredMass||0)-tissue);
 attacker.acquiredMass=(attacker.acquiredMass||0)+tissue*.82;attacker.mass=(attacker.mass||attacker.baseMass||1)+tissue*.82;
 attacker.massScale=Math.cbrt(Math.max(.01,attacker.mass)/Math.max(.01,attacker.baseMass||1));
 prey.segmentTrail=prey.segmentTrail?.slice(0,Math.max(2,Math.floor(prey.segmentTrail.length*prey.segments/before)));
 return loss;
}
export function combatSummary(agents){const living=agents.filter(a=>!a.dead),dead=agents.filter(a=>a.dead),mean=k=>living.length?living.reduce((n,a)=>n+(a.traits?.[k]||0),0)/living.length:0;return{living:living.length,dead:dead.length,injured:living.filter(a=>a.injury>.05).length,meanHealth:living.length?living.reduce((n,a)=>n+(a.health??1),0)/living.length:0,meanAttack:mean("attack"),meanDefense:mean("defense"),meanAggression:mean("aggression")}}
