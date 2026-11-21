import test from"node:test";
import assert from"node:assert/strict";
import{castVision,neuralSenseVector}from"../organisms/senses.js";
import{updateCombat}from"../organisms/predation.js";
import{createTraits,inheritTraits,phenotype}from"../organisms/genetics.js";
import{createPlantGenome,germinatePlant,growPlant,inheritPlantGenome}from"../organisms/plant_genetics.js";
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
 assert.equal(neuralSenseVector(a,3).length,22);
});

test("boid genomes express diverse combat traits and physical trade-offs",()=>{
 let seed=9;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const a=createTraits(random),b=createTraits(random),child=inheritTraits(a,b,random),form=phenotype(child);
 for(const key of["size","attack","damage","defense","attackSpeed","tracking","sexDrive","aggression","flee"])assert.ok(Number.isFinite(child[key]));
 assert.ok(form.radius>0&&form.mass>0&&form.metabolicCost>0);
 assert.ok(child.speed>=.35&&child.speed<=2.4);
});

test("physical combat injures prey, kills it and transfers carcass mass to its attacker",()=>{
 const attacker={id:1,x:50,y:50,vx:1,vy:0,energy:1,health:1,injury:0,mass:1,baseMass:1,massScale:1,radius:5,traits:{attack:2,damage:2,defense:1,aggression:.8,attackSpeed:1,attackCost:1,tracking:1},senses:[{visible:true,targetId:2}]};
 const prey={id:2,x:55,y:50,vx:-1,vy:0,energy:1,health:.05,injury:0,mass:1,baseMass:1,radius:5,traits:{attack:.5,damage:.5,defense:.25,aggression:.1,flee:.5},senses:[]};
 const world={width:200,height:200,agents:[attacker,prey],tick:1,deaths:0};
 const first=updateCombat(world,1,{random:()=>.99,consumeRate:.1});
 assert.equal(prey.dead,true);assert.equal(prey.consumedBy,1);assert.equal(attacker.attachedPrey,2);assert.equal(first.kills,1);
 const mass=attacker.mass;updateCombat(world,2,{random:()=>.99,consumeRate:.1});
 assert.ok(attacker.mass>mass);assert.ok(attacker.massScale>1);assert.equal(attacker.x,prey.x);
});

test("plant chromosomes carry inherited traits and plants branch and release spores",()=>{
 const random=()=>0,g=createPlantGenome(random),decoded=decodeChromosome(g.chromosome);
 assert.ok(decoded.filter(x=>x.type==="trait").length>=10);
 const child=inheritPlantGenome(g,g,random);assert.ok(child.chromosome.length>0);
 const plant=germinatePlant(10,10,g,random);let spores=0;
 for(let i=0;i<260;i++)spores+=growPlant(plant,{light:.9,moisture:.9,temperature:.55,nutrients:.9},1,random).spores;
 assert.ok(plant.nodes.length>1);assert.ok(spores>0);
});

test("environment cycles through day and seasons and supplies watershed geography",()=>{
 const env=createEnvironment(800,600,7);assert.equal(env.tributaries.length,3);
 advanceEnvironment(env,600);assert.ok(sampleEnvironment(env,400,300).daylight>.99);
 advanceEnvironment(env,11400);assert.equal(env.day,10);assert.equal(Math.floor(env.season),1);
 assert.ok(env.fields.some(f=>f.water));assert.ok(env.fields.some(f=>!f.water));
});

test("observatory history retains trend samples and periodic averages",()=>{
 const history=createHistory({capacity:5,interval:1}),world={tick:1,agents:[{id:1,energy:.5,health:.8,traits:{attack:1,defense:1}}],births:1,deaths:0},env={day:1,year:0,season:0,daylight:.5};
 recordHistory(history,world,env,[]);world.tick=2;world.agents[0].energy=.9;recordHistory(history,world,env,[]);
 const mean=averageHistory(history,"meanEnergy",2);assert.equal(mean.count,2);assert.ok(Math.abs(mean.mean-.7)<1e-9);assert.ok(mean.delta>.3);
});
