'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const genetics=require('../genetics.js');

test('ten stable loci have ordered indices and valid bounds',()=>{
  assert.equal(genetics.TRAITS.length,10);
  assert.deepEqual(genetics.TRAITS.map(g=>g.index),[0,1,2,3,4,5,6,7,8,9]);
  for(const gene of genetics.TRAITS) assert.ok(gene.min<gene.max,gene.key);
});
test('sensory range scales personal and food detection',()=>{
  assert.ok(Math.abs(genetics.perceptionRadius(100,.55)-55)<1e-12);
  assert.ok(Math.abs(genetics.perceptionRadius(100,1)-100)<1e-12);
  assert.ok(Math.abs(genetics.perceptionRadius(100,1.65)-165)<1e-12);
  assert.ok(Math.abs(genetics.foodSenseRange(100,1.5,2,60)-300)<1e-12);
  assert.ok(Math.abs(genetics.foodSenseRange(100,.55,2,60)-110)<1e-12);
});
test('kin affinity continuously scales pedigree relatedness',()=>{
  assert.equal(genetics.kinProtection(.8,0),0);
  assert.ok(Math.abs(genetics.kinProtection(.8,.5)-.4)<1e-12);
  assert.equal(genetics.kinProtection(.8,1),.8);
});
test('exploration changes wandering noise and food attraction',()=>{
  assert.ok(Math.abs(genetics.explorationNoise(.08,.55)-.084)<1e-12);
  assert.ok(Math.abs(genetics.explorationNoise(.08,1)-.12)<1e-12);
  assert.ok(Math.abs(genetics.explorationNoise(.08,1.65)-.172)<1e-12);
  assert.ok(Math.abs(genetics.foodSteering(.22,.55)-.2695)<1e-12);
  assert.ok(Math.abs(genetics.foodSteering(.22,1.65)-.1485)<1e-12);
});
test('expression helpers clamp invalid or out-of-range values',()=>{
  assert.equal(genetics.perceptionRadius(100,99),165);
  assert.equal(genetics.kinProtection(2,-5),0);
  assert.ok(Math.abs(genetics.explorationNoise(.1,NaN)-.15)<1e-12);
});

const fs=require('node:fs');
const worker=fs.readFileSync(require('node:path').join(__dirname,'../boids-worker.js'),'utf8');
test('worker wires all phase-one expression helpers into live simulation paths',()=>{
  assert.match(worker,/BoidsGenetics\.kinProtection\(kinshipRelatedness/);
  assert.match(worker,/BoidsGenetics\.perceptionRadius\(cfg\.perception,traitGenes\[myTrait\+5\]\)/);
  assert.match(worker,/sepR=cfg\.perception\*cfg\.separationRadius/);
  assert.match(worker,/d2<foodSenseRange\*foodSenseRange/);
  assert.match(worker,/BoidsGenetics\.explorationNoise\(cfg\.flockNoise,exploration\)/);
  assert.match(worker,/BoidsGenetics\.foodSteering\(cfg\.foodSteering,exploration\)/);
});
