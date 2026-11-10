/* Shared declarative schema for generated simulation controls. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BoidsConfigSchema=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const extraSliderDefs=[["flockNoise","Flocking noise","0","0.4","0.01","0.08","Movement"],["alignmentMemory","Alignment persistence","0.2","1.5","0.05","0.9","Movement"],["cohesionBias","Cohesion bias","0.2","1.5","0.05","1","Movement"],["separationExponent","Separation falloff","0.5","2","0.05","1","Movement"],["neighbourDensityScale","Neighbour density sensitivity","0.5","2","0.05","1","Movement"],["flowDrift","Current drift multiplier","0.2","2","0.05","1","Water dynamics"],["eddyFrequency","Eddy frequency","0.5","2","0.05","1","Water dynamics"],["foodRegrowth","Food regrowth multiplier","0","2","0.05","1","Water dynamics"],["foodDepletion","Food depletion multiplier","0.2","2","0.05","1","Water dynamics"],["foodCompetition","Food energy yield multiplier","0","2","0.05","1","Water dynamics"],["mateDriveNoise","Mate drive variation","0","0.5","0.01","0.12","Reproduction"],["mateDistanceBias","Mate proximity weighting","0","2","0.05","1","Reproduction"],["mutationDrift","Mutation drift","0","0.3","0.01","0.04","Genetic variation"],["rewireChance","Connection rewiring chance","0.05","0.5","0.01","0.18","Genetic variation"],["lineageDrift","Lineage variation","0","0.5","0.01","0.08","Genetic variation"],["neuralNoise","Neural output noise","0","0.5","0.01","0.04","Neural dynamics"],["neuralInertia","Neural turn damping","0","0.9","0.01","0.25","Neural dynamics"],["learningMomentum","Plasticity multiplier","0","0.8","0.01","0.2","Neural dynamics"],["sensoryNoise","Sensory noise","0","0.3","0.01","0.03","Neural dynamics"],["juvenileGrowth","Juvenile ageing multiplier","0.5","2","0.05","1","Life history"],["adultMaintenance","Adult maintenance cost","0.5","2","0.05","1","Life history"],["attackRangeScale","Attack and detection range scale","0.5","3","0.05","1.25","Predation phenotype"],].map(([id,label,min,max,step,value,group])=>({id,label,min:Number(min),max:Number(max),step:Number(step),value:Number(value),group}));
  const expressionTraits=[
 {key:'aggression',label:'Aggression',min:0,max:1,upper:1.2,rate:.04,magnitude:.11,heritability:.96},
 {key:'bodySize',label:'Body size',min:.55,max:1.65,upper:3,rate:.04,magnitude:.11,heritability:.96},
 {key:'speed',label:'Speed',min:.1,max:.5,upper:8,rate:.04,magnitude:.11,heritability:.96},
 {key:'biteStrength',label:'Bite strength',min:.55,max:1.65,upper:3,rate:.04,magnitude:.11,heritability:.96},
 {key:'kinAffinity',label:'Kin affinity',min:0,max:1,upper:1.2,rate:.04,magnitude:.11,heritability:.96},
 {key:'sensoryRange',label:'Perception radius',min:18,max:90,upper:180,rate:.04,magnitude:.11,heritability:.96},
 {key:'acceleration',label:'Acceleration',min:.55,max:1.65,upper:3,rate:.04,magnitude:.11,heritability:.96},
 {key:'agility',label:'Agility',min:.55,max:1.65,upper:3,rate:.04,magnitude:.11,heritability:.96},
 {key:'riskTolerance',label:'Risk tolerance',min:0,max:1,upper:1.2,rate:.04,magnitude:.11,heritability:.96},
 {key:'exploration',label:'Exploration',min:.55,max:1.65,upper:3,rate:.04,magnitude:.11,heritability:.96}
];
  const expressionFields=[
 {key:'min',label:'Phenotype minimum',lo:0,step:.01},
 {key:'max',label:'Phenotype maximum',lo:0,step:.01},
 {key:'strength',label:'Curve strength',lo:.1,hi:8,step:.05,value:2},
 {key:'midpoint',label:'Curve midpoint',lo:.01,hi:.99,step:.01,value:.5},
 {key:'bias',label:'Expression bias',lo:-.5,hi:.5,step:.01,value:0},
 {key:'environmentSensitivity',label:'Environmental sensitivity',lo:0,hi:1,step:.01,value:0}
];
  const expressionMutationFields=[
 {key:'rate',label:'Mutation rate',lo:0,hi:.2,step:.001,value:.016},
 {key:'magnitude',label:'Mutation magnitude',lo:0,hi:.5,step:.005,value:.075},
 {key:'heritability',label:'Heritability / inheritance fidelity',lo:0,hi:1,step:.01,value:.98}
];
  const expressionCurves=[['linear','Linear'],['exponential','Exponential'],['logarithmic','Logarithmic'],['sigmoid','Sigmoid'],['threshold','Threshold'],['plateau','Plateau'],['inverse','Inverse']];
  const freeze=list=>Object.freeze(list.map(item=>Object.freeze(item)));
  return Object.freeze({
    extraSliderDefs:freeze(extraSliderDefs),
    expressionTraits:freeze(expressionTraits),
    expressionFields:freeze(expressionFields),
    expressionMutationFields:freeze(expressionMutationFields),
    expressionCurves:freeze(expressionCurves.map(([value,label])=>({value,label})))
  });
});
