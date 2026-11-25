import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_SETTINGS,PARAMETER_GROUPS,resolveSettings} from "../organisms/parameters.js";
import {createEnvironment,dawnClock,sampleEnvironment} from "../organisms/environment.js";

test("fundamental parameters are grouped, bounded and recover defaults",()=>{
 const keys=PARAMETER_GROUPS.flatMap(group=>group.items.map(item=>item.key));
 assert.equal(new Set(keys).size,keys.length);
 for(const group of PARAMETER_GROUPS)for(const item of group.items){
  assert.ok(item.min<item.max,`${item.key} has ordered bounds`);
  assert.ok(DEFAULT_SETTINGS[item.key]>=item.min&&DEFAULT_SETTINGS[item.key]<=item.max,`${item.key} default is in bounds`);
 }
 const defaults=resolveSettings();
 assert.deepEqual({...defaults,bounds:undefined},{...DEFAULT_SETTINGS,bounds:undefined});
 for(const group of PARAMETER_GROUPS)for(const item of group.items)assert.deepEqual(defaults.bounds[item.key],{min:item.min,max:item.max});
});

test("saved parameter overrides are clamped and invalid values ignored",()=>{
 const settings=resolveSettings({population:99999,coldDamage:-1,nightCooling:.31,thirstRate:"not-a-number",environment:"bogus"});
 assert.equal(settings.population,1200);
 assert.equal(settings.coldDamage,0);
 assert.equal(settings.nightCooling,.31);
 assert.equal(settings.thirstRate,DEFAULT_SETTINGS.thirstRate);
 assert.equal(settings.environment,DEFAULT_SETTINGS.environment);
});

test("custom slider bounds persist and clamp their parameter values",()=>{
 const settings=resolveSettings({population:1500,bounds:{population:{min:50,max:2000},coldDamage:{min:-1,max:.002},nightCooling:{min:1,max:0}}});
 assert.equal(settings.population,1500);
 assert.deepEqual(settings.bounds.population,{min:50,max:2000});
 assert.deepEqual(settings.bounds.coldDamage,{min:-1,max:.002});
 assert.deepEqual(settings.bounds.nightCooling,{min:.1,max:.8});
});

test("simulation starts at 06:00 dawn and uses a gentler configurable night cooling curve",()=>{
 const env=createEnvironment(800,600,7),milder=createEnvironment(800,600,7,{nightCooling:.3});
 assert.equal(dawnClock(env.dayLength),7200);
 env.clock=dawnClock(env.dayLength);milder.clock=dawnClock(milder.dayLength);
 assert.equal(sampleEnvironment(env,400,300).daylight,0);
 assert.ok(sampleEnvironment(milder,400,300).temperature>sampleEnvironment(env,400,300).temperature);
});

test("brood size and reproduction interval settings reach the reproductive process",async()=>{
 const {createWorld}=await import("../core/simulation.js");
 const {updateReproduction}=await import("../organisms/reproduction.js");
 const world=createWorld(300,200,2,41),[a,b]=world.agents;
 for(const organism of [a,b]){organism.age=1200;organism.energy=2;organism.sex=organism===a?"female":"male"}
 a.x=100;a.y=100;b.x=104;b.y=100;
 for(let i=0;i<180;i++)updateReproduction(world,1,{random:()=>.25,broodSize:7,birthInterval:60});
 const mother=a.pregnancy?a:b;
 assert.equal(mother.pregnancy?.clutchSize,7);
 const breedingRate=Math.max(.35,(a.traits.fertility+b.traits.fertility)*.5);
 assert.equal(a.reproductiveCooldown,60*37.5/breedingRate);
});

test("dawn cold stress is buffered and huddling reduces thermal energy loss",async()=>{
 const {applyThermalStress}=await import("../organisms/thermal.js");
 const parameters=resolveSettings();
 const exposed={energy:1,bodyHeat:.7},huddled={energy:1,bodyHeat:.7};
 for(let i=0;i<1200;i++){
  applyThermalStress(exposed,{temperature:0,daylight:0},0,1,parameters);
  applyThermalStress(huddled,{temperature:0,daylight:0},3,1,parameters);
 }
 assert.ok(exposed.energy>.9,"a cold dawn should not drain most of an organism's energy");
 assert.ok(exposed.bodyHeat>.5,"body heat should not collapse before daylight");
 assert.ok(huddled.energy>exposed.energy,"huddling should reduce cold damage");
});


test("default ecosystem starts with a balanced population, forage reserve and movement ceiling",()=>{
 const settings=resolveSettings();assert.equal(settings.population,48);assert.equal(settings.plantDensity,2.5);assert.equal(settings.foodAbundance,2.2);assert.equal(settings.coldDamage,.0001);assert.equal(settings.thirstRate,.00016);assert.equal(settings.maxSpeed,10);
});


test("legacy saved defaults migrate the movement ceiling and expanded vision range",()=>{
 const settings=resolveSettings({maxSpeed:.78,perception:76,bounds:{maxSpeed:{min:.4,max:3},perception:{min:20,max:150}}});
 assert.equal(settings.maxSpeed,10);assert.deepEqual(settings.bounds.maxSpeed,{min:1,max:10});assert.deepEqual(settings.bounds.perception,{min:20,max:300});assert.equal(settings.perception,76);
});


test("vision defaults provide broad, persistent, high-resolution useful perception",()=>{
 const settings=resolveSettings();assert.equal(settings.visionRays,31);assert.equal(settings.visionFov,150);assert.equal(settings.visionPrecision,1.35);assert.equal(settings.visionMemory,.992);assert.equal(settings.visionUpdate,1);assert.equal(settings.visionNoise,.15);
 const migrated=resolveSettings({visionRays:21,visionFov:120,visionPrecision:1,visionMemory:.985,visionNoise:0});assert.equal(migrated.visionRays,31);assert.equal(migrated.visionFov,150);assert.equal(migrated.visionPrecision,1.35);assert.equal(migrated.visionMemory,.992);assert.equal(migrated.visionNoise,.15);
});
