// Optional-by-contract, enabled-by-default neural evolution module.
// Node identifiers and innovation identifiers are integers; only weights/biases are floats.
// Shared innovation ledger keeps matching structural mutations homologous across a population.
export function createInnovationLedger({nextNodeId=0,nextInnovation=0}={}){
 const connections=new Map(),splits=new Map();
 return{
  connection(source,destination){const key=source+":"+destination;if(!connections.has(key))connections.set(key,nextInnovation++);return connections.get(key)},
  split(connection){if(!splits.has(connection.innovation)){const nodeId=nextNodeId++,incoming=this.connection(connection.source,nodeId),outgoing=this.connection(nodeId,connection.destination);splits.set(connection.innovation,{nodeId,incoming,outgoing})}return splits.get(connection.innovation)},
  get nextNodeId(){return nextNodeId},get nextInnovation(){return nextInnovation}
 }
}

export function createNetworkGenome({inputs=4,outputs=3,random=Math.random}={}){
 const nodes=[];for(let i=0;i<inputs;i++)nodes.push({id:i,kind:"input",bias:0});for(let i=0;i<outputs;i++)nodes.push({id:inputs+i,kind:"output",bias:0});
 const connections=[];let innovation=0;for(let i=0;i<inputs;i++)for(let j=0;j<outputs;j++)connections.push({source:i,destination:inputs+j,weight:(random()-.5)*2,enabled:true,innovation:innovation++});
 return{version:1,nextNodeId:inputs+outputs,nextInnovation:innovation,nodes,connections};
}
export function validateNetworkGenome(g){
 if(!g||g.version!==1||!Array.isArray(g.nodes)||!Array.isArray(g.connections))throw new TypeError("Invalid neural genome");
 const ids=new Set();for(const n of g.nodes){if(!Number.isInteger(n.id)||n.id<0||ids.has(n.id)||!["input","hidden","output"].includes(n.kind))throw new TypeError("Invalid neural node");ids.add(n.id)}
 for(const c of g.connections)if(!Number.isInteger(c.source)||!Number.isInteger(c.destination)||!Number.isFinite(c.weight)||!Number.isInteger(c.innovation)||!ids.has(c.source)||!ids.has(c.destination))throw new TypeError("Invalid neural connection");
 return true
}
export function mutateNetworkGenome(genome,{random=Math.random,weightRate=.8,addConnectionRate=.08,addNodeRate=.03,weightScale=.25,innovationLedger=null}={}){
 const g=structuredClone(genome);for(const c of g.connections)if(random()<weightRate)c.weight+=(random()-.5)*2*weightScale;
 if(random()<addConnectionRate){const sources=g.nodes.filter(n=>n.kind!=="output"),targets=g.nodes.filter(n=>n.kind!=="input"),pairs=[];for(const s of sources)for(const t of targets)if(s.id!==t.id&&!g.connections.some(c=>c.source===s.id&&c.destination===t.id))pairs.push([s,t]);if(pairs.length){const [s,t]=pairs[Math.floor(random()*pairs.length)];g.connections.push({source:s.id,destination:t.id,weight:(random()-.5)*2,enabled:true,innovation:innovationLedger?innovationLedger.connection(s.id,t.id):g.nextInnovation++})}}
 if(random()<addNodeRate){const candidates=g.connections.filter(c=>c.enabled);if(candidates.length){const c=candidates[Math.floor(random()*candidates.length)];c.enabled=false;const split=innovationLedger?innovationLedger.split(c):{nodeId:g.nextNodeId++,incoming:g.nextInnovation++,outgoing:g.nextInnovation++},id=split.nodeId;g.nodes.push({id,kind:"hidden",bias:0});g.connections.push({source:c.source,destination:id,weight:1,enabled:true,innovation:split.incoming},{source:id,destination:c.destination,weight:c.weight,enabled:true,innovation:split.outgoing})}}
 if(innovationLedger){g.nextNodeId=Math.max(g.nextNodeId,innovationLedger.nextNodeId);g.nextInnovation=Math.max(g.nextInnovation,innovationLedger.nextInnovation)}
 validateNetworkGenome(g);return g
}
export function crossoverNetworkGenomes(a,b,{random=Math.random,fitnessA=1,fitnessB=1}={}){
 validateNetworkGenome(a);validateNetworkGenome(b);const fitter=fitnessA>=fitnessB?a:b,other=fitter===a?b:a,otherGenes=new Map(other.connections.map(c=>[c.innovation,c]));
 const connections=fitter.connections.map(c=>{const m=otherGenes.get(c.innovation);return m&&random()<.5?{...m}:{...c}});
 const nodeMap=new Map([...fitter.nodes,...other.nodes].map(n=>[n.id,n]));const nodes=[...nodeMap.values()].filter(n=>n.kind==="input"||n.kind==="output"||connections.some(c=>c.source===n.id||c.destination===n.id));
 const child={version:1,nextNodeId:Math.max(a.nextNodeId,b.nextNodeId),nextInnovation:Math.max(a.nextInnovation,b.nextInnovation),nodes,connections};validateNetworkGenome(child);return child
}
// Frozen genomes are immutable, so their evaluation topology can be compiled once.
const compiledNetworks=new WeakMap();
function compileNetwork(genome){
 const ordered=[...genome.nodes].sort((a,b)=>a.id-b.id),maxId=ordered.reduce((m,n)=>Math.max(m,n.id),0),incoming=Array.from({length:maxId+1},()=>[]);
 for(const c of genome.connections)if(c.enabled)incoming[c.destination].push(c);
 return{ordered,incoming,inputs:ordered.filter(n=>n.kind==="input"),outputs:ordered.filter(n=>n.kind==="output"),size:maxId+1};
}
export function evaluateNetwork(genome,inputs,{activations=1}={}){
 let compiled=Object.isFrozen(genome)&&Object.isFrozen(genome.nodes)&&Object.isFrozen(genome.connections)?compiledNetworks.get(genome):null;
 if(!compiled){validateNetworkGenome(genome);compiled=compileNetwork(genome);if(Object.isFrozen(genome)&&Object.isFrozen(genome.nodes)&&Object.isFrozen(genome.connections))compiledNetworks.set(genome,compiled)}
 const values=new Float64Array(compiled.size);
 for(let i=0;i<compiled.inputs.length;i++)values[compiled.inputs[i].id]=Number(inputs[i]??0);
 const sigmoid=x=>1/(1+Math.exp(-Math.max(-30,Math.min(30,x))));
 for(let pass=0;pass<activations;pass++)for(const n of compiled.ordered){if(n.kind==="input")continue;let sum=n.bias;for(const c of compiled.incoming[n.id])sum+=values[c.source]*c.weight;values[n.id]=sigmoid(sum)}
 return compiled.outputs.map(n=>values[n.id]??0)
}
export function compatibilityDistance(a,b,{excess=1,disjoint=1,weight=.4}={}){
 const A=new Map(a.connections.map(c=>[c.innovation,c])),B=new Map(b.connections.map(c=>[c.innovation,c])),maxA=Math.max(0,...A.keys()),maxB=Math.max(0,...B.keys()),max=Math.max(maxA,maxB);let e=0,d=0,w=0,m=0;
 for(const id of new Set([...A.keys(),...B.keys()])){if(A.has(id)&&B.has(id)){w+=Math.abs(A.get(id).weight-B.get(id).weight);m++}else if(id>Math.min(maxA,maxB))e++;else d++}
 const N=Math.max(1,Math.max(A.size,B.size));return excess*e/N+disjoint*d/N+weight*(m?w/m:0)
}
