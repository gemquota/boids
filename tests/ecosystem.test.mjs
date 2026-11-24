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
 const prey={id:2,x:55,y:50,vx:-1,vy:0,energy:1,health:.05,injury:0,mass:1,baseMass:1,radius:5,traits:{attack:.5,damage:.5,defense:.25,aggression:.1,flee:.5},senses:[]};
 const world={width:200,height:200,agents:[attacker,prey],tick:1,deaths:0};
 const first=updateCombat(world,1,{random:()=>.99,consumeRate:.1});
 assert.equal(prey.dead,true);assert.equal(prey.consumedBy,1);assert.equal(attacker.attachedPrey,2);assert.equal(first.kills,1);
 const mass=attacker.mass;updateCombat(world,2,{random:()=>.99,consumeRate:.1});
 assert.ok(attacker.mass>mass);assert.ok(attacker.massScale>1);assert.equal(attacker.x,prey.x);
});

test("plant chromosomes carry inherited traits and plants branch and release spores",()=>{
 const random=()=>0,g=createPlantGenome(random),decoded=decodeChromosome(g.chromosome);
 assert.ok(decoded.filter(x=>x.type==="trait").length>=10);assert.ok(decoded.filter(x=>x.type==="regulator").length>=4);
 const child=inheritPlantGenome(g,g,random);assert.ok(child.chromosome.length>0);
 const plant=germinatePlant(10,10,g,random);plant.energy=1;plant.sporeCooldown=0;let spores=0;
 for(let i=0;i<260;i++)spores+=growPlant(plant,{light:.9,moisture:.9,temperature:.55,nutrients:.9},1,random).spores;
 assert.ok(plant.nodes.length>1);assert.ok(spores>0);
});

test("environment cycles through day and seasons and supplies watershed geography",()=>{
 const env=createEnvironment(800,600,7);assert.equal(env.tributaries.length,3);
 assert.equal(env.dayLength,28800);assert.equal(env.seasonLength,144000);advanceEnvironment(env,7200);assert.ok(sampleEnvironment(env,400,300).daylight>.99);
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
});

test("plant life stages progress from seedling through senescence",()=>{
 const plant={age:0,traits:{longevity:1}};assert.equal(classifyPlantStage(plant),"seedling");
 plant.age=200;assert.equal(classifyPlantStage(plant),"juvenile");
 plant.age=1000;assert.equal(classifyPlantStage(plant),"mature");
 plant.age=21000;assert.equal(classifyPlantStage(plant),"senescent");
});


test("ancestral boids are herbivores and carnivory is a rare inherited mutation",()=>{let seed=1;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const a=createTraits(random);assert.equal(a.carnivory,0);const b=inheritTraits(a,a,()=>.99);assert.equal(b.carnivory,0)});
