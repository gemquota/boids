// Adapter keeps selection and inheritance outside the simulator.
import{selectParents}from"./selection.js";
import{mutateNetworkGenome,crossoverNetworkGenomes,createInnovationLedger}from"./neural.js";
import{recombineChromosomes,mutateChromosome}from"./genome.js";
export function createEvolutionAdapter({selection={models:["natural"]},random=Math.random,mutationRate=.015,innovationLedger=null}={}){
 let activeSelection=selection,ledger=innovationLedger;
 return{setSelection(config){activeSelection=config},selectParents(population){return selectParents(population,{...activeSelection,random})},inherit(a,b){const x=a.genome||"",y=b.genome||"";let genome=x&&y?recombineChromosomes(x,y,random):(x||y);if(genome)genome=mutateChromosome(genome,{rate:mutationRate,random});let neural=null;if(a.neural&&b.neural){if(!ledger)ledger=createInnovationLedger({nextNodeId:a.neural.nextNodeId,nextInnovation:a.neural.nextInnovation});neural=crossoverNetworkGenomes(a.neural,b.neural,{random,fitnessA:a.fitness??a.energy??1,fitnessB:b.fitness??b.energy??1});neural=mutateNetworkGenome(neural,{random,innovationLedger})}else if(a.neural||b.neural)neural=mutateNetworkGenome(structuredClone(a.neural||b.neural),{random,innovationLedger});return{genome,neural}}}
}
