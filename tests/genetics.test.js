'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const genetics=require('../genetics.js');

test('ten stable loci have ordered indices and valid gene bounds',()=>{
  assert.equal(genetics.TRAITS.length,10);
  assert.equal(genetics.TRAITS[5].label,'Perception radius');
  assert.equal(genetics.DEFAULT_EXPRESSION.sensoryRange.min,18);
  assert.equal(genetics.DEFAULT_EXPRESSION.sensoryRange.max,90);
  assert.equal(genetics.DEFAULT_EXPRESSION.speed.min,.1);
  assert.equal(genetics.DEFAULT_EXPRESSION.speed.max,.5);
  assert.deepEqual(genetics.TRAITS.map(g=>g.index),[0,1,2,3,4,5,6,7,8,9]);
  for(const gene of genetics.TRAITS) assert.ok(gene.min<gene.max,gene.key);
});
test('perception radius helpers use expressed world-unit values',()=>{
  assert.ok(Math.abs(genetics.perceptionRadius(42)-42)<1e-12);
  assert.ok(Math.abs(genetics.perceptionRadius(0)-1)<1e-12);
  assert.equal(genetics.kinProtection(.8,0),0);
  assert.ok(Math.abs(genetics.kinProtection(.8,.5)-.4)<1e-12);
  assert.ok(Math.abs(genetics.explorationNoise(.08,1)-.12)<1e-12);
  assert.ok(Math.abs(genetics.foodSteering(.22,1)-.22)<1e-12);
});
test('linear, exponential and logarithmic curves have distinct expected shapes',()=>{
  assert.equal(genetics.shapeExpression(.5,{curve:'linear'}),.5);
  assert.equal(genetics.shapeExpression(.5,{curve:'exponential',strength:2}),.25);
  assert.ok(Math.abs(genetics.shapeExpression(.5,{curve:'logarithmic',strength:2})-Math.sqrt(.5))<1e-12);
});
test('sigmoid, threshold, plateau and inverse curves are monotonic and bounded',()=>{
  for(const curve of ['sigmoid','threshold','plateau','inverse']){
    const values=[0,.25,.5,.75,1].map(x=>genetics.shapeExpression(x,{curve,strength:3,midpoint:.5}));
    assert.ok(values.every(v=>v>=0&&v<=1),curve);
    if(curve==='inverse')assert.ok(values.every((v,i)=>i===0||v<=values[i-1]),curve);
    else assert.ok(values.every((v,i)=>i===0||v>=values[i-1]),curve);
  }
});
test('expression maps normalized genotype to independently configurable phenotype bounds',()=>{
  const t=genetics.TRAITS[2];
  const settings={min:2,max:8,curve:'linear',strength:2,midpoint:.5,bias:0,environmentSensitivity:0};
  assert.equal(genetics.express(t.geneMin,t,settings,.5),2);
  assert.equal(genetics.express(t.geneMax,t,settings,.5),8);
  assert.ok(Math.abs(genetics.express((t.geneMin+t.geneMax)/2,t,settings,.5)-5)<1e-12);
});
test('environmental sensitivity modulates phenotype without changing genotype',()=>{
  const t=genetics.TRAITS[0],settings={min:0,max:1,curve:'linear',environmentSensitivity:.5};
  const neutral=genetics.express(.5,t,settings,.5);
  const low=genetics.express(.5,t,settings,0);
  const high=genetics.express(.5,t,settings,1);
  assert.equal(neutral,.5);
  assert.ok(low<neutral&&high>neutral);
});
test('cis-regulatory alleles shift trait expression and environmental responsiveness',()=>{
  const trait=genetics.TRAITS[0],settings={min:0,max:1,curve:'linear',bias:0,environmentSensitivity:.4};
  const quiet=genetics.express(.5,trait,settings,.5,.1);
  const active=genetics.express(.5,trait,settings,.5,.9);
  const quietStress=genetics.express(.5,trait,settings,1,.1);
  const activeStress=genetics.express(.5,trait,settings,1,.9);
  assert.ok(active>quiet);
  assert.ok(activeStress>active);
  assert.ok(quietStress>quiet);
});

test('inheritance fidelity and locus mutation are independently configurable',()=>{
  const t=genetics.TRAITS[2],mid=(t.geneMin+t.geneMax)/2;
  assert.equal(genetics.inheritTrait(mid,mid,2,{rate:0,magnitude:.5,heritability:1},()=>.99),mid);
  const mutated=genetics.inheritTrait(mid,mid,2,{rate:1,magnitude:.5,heritability:1},()=>.75);
  assert.ok(mutated>mid);
  const drifted=genetics.inheritTrait(mid,mid,2,{rate:0,magnitude:0,heritability:0},()=>.75);
  assert.ok(drifted>mid);
});

const fs=require('node:fs');
const worker=fs.readFileSync(require('node:path').join(__dirname,'../boids-worker.js'),'utf8');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
test('worker uses expression output, not raw genes, for physical behaviour',()=>{
  assert.match(worker,/function phenotype\(i,k\)/);
  assert.match(worker,/BoidsGenetics\.express\(traitGenes\[i\*10\+k\]/);
  assert.match(worker,/regulatoryGenes\[i\*10\+k\]/);
  assert.match(worker,/cloneRegulatoryGenes\(child,mother\)/);
  for(const index of [0,1,2,3,4,5,6,7,8,9])assert.ok(worker.includes('phenotype(i,'+index+')'),'missing expressed locus '+index);
  assert.match(worker,/BoidsGenetics\.inheritTrait/);
  assert.match(worker,/cfg\.geneExpression/);
  assert.match(worker,/cfg\.traitMutation/);
  assert.match(worker,/cfg\.geneExpression\.sensoryRange\?\.max\?\?0\)<=3/);
  assert.doesNotMatch(worker,/cfg\.speed/);
  assert.doesNotMatch(worker,/cfg\.perception/);
  assert.match(worker,/perceptionRadius=phenotype\(i,5\)/);
});


test('Observatory exposes live species and population-genetic metrics',()=>{
  for(const id of ['mSpecies','mSpeciesThreshold','mSpeciesQuota','mSpeciesAge','mSpeciesStagnant','mSpeciesChampion','mLargestSpecies','mRegulatory','mRegulatoryCopies','mRegulatoryMax','mRegulatoryStrength','mHeterozygosity','mHeritability','mInbreeding','mNe','mHabitatTemp','mHabitatMoisture','mHabitatNutrients','mHabitatSuitability','mAlleleRichness'])assert.ok(html.includes('id="'+id+'"'),'missing Observatory metric '+id);
  assert.ok(html.includes('geneticsHistoryChart'));
  assert.ok(html.includes('speciesCount'));
  assert.ok(html.includes('speciesStagnationLimit'));
  assert.ok(html.includes('speciesStagnantCount'));
  assert.ok(html.includes('habitatTemperature'));
  assert.ok(html.includes('habitatSuitability'));
  assert.ok(html.includes('regulatoryDuplicationRate'));
  assert.ok(html.includes('regulatoryCopyMean'));
  assert.ok(html.includes('function drawNetwork(m)'));
  assert.match(html,/positions=new Map\(\)/);
});
