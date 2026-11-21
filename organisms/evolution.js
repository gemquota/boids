// Adapter keeps selection and inheritance outside the simulator.
import{selectParents}from"./selection.js";
import{mutateNetworkGenome,crossoverNetworkGenomes}from"./neural.js";
import{recombineChromosomes,mutateChromosome}from"./genome.js";
export function createEvolutionAdapter({selection={models:["natural"]},random=Math.random,mutationRate=.015}={}){
 return{selectParents(population){return selectParents(population,{...selection,random})},inherit(a,b){const x=a.genome||"",y=b.genome||"";let genome=x&&y?recombineChromosomes(x,y,random):(x||y);if(genome)genome=mutateChromosome(genome,{rate:mutationRate,random});let neural=null;if(a.neural&&b.neural){neural=crossoverNetworkGenomes(a.neural,b.neural,{random,fitnessA:a.fitness??a.energy??1,fitnessB:b.fitness??b.energy??1});neural=mutateNetworkGenome(neural,{random})}else if(a.neural||b.neural)neural=mutateNetworkGenome(structuredClone(a.neural||b.neural),{random});return{genome,neural}}}
}
