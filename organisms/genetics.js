// Optional organism extension. Traits are inherited data, not core runtime dependencies.
export const TRAIT_KEYS=Object.freeze(["speed","perception","metabolism","fertility","hue"]);
export function inheritTraits(a,b,random=Math.random){
 const out={};for(const key of TRAIT_KEYS){const av=Number(a?.[key]??1),bv=Number(b?.[key]??av);let value=random()<.5?av:bv;if(random()<.08)value+=(random()-.5)*(key==="hue"?18:.16);out[key]=key==="hue"?Math.max(0,Math.min(360,value)):Math.max(.25,Math.min(2,value))}
 return out;
}
export function describeGenome(traits={}){return TRAIT_KEYS.map(key=>({key,value:Number(traits[key]??1)}))}
