/* Shared organism energy economics and persistent bonding primitives.
 * Pure functions only: the worker owns state, RNG, and scheduling.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BoidsEconomics=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function calculateEnergyCostsInto(out={},input={},settings={}){
    const mass=Math.max(.05,finite(input.bodyMass,1)),speed=Math.max(0,finite(input.speed,0)),maxSpeed=Math.max(.01,finite(input.maxSpeed,1));
    const acceleration=Math.max(0,finite(input.acceleration,0)),limbLoad=Math.max(0,finite(input.limbLoad,0));
    const nodes=Math.max(0,finite(input.brainNodes,0)),edges=Math.max(0,finite(input.brainConnections,0));
    const visionRange=Math.max(0,finite(input.visionRange,0)),visionArc=clamp(finite(input.visionArc,Math.PI),0,Math.PI*2);
    const rays=clamp(finite(input.visionRays,16),0,128),pollingHz=clamp(finite(input.pollingHz,10),0,120);
    const bondLoad=Math.max(0,finite(input.bondLoad,0)),aggression=clamp(finite(input.aggression,0),0,2);
    const reproductiveLoad=Math.max(0,finite(input.reproductiveLoad,0)),environmental=Math.max(0,finite(input.environmentalMultiplier,1));
    const metabolic=Math.max(0,finite(settings.metabolicRate,1)),adult=Math.max(0,finite(settings.adultMaintenance,1));
    const brainActivity=Math.max(0,finite(settings.brainActivity,1)),speedRatio=clamp(speed/maxSpeed,0,1),basal=Math.max(0,finite(input.basalCost,.00004));
    const tissue=mass**.75*.0000018,brain=(nodes*.000000055+edges*.000000018)*brainActivity;
    const vision=(visionRange/90)*(visionArc/(Math.PI*2))*(rays/16)*(pollingHz/10)*.0000011;
    const limbs=limbLoad*.0000016,bonding=bondLoad*.00000125;
    const aggressionCost=aggression*Math.max(0,finite(settings.attackCost,.1))*.000003,reproduction=reproductiveLoad*.0000025;
    const locomotion=(speed*speed*.000012+acceleration*acceleration*.0000007)*mass*(1+5*speedRatio**3)*(1+limbLoad*.025);
    const basalTotal=basal*metabolic*adult*environmental,tissueTotal=tissue*metabolic*adult*environmental;
    const brainTotal=brain*metabolic*adult*environmental,visionTotal=vision*metabolic*adult*environmental;
    const limbTotal=limbs*metabolic*adult*environmental,bondingTotal=bonding*metabolic*adult*environmental;
    const aggressionTotal=aggressionCost*metabolic*adult*environmental,reproductionTotal=reproduction*metabolic*adult*environmental;
    const maintenance=basalTotal+tissueTotal+brainTotal+visionTotal+limbTotal+bondingTotal+aggressionTotal+reproductionTotal,movement=locomotion*metabolic;
    out.basal=basalTotal;out.tissue=tissueTotal;out.brain=brainTotal;out.vision=visionTotal;out.limbs=limbTotal;
    out.bonding=bondingTotal;out.aggression=aggressionTotal;out.reproduction=reproductionTotal;
    out.locomotion=movement;out.maintenance=maintenance;out.movement=movement;out.total=maintenance+movement;
    return out;
  }
  function calculateEnergyCosts(input={},settings={}){return calculateEnergyCostsInto({},input,settings)}


  function calculateConstructionCost(input={}){
    const mass=Math.max(.05,finite(input.bodyMass,1));
    const limbLoad=Math.max(0,finite(input.limbLoad,0));
    const nodes=Math.max(0,finite(input.brainNodes,0));
    const edges=Math.max(0,finite(input.brainConnections,0));
    const visionLoad=Math.max(0,finite(input.visionLoad,0));
    const bondingSites=Math.max(0,finite(input.bondingSites,0));
    return {tissue:mass*.0012,limbs:limbLoad*.00022,brain:nodes*.000045+edges*.000012,
      vision:visionLoad*.00016,bonding:bondingSites*.00018,
      total:mass*.0012+limbLoad*.00022+nodes*.000045+edges*.000012+visionLoad*.00016+bondingSites*.00018};
  }

  function pairKey(a,b){const x=String(a),y=String(b);return x<y?x+'|'+y:y+'|'+x}
  function normalizeBond(input={}){
    const kind=['mutualistic','commensal','parasitic','altruistic'].includes(input.kind)?input.kind:'mutualistic';
    const targetType=input.targetType==='plant'?'plant':'agent';
    return {a:Math.max(0,Math.floor(finite(input.a,0))),b:Math.max(0,Math.floor(finite(input.b,0))),
      targetType,sideA:input.sideA==='right'?'right':'left',...(targetType==='agent'?{sideB:input.sideB==='right'?'right':'left'}:{}),
      kind,strength:clamp(finite(input.strength,.1),0,1),age:Math.max(0,finite(input.age,0)),
      createdAt:Math.max(0,finite(input.createdAt,0))};
  }
  function countBonds(links,agentId){return (links||[]).reduce((n,b)=>n+(b.a===agentId||(b.targetType==='agent'&&b.b===agentId)?1:0),0)}
  function bondLoad(links,agentId){return (links||[]).reduce((n,b)=>n+((b.a===agentId||(b.targetType==='agent'&&b.b===agentId))?b.strength:0),0)}
  function hasBond(links,a,b,targetType='agent'){return (links||[]).some(v=>v.targetType===targetType&&((v.a===a&&v.b===b)||(targetType==='agent'&&v.a===b&&v.b===a)))}
  function pruneBonds(links,aliveAgents,alivePlants){
    const agents=aliveAgents instanceof Set?aliveAgents:new Set(aliveAgents||[]);
    const plants=alivePlants instanceof Set?alivePlants:new Set(alivePlants||[]);
    return (links||[]).filter(b=>b&&b.a>0&&agents.has(b.a)&&b.strength>.025&&(b.targetType==='plant'?plants.has(b.b):b.b>0&&agents.has(b.b)));
  }
  return Object.freeze({calculateEnergyCosts,calculateEnergyCostsInto,calculateConstructionCost,pairKey,normalizeBond,countBonds,bondLoad,hasBond,pruneBonds});
});
