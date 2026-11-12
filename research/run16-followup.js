'use strict';
const evo=require('../evolution.js');

const baseSeed=20261110;
const replicates=10;
const seeds=evo.replicateSeeds(baseSeed,replicates);
const scenarios=[
  {id:'fixed-baseline',patch:{},purpose:'Measure corrected system without additional parameter changes'},
  {id:'plant-recruitment-fast',patch:{sporeInterval:4},purpose:'Test whether faster spore turnover prevents late plant recruitment collapse'},
  {id:'plant-recruitment-moderate',patch:{sporeInterval:7},purpose:'Measure the new default spore interval'},
  {id:'mate-diversity-strong',patch:{matePreference:0.7},purpose:'Test stronger genetic similarity preference under the new kinship penalty'},
  {id:'mate-distance-priority',patch:{mateDistanceBias:1.5},purpose:'Test whether broader mate search plus kinship avoidance improves breeder diversity'}
];
const runs=[];
for(const scenario of scenarios){
  for(let replicate=0;replicate<seeds.length;replicate++){
    const manifest=evo.createExperimentManifest({modelVersion:'run16-remediation-v1',seed:seeds[replicate],replicates:1,scenario:scenario.id,config:scenario.patch,analysis:{replicate:replicate+1,pairedSeedGroup:'run16-followup-10',purpose:scenario.purpose,requiredTelemetry:['populationAccountingError','populationResizeAdds','populationResizeRemovals','bondCount','bondedIndividuals','collisionContacts','collisionImpulseTotal','plantBiomass','plantSeedlings','sporesReleased','sporesGerminated','sporeFailedCrowded','sporeFailedDry','heterozygosity','inbreeding','effectiveBreeders','neuralArchitectureRichness']}});
    runs.push({...manifest,replicate:replicate+1,pairedSeedGroup:'run16-followup-10'});
  }
}
process.stdout.write(JSON.stringify({format:'boids-experiment-batch-v1',baseSeed,replicatesPerScenario:replicates,pairedSeeds:seeds,scenarios:scenarios.map(({id,purpose})=>({id,purpose})),runs},null,2)+'\n');
