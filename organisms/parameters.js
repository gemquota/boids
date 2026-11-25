export const DEFAULT_SETTINGS=Object.freeze({
 selectionModel:"natural",environment:"temperate",separation:24,alignment:.035,cohesion:.0018,separationForce:.035,
 population:48,perception:76,maxSpeed:10,speed:1,
 visionRays:21,visionFov:120,visionPrecision:1,visionMemory:.985,visionUpdate:1,visionNoise:0,
 plantDensity:2.5,foodAbundance:1.9,
 birthInterval:48,broodSize:7,
 nightCooling:.42,coldThreshold:.3,coldDamage:.00015,coldHeatLoss:.00045,huddleWarmth:.24,dayHeatGain:.00035,thirstRate:.00022
});
export const PARAMETER_GROUPS=Object.freeze([
 {name:"Population & movement",items:[
  {key:"population",label:"Starting population",min:10,max:1200,step:10,unit:"organisms"},
  {key:"maxSpeed",label:"Movement speed ceiling",min:1,max:10,step:.1},
  {key:"perception",label:"Vision range",min:20,max:300,step:1,unit:"world units"},
  {key:"visionRays",label:"Vision ray count",min:3,max:64,step:1},
  {key:"visionFov",label:"Vision field of view",min:30,max:240,step:1,unit:"degrees"},
  {key:"visionPrecision",label:"Vision precision",min:.5,max:2.5,step:.05},
  {key:"visionMemory",label:"Vision memory persistence",min:.9,max:.999,step:.001},
  {key:"visionUpdate",label:"Vision update interval",min:1,max:12,step:1,unit:"ticks"},
  {key:"visionNoise",label:"Detection noise",min:0,max:12,step:.1},
  {key:"speed",label:"Simulation rate",min:.25,max:3,step:.25,unit:"×"}
 ]},
 {name:"Food & vegetation",items:[
  {key:"plantDensity",label:"Vegetation density",min:.25,max:2.5,step:.05},
  {key:"foodAbundance",label:"Plant food yield",min:.5,max:3,step:.1}
 ]},
 {name:"Survival & climate",items:[
  {key:"nightCooling",label:"Night-time cooling",min:.1,max:.8,step:.01},
  {key:"coldThreshold",label:"Cold stress threshold",min:0,max:.8,step:.01},
  {key:"coldDamage",label:"Cold energy damage",min:0,max:.001,step:.00001},
  {key:"coldHeatLoss",label:"Body heat loss",min:0,max:.003,step:.00005},
  {key:"huddleWarmth",label:"Warmth per nearby organism",min:0,max:.5,step:.01},
  {key:"dayHeatGain",label:"Daylight body-heat recovery",min:0,max:.002,step:.00005},
  {key:"thirstRate",label:"Thirst accumulation",min:0,max:.001,step:.00001}
 ]},
 {name:"Reproduction",items:[
  {key:"birthInterval",label:"Reproduction interval",min:24,max:180,step:6,unit:"ticks"},
  {key:"broodSize",label:"Brood size",min:2,max:12,step:1,unit:"offspring"}
 ]}
]);
export function resolveSettings(saved={}){
 const result={...DEFAULT_SETTINGS},bounds={};
 for(const group of PARAMETER_GROUPS)for(const p of group.items){
  const candidate=saved.bounds?.[p.key]||{},min=Number(candidate.min),max=Number(candidate.max);
  const legacyRange=(p.key==="maxSpeed"&&min===.4&&max===3)||(p.key==="perception"&&min===20&&max===150);
  const valid=Number.isFinite(min)&&Number.isFinite(max)&&min<max&&!legacyRange;
  bounds[p.key]=valid?{min,max}:{min:p.min,max:p.max};
  const value=Number(saved[p.key]);
  if(Number.isFinite(value))result[p.key]=Math.max(bounds[p.key].min,Math.min(bounds[p.key].max,value));
 }
 // Migrate the old default speed ceiling instead of silently preserving its obsolete .78 value.
 if(saved.maxSpeed===.78)result.maxSpeed=10;
 result.bounds=bounds;
 if(["natural","environmental","neutral"].includes(saved.selectionModel))result.selectionModel=saved.selectionModel;
 if(["temperate","tropical","arid","alpine","wetland"].includes(saved.environment))result.environment=saved.environment;
 return result;
}
