// Species assignment is independent of Core and supports composite organism distance.
import{compatibilityDistance}from"./neural.js";
export function organismCompatibilityDistance(a,b,{neuralWeight=.65,traitWeight=.35}={}){
 const neural=compatibilityDistance(a.neural,b.neural),keys=[...new Set([...Object.keys(a.traits||{}),...Object.keys(b.traits||{})])];if(!keys.length)return neural;
 const trait=keys.reduce((sum,k)=>{const x=Number(a.traits?.[k]??0),y=Number(b.traits?.[k]??0),range=k==="hue"?360:2,d=k==="hue"?Math.min(Math.abs(x-y),range-Math.abs(x-y)):Math.abs(x-y);return sum+Math.min(1,d/range)},0)/keys.length;
 return neural*neuralWeight+trait*traitWeight
}
export function assignSpecies(population,{threshold=1.2,distance=compatibilityDistance,previous=[],nextSpeciesId=1}={}){
 const species=previous.map(s=>({id:s.id,representative:structuredClone(s.representative),members:[]}));let next=nextSpeciesId;
 for(const organism of population){let best=null,bestDistance=Infinity;for(const s of species){const d=distance(organism.genome,s.representative);if(d<threshold&&d<bestDistance){best=s;bestDistance=d}}if(!best){best={id:next++,representative:structuredClone(organism.genome),members:[]};species.push(best)}best.members.push(organism.id)}
 const live=species.filter(s=>s.members.length);for(const s of live){const member=population.find(p=>p.id===s.members[0]);if(member)s.representative=structuredClone(member.genome)}
 return{species:live.map(s=>({...s,size:s.members.length})),nextSpeciesId:next,extinctions:species.filter(s=>!s.members.length).map(s=>s.id)}
}
export function summarizeSpecies(a){return{speciesCount:a.species.length,largestSpecies:Math.max(0,...a.species.map(s=>s.size)),smallestSpecies:a.species.length?Math.min(...a.species.map(s=>s.size)):0,totalMembers:a.species.reduce((n,s)=>n+s.size,0),extinctions:a.extinctions.length}}
export function speciesAdjustedFitness(population,assignments,fitnessOf=o=>o.fitness??o.energy??.5){const sizes=new Map(assignments.species.map(s=>[s.id,s.size])),membership=new Map(assignments.species.flatMap(s=>s.members.map(id=>[id,s.id])));return population.map(o=>({id:o.id,speciesId:membership.get(o.id)??null,rawFitness:fitnessOf(o),adjustedFitness:fitnessOf(o)/Math.max(1,sizes.get(membership.get(o.id))??1)}))}
