export function applyThermalStress(agent,environment,nearby=0,dt=1,parameters={}){
 const warmth=Math.min(.96,Math.max(0,nearby)*parameters.huddleWarmth),cold=Math.max(0,parameters.coldThreshold-environment.temperature),heatLoss=cold*(1-warmth)*parameters.coldHeatLoss*dt;
 agent.bodyHeat=Math.max(0,Math.min(1,(agent.bodyHeat??.7)-heatLoss+(environment.daylight>.35?parameters.dayHeatGain*dt:0)+warmth*.0012*dt));
 agent.coldStress=Math.max(0,cold-warmth*.85);
 if(agent.coldStress>.08)agent.energy=Math.max(0,agent.energy-agent.coldStress*parameters.coldDamage*dt);
 return agent.coldStress;
}
