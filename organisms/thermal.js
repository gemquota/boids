export function coldMovementMultiplier(hour,temperature,threshold,parameters={}){
 if(temperature>=threshold)return 1;
 const h=((hour%24)+24)%24;
 if(h<6)return parameters.nightMovementMultiplier??.25;
 if(h>=18)return parameters.eveningMovementMultiplier??.5;
 return 1;
}

export function applyThermalStress(agent,environment,nearby=0,dt=1,parameters={}){
 const warmth=Math.min(.96,Math.max(0,nearby)*parameters.huddleWarmth),cold=Math.max(0,parameters.coldThreshold-environment.temperature),heatLoss=cold*(1-warmth)*parameters.coldHeatLoss*dt/Math.max(.1,parameters.bodyHeatCapacity||1);
 agent.bodyHeat=Math.max(0,Math.min(1,(agent.bodyHeat??.7)-heatLoss+(environment.daylight>.35?parameters.dayHeatGain*dt:0)+warmth*.0012*dt));
 agent.coldStress=Math.max(0,cold/Math.max(.1,parameters.coldResistance||1)-warmth*.85);
 if(agent.coldStress>.08){
  // Apply cold damage in discrete events so each event has a readable visual response.
  agent.coldDamageClock=(agent.coldDamageClock||0)+dt;
  if(agent.coldDamageClock>=(parameters.coldDamageInterval??8)){
   const damage=agent.coldStress*parameters.coldDamage*agent.coldDamageClock;
   agent.energy=Math.max(0,agent.energy-damage);
   agent.coldDamageClock=0;
   if(damage>0){agent.coldDamageEvent=(agent.coldDamageEvent||0)+1;agent.coldVisualAge=agent.age||0;}
  }
 }else agent.coldDamageClock=0;
 return agent.coldStress;
}

// Build a compact local huddle target from only the nearest few neighbours.
// Capping membership prevents a population-wide centroid from becoming a
// single attractive point that drags every organism into one pile.
export function localHuddleTarget(agent,agents,radius=125,maxNeighbours=5,spacing=26){
 const neighbours=agents.filter(other=>other!==agent&&!other.dead)
  .map(other=>({other,d:Math.hypot(other.x-agent.x,other.y-agent.y)}))
  .filter(item=>item.d>0&&item.d<=radius)
  .sort((a,b)=>a.d-b.d).slice(0,maxNeighbours);
 if(neighbours.length<2)return null;
 const cx=neighbours.reduce((sum,item)=>sum+item.other.x,0)/neighbours.length;
 const cy=neighbours.reduce((sum,item)=>sum+item.other.y,0)/neighbours.length;
 let dx=agent.x-cx,dy=agent.y-cy,d=Math.hypot(dx,dy);
 if(d<.001){const angle=(agent.id||0)*2.399963229728653;dx=Math.cos(angle);dy=Math.sin(angle);d=1}
 return{x:cx+dx/d*spacing,y:cy+dy/d*spacing,count:neighbours.length,cx,cy};
}
