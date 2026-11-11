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
  const mutated=evo.mutateGenome(baseGenome(),registry,fixed(.0),{rates:{weight:0,addConnection:0,splitConnection:1,deleteConnection:0,toggleConnection:0,recurrent:0,deleteNode:0,activation:0,bias:0}});
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

test('recurrent mutation promotes enabled feed-forward genes to recurrent edges',()=>{
  const registry=evo.createInnovationRegistry({nextInnovation:50,nextNode:8});
  const mutated=evo.mutateGenome(baseGenome(),registry,()=>0,{rates:{weight:0,addConnection:0,splitConnection:0,deleteConnection:0,toggleConnection:0,recurrent:1,deleteNode:0,activation:0,bias:0}});
  assert.equal(mutated.connections[0].recurrent,true);
  assert.equal(mutated.connections[0].innovation,baseGenome().connections[0].innovation);
  assert.ok(evo.compileNetwork(mutated).recurrent.some(edges=>edges.length));
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
  evo.updateSpeciesStatistics(groups,new Map([[10,8.1],[11,4],[12,2],[20,1],[21,1]]),{stagnationLimit:2});
  assert.equal(groups[0].stagnation,0);
  const third=evo.updateSpeciesStatistics(groups,new Map([[10,8.1],[11,4],[12,2],[20,1],[21,1]]),{stagnationLimit:2});
  assert.equal(groups[1].stagnant,true);assert.equal(groups[1].offspringQuota,0);
  assert.equal(third.stagnantSpecies,1);
  const recovered=evo.updateSpeciesStatistics(groups,new Map([[10,9],[11,4],[12,2],[20,1],[21,1]]),{stagnationLimit:2});
  assert.equal(groups[0].stagnation,0);assert.equal(groups[0].bestFitness,9);
  assert.equal(recovered.totalMembers,5);
});

test('experiment manifests are immutable and derive reproducible independent seeds',()=>{
  const manifest=evo.createExperimentManifest({modelVersion:'test-7',seed:42,replicates:4,scenario:'drought',config:{count:100,nested:{rate:.2}}});
  assert.equal(Object.isFrozen(manifest),true);assert.equal(Object.isFrozen(manifest.config.nested),true);
  const first=evo.deriveReplicateSeeds(manifest),second=evo.deriveReplicateSeeds(manifest);
  assert.deepEqual(first,second);assert.equal(first.length,4);assert.equal(new Set(first).size,4);
  assert.throws(()=>evo.createExperimentManifest({replicates:0}),/between 1 and 10000/);
});

test('Kaplan-Meier survival handles events, censoring and median survival',()=>{
  const result=evo.kaplanMeier([{time:1,event:true},{time:2,event:false},{time:3,event:true},{time:4,event:true}]);
  assert.equal(result.n,4);assert.equal(result.events,3);assert.equal(result.censored,1);
  assert.equal(result.curve[1].survival,.75);assert.equal(result.median,3);
  assert.ok(result.curve.every(point=>point.lower>=0&&point.upper<=1&&point.lower<=point.survival&&point.upper>=point.survival));
  const large=evo.kaplanMeier(Array.from({length:5000},(_,i)=>({time:i+1,event:true})));
  assert.equal(large.events,5000);assert.equal(large.curve.length,5001);assert.equal(large.median,2500);
  const delayed=evo.kaplanMeier([{time:1,entry:0,event:true},{time:3,entry:2,event:true},{time:4,entry:0,event:false}]);
  assert.equal(delayed.leftTruncated,1);assert.equal(delayed.curve[1].atRisk,2);assert.equal(delayed.curve[2].atRisk,2);assert.equal(delayed.median,1);
});

test('multiple-comparison corrections preserve order and control adjusted p-values',()=>{
  const values=[.01,.04,.03,.2];
  const bh=evo.correctPValues(values,'BH'),holm=evo.correctPValues(values,'holm');
  assert.equal(bh.length,4);assert.equal(holm.length,4);
  assert.ok(bh.every((value,index)=>value>=values[index]&&value<=1));
  assert.ok(holm.every((value,index)=>value>=values[index]&&value<=1));
  assert.ok(holm.every((value,index)=>value>=bh[index]-1e-12));
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

test('regulatory gene copies retain stable identities through duplication and deletion',()=>{
  const base={nodes:[{id:1,locus:'aggression',bias:.2,effect:1},{id:2,locus:'size',bias:0,effect:.5}],edges:[{id:1,source:1,target:2,weight:.8}]};
  const registry={nextGene:3,nextEdge:2};
  const duplicated=evo.mutateRegulatoryGenome(base,registry,()=>0,{rates:{duplicate:1,delete:0,insert:0,rearrange:0,addEdge:0,deleteEdge:0,weight:0,bias:0,effect:0}});
  assert.equal(duplicated.nodes.length,3);assert.equal(new Set(duplicated.nodes.map(node=>node.id)).size,3);
  assert.equal(duplicated.nodes[2].id,3);assert.ok(duplicated.edges.some(edge=>edge.source===3||edge.target===3),'duplicated locus should retain regulatory connections');
  const deleted=evo.mutateRegulatoryGenome(duplicated,registry,()=>0,{rates:{duplicate:0,delete:1,insert:0,rearrange:0,addEdge:0,deleteEdge:0,weight:0,bias:0,effect:0}});
  assert.equal(deleted.nodes.length,2);assert.ok(deleted.edges.every(edge=>deleted.nodes.some(node=>node.id===edge.source)&&deleted.nodes.some(node=>node.id===edge.target)));
});

test('regulatory gene insertion and rearrangement preserve stable identities',()=>{
  const base={nodes:[{id:1,locus:'aggression',bias:.2,effect:1},{id:2,locus:'size',bias:0,effect:.5}],edges:[{id:1,source:1,target:2,weight:.8}]};
  const inserted=evo.mutateRegulatoryGenome(base,{nextGene:3,nextEdge:2},()=>0,{rates:{duplicate:0,delete:0,insert:1,rearrange:0,addEdge:0,deleteEdge:0,weight:0,bias:0,effect:0}});
  assert.equal(inserted.nodes.length,3);
  assert.deepEqual(inserted.nodes.slice(0,2).map(node=>node.id),[1,2]);
  assert.equal(inserted.nodes[2].id,3);
  assert.ok(inserted.edges.some(edge=>edge.source===1&&edge.target===3),'inserted gene should be linked without changing existing identities');
  const rearranged=evo.mutateRegulatoryGenome(base,{nextGene:3,nextEdge:2},()=>0,{rates:{duplicate:0,delete:0,insert:0,rearrange:1,addEdge:0,deleteEdge:0,weight:0,bias:0,effect:0}});
  assert.deepEqual(new Set(rearranged.nodes.map(node=>node.id)),new Set([1,2]));
  assert.deepEqual(rearranged.edges.map(edge=>[edge.id,edge.source,edge.target]),[[1,1,2]]);
  assert.deepEqual(rearranged.nodes.map(node=>node.id),[2,1],'rearrangement should move records without reassigning stable IDs');
});

test('regulatory crossover combines homologous and inherited gene copies by identity',()=>{
  const a={nodes:[{id:1,locus:'aggression',bias:.2,effect:1}],edges:[]},b={nodes:[{id:1,locus:'aggression',bias:.6,effect:1},{id:2,locus:'aggression',bias:.1,effect:.4}],edges:[]};
  const child=evo.crossoverRegulatoryGenome(a,b,()=>0);
  assert.equal(child.nodes.find(node=>node.id===1).bias,.4);
  assert.ok(child.nodes.some(node=>node.id===2),'unmatched regulatory copies can be inherited');
});

test('trans-regulatory expression responds to upstream activation, repression and environment',()=>{
  const base={nodes:[{id:1,locus:'regA',bias:1,effect:1},{id:2,locus:'aggression',bias:0,effect:1,environment:'heat',environmentSensitivity:1}],edges:[{id:1,source:1,target:2,weight:1}]};
  const activated=evo.evaluateRegulatoryGenome(base,{heat:1},5);
  const repressed=evo.evaluateRegulatoryGenome({...base,edges:[{id:1,source:1,target:2,weight:-1}]},{heat:1},5);
  const cool=evo.evaluateRegulatoryGenome(base,{heat:0},5);
  assert.ok(activated.expression.aggression>repressed.expression.aggression);
  assert.ok(activated.expression.aggression>cool.expression.aggression);
  const unthresholded=evo.evaluateRegulatoryGenome({nodes:[{id:3,locus:'growth',bias:1,effect:1,threshold:0}]},{},3),thresholded=evo.evaluateRegulatoryGenome({nodes:[{id:3,locus:'growth',bias:1,effect:1,threshold:1.5}]},{},3);
  assert.ok(unthresholded.expression.growth>thresholded.expression.growth,'regulatory thresholds should gate activation');
  assert.equal(activated.nodeCount,2);assert.equal(activated.edgeCount,1);
});

test('compiled regulatory evaluation matches the reference evaluator without rebuilding graph maps',()=>{
  const genome={nodes:[{id:1,locus:'growth',bias:.3,effect:.8,environment:'heat',environmentSensitivity:.2},{id:2,locus:'risk',bias:-.1,effect:.6},{id:3,locus:'growth',bias:.2,effect:.3}],edges:[{id:1,source:1,target:2,weight:-.7},{id:2,source:2,target:3,weight:.4}]};
  const environment={heat:.75},reference=evo.evaluateRegulatoryGenome(genome,environment,4),compiled=evo.compileRegulatoryGenome(genome,['growth','risk']),output=new Float32Array(2);
  evo.evaluateCompiledRegulatoryGenome(compiled,environment,4,output);
  assert.ok(Math.abs(output[0]-reference.expression.growth)<1e-6);
  assert.ok(Math.abs(output[1]-reference.expression.risk)<1e-6);
  const second=evo.evaluateCompiledRegulatoryGenome(compiled,{heat:0},4,output);
  assert.equal(second,output,'compiled evaluation should reuse caller-owned output storage');
  assert.notEqual(output[0],reference.expression.growth,'environment changes should be evaluated against the compiled topology');
});

test('allele statistics report richness, frequencies, and expected heterozygosity',()=>{
  const stats=evo.alleleStatistics([0,0,1,1]);assert.equal(stats.sampleSize,4);assert.equal(stats.alleleRichness,2);assert.equal(stats.expectedHeterozygosity,.5);
  assert.equal(evo.alleleStatistics([]).expectedHeterozygosity,null);
});

test('effective breeder estimate reflects realised unequal parental contributions',()=>{
  const balanced=evo.effectiveBreederSize({female:[1,1,1,1],male:[1,1,1,1]});
  assert.equal(balanced.effectiveFemales,4);assert.equal(balanced.effectiveMales,4);assert.equal(balanced.effectiveBreeders,4);
  const skewed=evo.effectiveBreederSize({female:[8,1,1,0],male:[1,1,1,1]});
  assert.ok(skewed.effectiveFemales<4);assert.equal(skewed.effectiveMales,4);assert.ok(skewed.effectiveBreeders<balanced.effectiveBreeders);
  assert.equal(evo.effectiveBreederSize({female:[1,2],male:[]}).effectiveBreeders,0);
});

test('parent-offspring regression reports slope uncertainty and refuses undersized samples',()=>{
  const h=evo.parentOffspringHeritability([1,2,3,4,5],[2.1,3.9,6.2,7.8,10.1]);
  assert.equal(h.n,5);assert.equal(h.rawSlope,h.slope);assert.ok(h.slopeStandardError>0);
  assert.ok(h.slopeConfidenceInterval95[0]<h.slope&&h.slope<h.slopeConfidenceInterval95[1]);
  const small=evo.parentOffspringHeritability([1,2],[2,4]);
  assert.equal(small.heritability,null);assert.equal(small.slopeConfidenceInterval95,null);
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
