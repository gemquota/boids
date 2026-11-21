// Expanded heritable boid phenotype. Traits drive both physical form and organism economics.
export const TRAIT_DEFAULTS=Object.freeze({
 speed:1,perception:1,metabolism:1,fertility:1,hue:195,size:1,mass:1,
 aggression:.45,attack:1,damage:.55,defense:1,attackSpeed:1,tracking:.7,
 sexDrive:.55,flee:1,visionRange:1,visionArc:1,maneuverability:1,attackCost:1
});
export const TRAIT_KEYS=Object.freeze(Object.keys(TRAIT_DEFAULTS));
const LIMITS={hue:[0,360],speed:[.35,2.4],perception:[.35,2.2],metabolism:[.3,2.4],fertility:[.2,2],size:[.45,1.8],mass:[.35,2.4],aggression:[0,2],attack:[.25,2.5],damage:[.15,2.5],defense:[.25,2.5],attackSpeed:[.25,2.5],tracking:[.1,2],sexDrive:[0,2],flee:[0,2],visionRange:[.3,2.2],visionArc:[.35,1.5],maneuverability:[.25,2.2],attackCost:[.25,2.5]};
export function createTraits(random=Math.random){
 const out={};for(const key of TRAIT_KEYS){const [lo,hi]=LIMITS[key];const base=TRAIT_DEFAULTS[key];out[key]=key==="hue"?Math.max(0,Math.min(360,base+(random()-.5)*90)):Math.max(lo,Math.min(hi,base*(.72+random()*.56)))}return out;
}
export function inheritTraits(a,b,random=Math.random){
 const out={};for(const key of TRAIT_KEYS){const [lo,hi]=LIMITS[key],av=Number(a?.[key]??TRAIT_DEFAULTS[key]),bv=Number(b?.[key]??av);let value=random()<.5?av:bv;
  if(random()<.11)value+=(random()-.5)*(key==="hue"?28:Math.max(.08,(hi-lo)*.11));
  out[key]=key==="hue"?((value%360)+360)%360:Math.max(lo,Math.min(hi,value));
 }
 // Explicit biomechanical trade-offs: tiny fast forms are light but pay higher mass-normalised upkeep.
 const size=out.size;out.mass=Math.max(.35,Math.min(2.4,out.mass*.65+size*.35));
 out.speed=Math.max(.35,Math.min(2.4,out.speed*(1.08-.12*size)));
 out.metabolism=Math.max(.3,Math.min(2.4,out.metabolism*(.72+.28/Math.max(.5,size))*(.82+.18*out.speed)));
 return out;
}
export function phenotype(traits={}){
 const t={...TRAIT_DEFAULTS,...traits},size=t.size;
 return{radius:2.8*size,mass:Math.max(.25,t.mass*size*size),length:2.2*size*(.8+t.attack*.24),width:1.6*size*(.75+t.defense*.3),metabolicCost:t.metabolism*(.72+.28/Math.max(.4,size))*(.85+.15*t.speed),attackPower:t.attack*t.damage,turnRate:t.maneuverability/(.65+size*.35)};
}
export function describeGenome(traits={}){return TRAIT_KEYS.map(key=>({key,value:Number(traits[key]??TRAIT_DEFAULTS[key])}))}
