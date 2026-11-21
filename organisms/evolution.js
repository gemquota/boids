// Default evolution adapter: selection + inheritance + neural evolution remain outside Core.
import{selectParents}from"./selection.js";
import{mutateNetworkGenome,crossoverNetworkGenomes}from"./neural.js";
import{recombineChromosomes,mutateChromosome}from"./genome.js";
export function createEvolutionAdapter({selection={models:["natural"]},random=Math.random,mutationRate=.015}={}){
 return{
  selectParents(population){return selectParents(population,{...selection,random})},
  inherit(parentA,parentB){const a=parentA.genome||"",b=parentB.genome||"";let chromosome=a&&b?recombineChromosomes(a,b,random):(a||b);if(chromosome)chromosome=mutateChromosome(chromosome,{rate:mutationRate,random});let neural=null;if(parentA.neural&&parentB.neural){neural=crossoverNetworkGenomes(parentA.neural,parentB.neural,{random,fitnessA:parentA.fitness??1,fitnessB:parentB.fitness??1});neural=mutateNetworkGenome(neural,{random})}else if(parentA.neural||parentB.neural)neural=mutateNetworkGenome(structuredClone(parentA.neural||parentB.neural),{random});return{genome:chromosome,neural}}
 }
}
