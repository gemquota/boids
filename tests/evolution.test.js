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
  const state=r.snapshot();assert.equal(state.splits.length,1);assert.equal(evo.createInnovationRegistry({nextInnovation:73,nextNode:19}).snapshot().nextInnovation,73);assert.equal(evo.createInnovationRegistry({nextInnovation:73,nextNode:19}).snapshot().nextNode,19);
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
  assert.ok(child.connections.some(g=>g.innovation===1&&g.weight===.5));
});

test('compiled neural networks execute variable hidden topologies in dependency order',()=>{
  const genome={nodes:[{id:0,type:'input'},{id:4,type:'hidden'},{id:5,type:'hidden'},{id:9,type:'output'}],connections:[
    {innovation:1,source:0,destination:5,weight:1},
    {innovation:2,source:5,destination:4,weight:1},
    {innovation:3,source:4,destination:9,weight:1}
  ]};
  const compiled=evo.compileNetwork(genome);
  assert.deepEqual(compiled.hidden.map(i=>compiled.nodes[i].id),[5,4]);
  const result=evo.activateNetwork(compiled,[1],new Float32Array(compiled.nodes.length));
  assert.ok(result.outputs[0]>.5);
  assert.equal(result.state.length,4);
});

test('activation mutations change node expression and node deletion removes incident genes',()=>{
  const registry=evo.createInnovationRegistry({nextInnovation:100,nextNode:8});
  const genome={nodes:[{id:0,type:'input'},{id:1,type:'hidden'},{id:2,type:'hidden'},{id:3,type:'output'}],connections:[
    {innovation:1,source:0,destination:1,weight:1},
    {innovation:2,source:1,destination:2,weight:1},
    {innovation:3,source:2,destination:3,weight:1}
  ]};
  const activated=evo.mutateGenome(genome,registry,()=>0,{rates:{weight:0,addConnection:0,splitConnection:0,deleteConnection:0,toggleConnection:0,deleteNode:0,activation:1,bias:0}});
  assert.notEqual(activated.nodes.find(n=>n.id===1).activation,'tanh');
  const deleted=evo.mutateGenome(genome,registry,()=>0,{rates:{weight:0,addConnection:0,splitConnection:0,deleteConnection:0,toggleConnection:0,deleteNode:1,activation:0,bias:0}});
  assert.equal(deleted.nodes.some(n=>n.id===1),false);
  assert.ok(deleted.connections.every(g=>deleted.nodes.some(n=>n.id===g.source)&&deleted.nodes.some(n=>n.id===g.destination)));
});

test('species statistics share fitness, allocate integer quotas, and track stagnation',()=>{
  const groups=[
    {id:1,representative:baseGenome(),members:[{id:10},{id:11},{id:12}]},
    {id:2,representative:baseGenome(),members:[{id:20},{id:21}]}
  ];
  const first=evo.updateSpeciesStatistics(groups,new Map([[10,8],[11,4],[12,2],[20,1],[21,1]]),{stagnationLimit:2});
  assert.equal(groups[0].age,1);assert.equal(groups[0].stagnation,0);
  assert.equal(groups[0].championId,10);assert.ok(groups[0].sharedFitness<groups[0].rawFitness,'fitness is divided by species size');
  assert.equal(groups.reduce((sum,g)=>sum+g.offspringQuota,0),5,'integer quotas must sum to the population size');
  assert.ok(groups[0].offspringQuota>groups[1].offspringQuota,'higher shared fitness receives more offspring');
  evo.updateSpeciesStatistics(groups,new Map([[10,8],[11,4],[12,2],[20,1],[21,1]]),{stagnationLimit:2});
  assert.equal(groups[0].stagnation,1);
  const third=evo.updateSpeciesStatistics(groups,new Map([[10,8],[11,4],[12,2],[20,1],[21,1]]),{stagnationLimit:2});
  assert.equal(groups[1].stagnant,true);assert.equal(groups[1].offspringQuota,0);
  assert.equal(third.stagnantSpecies,1);
  const recovered=evo.updateSpeciesStatistics(groups,new Map([[10,9],[11,4],[12,2],[20,1],[21,1]]),{stagnationLimit:2});
  assert.equal(groups[0].stagnation,0);assert.equal(groups[0].bestFitness,9);
  assert.equal(recovered.totalMembers,5);
});

test('recurrent neural connections retain state across activations',()=>{
  const genome={nodes:[{id:0,type:'input'},{id:1,type:'hidden'},{id:2,type:'output'}],connections:[
    {innovation:1,source:0,destination:1,weight:1},
    {innovation:2,source:1,destination:1,weight:.5,recurrent:true},
    {innovation:3,source:1,destination:2,weight:1}
  ]};
  const compiled=evo.compileNetwork(genome),state=new Float32Array(compiled.nodes.length),workspace={values:new Float32Array(128),state:new Float32Array(128),outputs:new Float32Array(8),result:{}};
  const first=evo.activateNetwork(compiled,[1],state,workspace),saved=first.state.slice();
  const second=evo.activateNetwork(compiled,[0],saved,workspace);
  assert.equal(first,second,'workspace should reuse the activation result object');
  assert.ok(second.outputs[0]>0);
  assert.ok(second.state[compiled.nodes.findIndex(n=>n.id===1)]>0);
});

test('splitting a recurrent hidden edge preserves recurrence on the downstream half',()=>{
  const genome={nodes:[{id:0,type:'input'},{id:1,type:'hidden'},{id:2,type:'output'}],connections:[
    {innovation:1,source:0,destination:1,weight:1},
    {innovation:2,source:1,destination:1,weight:.5,recurrent:true},
    {innovation:3,source:1,destination:2,weight:1}
  ]};
  const registry=evo.createInnovationRegistry({nextInnovation:100,nextNode:4});
  const mutated=evo.mutateGenome(genome,registry,()=>.4,{rates:{weight:0,addConnection:0,splitConnection:1,deleteConnection:0,toggleConnection:0,bias:0}});
  assert.ok(mutated.connections.some(g=>g.source===4&&g.destination===1&&g.recurrent));
  assert.ok(mutated.connections.some(g=>g.source===1&&g.destination===4&&!g.recurrent));
});

test('split mutations compile into a live two-edge path',()=>{
  const registry=evo.createInnovationRegistry({nextInnovation:20,nextNode:8});
  const mutated=evo.mutateGenome(baseGenome(),registry,fixed(0),{rates:{weight:0,addConnection:0,splitConnection:1,deleteConnection:0,toggleConnection:0,bias:0}});
  const compiled=evo.compileNetwork(mutated),result=evo.activateNetwork(compiled,[1,0],new Float32Array(compiled.nodes.length));
  assert.equal(mutated.nodes.filter(n=>n.type==='hidden').length,2);
  assert.ok(result.outputs[0]>0);
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

test('replicate summaries and permutation comparisons are reproducible',()=>{
  const a=evo.summarizeReplicates([1,2,3,4,5],{seed:7,bootstrapSamples:300});
  const b=evo.summarizeReplicates([1,2,3,4,5],{seed:7,bootstrapSamples:300});
  assert.deepEqual(a,b);assert.equal(a.n,5);assert.ok(a.interquartileRange>=0);assert.ok(a.firstQuartile<=a.median&&a.median<=a.thirdQuartile);assert.ok(a.confidenceInterval95[0]<=a.mean&&a.confidenceInterval95[1]>=a.mean);
  const comparison=evo.compareReplicates([5,6,7,8],[1,2,3,4],{seed:9,permutations:500,bootstrapSamples:300});
  assert.ok(comparison.difference>0);assert.ok(comparison.cohensD>0);assert.ok(comparison.pValue>=0&&comparison.pValue<=1);
  assert.deepEqual(comparison,evo.compareReplicates([5,6,7,8],[1,2,3,4],{seed:9,permutations:500,bootstrapSamples:300}));
});

test('parameter sweeps enumerate deterministic cartesian configurations and enforce limits',()=>{
  const sweep=evo.parameterSweep({speed:[1,2],predation:[0,.5,1]});
  assert.equal(sweep.length,6);assert.deepEqual(sweep[0].config,{speed:1,predation:0});
  assert.throws(()=>evo.parameterSweep({a:[1,2],b:[1,2]},3),/exceeds/);
  assert.deepEqual(evo.replicateSeeds(123,4),evo.replicateSeeds(123,4));
});

test('pedigree kinship and offspring inbreeding use parent identities',()=>{
  const pedigree=new Map([[1,[0,0]],[2,[0,0]],[3,[1,2]],[4,[1,2]],[5,[3,4]]]);
  assert.equal(evo.pedigreeKinship(1,2,pedigree),0);
  assert.equal(evo.pedigreeKinship(3,4,pedigree),.25);
  assert.equal(evo.inbreedingCoefficient(5,pedigree),.25);
});
