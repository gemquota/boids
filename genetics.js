/* Shared genotype-to-phenotype expression primitives for the browser worker and Node tests. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.BoidsGenetics=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const TRAITS=Object.freeze([
    {index:0,key:'aggression',label:'Aggression',min:0,max:1,geneMin:0,geneMax:1,phenotypeMin:0,phenotypeMax:1},
    {index:1,key:'bodySize',label:'Body size',min:.55,max:1.65,geneMin:.55,geneMax:1.65,phenotypeMin:.55,phenotypeMax:1.65},
    {index:2,key:'speed',label:'Speed',min:.55,max:1.65,geneMin:.55,geneMax:1.65,phenotypeMin:.1,phenotypeMax:.5},
    {index:3,key:'biteStrength',label:'Bite strength',min:.55,max:1.65,geneMin:.55,geneMax:1.65,phenotypeMin:.55,phenotypeMax:1.65},
    {index:4,key:'kinAffinity',label:'Kin affinity',min:0,max:1,geneMin:0,geneMax:1,phenotypeMin:0,phenotypeMax:1},
    {index:5,key:'sensoryRange',label:'Perception radius',min:.55,max:1.65,geneMin:.55,geneMax:1.65,phenotypeMin:18,phenotypeMax:90},
    {index:6,key:'acceleration',label:'Acceleration',min:.55,max:1.65,geneMin:.55,geneMax:1.65,phenotypeMin:.55,phenotypeMax:1.65},
    {index:7,key:'agility',label:'Agility',min:.55,max:1.65,geneMin:.55,geneMax:1.65,phenotypeMin:.55,phenotypeMax:1.65},
    {index:8,key:'riskTolerance',label:'Risk tolerance',min:0,max:1,geneMin:0,geneMax:1,phenotypeMin:0,phenotypeMax:1},
    {index:9,key:'exploration',label:'Exploration',min:.55,max:1.65,geneMin:.55,geneMax:1.65,phenotypeMin:.55,phenotypeMax:1.65}
  ]);
  const DEFAULT_EXPRESSION=Object.freeze(Object.fromEntries(TRAITS.map(t=>[t.key,Object.freeze({
    min:t.phenotypeMin,max:t.phenotypeMax,curve:'linear',strength:2,midpoint:.5,bias:0,environmentSensitivity:0
  })])));
  const DEFAULT_MUTATION=Object.freeze(Object.fromEntries(TRAITS.map(t=>[t.key,Object.freeze({
    rate:.016,magnitude:.075,heritability:.98
  })])));
  function normalizeGene(value,trait){
    const t=typeof trait==='number'?TRAITS[trait]:trait;
    if(!t)return .5;
    return clamp((Number(value)-t.geneMin)/(t.geneMax-t.geneMin),0,1);
  }
  function shapeExpression(normalized,settings={}){
    const x=clamp(normalized+(Number(settings.bias)||0),0,1);
    const strength=clamp(Number(settings.strength)||2,.1,8);
    const midpoint=clamp(Number(settings.midpoint??.5),.01,.99);
    const curve=settings.curve||'linear';
    if(curve==='exponential')return Math.pow(x,strength);
    if(curve==='logarithmic')return Math.pow(x,1/strength);
    if(curve==='inverse')return 1-x;
    if(curve==='sigmoid'){
      const logistic=z=>1/(1+Math.exp(-strength*8*(z-midpoint)));
      const lo=logistic(0),hi=logistic(1);
      return clamp((logistic(x)-lo)/(hi-lo),0,1);
    }
    if(curve==='threshold'){
      const z=clamp((x-midpoint)/Math.max(.001,1-midpoint),0,1);
      return z*z*(3-2*z);
    }
    if(curve==='plateau')return (1-Math.exp(-strength*x))/(1-Math.exp(-strength));
    return x;
  }
  function normalizeInteractionEquations(equations=[]){
    if(!Array.isArray(equations))throw new TypeError('Gene interaction equations must be an array');
    return equations.map((equation,index)=>{
      if(!equation||!TRAITS.some(t=>t.key===equation.trait))throw new TypeError('Unknown interaction target at equation '+index);
      const terms=Array.isArray(equation.terms)?equation.terms:[];
      return Object.freeze({id:String(equation.id??('interaction-'+index)),trait:equation.trait,intercept:clamp(Number(equation.intercept)||0,-1,1),maxMagnitude:clamp(Number(equation.maxMagnitude??.25),0,1),terms:Object.freeze(terms.map((term,termIndex)=>{
        const loci=Array.isArray(term.loci)?term.loci:[];
        if(!loci.length||loci.length>4||new Set(loci).size!==loci.length||loci.some(key=>!TRAITS.some(t=>t.key===key)))throw new TypeError('Invalid interaction loci at equation '+index+', term '+termIndex);
        const coefficient=Number(term.coefficient);
        if(!Number.isFinite(coefficient))throw new TypeError('Interaction coefficient must be finite');
        return Object.freeze({loci:Object.freeze(loci.slice()),coefficient:clamp(coefficient,-1,1)});
      }))});
    });
  }
  function evaluateMultiLocusModifier(trait,normalizedLoci,equations=[]){
    const key=typeof trait==='number'?TRAITS[trait]?.key:trait;
    if(!key||!normalizedLoci)return 0;
    let value=0,limit=.25;
    for(const equation of equations){if(equation.trait!==key)continue;limit=Math.min(limit,clamp(Number(equation.maxMagnitude??.25),0,1));value+=finite(equation.intercept,0);
      for(const term of equation.terms||[]){let product=1;for(const locus of term.loci){const index=TRAITS.findIndex(t=>t.key===locus);if(index<0){product=0;break}product*=2*clamp(Number(normalizedLoci[index])||0,0,1)-1}value+=product*finite(term.coefficient,0)}
    }
    return clamp(value,-limit,limit);
  }
  function express(geneValue,trait,settings={},environment=.5,regulator=.5,multiLocusModifier=0){
    const t=typeof trait==='number'?TRAITS[trait]:TRAITS.find(x=>x.key===trait)||trait;
    if(!t)return Number(geneValue)||0;
    const normalized=normalizeGene(geneValue,t),regulatoryActivity=clamp(Number(regulator??.5),0,1);
    const shaped=clamp(shapeExpression(normalized+(regulatoryActivity-.5)*.35,settings)+clamp(Number(multiLocusModifier)||0,-1,1),0,1);
    const min=Number.isFinite(+settings.min)?+settings.min:t.phenotypeMin;
    const max=Math.max(min+1e-6,Number.isFinite(+settings.max)?+settings.max:t.phenotypeMax);
    const sensitivity=clamp((Number(settings.environmentSensitivity)||0)*(.5+regulatoryActivity),0,2);
    const env=clamp(Number(environment)||0,0,1);
    const modulated=clamp(shaped+(env-.5)*sensitivity,0,1);
    return min+modulated*(max-min);
  }
  function perceptionRadius(expresssedRadius){return Math.max(1,Number(expresssedRadius)||1)}
  function foodSenseRange(expresssedRadius,foodRangeScale,minRange){return Math.max(Number(minRange)||0,perceptionRadius(expresssedRadius)*(Number(foodRangeScale)||0))}
  function kinProtection(relatedness,affinityGene){return clamp(Number(relatedness)||0,0,1)*clamp(Number(affinityGene)||0,0,1)}
  function explorationNoise(baseNoise,explorationGene){return Math.max(0,Number(baseNoise)||0)*(.5+clamp(Number(explorationGene)||1,.55,1.65))}
  function foodSteering(baseSteering,explorationGene){return Math.max(0,Number(baseSteering)||0)*(1.5-clamp(Number(explorationGene)||1,.55,1.65)*.5)}
  function inheritTrait(maternal,paternal,trait,mutation={},random=Math.random){
    const t=typeof trait==='number'?TRAITS[trait]:TRAITS.find(x=>x.key===trait);
    if(!t)return Number(maternal)||0;
    const h=clamp(Number(mutation.heritability??.98),0,1);
    const rate=clamp(Number(mutation.rate??.016),0,1);
    const magnitude=clamp(Number(mutation.magnitude??.075),0,1);
    const span=t.geneMax-t.geneMin;
    let value=(Number(maternal)+Number(paternal))*.5;
    value+=(random()*2-1)*span*(1-h)*.1;
    if(random()<rate)value+=(random()*2-1)*span*magnitude;
    return clamp(value,t.geneMin,t.geneMax);
  }
  return Object.freeze({TRAITS,DEFAULT_EXPRESSION,DEFAULT_MUTATION,normalizeGene,shapeExpression,normalizeInteractionEquations,evaluateMultiLocusModifier,express,inheritTrait,perceptionRadius,foodSenseRange,kinProtection,explorationNoise,foodSteering});
});
