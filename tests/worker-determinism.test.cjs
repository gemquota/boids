const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const BoidsChromosome = require('../chromosome.js');
const BoidsEcology = require('../ecology.js');

const source = fs.readFileSync('boids-worker.js', 'utf8');

function makeWorld(seed) {
  const messages = [];
  const sandbox = {
    __messages: messages,
    postMessage: message => messages.push(message),
    setTimeout: () => 0,
    performance: { now: () => 1000 },
    console,
    Math,
    Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int32Array,
    Array, Object, Number, String, Boolean, Set, Map, Date, JSON,
  };
  vm.createContext(sandbox);
  sandbox.importScripts = (...paths) => { for (const path of paths) { const filePath = path.split('?')[0]; vm.runInContext(fs.readFileSync(filePath, 'utf8'), sandbox, { filename: path }); } };
  vm.runInContext(source + `\nglobalThis.__boidsTest = { get cfg(){return cfg}, get N(){return N}, get rngState(){return rngState}, get sex(){return sex}, get age(){return age}, get birthCohort(){return birthCohort}, get environmentFields(){return environmentFields}, get pregnant(){return pregnant}, get energy(){return energy}, get fitness(){return fitness}, get individualId(){return individualId}, get parentA(){return parentA}, get parentB(){return parentB}, get pedigree(){return pedigree}, get plants(){return plants}, makePlantNode, get plantGrid(){return plantGrid}, rebuildPlantGrid, get cols(){return cols}, get rows(){return rows}, get cellSize(){return cellSize}, get spores(){return spores}, get plantCounters(){return plantCounters}, growPlants, nearestFreshwater, get obstacles(){return obstacles}, set obstacles(v){obstacles=v}, get x(){return x}, get y(){return y}, get xNext(){return xNext}, get yNext(){return yNext}, get vx(){return vx}, get vy(){return vy}, collisionRadius, resolveAgentCollisions, get coverByAgent(){return coverByAgent}, get currentSeasonalFactor(){return currentSeasonalFactor}, get reproductiveSuccess(){return reproductiveSuccess}, get parentTraitRecords(){return parentTraitRecords}, get traitGenes(){return traitGenes}, get survivalHistory(){return survivalHistory}, get survivalEntryAgeById(){return survivalEntryAgeById}, get survivalHistoryTruncated(){return survivalHistoryTruncated}, recordSurvivalObservation, populationSurvivalMetrics, resizePopulation, populationGeneticsMetrics, get selectedParentEvents(){return selectedParentEvents}, get selectedTraitSums(){return selectedTraitSums}, get attackAttempts(){return attackAttempts}, get genome(){return genome}, get innovation(){return innovation}, get innovationRegistry(){return innovationRegistry}, get innovationBirthTime(){return innovationBirthTime}, get simTime(){return simTime}, set simTime(value){simTime=value}, get frameNo(){return frameNo}, get phenotypeCache(){return phenotypeCache}, get phenotypeCacheReady(){return phenotypeCacheReady}, innovationProtectionFactor, get agentGenomes(){return agentGenomes}, get agentGeneIndex(){return agentGeneIndex}, get agentLearnedWeights(){return agentLearnedWeights}, get agentEligibility(){return agentEligibility}, get agentRegulatoryGenomes(){return agentRegulatoryGenomes}, get paternalRegulatoryGenomes(){return paternalRegulatoryGenomes}, get regulatoryRegistry(){return regulatoryRegistry}, get regulatoryExpressionByAgent(){return regulatoryExpressionByAgent}, get regulatoryMutationHistory(){return regulatoryMutationHistory}, recordRegulatoryMutation, updateRegulatoryExpression, inheritRegulatoryGenome, calculatePhenotype, refreshPhenotypes, phenotype, installNeatGenome, get reward(){return reward}, get speciesThresholdCurrent(){return speciesThresholdCurrent}, speciesQuotaFactor, get speciesState(){return speciesState}, get speciesByIndividual(){return speciesByIndividual}, get speciesQuotaById(){return speciesQuotaById}, get speciesChampionById(){return speciesChampionById}, configure:values=>onmessage({data:{type:'config',values}}), brain, inspectBrain, update, exportSnapshot, restoreSnapshot, conceive, deliver, kinshipRelatedness, innovationFor, genomeDistance, evaluatePopulation, exportExperimentData, init };`, sandbox, { filename: 'boids-worker.js' });
  const api = sandbox.__boidsTest;
  api.cfg.seed = seed;
  api.cfg.count = 96;
  api.cfg.obstacles = 4;
  api.cfg.drive = 0;
  const context = {
    setTransform() {},
    fillRect() {},
  };
  const canvas = { width: 1, height: 1, getContext: () => context };
  api.init(canvas, 720, 480, 1);
  return sandbox;
}

const plantIndexProbe=makeWorld(112233).__boidsTest;
plantIndexProbe.plants.push(plantIndexProbe.makePlantNode({x:35,y:48}),plantIndexProbe.makePlantNode({x:240,y:180}),plantIndexProbe.makePlantNode({x:500,y:300}));
plantIndexProbe.rebuildPlantGrid();
const indexedPlantIds=[];
for(let cell=0;cell<plantIndexProbe.plantGrid.length;cell++){
  for(const plantIndex of plantIndexProbe.plantGrid[cell]){
    assert.ok(!indexedPlantIds.includes(plantIndex),'each plant must be indexed exactly once');
    const plant=plantIndexProbe.plants[plantIndex];
    const expectedX=Math.min(plantIndexProbe.cols-1,Math.max(0,Math.floor(plant.x/plantIndexProbe.cellSize)));
    const expectedY=Math.min(plantIndexProbe.rows-1,Math.max(0,Math.floor(plant.y/plantIndexProbe.cellSize)));
    assert.equal(cell,expectedY*plantIndexProbe.cols+expectedX,'plant must be stored in its spatial cell');
    indexedPlantIds.push(plantIndex);
  }
}
assert.equal(indexedPlantIds.length,plantIndexProbe.plants.length,'plant spatial index must contain every live plant once');
assert.deepEqual([...new Set(indexedPlantIds)].sort((a,b)=>a-b),[0,1,2],'plant spatial index must not duplicate plant entries');
plantIndexProbe.update(1/60,1000);

const expressionCadence=makeWorld(76543).__boidsTest;
expressionCadence.cfg.drive=0;
expressionCadence.traitGenes[0]=.01;
expressionCadence.update(1/60,1000);
const firstExpression=expressionCadence.phenotypeCache[0];
expressionCadence.traitGenes[0]=.99;
expressionCadence.update(1/60,1016);
const refreshedExpression=expressionCadence.phenotypeCache[0];
assert.notEqual(refreshedExpression,firstExpression,'environmental phenotype cache should refresh on alternating fixed ticks');
expressionCadence.traitGenes[0]=.01;
expressionCadence.update(1/60,1033);
assert.equal(expressionCadence.phenotypeCache[0],refreshedExpression,'the cached expression should be reused on intervening ticks');
expressionCadence.update(1/60,1050);
assert.notEqual(expressionCadence.phenotypeCache[0],refreshedExpression,'the next scheduled expression refresh should observe inherited trait changes');

function run(seed) {
  const world = makeWorld(seed);
  for (let tick = 0; tick < 180; tick++) world.__boidsTest.update(1 / 60, 1000 + tick * (1000 / 60));
  return world;
}

const selectionLow=makeWorld(77661).__boidsTest,selectionHigh=makeWorld(77661).__boidsTest;
for(const api of [selectionLow,selectionHigh]){api.fitness[0]=.5;api.energy[0]=.8;api.age[0]=60;api.cfg.drive=0}
selectionHigh.reproductiveSuccess.set(selectionHigh.individualId[0],4);
selectionLow.update(1/60,1000);selectionHigh.update(1/60,1000);
assert.ok(selectionHigh.fitness[0]>selectionLow.fitness[0],'selection fitness must include realised lifetime reproductive success');
const survivalYoung=makeWorld(77662).__boidsTest,survivalOld=makeWorld(77662).__boidsTest;
for(const api of [survivalYoung,survivalOld]){api.fitness[0]=.5;api.energy[0]=.8;api.cfg.drive=0;api.reproductiveSuccess.set(api.individualId[0],2)}
survivalYoung.age[0]=10;survivalOld.age[0]=100;
survivalYoung.update(1/60,1000);survivalOld.update(1/60,1000);
assert.ok(survivalOld.fitness[0]>survivalYoung.fitness[0],'selection fitness must reward realised survival time');
const regulationProbe=makeWorld(90210).__boidsTest;
assert.equal(regulationProbe.agentRegulatoryGenomes[0].nodes.length,10,'live agents should start with a typed trans-regulatory network');
const originalRegulatedPhenotype=regulationProbe.calculatePhenotype(0,0),regulatoryNode=regulationProbe.agentRegulatoryGenomes[0].nodes[0];
regulatoryNode.bias=4;regulatoryNode.threshold=0;regulatoryNode.effect=4;regulatoryNode.environment='';regulatoryNode.environmentSensitivity=0;
regulationProbe.updateRegulatoryExpression(0);
assert.notEqual(regulationProbe.calculatePhenotype(0,0),originalRegulatedPhenotype,'trans-regulatory expression should alter the live phenotype');
const a = run(123456);
const b = run(123456);
const sa = a.__boidsTest.exportSnapshot();
const sb = b.__boidsTest.exportSnapshot();

for (const key of ['x', 'y', 'vx', 'vy', 'energy', 'age', 'individualId', 'parentA', 'parentB', 'traitGenes', 'regulatoryGenes', 'genome', 'innovation']) {
  assert.deepEqual(Array.from(sa.arrays[key]), Array.from(sb.arrays[key]), 'same seed must reproduce ' + key);
}
assert.equal(sa.rngState, sb.rngState, 'same seed must reproduce RNG state');
assert.equal(JSON.stringify(sa.neatGenomes), JSON.stringify(sb.neatGenomes), 'same seed must reproduce variable-length neural genomes');
assert.equal(JSON.stringify(sa.agentLearnedWeights), JSON.stringify(sb.agentLearnedWeights), 'same seed must reproduce lifetime learned weights');
assert.equal(JSON.stringify(sa.agentNeuralStates), JSON.stringify(sb.agentNeuralStates), 'same seed must reproduce recurrent neural state');
assert.equal(new Set(Array.from(sa.arrays.individualId)).size, sa.N, 'individual IDs must be unique');
const thresholdControl = makeWorld(998876).__boidsTest;
thresholdControl.configure({speciesThreshold:1.5});
assert.equal(thresholdControl.speciesThresholdCurrent,1.5,'the initial compatibility threshold control must update the live adaptive threshold');
const plasticWorld = makeWorld(998877).__boidsTest;
const originalGenome = plasticWorld.agentGenomes[0];
const existingPairs = new Set(originalGenome.connections.map(gene => gene.source + ':' + gene.destination));
let extraPair = null;
for (let source = 0; source < 8 && !extraPair; source++) {
  for (let destination = 8; destination < 8 + plasticWorld.cfg.hidden; destination++) {
    if (!existingPairs.has(source + ':' + destination)) { extraPair = { source, destination }; break; }
  }
}
assert.ok(extraPair, 'test fixture must have an unused input-to-hidden connection');
const nextInnovation = Math.max(...originalGenome.connections.map(gene => gene.innovation)) + 1;
const expandedGenome = { nodes: originalGenome.nodes, connections: [...originalGenome.connections, { innovation: nextInnovation, source: extraPair.source, destination: extraPair.destination, weight: .5, enabled: true, recurrent: false }] };
plasticWorld.installNeatGenome(0, expandedGenome);
const extraConnectionIndex = plasticWorld.agentGenomes[0].connections.findIndex(gene => gene.innovation === nextInnovation);
assert.ok(plasticWorld.agentGenomes[0].connections.length > plasticWorld.cfg.connections, 'fixture must exceed the legacy fixed connection capacity');
const plasticGene = plasticWorld.agentGenomes[0].connections.find(gene => gene.enabled && gene.source < 8);
assert.ok(plasticGene, 'initial brain should contain an input connection');
const plasticIndex = plasticWorld.agentGeneIndex[0].get(plasticGene.innovation);
const inheritedWeight = plasticGene.weight;
plasticWorld.cfg.plasticity = .5;
plasticWorld.cfg.rewardScale = 1;
plasticWorld.cfg.learningMomentum = 1;
plasticWorld.cfg.traceDecay = 0;
plasticWorld.reward[0] = 1;
plasticWorld.brain(0, [1,1,1,1,1,1,1,1]);
assert.equal(plasticWorld.agentGenomes[0].connections[plasticIndex].weight, inheritedWeight, 'plasticity must not rewrite inherited connection genes');
assert.notEqual(plasticWorld.agentLearnedWeights[0][plasticIndex], 0, 'plasticity must update a separate learned-weight overlay');
assert.equal(plasticWorld.agentEligibility[0].length, expandedGenome.connections.length, 'plasticity traces must allocate to the full variable genome length');
assert.notEqual(plasticWorld.agentEligibility[0][extraConnectionIndex], 0, 'plasticity must update connections beyond the legacy fixed-slot capacity');
assert.notEqual(plasticWorld.agentLearnedWeights[0][extraConnectionIndex], 0, 'learned-weight overlays must cover every variable-length connection');
const plasticSnapshot = plasticWorld.exportSnapshot();
const plasticRestored = makeWorld(998877).__boidsTest;
plasticRestored.restoreSnapshot(plasticSnapshot);
assert.equal(plasticRestored.agentLearnedWeights[0][plasticIndex], plasticWorld.agentLearnedWeights[0][plasticIndex], 'learned weights must survive snapshot restore');
assert.deepEqual(Array.from(plasticRestored.agentEligibility[0]), Array.from(plasticWorld.agentEligibility[0]), 'variable-length plasticity traces must survive snapshot restore');

const inspectedWorld = a.__boidsTest;
inspectedWorld.inspectBrain(inspectedWorld.x[0], inspectedWorld.y[0], 100);
const brainMessage = a.__messages.filter(message => message.type === 'brain').at(-1);
assert.ok(brainMessage && brainMessage.nodes.length > 0, 'brain inspection should expose actual variable topology nodes');
assert.ok(brainMessage.edges.every(edge => brainMessage.nodes.some(node => node.id === edge[0]) && brainMessage.nodes.some(node => node.id === edge[1])), 'every inspected edge must reference a visible node');
a.__boidsTest.obstacles = [{ x: a.__boidsTest.x[0], y: a.__boidsTest.y[0], r: 60 }];
a.__boidsTest.update(1 / 60, 5000);
assert.ok(a.__boidsTest.coverByAgent[0] > .5, 'reef obstacles should provide measurable shelter cover');
assert.ok(a.__boidsTest.currentSeasonalFactor >= .44 && a.__boidsTest.currentSeasonalFactor <= 1, 'seasonal resource factor should remain bounded');

// A parent pair must be stored as persistent individual identities, not generation counters.
const api = a.__boidsTest;
api.sex[0] = 1;
api.sex[1] = 0;
const motherId=api.individualId[0],fatherId=api.individualId[1];
const expectedMidParent = Array.from({length:10},(_,k)=>(api.traitGenes[k]+api.traitGenes[10+k])*.5);
api.age[0] = 30;
api.age[1] = 30;
api.survivalEntryAgeById.set(motherId,30);
api.survivalEntryAgeById.set(fatherId,30);
api.pregnant[0] = 0;
api.energy[0] = 1;
api.conceive(0, 1);
api.cfg.fertility = 1;
const before = api.N;
api.deliver(0);
assert.equal(api.phenotypeCacheReady,false,'offspring delivery must invalidate cached phenotype expression');
assert.equal(api.N, before + 1, 'delivery should append one offspring');
assert.equal(api.parentA[before], api.individualId[0], 'offspring should retain maternal identity');
assert.equal(api.parentB[before], api.individualId[1], 'offspring should retain paternal identity');
assert.notEqual(api.individualId[before], api.individualId[0], 'offspring identity must be unique');
assert.deepEqual(api.parentTraitRecords.get(api.individualId[before]),expectedMidParent,'offspring should retain parental trait values captured at conception');
const firstChildId = api.individualId[before];
assert.ok(api.agentRegulatoryGenomes[before].nodes.length>=10,'offspring should inherit a variable-length trans-regulatory genome');
assert.equal(new Set(api.agentRegulatoryGenomes[before].nodes.map(node=>node.id)).size,api.agentRegulatoryGenomes[before].nodes.length,'regulatory gene-copy identities must remain unique');
assert.ok(api.agentRegulatoryGenomes[before].edges.every(edge=>api.agentRegulatoryGenomes[before].nodes.some(node=>node.id===edge.source)&&api.agentRegulatoryGenomes[before].nodes.some(node=>node.id===edge.target)),'inherited regulatory edges must reference extant gene copies');
assert.equal(api.kinshipRelatedness(api.individualId[0], firstChildId), .5, 'parent and offspring should have 0.5 relatedness');
api.conceive(0, 1);
api.deliver(0);
const secondChildId = api.individualId[before + 1];
api.conceive(0, 1);
api.deliver(0);
const thirdChildId = api.individualId[before + 2];
const cohortSnapshot=api.exportSnapshot();
const pedigreeProbe=makeWorld(123457).__boidsTest;
pedigreeProbe.restoreSnapshot(cohortSnapshot);
for(const id of [firstChildId,secondChildId,thirdChildId]){const index=Array.from(pedigreeProbe.individualId.subarray(0,pedigreeProbe.N)).indexOf(id);pedigreeProbe.parentA[index]=999999;pedigreeProbe.parentB[index]=888888;}
const cohortMetrics=pedigreeProbe.populationGeneticsMetrics();
assert.deepEqual(cohortMetrics.heritabilitySampleSizes,Array(10).fill(3),'heritability sampling must not depend on parents remaining alive');
const cohortRestored=makeWorld(123456).__boidsTest;
cohortRestored.restoreSnapshot(cohortSnapshot);
assert.deepEqual([...cohortRestored.parentTraitRecords.entries()],[...api.parentTraitRecords.entries()],'conception-time parent trait records must survive snapshot restoration');
const deathIndex=Math.min(10,api.N-1),deathId=api.individualId[deathIndex],initialEntryAge=api.survivalEntryAgeById.get(deathId);
api.age[deathIndex]=api.cfg.lifespan+1;
api.update(1/60,12000);
assert.ok(api.survivalHistory.some(row=>row.event&&row.time>api.cfg.lifespan&&row.entry===initialEntryAge),'natural mortality must append a delayed-entry survival event');
api.birthCohort[0]=0;api.birthCohort[1]=1;
 const survivalMetrics=api.populationSurvivalMetrics();
assert.ok(survivalMetrics.survivalEvents>=1,'Kaplan-Meier telemetry must count recorded deaths');
assert.ok(survivalMetrics.survivalCensored>=api.N,'living agents must enter the survival estimate as right-censored observations');
assert.ok(survivalMetrics.survivalLeftTruncated>0,'initial agents with nonzero ages must enter the risk set only after delayed entry');
 assert.ok(survivalMetrics.birthCohortCount>=2,'survival metrics must retain independently identified birth cohorts');
 assert.ok(survivalMetrics.birthCohortSurvival.some(row=>row.cohort===1),'cohort-specific survival estimates must be reported');
const mutationBefore={nodes:[{id:1,locus:'aggression',bias:0,effect:1}],edges:[]},mutationAfter={nodes:[{id:1,locus:'aggression',bias:.5,effect:1},{id:2,locus:'aggression',bias:0,effect:.5}],edges:[{id:1,source:1,target:2,weight:.4,enabled:true}]};const mutationHistoryBefore=api.regulatoryMutationHistory.length,mutationEvent=api.recordRegulatoryMutation(0,mutationBefore,mutationAfter);assert.equal(mutationEvent.changedNodes,1);assert.equal(mutationEvent.duplicatedNodes,1);assert.equal(mutationEvent.addedEdges,1);assert.equal(api.regulatoryMutationHistory.length,mutationHistoryBefore+1,'regulatory mutation events should be recorded');
 const survivalSnapshot=api.exportSnapshot();
const survivalRestored=makeWorld(123456).__boidsTest;
survivalRestored.restoreSnapshot(survivalSnapshot);
assert.equal(JSON.stringify(survivalRestored.survivalHistory),JSON.stringify(api.survivalHistory),'survival events must survive snapshot restoration');
assert.equal(JSON.stringify([...survivalRestored.survivalEntryAgeById.entries()]),JSON.stringify([...api.survivalEntryAgeById.entries()]),'delayed-entry ages must survive snapshot restoration');
assert.equal(survivalRestored.survivalHistoryTruncated,api.survivalHistoryTruncated,'survival truncation count must survive snapshot restoration');
 assert.deepEqual(Array.from(survivalRestored.birthCohort.slice(0,survivalRestored.N)),Array.from(api.birthCohort.slice(0,api.N)),'birth cohort identities must survive snapshot restoration');
const manualRemovalWorld=makeWorld(4321).__boidsTest;
const populationBeforeShrink=manualRemovalWorld.N;
manualRemovalWorld.resizePopulation(populationBeforeShrink-1);
assert.equal(manualRemovalWorld.N,populationBeforeShrink-1,'manual population reduction should remove one individual');
assert.ok(manualRemovalWorld.survivalHistory.some(row=>!row.event),'manual removals must be censored rather than counted as deaths');

assert.equal(api.kinshipRelatedness(firstChildId, secondChildId), .5, 'full siblings should have 0.5 relatedness');
assert.equal(api.reproductiveSuccess.get(motherId), 3, 'maternal lifetime reproductive success should count all three offspring');
assert.equal(api.reproductiveSuccess.get(fatherId), 3, 'paternal lifetime reproductive success should count all three offspring');
assert.equal(api.selectedParentEvents, 6, 'each birth should contribute two successful parent events');
const experimentSample = api.evaluatePopulation();
assert.equal(experimentSample.selectionDifferentials.length, 10, 'selection differentials should be reported for all inherited loci');
assert.equal(experimentSample.traitHeritabilityConfidenceIntervals.length,10,'heritability uncertainty intervals should be exposed for every locus');
assert.equal(experimentSample.traitHeritabilityRawSlopes.length,10,'unbounded regression slopes should remain available for diagnostics');
assert.ok(experimentSample.speciesCount >= 1, 'NEAT species should be measured in live population telemetry');
assert.ok(Number.isFinite(experimentSample.speciesQuotaPressureMean), 'species size should influence reproductive pressure');
assert.ok(Number.isFinite(experimentSample.speciesMeanAge), 'species age should be tracked');
assert.ok(Number.isFinite(experimentSample.speciesStagnantCount), 'species stagnation should be tracked');
assert.ok(Number.isFinite(experimentSample.speciesChampionFitness), 'species champion fitness should be tracked');
assert.equal(experimentSample.speciesQuotaTotal, experimentSample.count, 'species offspring quotas should sum to population size');
assert.ok(Number.isFinite(experimentSample.speciesMeanNodes)&&experimentSample.speciesMeanNodes>0,'species neural node complexity should be measured');
assert.ok(Number.isFinite(experimentSample.speciesMeanConnections)&&experimentSample.speciesMeanConnections>0,'species connection complexity should be measured');
assert.ok(Number.isFinite(experimentSample.speciesInnovationDiversity)&&experimentSample.speciesInnovationDiversity>0,'species innovation diversity should be measured');
assert.ok(Number.isFinite(experimentSample.effectiveBreeders)&&experimentSample.effectiveBreeders>=0,'realised effective breeders should be measured');
assert.ok(Number.isFinite(experimentSample.effectiveFemales)&&Number.isFinite(experimentSample.effectiveMales),'sex-specific effective breeders should be measured');
assert.ok(Number.isFinite(experimentSample.meanPhenotypicVariance)&&experimentSample.meanPhenotypicVariance>=0,'expressed trait variance should be measured');
assert.ok(experimentSample.meanAdditiveVariance===null||Number.isFinite(experimentSample.meanAdditiveVariance),'additive variance should be estimated only when heritability is estimable');
assert.equal(experimentSample.traitPhenotypicVariance.length,10);
assert.equal(experimentSample.traitAdditiveVariance.length,10);
assert.equal(experimentSample.phenotypicTraitCovariance.length,10);
assert.equal(experimentSample.geneticTraitCovariance.length,10);
assert.ok(experimentSample.phenotypicTraitCovariance.every(row=>row.length===10)&&experimentSample.geneticTraitCovariance.every(row=>row.length===10),'trait covariance matrices should be square');
assert.equal(experimentSample.speciesTopology.length,experimentSample.speciesCount,'topology summaries should be available per species');
assert.ok(experimentSample.speciesTopology.every(group=>group.members>=0&&group.innovationCount>=0&&group.meanNodes>=0&&group.meanConnections>=0),'per-species topology summaries should be well formed');
const championSpecies=api.speciesState.find(group=>group.members.length>1&&group.championId!==null);
if(championSpecies){api.speciesQuotaById.set(championSpecies.id,1);api.cfg.innovationProtectionDuration=0;const championIndex=Array.from(api.individualId.subarray(0,api.N)).indexOf(championSpecies.championId);const otherIndex=api.speciesState.find(group=>group.id===championSpecies.id).members.find(member=>member.id!==championSpecies.championId);const otherAgent=Array.from(api.individualId.subarray(0,api.N)).indexOf(otherIndex.id);assert.ok(api.speciesQuotaFactor(championIndex)>api.speciesQuotaFactor(otherAgent),'species champions should receive reproductive preservation pressure');const configuredBonus=api.cfg.speciesChampionBonus;api.cfg.speciesChampionBonus=0;const unboosted=api.speciesQuotaFactor(championIndex);api.cfg.speciesChampionBonus=2;const boosted=api.speciesQuotaFactor(championIndex);assert.ok(boosted>unboosted,'champion preservation pressure must be configurable');assert.ok(Math.abs(boosted-unboosted*3)<1e-9,'champion preservation must follow the configured multiplier');api.cfg.speciesChampionBonus=configuredBonus}
const protectedGeneId=api.agentGenomes[0].connections[0].innovation,protectionTime=api.simTime;api.cfg.innovationProtectionDuration=8;api.cfg.innovationProtectionBonus=.5;api.innovationBirthTime.set(protectedGeneId,protectionTime);assert.equal(api.innovationProtectionFactor(0),1.5,'new structural innovations should receive a temporary preservation bonus');api.simTime=protectionTime+9;assert.equal(api.innovationProtectionFactor(0),1,'structural innovation protection should expire after its configured window');api.simTime=protectionTime;
assert.ok(api.speciesQuotaFactor(0)>=0&&api.speciesQuotaFactor(0)<=4.5, 'species quota pressure must remain bounded');
assert.equal(experimentSample.traitAlleleRichness.length, 10, 'allele richness should be reported for every trait');
assert.equal(experimentSample.traitHeritability.length, 10, 'parent-offspring heritability should be reported for every trait');
assert.ok(Number.isFinite(experimentSample.meanInbreeding), 'population inbreeding should be measurable');
assert.equal(experimentSample.maleCount + experimentSample.femaleCount, experimentSample.count, 'sex counts must sum to population size');
assert.equal(experimentSample.sexRatioEffectiveSize, 4 * experimentSample.maleCount * experimentSample.femaleCount / Math.max(1, experimentSample.maleCount + experimentSample.femaleCount), 'sex-ratio Ne must use the documented formula');
assert.ok(Number.isFinite(experimentSample.regulatoryActivity), 'regulatory expression activity should be measurable');
assert.ok(experimentSample.selectionDifferentials.every(Number.isFinite), 'selection differentials must be finite');
assert.ok(Number.isFinite(experimentSample.selectionAggression), 'per-locus selection series should be available to the Observatory');
assert.ok(Number.isFinite(experimentSample.aggressionMin) && experimentSample.aggressionMin <= experimentSample.aggression, 'population aggression range should be reported');
assert.equal(experimentSample.reproductiveDrive, 0, 'global reproductive drive setting should be included in telemetry');
assert.ok(experimentSample.meanLifetimeOffspring >= 0, 'lifetime reproductive success should be measurable');
const experimentData = api.exportExperimentData();
assert.equal(experimentData.format, 'boids-analysis-bundle-v2');
assert.equal(experimentData.metadata.includesFullSnapshot, true);
assert.ok(experimentData.snapshot.arrays.genome.length > 0, 'analysis bundle should include each living genome');
assert.equal(experimentData.metadata.seed, 123456);
assert.equal(experimentData.reproductiveSuccess.length, api.reproductiveSuccess.size);
a.onmessage({ data: { type: 'exportData', requestId: 42 } });
const exportResponse = a.__messages.at(-1);
assert.equal(exportResponse.type, 'exportData', 'worker should answer export requests');
assert.equal(exportResponse.requestId, 42, 'worker should preserve export request IDs');

// Plant life cycle: clonal budding, mature adult offspring, spore germination, senescence and death.
const plantWorld = makeWorld(404);
const plantApi = plantWorld.__boidsTest;
plantApi.plants.splice(0);
plantApi.spores.splice(0);
const mother = { id: 9001, parent: 0, root: 9001, x: 180, y: 180, angle: 0, size: 1.3, biomass: 1.3, age: 20, children: 0, grandmother: false, greatGrandmother: false, adultNode: false, offspring: 0, sporeClock: 0, depth: 0, lifespan: 100, senescent: false };
plantApi.plants.push(mother);
plantApi.growPlants(.01);
assert.equal(mother.grandmother, true, 'a sufficiently large mature mother should become a grandmother');
const adultClones = plantApi.plants.filter(p => p.parent === mother.id && p.adultNode);
assert.equal(adultClones.length, 2, 'grandmother should produce two fully mature clonal offspring');
assert.ok(adultClones.every(p => p.biomass >= .72 && p.age >= 9), 'adult clones should be branch-ready immediately');
assert.ok(plantApi.plantCounters.asexualBuds >= 2, 'clonal budding should be counted');
const beforeGermination = plantApi.plants.length;
const waterLanding = plantApi.nearestFreshwater(500, 300);
plantApi.spores.push({ x: waterLanding.x, y: waterLanding.y, vx: 0, vy: 0, life: 7.1, settleAfter: 7, landed: true, settleClock: 1.8, parentId: mother.id, root: mother.id, kind: 'asexual-spore' });
plantApi.growPlants(.01);
const germinated = plantApi.plants.find(p => p.cloneParent === mother.id && p.asexual && Math.hypot(p.x-waterLanding.x,p.y-waterLanding.y)<1);
assert.ok(germinated, 'a landed, viable asexual spore should germinate into a clonal seedling');
assert.ok(plantApi.plants.length > beforeGermination, 'adult clonal nodes should continue branching during the next growth tick');
assert.equal(plantApi.plantCounters.sporesGerminated, 1);
const oldPlant = { id: 9002, parent: 0, root: 9002, x: 600, y: 300, angle: 0, size: .3, biomass: .2, age: 100, children: 0, lifespan: 100, senescent: false };
plantApi.plants.push(oldPlant);
plantApi.growPlants(.1);
assert.equal(oldPlant.stage, 'senescent', 'plants should enter senescence at their lifespan');
assert.ok(oldPlant.biomass < .2, 'senescent plants should lose biomass');
oldPlant.age = 119.9;
plantApi.growPlants(.2);
assert.ok(!plantApi.plants.includes(oldPlant), 'senescent plants should eventually die');
assert.equal(plantApi.plantCounters.plantDeaths, 1, 'plant deaths should be counted');
const plantSnapshot = plantApi.exportSnapshot();
assert.ok(plantSnapshot.plantCounters.asexualBuds >= 2, 'plant lifecycle counters should persist in snapshots');
const restoredPlants = makeWorld(405);
restoredPlants.__boidsTest.restoreSnapshot(plantSnapshot);
assert.deepEqual({ ...restoredPlants.__boidsTest.plantCounters }, { ...plantApi.plantCounters }, 'plant lifecycle counters should survive snapshot restore');

// Snapshot restore must preserve both the random stream and pedigree identifiers.
const restored = makeWorld(999);
const sourceSnapshot = api.exportSnapshot();
restored.__boidsTest.restoreSnapshot(sourceSnapshot);
const restoredSnapshot = restored.__boidsTest.exportSnapshot();
assert.deepEqual(Array.from(restoredSnapshot.arrays.individualId), Array.from(api.individualId.subarray(0, api.N)));
assert.deepEqual(Array.from(restoredSnapshot.arrays.parentA), Array.from(api.parentA.subarray(0, api.N)));
assert.equal(restoredSnapshot.rngState, api.rngState);
assert.deepEqual(Array.from(restoredSnapshot.arrays.innovation), Array.from(api.innovation.subarray(0, api.N * api.cfg.connections)));
assert.equal(restoredSnapshot.innovationRegistry.length, api.innovationRegistry.size);
assert.deepEqual(restoredSnapshot.innovationBirthTime,Array.from(api.innovationBirthTime.entries()),'structural innovation protection ages must survive snapshot restoration');
assert.deepEqual(restored.__boidsTest.exportSnapshot().innovationBirthTime,restoredSnapshot.innovationBirthTime);
assert.equal(restoredSnapshot.schemaVersion, 23);
assert.ok(Array.isArray(restoredSnapshot.bondLinks),'persistent organism bonds must be included in snapshots');
assert.equal(JSON.stringify(restoredSnapshot.bondLinks.map(({a,b,targetType,sideA,sideB,kind})=>({a,b,targetType,sideA,sideB,kind}))),JSON.stringify(sourceSnapshot.bondLinks.map(({a,b,targetType,sideA,sideB,kind})=>({a,b,targetType,sideA,sideB,kind}))), 'organism bond topology and relationship types must survive snapshot restoration');
assert.equal(JSON.stringify(BoidsEcology.serializeFields(restored.__boidsTest.environmentFields)),JSON.stringify(restoredSnapshot.environmentFields),'deterministic habitat fields must survive snapshot restoration');
assert.deepEqual(restoredSnapshot.species.map(s=>({id:s.id,age:s.age,bestFitness:s.bestFitness,stagnation:s.stagnation,championId:s.championId,offspringQuota:s.offspringQuota})),api.exportSnapshot().species.map(s=>({id:s.id,age:s.age,bestFitness:s.bestFitness,stagnation:s.stagnation,championId:s.championId,offspringQuota:s.offspringQuota})),'species lifecycle statistics must survive snapshots');
assert.equal(restoredSnapshot.chromosomeFormat, 'boids-hex-gene-v3');
const typedChromosome=BoidsChromosome.decode(restoredSnapshot.chromosomes[0]);
assert.ok(typedChromosome.structural.length>0&&typedChromosome.neuralNodes.length>0&&typedChromosome.neuralConnections.length>0,'chromosomes must contain typed neural structure and connection records');
assert.equal(typedChromosome.regulatoryNodes.length,10,'chromosomes must contain the per-agent regulatory node records');
assert.ok(typedChromosome.regulatoryEdges.length>0,'chromosomes must contain regulatory edge records');
assert.equal(typedChromosome.modifiers.length,10,'chromosomes must contain inherited cis modifier records');
assert.equal(restoredSnapshot.arrays.regulatoryGenes.length, api.N * 10, 'regulatory loci must persist for every agent');
assert.equal(JSON.stringify(restoredSnapshot.agentRegulatoryGenomes),JSON.stringify(api.exportSnapshot().agentRegulatoryGenomes),'trans-regulatory gene copies and edges must persist');
assert.equal(JSON.stringify(restoredSnapshot.regulatoryRegistry),JSON.stringify(api.regulatoryRegistry),'regulatory innovation identities must persist');
assert.equal(JSON.stringify(restoredSnapshot.regulatoryMutationHistory),JSON.stringify(api.regulatoryMutationHistory),'regulatory mutation history must survive snapshots');
assert.equal(JSON.stringify(restoredSnapshot.regulatoryExpressionByAgent),JSON.stringify(api.regulatoryExpressionByAgent.slice(0,api.N).map(v=>Array.from(v||[]))),'regulatory expression state must survive snapshots');
assert.equal(JSON.stringify(restoredSnapshot.agentLearnedWeights), JSON.stringify(api.exportSnapshot().agentLearnedWeights), 'learned weight overlays must survive snapshot restore');
assert.equal(JSON.stringify(restoredSnapshot.agentNeuralStates), JSON.stringify(api.exportSnapshot().agentNeuralStates), 'recurrent neural state must survive snapshot restore');
assert.equal(restoredSnapshot.chromosomes.length, api.N);
const typedOnlySnapshot=api.exportSnapshot();delete typedOnlySnapshot.neatGenomes;delete typedOnlySnapshot.agentRegulatoryGenomes;delete typedOnlySnapshot.paternalRegulatoryGenomes;delete typedOnlySnapshot.arrays.traitGenes;delete typedOnlySnapshot.arrays.regulatoryGenes;delete typedOnlySnapshot.arrays.paternalRegulatoryGenes;const typedOnlyRestore=makeWorld(654321).__boidsTest;typedOnlyRestore.restoreSnapshot(typedOnlySnapshot);assert.equal(typedOnlyRestore.agentGenomes[0].nodes.length,api.agentGenomes[0].nodes.length,'typed chromosome records must reconstruct neural nodes');assert.equal(typedOnlyRestore.agentRegulatoryGenomes[0].nodes.length,api.agentRegulatoryGenomes[0].nodes.length,'typed chromosome records must reconstruct regulatory nodes');assert.equal(typedOnlyRestore.agentRegulatoryGenomes[0].edges.length,api.agentRegulatoryGenomes[0].edges.length,'typed chromosome records must reconstruct regulatory edges');
assert.ok(restoredSnapshot.chromosomes.every(chromosome => chromosome.every(gene => /^[0-9A-F]+$/.test(gene))));
const decodedFirst = BoidsChromosome.decode(restoredSnapshot.chromosomes[0]);
assert.ok(decodedFirst.source instanceof Uint16Array, 'source neuron indices must decode as uint16');
assert.ok(decodedFirst.destination instanceof Uint16Array, 'destination neuron indices must decode as uint16');
assert.deepEqual(Array.from(restoredSnapshot.arrays.connectionSource), Array.from(decodedFirst.source).concat(Array.from(restoredSnapshot.arrays.connectionSource).slice(decodedFirst.source.length)));
for (let i = 0; i < api.N * api.cfg.connections; i++) { assert.equal(restoredSnapshot.arrays.genome[i * 3], 0, 'source index must not be shadow-stored as float'); assert.equal(restoredSnapshot.arrays.genome[i * 3 + 1], 0, 'destination index must not be shadow-stored as float'); }
assert.ok(restoredSnapshot.pedigree.length >= api.N, 'snapshot should retain the pedigree graph');
assert.equal(restored.__boidsTest.kinshipRelatedness(firstChildId, secondChildId), .5, 'restored pedigree should preserve kinship');
assert.equal(restoredSnapshot.arrays.traitGenes.length, api.N * 10, 'ten inherited traits must be stored per agent');
assert.ok(restoredSnapshot.arrays.traitGenes[before * 10 + 6] >= .55, 'offspring acceleration trait must be inherited');

// Schema-v3 snapshots used six packed traits; migration must preserve those and initialise four new loci.
const legacy = api.exportSnapshot();
legacy.schemaVersion = 3;
delete legacy.environmentFields;
delete legacy.arrays.birthCohort;
// A schema-v3 export predates the trans-regulatory network and its identity registry.
delete legacy.agentRegulatoryGenomes;
delete legacy.paternalRegulatoryGenomes;
delete legacy.regulatoryRegistry;
delete legacy.arrays.regulatoryGenes;
delete legacy.arrays.paternalRegulatoryGenes;
delete legacy.innovationRegistry;
delete legacy.nextInnovationId;
delete legacy.arrays.innovation;
delete legacy.arrays.paternalInnovation;
// Reconstruct the pre-v9 float-triple layout to model a genuine historical export.
for (let i = 0; i < legacy.N; i++) {
  const decoded = BoidsChromosome.decode(legacy.chromosomes[i]);
  for (let g = 0; g < decoded.source.length; g++) {
    const offset = (i * legacy.cfg.connections + g) * 3;
    legacy.arrays.genome[offset] = decoded.source[g];
    legacy.arrays.genome[offset + 1] = decoded.destination[g];
  }
  const paternal = legacy.paternalChromosomes[i];
  if (paternal) {
    const paternalDecoded = BoidsChromosome.decode(paternal);
    for (let g = 0; g < paternalDecoded.source.length; g++) {
      const offset = (i * legacy.cfg.connections + g) * 3;
      legacy.arrays.paternalGenome[offset] = paternalDecoded.source[g];
      legacy.arrays.paternalGenome[offset + 1] = paternalDecoded.destination[g];
    }
  }
}
delete legacy.chromosomes;
delete legacy.paternalChromosomes;
delete legacy.chromosomeFormat;
delete legacy.arrays.connectionSource;
delete legacy.arrays.connectionDestination;
delete legacy.arrays.paternalConnectionSource;
delete legacy.arrays.paternalConnectionDestination;
delete legacy.pedigree;
delete legacy.pedigreeTruncated;
delete legacy.reproductiveSuccess;
delete legacy.counters.selectedTraitSums;
delete legacy.counters.attackAttempts;
delete legacy.counters.movementEnergySpent;
delete legacy.counters.maintenanceEnergySpent;
delete legacy.counters.experimentSerial;
delete legacy.counters.selectedParentEvents;
const legacyTraits = new Float32Array(api.N * 6);
const legacyPaternalTraits = new Float32Array(api.N * 6);
for (let i = 0; i < api.N; i++) {
  legacyTraits.set(legacy.arrays.traitGenes.subarray(i * 10, i * 10 + 6), i * 6);
  legacyPaternalTraits.set(legacy.arrays.paternalTraits.subarray(i * 10, i * 10 + 6), i * 6);
}
legacy.arrays.traitGenes = legacyTraits;
legacy.arrays.paternalTraits = legacyPaternalTraits;
// Preserve the known pedigree fixture while exercising reconstruction without the pedigree map.
for (const [childId,motherId,fatherId] of [[firstChildId,api.individualId[0],api.individualId[1]],[secondChildId,api.individualId[0],api.individualId[1]]]) {
  const childIndex=Array.from(legacy.arrays.individualId).indexOf(childId);
  assert.ok(childIndex>=0,'legacy fixture must contain each offspring identity');
  legacy.arrays.parentA[childIndex]=motherId;
  legacy.arrays.parentB[childIndex]=fatherId;
}
const migrated = makeWorld(777);
migrated.__boidsTest.restoreSnapshot(legacy);
const migratedTraits = migrated.__boidsTest.exportSnapshot().arrays.traitGenes;
assert.equal(migratedTraits.length, api.N * 10);
assert.equal(migratedTraits[6], 1, 'legacy acceleration locus should receive neutral migration value');
assert.equal(migratedTraits[8], .5, 'legacy risk locus should receive neutral migration value');
assert.equal(migrated.__boidsTest.agentRegulatoryGenomes[0].nodes.length,10,'legacy snapshots should receive neutral trans-regulatory gene records');
assert.ok(migrated.__boidsTest.agentRegulatoryGenomes[0].nodes.every(node=>node.effect===0),'legacy migration must not invent active trans-regulatory effects');
assert.ok(migrated.__boidsTest.environmentFields,'legacy snapshots should deterministically regenerate habitat fields');
assert.equal(migrated.__boidsTest.exportSnapshot().arrays.innovation.length, api.N * api.cfg.connections, 'legacy neural genes should receive innovation IDs');
assert.equal(migrated.__boidsTest.kinshipRelatedness(firstChildId, secondChildId), .5, 'legacy restore should reconstruct the live pedigree from parent IDs');

console.log('Worker deterministic replay, unique identities, pedigree inheritance, and schema-v4 restore and schema-v3 phenotype migration passed.');

const collisionProbe=makeWorld(554433).__boidsTest;
collisionProbe.cfg.drive=0;
collisionProbe.x[0]=collisionProbe.x[1]=240;
collisionProbe.y[0]=collisionProbe.y[1]=180;
collisionProbe.vx[0]=collisionProbe.vx[1]=0;
collisionProbe.vy[0]=collisionProbe.vy[1]=0;
collisionProbe.update(1/60,1000);
const collisionDistance=Math.hypot(collisionProbe.x[0]-collisionProbe.x[1],collisionProbe.y[0]-collisionProbe.y[1]);
assert.ok(collisionDistance>=collisionProbe.collisionRadius(0)+collisionProbe.collisionRadius(1)-.1,'overlapping boids should be separated by physical body contact');
