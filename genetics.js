/* Shared genetic expression primitives for the browser worker and Node tests. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BoidsGenetics=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const TRAITS=Object.freeze([
    {index:0,key:'aggression',label:'Aggression',min:0,max:1},
    {index:1,key:'bodySize',label:'Body size',min:.55,max:1.65},
    {index:2,key:'speed',label:'Speed',min:.55,max:1.65},
    {index:3,key:'biteStrength',label:'Bite strength',min:.55,max:1.65},
    {index:4,key:'kinAffinity',label:'Kin affinity',min:0,max:1},
    {index:5,key:'sensoryRange',label:'Sensory range',min:.55,max:1.65},
    {index:6,key:'acceleration',label:'Acceleration',min:.55,max:1.65},
    {index:7,key:'agility',label:'Agility',min:.55,max:1.65},
    {index:8,key:'riskTolerance',label:'Risk tolerance',min:0,max:1},
    {index:9,key:'exploration',label:'Exploration',min:.55,max:1.65}
  ]);
  function perceptionRadius(base,rangeGene){return base*clamp(Number(rangeGene)||1,.55,1.65)}
  function foodSenseRange(basePerception,rangeGene,foodRangeScale,minRange){return Math.max(Number(minRange)||0,perceptionRadius(basePerception,rangeGene)*(Number(foodRangeScale)||0))}
  function kinProtection(relatedness,affinityGene){return clamp(Number(relatedness)||0,0,1)*clamp(Number(affinityGene)||0,0,1)}
  function explorationNoise(baseNoise,explorationGene){return Math.max(0,Number(baseNoise)||0)*(.5+clamp(Number(explorationGene)||1,.55,1.65))}
  function foodSteering(baseSteering,explorationGene){return Math.max(0,Number(baseSteering)||0)*(1.5-clamp(Number(explorationGene)||1,.55,1.65)*.5)}
  return Object.freeze({TRAITS,perceptionRadius,foodSenseRange,kinProtection,explorationNoise,foodSteering});
});
