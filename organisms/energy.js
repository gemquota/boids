// Per-organism energy economics. Costs are explicit and observable, not hidden in one metabolism scalar.
export function calculateEnergyCost(agent,dt=1,tick=0){
 const t=agent.traits||{},p=agent.phenotype||{},speed=Math.hypot(agent.vx||0,agent.vy||0),mass=Math.max(.2,agent.mass||p.mass||1);
 const hunger=agent.energy<.55?1+(.55-agent.energy)*3.2:1;
 const basal=.00011*(t.metabolism??1)*hunger*dt;
 const tissue=.000035*mass*dt;
 const nodes=agent.neural?.nodes?.length||0,connections=agent.neural?.connections?.filter(c=>c.enabled!==false).length||0;
 const brain=(nodes*.000001+connections*.0000005)*dt;
 const vision=(agent.senses?.length||0)*.00001*(t.visionRange??1)*dt;
 const movement=.000032*speed*speed*mass*hunger*dt;
 const aggression=.000003*(t.aggression??0)*dt;
 const attack=agent.lastAttackTick===tick?.000012*(t.attackCost??1):0;
 const reproduction=.000008*(t.sexDrive??1)*dt;
 const maintenance=.000035*mass*hunger*dt;
 const total=basal+tissue+brain+vision+movement+aggression+attack+reproduction+maintenance;
 return{total,basal,tissue,brain,vision,movement,aggression,attack,reproduction,maintenance};
}
export function addEnergyLedger(world,costs){
 world.energySpent||={};for(const [key,value] of Object.entries(costs||{}))if(key!=="total")world.energySpent[key]=(world.energySpent[key]||0)+value;
 world.energySpent.total=(world.energySpent.total||0)+(costs?.total||0);
}
export function energySummary(world){return{...(world.energySpent||{}),total:(world.energySpent||{}).total||0}}
