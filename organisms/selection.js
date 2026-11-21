// Composable selection models. Scores are observational inputs; selection never mutates organisms.
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const selectionModels={
 natural:(o)=>clamp(o.fitness??o.performance??o.survival??.5),
 environmental:(o,ctx={})=>{const target=ctx.optima||{};const traits=o.traits||{};const keys=Object.keys(target);if(!keys.length)return selectionModels.natural(o);return keys.reduce((s,k)=>s+Math.exp(-Math.abs((traits[k]??0)-target[k])/(ctx.tolerance?.[k]??.25)),0)/keys.length},
 sexual:(o,ctx={})=>clamp(ctx.matePreference?ctx.matePreference(o):o.mateAttractiveness??.5),
 frequencyDependent:(o,ctx={})=>{const count=ctx.frequencies?.[o.strategy]??0;return clamp(1-Math.abs(count-(ctx.optimalFrequency??.5)))},
 kin:(o,ctx={})=>clamp((o.directFitness??.5)+(ctx.relatedBenefit??0)*(o.relatedSuccess??0)),
 group:(o,ctx={})=>clamp(ctx.groupFitness?.[o.groupId]??o.fitness??.5),
 artificial:(o,ctx={})=>clamp(ctx.score?ctx.score(o):o.traits?.[ctx.trait]??.5),
 neutral:()=>1
};
export function evaluateSelection(organism,{models=["natural"],weights={},context={}}={}){
 const components={};let total=0,weightTotal=0;for(const name of models){const model=selectionModels[name];if(!model)throw new TypeError("Unknown selection model: "+name);const w=Math.max(0,Number(weights[name]??1));components[name]=model(organism,context);total+=components[name]*w;weightTotal+=w}
 return{score:weightTotal?total/weightTotal:1,components}
}
export function weightedChoice(items,scoreOf,random=Math.random){
 if(!items.length)return null;const scores=items.map(x=>Math.max(0,Number(scoreOf(x))||0)),sum=scores.reduce((a,b)=>a+b,0);if(sum<=0)return items[Math.floor(random()*items.length)];let r=random()*sum;for(let i=0;i<items.length;i++){r-=scores[i];if(r<=0)return items[i]}return items.at(-1)
}
export function selectParents(population,options={}){
 const scored=population.map(o=>({organism:o,...evaluateSelection(o,options)}));const choose=()=>weightedChoice(scored,x=>x.score,options.random)?.organism??null;
 return{first:choose(),second:choose(),scores:scored.map(({organism,score,components})=>({id:organism.id,score,components}))}
}
