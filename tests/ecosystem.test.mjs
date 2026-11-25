import test from"node:test";
import assert from"node:assert/strict";
import{createVisionField,castVision,neuralSenseVector}from"../organisms/senses.js";
import{updateCombat}from"../organisms/predation.js";
import{calculateEnergyCost}from"../organisms/energy.js";
import{createTraits,inheritTraits,phenotype}from"../organisms/genetics.js";
import{createPlantGenome,germinatePlant,growPlant,inheritPlantGenome,classifyPlantStage}from"../organisms/plant_genetics.js";
import{decodeChromosome}from"../organisms/genome.js";
import{createEnvironment,sampleEnvironment,advanceEnvironment}from"../organisms/environment.js";
import{createHistory,recordHistory,averageHistory}from"../labs/history.js";

test("raycast vision detects only targets in a ray and retains predicted unseen positions",()=>{
 const a={id:1,x:100,y:100,vx:1,vy:0,energy:.8,health:1},b={id:2,x:120,y:100,vx:1,vy:.2};
 const first=castVision(a,[a,b],{rays:3,range:60,fieldOfView:1,dt:1});
 assert.ok(first.some(s=>s.visible&&s.targetId===2));
 const before=first.find(s=>s.visible&&s.targetId===2).confidence;
 const second=castVision(a,[a],{rays:3,range:60,fieldOfView:1,dt:2});
 const memory=second.find(s=>s.targetId===2);
 assert.ok(memory&&!memory.visible);assert.ok(memory.confidence<before);assert.ok(memory.x>120);assert.ok(memory.distance>20);
 assert.equal(neuralSenseVector(a,3).length,28);
});

test("boid genomes express diverse combat traits and physical trade-offs",()=>{
 let seed=9;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const a=createTraits(random),b=createTraits(random),child=inheritTraits(a,b,random),form=phenotype(child);
 for(const key of["size","attack","damage","defense","attackSpeed","tracking","sexDrive","aggression","flee"])assert.ok(Number.isFinite(child[key]));
 assert.ok(form.radius>0&&form.mass>0&&form.metabolicCost>0);
 assert.ok(child.speed>=.35&&child.speed<=2.4);
});

test("physical combat injures prey, kills it and transfers carcass mass to its attacker",()=>{
 const attacker={id:1,x:50,y:50,vx:1,vy:0,energy:1,health:1,injury:0,mass:1,baseMass:1,massScale:1,radius:5,traits:{attack:2,damage:2,defense:1,aggression:.8,attackSpeed:1,attackCost:1,tracking:1,carnivory:1},senses:[{visible:true,targetId:2}]};
 const prey={id:2,x:55,y:50,vx:-1,vy:0,energy:1,health:.05,injury:0,mass:1,baseMass:1,radius:5,traits:{attack:.5,damage:.5,defense:.25,aggression:.1,flee:.5,tracking:1.8,perception:1.5,visionRange:1.7},kind:"centipede",segments:1,senses:[]};
 const world={width:200,height:200,agents:[attacker,prey],tick:1,deaths:0};
 const first=updateCombat(world,1,{random:()=>.99,consumeRate:.1});
 assert.equal(prey.dead,true);assert.equal(prey.consumedBy,1);assert.equal(attacker.attachedPrey,2);assert.equal(first.kills,1);
 const mass=attacker.mass;updateCombat(world,2,{random:()=>.99,consumeRate:.1});
 assert.ok(attacker.mass>mass);assert.ok(attacker.massScale>1);assert.equal(attacker.x,prey.x);
 for(let i=0;i<30;i++)updateCombat(world,10,{random:()=>.99,consumeRate:.1});
 assert.equal(attacker.headMeals,1);assert.ok(attacker.headSenseBoost>0);assert.ok(attacker.headTraitAssimilations>0);assert.equal(world.headMeals,1);assert.ok(attacker.health>0);
});

test("damaging a centipede removes body segments and transfers their tissue mass",()=>{
 const attacker={id:1,x:50,y:50,vx:1,vy:0,energy:1,health:1,injury:0,mass:1,baseMass:1,massScale:1,radius:5,traits:{attack:.5,damage:.5,defense:1,aggression:.8,attackSpeed:1,attackCost:1,tracking:1,carnivory:1},senses:[{visible:true,targetId:2}]};
 const prey={id:2,x:55,y:50,vx:-1,vy:0,energy:1,health:1,injury:0,mass:2,baseMass:2,massScale:1,radius:5,segments:12,kind:"centipede",traits:{attack:.2,damage:.2,defense:1,aggression:.1,flee:.5},senses:[]};
 const world={width:200,height:200,agents:[attacker,prey],tick:1,deaths:0};
 updateCombat(world,1,{random:()=>.99});
 assert.ok(prey.segments<12);assert.ok(prey.lostSegments>0);assert.ok(attacker.acquiredMass>0);assert.ok(prey.mass<2);assert.ok(world.combatEvents.length>0);assert.ok(world.combatEvents.some(event=>event.severed));
});

test("plant chromosomes carry inherited traits and plants branch and release spores",()=>{
 const random=()=>0,g=createPlantGenome(random),decoded=decodeChromosome(g.chromosome);
 assert.ok(decoded.filter(x=>x.type==="trait").length>=10);assert.ok(decoded.filter(x=>x.type==="regulator").length>=4);
 const child=inheritPlantGenome(g,g,random);assert.ok(child.chromosome.length>0);
 const plant=germinatePlant(10,10,g,random);plant.energy=1;plant.sporeCooldown=0;let spores=0;
 for(let i=0;i<260;i++)spores+=growPlant(plant,{light:.9,moisture:.9,temperature:.55,nutrients:.9},1,random).spores;
 assert.ok(plant.nodes.length>1);assert.ok(spores>0);assert.ok(plant.nodes.some(node=>node.fruit?.food>0));
});

test("environment cycles through day and seasons and supplies watershed geography",()=>{
 const env=createEnvironment(800,600,7);assert.equal(env.tributaries.length,3);
 assert.equal(env.dayLength,28800);assert.equal(env.seasonLength,144000);
 advanceEnvironment(env,7200);assert.ok(sampleEnvironment(env,400,300).daylight<.001,"06:00 is dawn");
 advanceEnvironment(env,7200);assert.ok(sampleEnvironment(env,400,300).daylight>.99,"12:00 is midday");
 advanceEnvironment(env,7200);assert.ok(sampleEnvironment(env,400,300).daylight<.001,"18:00 is dusk");
 advanceEnvironment(env,7200);assert.ok(sampleEnvironment(env,400,300).daylight<.001,"00:00 is midnight");
 advanceEnvironment(env,136800);assert.equal(env.day,5);assert.equal(Math.floor(env.season),1);
 assert.ok(env.fields.some(f=>f.water));assert.ok(env.fields.some(f=>!f.water));
});

test("observatory history retains trend samples and periodic averages",()=>{
 const history=createHistory({capacity:5,interval:1}),world={tick:1,agents:[{id:1,energy:.5,health:.8,traits:{attack:1,defense:1}}],births:1,deaths:0},env={day:1,year:0,season:0,daylight:.5};
 recordHistory(history,world,env,[]);world.tick=2;world.agents[0].energy=.9;recordHistory(history,world,env,[]);
 const mean=averageHistory(history,"meanEnergy",2);assert.equal(mean.count,2);assert.ok(Math.abs(mean.mean-.7)<1e-9);assert.ok(mean.delta>.3);
});

test("spatial vision field exposes plants only when a ray intersects them",()=>{
 const a={id:10,x:40,y:40,vx:1,vy:0,energy:.5,health:1},plant={id:-1,x:55,y:40,vx:0,vy:0,radius:3,kind:"plant"};
 const field=createVisionField([a,plant],200,100,50),s=castVision(a,[a,plant],{field,rays:3,range:50,fieldOfView:1});
 assert.ok(s.some(x=>x.visible&&x.kind==="plant"&&x.targetId===-1));
 assert.equal(neuralSenseVector(a,3)[15],1);
});

test("biome presets produce distinct moisture and watershed structures",()=>{
 const arid=createEnvironment(600,400,4,{preset:"arid"}),wetland=createEnvironment(600,400,4,{preset:"wetland"});
 const moisture=e=>e.fields.reduce((n,f)=>n+f.moisture,0)/e.fields.length;
 assert.ok(moisture(wetland)>moisture(arid));assert.ok(wetland.tributaries.length>arid.tributaries.length);
 assert.notEqual(arid.coastWidth,wetland.coastWidth);
});

test("energy economics account for tissue, brain, vision, attacks and upkeep",()=>{
 const agent={traits:{metabolism:1.2,visionRange:1.1,aggression:.8,attackCost:1.3,sexDrive:1},mass:1.4,vx:1,vy:1,lastAttackTick:5,senses:[{confidence:1}],neural:{nodes:Array(10).fill({}),connections:Array(20).fill({enabled:true})}};
 const costs=calculateEnergyCost(agent,2,5),sum=Object.entries(costs).filter(([k])=>k!=="total").reduce((n,[,v])=>n+v,0);
 assert.ok(costs.brain>0&&costs.vision>0&&costs.attack>0);assert.ok(Math.abs(sum-costs.total)<1e-12);
 const hungry=calculateEnergyCost({...agent,energy:.12},2,5),fed=calculateEnergyCost({...agent,energy:1.2},2,5);assert.ok(hungry.total>fed.total*1.5);

});

test("plant life stages progress from seedling through senescence",()=>{
 const plant={age:0,traits:{longevity:1}};assert.equal(classifyPlantStage(plant),"seedling");
 plant.age=200;assert.equal(classifyPlantStage(plant),"juvenile");
 plant.age=1000;assert.equal(classifyPlantStage(plant),"mature");
 plant.age=21000;assert.equal(classifyPlantStage(plant),"senescent");
});


test("ancestral boids are herbivores and carnivory is a rare inherited mutation",()=>{let seed=1;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const a=createTraits(random);assert.equal(a.carnivory,0);const b=inheritTraits(a,a,()=>.99);assert.equal(b.carnivory,0)});


test("environment creates a roughly rectangular landmass with coastline on all four edges",()=>{
 const env=createEnvironment(1000,700,22),at=(x,y)=>env.fields[Math.min(env.rows-1,Math.floor(y*env.rows))*env.cols+Math.min(env.cols-1,Math.floor(x*env.cols))];
 assert.equal(env.version,2);
 for(const [x,y] of [[.02,.5],[.98,.5],[.5,.02],[.5,.98]])assert.equal(at(x,y).water,true);
 for(const [x,y] of [[.5,.5],[.2,.2],[.8,.8]])assert.equal(at(x,y).water,false);
 assert.ok(env.shoreline.length>=30);
});


test("centipede body contact can attack and sever segments without head-to-head contact",()=>{
 const attacker={id:1,x:50,y:50,vx:1,vy:0,energy:1,health:1,mass:1,baseMass:1,radius:5,kind:"centipede",traits:{attack:.5,damage:.5,defense:1,attackSpeed:1,attackCost:1,tracking:1,carnivory:1},senses:[]};
 const prey={id:2,x:100,y:50,vx:-1,vy:0,energy:1,health:1,mass:2,baseMass:2,radius:5,kind:"centipede",segments:10,bodySegments:[{x:100,y:50},{x:55,y:50}],traits:{attack:.2,damage:.2,defense:1},senses:[]};
 const world={width:200,height:200,agents:[attacker,prey],tick:1,deaths:0};updateCombat(world,1,{random:()=>.99});assert.ok(prey.segments<10);assert.ok(attacker.acquiredMass>0);assert.ok(world.combatEvents.some(event=>event.targetId===prey.id));
});


test("vision rays expose exact endpoints and precision affects target detection",()=>{
 const a={id:1,x:20,y:50,vx:1,vy:0,age:0},small={id:2,x:40,y:54,vx:0,vy:0,radius:2,kind:"plant"};
 const narrow=castVision(a,[a,small],{rays:3,range:50,fieldOfView:0,precision:.5});
 assert.ok(narrow.every(ray=>Number.isFinite(ray.endX)&&Number.isFinite(ray.endY)));
 const precise=castVision(a,[a,small],{rays:3,range:50,fieldOfView:0,precision:2});
 assert.ok(precise.some(ray=>ray.visible&&ray.targetId===2));
});

test("attacks transfer momentum with recoil and target mass affects acceleration",()=>{
 const attacker={id:1,x:20,y:20,vx:2,vy:0,energy:1,health:1,mass:2,baseMass:2,traits:{attack:1,damage:1,defense:1,tracking:1,attackCost:1,carnivory:1},senses:[{visible:true,targetId:2}]},prey={id:2,x:24,y:20,vx:-1,vy:0,energy:1,health:1,mass:1,baseMass:1,traits:{defense:.2,flee:.2},bodySegments:[{x:24,y:20},{x:20,y:23}],segments:2};
 const world={width:100,height:100,agents:[attacker,prey],combatEvents:[]};
 updateCombat(world,1,{random:()=>.99});
 assert.ok(prey.vx>-1);assert.ok(attacker.vx<2);assert.ok(Number.isFinite(prey.spin));
});


test("neural vision samples the full ray fan instead of only the leftmost rays",()=>{
 const agent={id:1,energy:1,health:1,injury:0,vx:0,vy:0,senses:Array.from({length:31},(_,i)=>({confidence:i===30?1:0,visible:i===30,distance:10,bearing:.8,vx:0,vy:0,size:5,kind:i===30?"plant":null}))};
 const vector=neuralSenseVector(agent,4,200,10);
 assert.equal(vector.length,36);assert.equal(vector[24],1);assert.equal(vector[25],1);assert.equal(vector[31],1);
});
