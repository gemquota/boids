// Physical predator/prey encounters. Operates as an optional organism system after Core movement.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const radius=a=>Math.max(2,(a.radius||a.traits?.size||3)*(a.massScale||1));
const randOf=(rng)=>rng();
export function updateCombat(world,dt=1,{random=Math.random,collisionRestitution=.42,injuryRecovery=.0008,consumeRate=.012}={}){
 const agents=world.agents,byId=new Map(agents.map(a=>[a.id,a])),events=world.combatEvents||(world.combatEvents=[]);
 let hits=0,kills=0,consumed=0;world.detritus??=0;world.sicknessEvents??=0;
 for(const a of agents){
  a.health??=1;a.injury??=0;a.dead??=false;a.attackCooldown=Math.max(0,(a.attackCooldown||0)-dt);
  if(a.dead){a.vx=0;a.vy=0;a.energy=0;a.rot??=0;a.sickness??=0;if(a.consumedBy!=null&&a.consumedBy!==-1){const killer=byId.get(a.consumedBy);if(killer){const bite=Math.min(a.mass||1,consumeRate*dt*(killer.traits?.attackSpeed||1));a.mass=Math.max(0,(a.mass||1)-bite);killer.mass=(killer.mass||1)+bite*.82;killer.massScale=Math.cbrt(killer.mass/Math.max(.01,killer.baseMass||1));killer.energy=Math.min(3,(killer.energy||0)+bite*.72);killer.health=Math.min(1,(killer.health||1)+bite*.08);consumed+=bite;if(a.mass<=.015){killer.consumedMass=(killer.consumedMass||0)+(a.initialMass||1);killer.attachedPrey=null;a.consumedBy=-1}}}if(a.consumedBy==null&&a.mass>.015&&world.tick-(a.deathTick||world.tick)<900){const scavenger=agents.find(k=>!k.dead&&k.id!==a.id&&Math.hypot(k.x-a.x,k.y-a.y)<radius(k)+radius(a)+5);if(scavenger){const bite=Math.min(a.mass,.006*dt*(scavenger.traits?.tracking||1));a.mass-=bite;scavenger.energy=Math.min(3,(scavenger.energy||0)+bite*.62);scavenger.mass=(scavenger.mass||1)+bite*.3;scavenger.massScale=Math.cbrt(scavenger.mass/Math.max(.01,scavenger.baseMass||1));consumed+=bite}}const age=Math.max(0,world.tick-(a.deathTick||world.tick));a.rot=Math.min(1,Math.max(0,(age-900)/5200));if(a.rot>0){const decay=Math.min(a.mass||0,(a.initialMass||1)*(.000025+.00011*a.rot)*dt);a.mass=Math.max(0,(a.mass||0)-decay);world.detritus+=decay;if(a.mass<=.01){a.consumedBy=-1;a.decomposed=true}}if(a.rot>.12&&random()<(.000015+a.rot*.00012)*dt){a.sickness=Math.min(1,(a.sickness||0)+.12);world.sicknessEvents++}continue}
  a.injury=Math.max(0,a.injury-injuryRecovery*dt);a.health=Math.min(1,a.health+injuryRecovery*.15*dt);if(a.attachedPrey!=null){const corpse=byId.get(a.attachedPrey);if(corpse?.dead){a.x=corpse.x;a.y=corpse.y;a.vx=0;a.vy=0}else a.attachedPrey=null}
 }
 // Spatial hash prevents an all-pairs cost as the ecosystem grows.
 const cell=28,cols=Math.max(1,Math.ceil(world.width/cell)),rows=Math.max(1,Math.ceil(world.height/cell)),grid=new Map();for(const a of agents){if(a.dead)continue;const key=Math.floor(a.x/cell)+":"+Math.floor(a.y/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(a)}
 const seen=new Set();
 for(const a of agents){if(a.dead)continue;const gx=Math.floor(a.x/cell),gy=Math.floor(a.y/cell);
  for(let y=gy-1;y<=gy+1;y++)for(let x=gx-1;x<=gx+1;x++)for(const b of grid.get((((x%cols)+cols)%cols)+":"+(((y%rows)+rows)%rows))||[]){
   if(a.id>=b.id)continue;const key=a.id+":"+b.id;if(seen.has(key))continue;seen.add(key);
   let dx=b.x-a.x,dy=b.y-a.y;if(dx>world.width/2)dx-=world.width;if(dx< -world.width/2)dx+=world.width;if(dy>world.height/2)dy-=world.height;if(dy< -world.height/2)dy+=world.height;let d=Math.hypot(dx,dy)||.001,min=radius(a)+radius(b);if(d>=min)continue;
   const nx=dx/d,ny=dy/d,overlap=min-d;
   // Mass-weighted positional correction and damped elastic response.
   const ma=Math.max(.2,a.mass||1),mb=Math.max(.2,b.mass||1),sum=ma+mb;
   a.x-=nx*overlap*(mb/sum);a.y-=ny*overlap*(mb/sum);b.x+=nx*overlap*(ma/sum);b.y+=ny*overlap*(ma/sum);a.x=(a.x+world.width)%world.width;a.y=(a.y+world.height)%world.height;b.x=(b.x+world.width)%world.width;b.y=(b.y+world.height)%world.height;
   const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(rel<0){const impulse=-(1+collisionRestitution)*rel/(1/ma+1/mb);a.vx-=impulse*nx/ma;a.vy-=impulse*ny/ma;b.vx+=impulse*nx/mb;b.vy+=impulse*ny/mb}
   const ta=a.traits||{},tb=b.traits||{},aTarget=(a.senses||[]).some(s=>s.visible&&s.targetId===b.id),bTarget=(b.senses||[]).some(s=>s.visible&&s.targetId===a.id);
   const aAgg=ta.aggression||0,bAgg=tb.aggression||0;
   if(aTarget&&a.attackCooldown<=0&&!b.dead&&(ta.carnivory||0)>.18){strike(a,b,random,1,world.tick);a.attackCooldown=1/Math.max(.2,ta.attackSpeed||1);hits++}
   if(bTarget&&b.attackCooldown<=0&&!a.dead&&(tb.carnivory||0)>.18){strike(b,a,random,1,world.tick);b.attackCooldown=1/Math.max(.2,tb.attackSpeed||1);hits++}
   // Head-on defensive clashes: both commit to the contact; the better attack/defence balance wins probabilistically.
   if((ta.carnivory||0)>.18&&(tb.carnivory||0)>.18&&aAgg>.55&&bAgg>.55&&((a.vx*nx+a.vy*ny)/(Math.hypot(a.vx,a.vy)||1)>.5)&&((b.vx*-nx+b.vy*-ny)/(Math.hypot(b.vx,b.vy)||1)>.5)&&randOf(random)<.22){
    const sa=(ta.attack||1)*(0.5+randOf(random))-(tb.defense||1)*.35,sb=(tb.attack||1)*(0.5+randOf(random))-(ta.defense||1)*.35;
    if(sa>sb)strike(a,b,random,.65,world.tick);else if(sb>sa)strike(b,a,random,.65,world.tick);else{strike(a,b,random,.3,world.tick);strike(b,a,random,.3,world.tick)}hits++;
   }
  }
 }
 for(const a of agents){if(!a.dead&&agents.some(c=>c.dead&&c.rot>.12&&Math.hypot(c.x-a.x,c.y-a.y)<18)&&random()<.000018*dt){a.sickness=Math.min(1,(a.sickness||0)+.08);a.health=Math.max(0,(a.health||1)-.003)}if(a.sickness>.05&&!a.dead){a.health=Math.max(0,(a.health||1)-a.sickness*.00008*dt);a.energy=Math.max(0,(a.energy||0)-a.sickness*.00012*dt)}if(a.health<=0&&!a.dead){a.dead=true;a.vx=0;a.vy=0;a.deathTick=world.tick;a.rot=0;a.sickness??=0;a.mass??=1;a.initialMass??=a.mass;world.deaths=(world.deaths||0)+1;kills++;const killer=agents.find(k=>(k.senses||[]).some(s=>s.visible&&s.targetId===a.id)&&!k.dead);if(killer){a.consumedBy=killer.id;killer.attachedPrey=a.id;killer.energy=Math.min(3,killer.energy+.28)}}}
 world.totalPredation=(world.totalPredation||0)+hits;world.totalKills=(world.totalKills||0)+kills;world.totalConsumed=(world.totalConsumed||0)+consumed;world.combat={hits,kills,consumed,totalPredation:world.totalPredation,totalKills:world.totalKills,population:agents.filter(a=>!a.dead).length,injured:agents.filter(a=>!a.dead&&a.injury>.05).length,biomass:agents.filter(a=>a.dead).reduce((n,a)=>n+(a.mass||0),0)};
 if(events.length>500)events.splice(0,events.length-500);
 return world.combat;
}
function strike(attacker,prey,random,multiplier=1,tick=0){
 const at=attacker.traits||{},pt=prey.traits||{},damage=Math.max(.015,(at.damage||.4)*(at.attack||1)*multiplier/(1+(pt.defense||1)*.45));
 prey.health=Math.max(0,(prey.health??1)-damage);prey.injury=Math.min(1,(prey.injury||0)+damage*.8);
 const flee=Math.max(0,(pt.flee||1)*(pt.speed||1)-at.tracking*.2);
 if(random()<clamp(.18+flee*.13,0,.78)){prey.fleeing=true;prey.vx+=(prey.x-attacker.x)*.012;prey.vy+=(prey.y-attacker.y)*.012}
 attacker.energy=Math.max(0,attacker.energy-.00035*(at.attackCost||1));attacker.lastAttack=prey.id;attacker.lastAttackTick=tick;
}
export function combatSummary(agents){const living=agents.filter(a=>!a.dead),dead=agents.filter(a=>a.dead),mean=k=>living.length?living.reduce((n,a)=>n+(a.traits?.[k]||0),0)/living.length:0;return{living:living.length,dead:dead.length,injured:living.filter(a=>a.injury>.05).length,meanHealth:living.length?living.reduce((n,a)=>n+(a.health??1),0)/living.length:0,meanAttack:mean("attack"),meanDefense:mean("defense"),meanAggression:mean("aggression")}}
