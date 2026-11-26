export const DEFAULT_SETTINGS=Object.freeze({
 selectionModel:"natural",environment:"temperate",separation:24,alignment:.035,cohesion:.0018,separationForce:.035,
 population:48,perception:76,maxSpeed:10,speed:1,
 visionRays:31,visionFov:150,visionPrecision:1.35,visionMemory:.992,visionUpdate:1,visionNoise:.15,
 plantDensity:2.5,foodAbundance:2.2,birthInterval:48,broodSize:7,maxPopulation:1200,
 basalMetabolism:.00009,metabolismScale:1,energyReserve:2.8,hungerSensitivity:3.2,hungerThreshold:.55,
 feedingRate:.055,fruitFeedingRate:.22,foodEfficiency:1.45,fruitEfficiency:3.8,feedingDriveThreshold:1.8,fullnessThreshold:2.65,
 movementEnergyCost:.000026,tissueMaintenanceCost:.00003,brainEnergyCost:1,visionEnergyCost:1,attackEnergyCost:.000012,reproductionEnergyCost:.000008,
 initialEnergy:.9,initialEnergyVariation:.3,juvenileStartScale:.48,juvenileMaturationRate:.001,bodyMassGrowthRate:.00072,maxBodyMass:10,
 segmentGrowthCost:.18,segmentGrowthRate:1,segmentMassContribution:.035,acquiredMassScale:.18,maxSegments:128,
 turnSpeed:.12,acceleration:.18,braking:.28,linearDamping:.985,collisionFriction:.32,impactDamageThreshold:.10,undulationFrequency:.12,undulationAmplitude:.09,segmentSpacing:.56,
 tier1Age:900,tier2Age:4200,tier3Age:11000,
 starvationThreshold:.16,starvationTailInterval:34,tailEnergyYield:.8,meatBiteRate:.018,meatEnergyEfficiency:.8,meatDecayRate:.000025,meatLifetime:900,injuryRecoveryRate:.0016,collisionRestitution:.42,attackCooldownMultiplier:1,hydrationTrigger:.48,hydrationRecovery:.035,drinkingEnergyRecovery:.0004,dehydrationDamage:.00008,coldResistance:1,bodyHeatCapacity:1,huddleTriggerStress:.08,huddleMaxNeighbours:5,huddleMovementThrust:.42,maxAge:22000,
 nightCooling:.42,coldThreshold:.3,coldDamage:.0001,coldHeatLoss:.00035,coldDamageInterval:8,eveningMovementMultiplier:.5,nightMovementMultiplier:.25,huddleWarmth:.30,huddleRadius:125,huddleSpacing:26,dayHeatGain:.00045,thirstRate:.00016,hydrationSearchRadius:240,adultMaturationAge:900,maxReproductiveAge:18000,courtshipDuration:180,gestationDuration:900,gestationEnergyCost:.00018,gestationEnergyReserveCost:.12,parentalCareRadius:105,sporeGerminationProbability:.025,plantResourceRegeneration:.0024
});
const item=(key,label,min,max,step,unit)=>({key,label,min,max,step,...(unit?{unit}:{})});
export const PARAMETER_GROUPS=Object.freeze([
 {name:"Organism physiology",subgroups:[
  {name:"Energy budget & metabolism",items:[item("basalMetabolism","Basal metabolic drain",.000005,.001,.000005),item("metabolismScale","Metabolic rate multiplier",.1,4,.05),item("energyReserve","Maximum energy reserve",.5,8,.1),item("initialEnergy","Starting energy",.1,3,.05),item("initialEnergyVariation","Starting energy variation",0,1,.01),item("tissueMaintenanceCost","Tissue maintenance cost",0,.0005,.000005),item("brainEnergyCost","Brain energy multiplier",0,5,.05),item("visionEnergyCost","Vision energy multiplier",0,5,.05)]},
  {name:"Hunger & feeding",items:[item("hungerSensitivity","Hunger sensitivity",0,10,.1),item("hungerThreshold","Low-energy threshold",.05,2,.01),item("feedingDriveThreshold","Food-seeking trigger",.1,2.8,.05),item("feedingRate","Plant bite rate",.005,.3,.005),item("fruitFeedingRate","Fruit bite rate",.01,.8,.01),item("foodEfficiency","Plant digestion efficiency",.1,4,.05),item("fruitEfficiency","Fruit digestion efficiency",.1,8,.1),item("fullnessThreshold","Stop eating at energy",.2,2.8,.05)]},
  {name:"Movement energy",items:[item("movementEnergyCost","Movement energy cost",0,.001,.000005),item("attackEnergyCost","Attack energy cost",0,.001,.000005),item("reproductionEnergyCost","Reproductive drive upkeep",0,.001,.000005)]},
  {name:"Starvation & carcass economics",items:[item("starvationThreshold","Tail-shedding energy threshold",0,.8,.01),item("starvationTailInterval","Tail sacrifice interval",5,200,1,"ticks"),item("tailEnergyYield","Energy recovered from tail tissue",0,2,.05),item("meatBiteRate","Meat consumption rate",.001,.2,.001),item("meatEnergyEfficiency","Meat digestion efficiency",0,2,.05),item("meatDecayRate","Meat decay rate",0,.001,.000005),item("meatLifetime","Meat chunk lifetime",100,5000,50,"ticks")] }
 ]},
 {name:"Body growth & development",subgroups:[
  {name:"Overall size & mass",items:[item("juvenileStartScale","Newborn body scale",.15,1,.01),item("juvenileMaturationRate","Maturation rate",.0001,.01,.0001),item("bodyMassGrowthRate","Body mass growth rate",0,.005,.00001),item("maxBodyMass","Maximum body mass",1,30,.1),item("segmentMassContribution","Size gained per segment",0,.15,.001),item("acquiredMassScale","Size from acquired biomass",0,.8,.01)]},
  {name:"Segment growth",items:[item("segmentGrowthCost","Nutrition required per segment",.02,1,.01),item("segmentGrowthRate","Segment growth multiplier",.1,5,.05),item("maxSegments","Maximum body segments",1,128,1),item("segmentSpacing","Body segment spacing",.25,1.2,.01)]},
  {name:"Morphological tier progression",items:[item("tier1Age","Age to morphology tier 1",50,8000,50,"ticks"),item("tier2Age","Age to morphology tier 2",100,16000,100,"ticks"),item("tier3Age","Age to morphology tier 3",200,30000,100,"ticks")]}
 ]},
 {name:"Locomotion & body dynamics",subgroups:[
  {name:"Steering and acceleration",items:[item("maxSpeed","Movement speed ceiling",1,10,.1),item("turnSpeed","Turn speed",.01,.8,.005),item("acceleration","Acceleration strength",.01,1,.01),item("braking","Braking strength",.01,1,.01),item("linearDamping","Coasting drag",.8,1,.005)]},
  {name:"Lifespan",items:[item("maxAge","Maximum lifespan",1000,100000,500,"ticks"),item("adultMaturationAge","Adult maturation age",100,8000,50,"ticks"),item("maxReproductiveAge","Maximum reproductive age",1000,100000,500,"ticks")]},
  {name:"Undulation & articulation",items:[item("undulationFrequency","Body undulation frequency",.01,.8,.005),item("undulationAmplitude","Body undulation amplitude",0,.5,.005)]}
 ]},
 {name:"Senses & perception",subgroups:[
  {name:"Raycast vision",items:[item("perception","Vision range",20,300,1,"world units"),item("visionRays","Vision ray count",3,64,1),item("visionFov","Vision field of view",30,240,1,"degrees"),item("visionPrecision","Detection radius multiplier",.5,2.5,.05),item("visionMemory","Vision memory persistence",.9,.999,.001),item("visionUpdate","Vision update interval",1,12,1,"ticks"),item("visionNoise","Detection noise",0,12,.1)]},
  {name:"Neural processing",items:[item("speed","Simulation rate",.25,3,.25,"×")]}
 ]},
 {name:"Food web & vegetation",subgroups:[
  {name:"Plant resources",items:[item("plantDensity","Vegetation density",.25,5,.05),item("foodAbundance","Food intake per bite",.5,3,.1),item("sporeGerminationProbability","Spore germination probability",0,.2,.001),item("plantResourceRegeneration","Plant growth energy coefficient",.0001,.01,.0001)]}
 ]},
 {name:"Survival & climate",subgroups:[
  {name:"Thermal regulation",items:[item("nightCooling","Night-time cooling",.1,.8,.01),item("eveningMovementMultiplier","Cold evening movement multiplier",0,1,.01),item("nightMovementMultiplier","Cold night movement multiplier",0,1,.01),item("coldDamageInterval","Thermal damage interval",1,60,1,"ticks"),item("coldThreshold","Cold stress threshold",0,.8,.01),item("coldDamage","Cold energy damage",0,.001,.00001),item("coldHeatLoss","Body heat loss",0,.003,.00005),item("dayHeatGain","Daylight body-heat recovery",0,.002,.00005),item("coldResistance","Cold resistance",.1,3,.05),item("bodyHeatCapacity","Body heat capacity",.1,4,.05)]},
  {name:"Huddling & hydration",items:[item("huddleWarmth","Warmth per nearby organism",0,.5,.01),item("huddleRadius","Local huddle radius",45,260,5,"world units"),item("huddleSpacing","Huddle spacing",12,65,1,"world units"),item("thirstRate","Thirst accumulation",0,.001,.00001),item("hydrationTrigger","Drink-seeking threshold",.05,1.5,.01),item("hydrationSearchRadius","Water search radius",40,600,10,"world units"),item("hydrationRecovery","Thirst recovery while drinking",.001,.2,.001),item("drinkingEnergyRecovery","Energy recovery while drinking",0,.005,.00005),item("dehydrationDamage","Dehydration energy damage",0,.001,.000005),item("huddleTriggerStress","Huddle trigger stress",0,.8,.01),item("huddleMaxNeighbours","Maximum huddle neighbours",1,12,1),item("huddleMovementThrust","Huddle movement thrust",0,1,.01),item("parentalCareRadius","Parental care radius",10,300,5,"world units")]}
 ]},
 {name:"Combat & recovery",subgroups:[{name:"Damage and healing",items:[item("injuryRecoveryRate","Injury recovery rate",0,.02,.0001),item("collisionRestitution","Collision elasticity",0,1,.01),item("collisionFriction","Collision tangential friction",0,1,.01),item("impactDamageThreshold","Impact damage threshold",0,.5,.005),item("attackCooldownMultiplier","Attack cooldown multiplier",.1,5,.05)]}]},
 {name:"Reproduction & population",subgroups:[
  {name:"Breeding",items:[item("birthInterval","Reproduction interval",24,180,6,"ticks"),item("broodSize","Brood size",2,12,1,"offspring"),item("population","Starting population",10,1200,10,"organisms"),item("maxPopulation","Reproduction population cap",10,3000,25,"organisms"),item("courtshipDuration","Courtship duration",20,1200,10,"ticks"),item("gestationDuration","Gestation duration",120,6000,30,"ticks"),item("gestationEnergyCost","Gestation energy upkeep",0,.001,.00001),item("gestationEnergyReserveCost","Energy cost at birth",0,.5,.01)]}
 ]}
]);
export function resolveSettings(saved={}){
 const result={...DEFAULT_SETTINGS},bounds={};
 for(const group of PARAMETER_GROUPS)for(const subgroup of group.subgroups)for(const p of subgroup.items){
  const candidate=saved.bounds?.[p.key]||{},min=Number(candidate.min),max=Number(candidate.max);
  const legacyRange=(p.key==="maxSpeed"&&min===.4&&max===3)||(p.key==="perception"&&min===20&&max===150)||(p.key==="plantDensity"&&min===.25&&max===2.5);
  const valid=Number.isFinite(min)&&Number.isFinite(max)&&min<max&&!legacyRange;
  bounds[p.key]=valid?{min,max}:{min:p.min,max:p.max};
  const value=Number(saved[p.key]);
  if(Number.isFinite(value))result[p.key]=Math.max(bounds[p.key].min,Math.min(bounds[p.key].max,value));
 }
 // Migrate the old default speed ceiling instead of silently preserving its obsolete .78 value.
 if(saved.maxSpeed===.78)result.maxSpeed=10;
 // Upgrade the previous default sensory profile, while preserving deliberate user tuning.
 if(saved.visionRays===21)result.visionRays=31;
 if(saved.visionFov===120)result.visionFov=150;
 if(saved.visionPrecision===1)result.visionPrecision=1.35;
 if(saved.visionMemory===.985)result.visionMemory=.992;
 if(saved.visionNoise===0)result.visionNoise=.15;
 result.bounds=bounds;
 if(["natural","environmental","neutral"].includes(saved.selectionModel))result.selectionModel=saved.selectionModel;
 if(["temperate","tropical","arid","alpine","wetland"].includes(saved.environment))result.environment=saved.environment;
 return result;
}
