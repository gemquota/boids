// Species assignment is independent of the simulator and can use any genome distance function.
import{compatibilityDistance}from"./neural.js";
export function assignSpecies(population,{threshold=1.2,distance=compatibilityDistance,previous=[],nextSpeciesId=1}={}){
 const species=previous.map(s=>({id:s.id,representative:structuredClone(s.representative),members:[]}));let next=nextSpeciesId;
 for(const organism of population){let best=null,bestDistance=Infinity;for(const s of species){const d=distance(organism.genome,s.representative);if(d<threshold&&d<bestDistance){best=s;bestDistance=d}}
  if(!best){best={id:next++,representative:structuredClone(organism.genome),members:[]};species.push(best)}best.members.push(organism.id)
 }
 const live=species.filter(s=>s.members.length);for(const s of live){const member=population.find(p=>p.id===s.members[0]);if(member)s.representative=structuredClone(member.genome)}
 return{species:live.map(s=>({...s,size:s.members.length})),nextSpeciesId:next,extinctions:species.filter(s=>!s.members.length).map(s=>s.id)}
}
export function summarizeSpecies(assignments){return{speciesCount:assignments.species.length,largestSpecies:Math.max(0,...assignments.species.map(s=>s.size)),smallestSpecies:assignments.species.length?Math.min(...assignments.species.map(s=>s.size)):0,totalMembers:assignments.species.reduce((n,s)=>n+s.size,0),extinctions:assignments.extinctions.length}}
