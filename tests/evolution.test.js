'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const evo=require('../evolution.js');

function baseGenome(){return{nodes:[{id:0,type:'input'},{id:1,type:'input'},{id:2,type:'hidden'},{id:3,type:'output'}],connections:[{innovation:1,source:0,destination:2,weight:.5},{innovation:2,source:2,destination:3,weight:1}]}}
const fixed=value=>()=>value;

test('variable genomes validate nodes, innovation identities, and connection references',()=>{
  const g=evo.normalizeGenome(baseGenome());assert.equal(g.connections.length,2);
  assert.throws(()=>evo.normalizeGenome({...baseGenome(),connections:[...baseGenome().connections,{innovation:1,source:0,destination:3,weight:1}]}),/Duplicate innovation/);
  assert.throws(()=>evo.normalizeGenome({...baseGenome(),connections:[{innovation:3,source:99,destination:3,weight:1}]}),/missing node/);
});

test('innovation registry returns stable connection and split history',()=>{
  const r=evo.createInnovationRegistry();assert.equal(r.connection(0,2),r.connection(0,2));
  const a=r.split(7,0,3),b=r.split(7,0,3);assert.deepEqual(a,b);assert.notEqual(a.left,a.right);
  const state=r.snapshot();assert.equal(state.splits.length,1);
});

test('split mutation creates a hidden node and two historical connections',()=>{
  const registry=evo.createInnovationRegistry({nextNode:4});
  const mutated=evo.mutateGenome(baseGenome(),registry,fixed(.0),{rates:{weight:0,addConnection:0,splitConnection:1,deleteConnection:0,toggleConnection:0,bias:0}});
  assert.equal(mutated.nodes.length,5);assert.equal(mutated.connections.length,4);
  assert.equal(mutated.connections.filter(g=>!g.enabled).length,1);
  assert.ok(mutated.connections.some(g=>g.source===0&&g.destination===4));
  assert.ok(mutated.connections.some(g=>g.source===4&&g.destination===2));
});

test('mutation supports variable connection counts and bounded weights',()=>{
  const registry=evo.createInnovationRegistry({nextInnovation:20,nextNode:4});
  const mutated=evo.mutateGenome(baseGenome(),registry,()=>.5,{rates:{weight:1,addConnection:0,splitConnection:0,deleteConnection:0,toggleConnection:0,bias:0},limits:{weightStep:20}});
  assert.ok(mutated.connections.every(g=>Math.abs(g.weight)<=5));
});

test('crossover aligns matching innovations and only inherits unmatched genes from fitter parent',()=>{
  const a=baseGenome(),b=baseGenome();a.connections.push({innovation:9,source:1,destination:3,weight:.2});b.connections[0].weight=-.5;
  const child=evo.crossover(a,b,()=>0,{equalFitness:false});
  assert.deepEqual(child.connections.map(g=>g.innovation),[1,2,9]);
  assert.ok(child.connections.some(g=>g.innovation===1&&g.weight===-.5));
});

test('compatibility distance is invariant to connection array ordering',()=>{
  const a=baseGenome(),b=baseGenome();b.connections.reverse();
  assert.equal(evo.compatibilityDistance(a,b),0);
  b.connections.push({innovation:10,source:1,destination:3,weight:0});
  assert.ok(evo.compatibilityDistance(a,b)>0);
});

test('species assignment groups compatible genomes and separates divergent topologies',()=>{
  const a=baseGenome(),b=baseGenome(),c=baseGenome();c.connections.push({innovation:90,source:1,destination:3,weight:1});
  const species=evo.assignSpecies([{id:1,genome:a},{id:2,genome:b},{id:3,genome:c}],[],{threshold:.1});
  assert.equal(species.length,2);assert.equal(species.reduce((n,s)=>n+s.members.length,0),3);
});

test('regulatory activation, repression, and epistatic phenotype expression are measurable',()=>{
  const result=evo.expressPhenotypes({growth:1,modifier:.5},[{source:'growth',target:'modifier',threshold:0,strength:.5,mode:'activate'}],{temperature:.2},{size:{loci:{growth:2,modifier:1},interactions:[{a:'growth',b:'modifier',weight:.5}],min:0,max:10}});
  assert.ok(result.expression.modifier>.5);assert.ok(result.phenotype.size>2.5);
  const repressed=evo.evaluateRegulation({a:1,b:1},[{source:'a',target:'b',threshold:0,strength:.5,mode:'repress'}],{});
  assert.ok(repressed.b<1);
});

test('allele statistics report richness, frequencies, and expected heterozygosity',()=>{
  const stats=evo.alleleStatistics([0,0,1,1]);assert.equal(stats.sampleSize,4);assert.equal(stats.alleleRichness,2);assert.equal(stats.expectedHeterozygosity,.5);
  assert.equal(evo.alleleStatistics([]).expectedHeterozygosity,null);
});

test('parent-offspring regression reports slope and refuses undersized samples',()=>{
  const h=evo.parentOffspringHeritability([1,2,3,4],[2,4,6,8]);assert.equal(h.slope,2);assert.equal(h.n,4);
  assert.equal(evo.parentOffspringHeritability([1,2],[2,4]).heritability,null);
});

test('pedigree kinship and offspring inbreeding use parent identities',()=>{
  const pedigree=new Map([[1,[0,0]],[2,[0,0]],[3,[1,2]],[4,[1,2]],[5,[3,4]]]);
  assert.equal(evo.pedigreeKinship(1,2,pedigree),0);
  assert.equal(evo.pedigreeKinship(3,4,pedigree),.25);
  assert.equal(evo.inbreedingCoefficient(5,pedigree),.25);
});
