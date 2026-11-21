// Adapter keeps selection and inheritance outside the simulator.
import{selectParents}from"./selection.js";
import{mutateNetworkGenome,crossoverNetworkGenomes,createInnovationLedger}from"./neural.js";
import{decodeChromosome,encodeChromosome,recombineChromosomes,mutateChromosome}from"./genome.js";
const neuralGenes=n=>[...(n?.nodes||[]).map(x=>({type:"node",locus:x.id,id:x.id,kind:x.kind,bias:x.bias})),...(n?.connections||[]).map(x=>({type:"connection",locus:x.innovation,source:x.source,destination:x.destination,weight:x.weight,enabled:x.enabled,innovation:x.innovation}))];
export function createEvolutionAdapter({selection={models:["natural"]},random=Math.random,mutationRate=.015,innovationLedger=null}={}){
 let activeSelection=selection,ledger=innovationLedger;
 return{
  setSelection(config){activeSelection=config},
  selectParents(population){return selectParents(population,{...activeSelection,random})},
  inherit(a,b){
   const genesA=decodeChromosome(a.genome||"").filter(g=>g.type!=="node"&&g.type!=="connection"),genesB=decodeChromosome(b.genome||"").filter(g=>g.type!=="node"&&g.type!=="connection");
   let base=genesA.length&&genesB.length?recombineChromosomes(encodeChromosome(genesA),encodeChromosome(genesB),random):encodeChromosome(genesA.length?genesA:genesB);
   if(base)base=mutateChromosome(base,{rate:mutationRate,random});
   let neural=null;
   if(a.neural&&b.neural){if(!ledger)ledger=createInnovationLedger({nextNodeId:a.neural.nextNodeId,nextInnovation:a.neural.nextInnovation});neural=crossoverNetworkGenomes(a.neural,b.neural,{random,fitnessA:a.fitness??a.energy??1,fitnessB:b.fitness??b.energy??1});neural=mutateNetworkGenome(neural,{random,innovationLedger:ledger})}
   else if(a.neural||b.neural){const source=a.neural||b.neural;if(!ledger)ledger=createInnovationLedger({nextNodeId:source.nextNodeId,nextInnovation:source.nextInnovation});neural=mutateNetworkGenome(structuredClone(source),{random,innovationLedger:ledger})}
   const chromosome=base?encodeChromosome([...decodeChromosome(base),...neuralGenes(neural)]):neural?encodeChromosome(neuralGenes(neural)):"";
   return{genome:chromosome,neural}
  }
 }
}
