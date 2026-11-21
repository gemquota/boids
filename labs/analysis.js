// Read-only analysis over snapshots. No references to live simulator state are retained.
export function analyzePopulation(snapshot){
 const agents=snapshot?.agents||[],keys=[...new Set(agents.flatMap(a=>Object.keys(a.traits||{})))],traits={};
 for(const key of keys){const values=agents.map(a=>Number(a.traits?.[key])).filter(Number.isFinite);traits[key]=values.length?{mean:values.reduce((a,b)=>a+b,0)/values.length,min:Math.min(...values),max:Math.max(...values),variance:values.reduce((s,x)=>s+(x-values.reduce((a,b)=>a+b,0)/values.length)**2,0)/values.length}:null}
 return{population:agents.length,births:snapshot?.births??0,deaths:snapshot?.deaths??0,tick:snapshot?.tick??0,traits}
}
export function analyzeLineage(records=[]){
 const parents=new Map(),children=new Map();for(const r of records){parents.set(r.id,r.parents||[]);for(const p of r.parents||[]){if(!children.has(p))children.set(p,[]);children.get(p).push(r.id)}}
 return{records:records.length,founders:records.filter(r=>!(r.parents||[]).length).map(r=>r.id),parentCounts:[...parents].map(([id,p])=>({id,count:p.length})),descendantCounts:[...children].map(([id,c])=>({id,count:c.length}))}
}
export function compareSnapshots(a,b){const x=analyzePopulation(a),y=analyzePopulation(b);return{from:x,to:y,populationDelta:y.population-x.population,birthDelta:y.births-x.births,deathDelta:y.deaths-x.deaths,traitDelta:Object.fromEntries(Object.keys({...x.traits,...y.traits}).map(k=>[k,(y.traits[k]?.mean??0)-(x.traits[k]?.mean??0)]))}}
