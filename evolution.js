/* Variable-length evolutionary genome, regulatory expression, and population-statistics primitives.
 * This module is intentionally pure: callers own RNG state, persistence, and worker scheduling.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BoidsEvolution=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const randomIndex=(length,random)=>Math.floor(random()*length);

  function normalizeGenome(genome){
    if(!genome||!Array.isArray(genome.nodes)||!Array.isArray(genome.connections))throw new TypeError('Genome requires node and connection arrays');
    const nodes=genome.nodes.map(n=>({id:Number(n.id),type:n.type||'hidden',activation:['tanh','sigmoid','relu','sin','linear'].includes(n.activation)?n.activation||'tanh':'tanh',bias:finite(n.bias)}));
    const ids=new Set();
    for(const node of nodes){if(!Number.isInteger(node.id)||node.id<0||node.id>65535)throw new RangeError('Node ID must be uint16');if(ids.has(node.id))throw new Error('Duplicate node ID '+node.id);ids.add(node.id);if(!['input','hidden','output'].includes(node.type))throw new Error('Invalid node type '+node.type)}
    const innovations=new Set();
    const connections=genome.connections.map(g=>({innovation:Number(g.innovation),source:Number(g.source),destination:Number(g.destination),weight:finite(g.weight),enabled:g.enabled!==false,recurrent:!!g.recurrent}));
    for(const gene of connections){if(!Number.isInteger(gene.innovation)||gene.innovation<0||gene.innovation>0xffffffff)throw new RangeError('Innovation must be uint32');if(innovations.has(gene.innovation))throw new Error('Duplicate innovation '+gene.innovation);innovations.add(gene.innovation);if(!ids.has(gene.source)||!ids.has(gene.destination))throw new Error('Connection references missing node');if(gene.source===gene.destination&&!gene.recurrent)throw new Error('Self connection must be recurrent')}
    return {version:2,nodes,connections};
  }

  function createInnovationRegistry(state={}){
    let nextInnovation=state.nextInnovation===undefined?1000000:Math.max(1,finite(state.nextInnovation,1000000));
    let nextNode=Math.max(1,finite(state.nextNode,1));
    const connections=new Map(state.connections||[]);
    const splits=new Map(state.splits||[]);
    function connection(source,destination){const key=source+':'+destination;if(!connections.has(key))connections.set(key,nextInnovation++);return connections.get(key)}
    function split(oldInnovation,source,destination){
      const key=String(oldInnovation);
      if(!splits.has(key)){const nodeId=nextNode++,left=connection(source,nodeId),right=connection(nodeId,destination);splits.set(key,{nodeId,left,right})}
      return {...splits.get(key)};
    }
    function snapshot(){return{nextInnovation,nextNode,connections:Array.from(connections.entries()),splits:Array.from(splits.entries()).map(([k,v])=>[k,{...v}])}}
    return Object.freeze({connection,split,snapshot});
  }

  function cloneGenome(genome){return clone(normalizeGenome(genome))}
  function mutateGenome(input,registry,random=Math.random,options={}){
    const genome=cloneGenome(input),rates={weight:.8,addConnection:.08,splitConnection:.03,deleteConnection:.01,toggleConnection:.01,recurrent:0,bias:.08,...options.rates};
    const limits={maxNodes:128,maxConnections:512,weightStep:.25,...options.limits};
    for(const gene of genome.connections)if(random()<rates.weight)gene.weight=clamp(gene.weight+(random()*2-1)*limits.weightStep,-5,5);
    for(const node of genome.nodes)if(node.type!=='input'&&random()<rates.bias)node.bias=clamp(node.bias+(random()*2-1)*limits.weightStep,-5,5);
    if(random()<rates.toggleConnection&&genome.connections.length){const g=genome.connections[randomIndex(genome.connections.length,random)];g.enabled=!g.enabled}
    if(random()<rates.recurrent){const candidates=genome.connections.filter(g=>g.enabled&&!g.recurrent);if(candidates.length)candidates[randomIndex(candidates.length,random)].recurrent=true}
    if(random()<rates.deleteConnection&&genome.connections.length){genome.connections.splice(randomIndex(genome.connections.length,random),1)}
    if(random()<rates.deleteNode){const hidden=genome.nodes.filter(node=>node.type==='hidden');if(hidden.length>1){const removed=hidden[randomIndex(hidden.length,random)].id;genome.nodes=genome.nodes.filter(node=>node.id!==removed);genome.connections=genome.connections.filter(g=>g.source!==removed&&g.destination!==removed)}}
    if(random()<rates.activation){const hidden=genome.nodes.filter(node=>node.type!=='input'),choices=['tanh','sigmoid','relu','sin','linear'];if(hidden.length){const node=hidden[randomIndex(hidden.length,random)],available=choices.filter(value=>value!==node.activation);node.activation=available[randomIndex(available.length,random)]}}
    if(random()<rates.splitConnection&&genome.nodes.length<limits.maxNodes){
      const candidates=genome.connections.filter(g=>g.enabled);
      if(candidates.length){const old=candidates[randomIndex(candidates.length,random)],innovation=registry.split(old.innovation,old.source,old.destination);old.enabled=false;
        if(!genome.nodes.some(n=>n.id===innovation.nodeId))genome.nodes.push({id:innovation.nodeId,type:'hidden',activation:'tanh',bias:0});
        const sourceNode=genome.nodes.find(n=>n.id===old.source),leftRecurrent=!!old.recurrent&&sourceNode?.type==='output',rightRecurrent=!!old.recurrent&&sourceNode?.type!=='output';
        if(!genome.connections.some(g=>g.innovation===innovation.left))genome.connections.push({innovation:innovation.left,source:old.source,destination:innovation.nodeId,weight:1,enabled:true,recurrent:leftRecurrent});
        if(!genome.connections.some(g=>g.innovation===innovation.right))genome.connections.push({innovation:innovation.right,source:innovation.nodeId,destination:old.destination,weight:old.weight,enabled:true,recurrent:rightRecurrent});
      }
    }
    if(random()<rates.addConnection&&genome.connections.length<limits.maxConnections){
      const sources=genome.nodes.filter(n=>n.type!=='output'),destinations=genome.nodes.filter(n=>n.type!=='input');
      for(let tries=0;tries<24;tries++){if(!sources.length||!destinations.length)break;const source=sources[randomIndex(sources.length,random)].id,destination=destinations[randomIndex(destinations.length,random)].id;if(source===destination)continue;
        if(genome.connections.some(g=>g.source===source&&g.destination===destination))continue;
        const src=genome.nodes.find(n=>n.id===source),dst=genome.nodes.find(n=>n.id===destination),recurrent=src.type==='output'||(src.type==='hidden'&&dst.type==='hidden'&&source>=destination);
        genome.connections.push({innovation:registry.connection(source,destination),source,destination,weight:(random()*2-1),enabled:true,recurrent});break;
      }
    }
    genome.connections.sort((a,b)=>a.innovation-b.innovation);
    return normalizeGenome(genome);
  }

  function crossover(fitterInput,otherInput,random=Math.random,options={}){
    const fitter=normalizeGenome(fitterInput),other=normalizeGenome(otherInput),a=new Map(fitter.connections.map(g=>[g.innovation,g])),b=new Map(other.connections.map(g=>[g.innovation,g]));
    const equalFitness=!!options.equalFitness,disabledInheritance=clamp(finite(options.disabledInheritance,.75),0,1),genes=[];
    const ids=new Set([...a.keys(),...(equalFitness?[...b.keys()]:[])]);
    for(const id of ids){const ga=a.get(id),gb=b.get(id);let chosen;if(ga&&gb)chosen=clone(random()<.5?ga:gb);else chosen=clone(ga||gb);
      if(ga&&gb&&(!ga.enabled||!gb.enabled)&&random()<disabledInheritance)chosen.enabled=false;
      genes.push(chosen)}
    const nodes=new Map();
    for(const n of [...fitter.nodes,...other.nodes])if(!nodes.has(n.id))nodes.set(n.id,clone(n));
    const required=new Set();for(const g of genes){required.add(g.source);required.add(g.destination)}
    for(const n of fitter.nodes)if(n.type!=='hidden')required.add(n.id);
    const child={version:2,nodes:[...nodes.values()].filter(n=>required.has(n.id)),connections:genes.sort((x,y)=>x.innovation-y.innovation)};
    return normalizeGenome(child);
  }

  function activateValue(value,activation){if(activation==='linear')return clamp(value,-5,5);if(activation==='relu')return Math.max(0,Math.min(5,value));if(activation==='sigmoid')return 2/(1+Math.exp(-clamp(value,-12,12)))-1;if(activation==='sin')return Math.sin(value);return Math.tanh(value)}
  function compileNetwork(input){
    const genome=normalizeGenome(input),nodes=genome.nodes.slice().sort((a,b)=>a.id-b.id),index=new Map(nodes.map((n,i)=>[n.id,i]));
    const inputs=nodes.map((n,i)=>n.type==='input'?i:-1).filter(i=>i>=0),hidden=nodes.map((n,i)=>n.type==='hidden'?i:-1).filter(i=>i>=0),outputs=nodes.map((n,i)=>n.type==='output'?i:-1).filter(i=>i>=0);
    const incoming=nodes.map(()=>[]),recurrent=nodes.map(()=>[]),outgoing=nodes.map(()=>[]),indegree=new Int32Array(nodes.length),connectionEdges=new Map();
    for(const gene of genome.connections)if(gene.enabled){const source=index.get(gene.source),destination=index.get(gene.destination),edge={source,weight:gene.weight,innovation:gene.innovation};(gene.recurrent?recurrent:incoming)[destination].push(edge);connectionEdges.set(gene.innovation,edge);if(!gene.recurrent&&nodes[source].type==='hidden'&&nodes[destination].type==='hidden'){outgoing[source].push(destination);indegree[destination]++}}
    const ordered=[],queue=hidden.filter(i=>indegree[i]===0);while(queue.length){const current=queue.shift();ordered.push(current);for(const destination of outgoing[current])if(--indegree[destination]===0)queue.push(destination)}for(const i of hidden)if(!ordered.includes(i))ordered.push(i);
    return Object.freeze({nodes,index,inputs,hidden:ordered,outputs,incoming,recurrent,connectionEdges,connectionCount:genome.connections.filter(g=>g.enabled).length});
  }
  function activateNetwork(compiled,inputValues,previousState,workspace){
    const size=compiled.nodes.length,values=workspace?.values?.length>=size?workspace.values:new Float32Array(size),state=workspace?.state?.length>=size?workspace.state:new Float32Array(size),outputs=workspace?.outputs?.length>=compiled.outputs.length?workspace.outputs:new Float32Array(compiled.outputs.length);
    values.fill(0,0,size);state.fill(0,0,size);outputs.fill(0,0,compiled.outputs.length);
    for(let k=0;k<compiled.inputs.length;k++)values[compiled.inputs[k]]=finite(inputValues[k],0);
    for(const i of compiled.hidden){let sum=compiled.nodes[i].bias;for(const edge of compiled.incoming[i])sum+=values[edge.source]*edge.weight;for(const edge of compiled.recurrent[i])sum+=(previousState?.[edge.source]||0)*edge.weight;values[i]=activateValue(sum,compiled.nodes[i].activation);state[i]=values[i]}
    for(let k=0;k<compiled.outputs.length;k++){const i=compiled.outputs[k];let sum=compiled.nodes[i].bias;for(const edge of compiled.incoming[i])sum+=values[edge.source]*edge.weight;for(const edge of compiled.recurrent[i])sum+=(previousState?.[edge.source]||0)*edge.weight;values[i]=activateValue(sum,compiled.nodes[i].activation);state[i]=values[i];outputs[k]=values[i]}
    const result=workspace?.result||{};result.outputs=outputs;result.state=state;return result;
  }

  function compatibilityDistance(aInput,bInput,coefficients={}){
    const a=normalizeGenome(aInput).connections,b=normalizeGenome(bInput).connections,am=new Map(a.map(g=>[g.innovation,g])),bm=new Map(b.map(g=>[g.innovation,g]));
    const all=[...new Set([...am.keys(),...bm.keys()])].sort((x,y)=>x-y),maxA=a.length?Math.max(...am.keys()):0,maxB=b.length?Math.max(...bm.keys()):0;
    let excess=0,disjoint=0,weight=0,matching=0;
    for(const id of all){const ga=am.get(id),gb=bm.get(id);if(ga&&gb){matching++;weight+=Math.abs(ga.weight-gb.weight)}else if(id>Math.min(maxA,maxB))excess++;else disjoint++}
    const N=Math.max(1,Math.max(a.length,b.length)<20?1:Math.max(a.length,b.length));
    return finite(coefficients.excess,1)*excess/N+finite(coefficients.disjoint,1)*disjoint/N+finite(coefficients.weight,.4)*(matching?weight/matching:0);
  }

  function assignSpecies(individuals,previous=[],options={}){
    const threshold=Math.max(.01,finite(options.threshold,3)),coefficients=options.coefficients||{},species=previous.map(s=>({...s,representative:cloneGenome(s.representative),members:[]}));let nextId=Math.max(0,...species.map(s=>s.id))+1;
    for(const individual of individuals){let best=null,bestDistance=Infinity;for(const s of species){const d=compatibilityDistance(individual.genome,s.representative,coefficients);if(d<threshold&&d<bestDistance){best=s;bestDistance=d}}
      if(best)best.members.push(individual);else species.push({id:nextId++,representative:cloneGenome(individual.genome),members:[individual]})}
    for(const s of species)if(s.members.length)s.representative=cloneGenome(s.members[0].genome);
    return species.filter(s=>s.members.length);
  }

  function updateSpeciesStatistics(species,fitnessById,options={}){
    const stagnationLimit=Math.max(1,Math.floor(finite(options.stagnationLimit,40))),improvementEpsilon=Math.max(0,finite(options.improvementEpsilon,.001));
    let totalAdjusted=0,totalRaw=0,totalMembers=0;
    for(const group of species){
      const values=group.members.map(member=>Math.max(0,finite(fitnessById instanceof Map?fitnessById.get(member.id):fitnessById?.[member.id],0)));
      const rawTotal=values.reduce((sum,value)=>sum+value,0),adjusted=rawTotal/Math.max(1,group.members.length),bestIndex=values.reduce((best,value,index)=>value>values[best]?index:best,0),bestFitness=values.length?values[bestIndex]:0;
      group.age=Math.max(0,Math.floor(finite(group.age,0)))+1;
      const priorBest=finite(group.bestFitness,-Infinity),improved=bestFitness>priorBest+improvementEpsilon;
      group.bestFitness=improved?bestFitness:Math.max(0,priorBest);
      group.stagnation=improved?0:Math.max(0,Math.floor(finite(group.stagnation,0)))+1;
      group.championId=values.length?group.members[bestIndex].id:null;
      group.rawFitness=rawTotal;group.sharedFitness=adjusted;group.stagnant=group.stagnation>=stagnationLimit;
      totalRaw+=rawTotal;totalAdjusted+=adjusted;totalMembers+=group.members.length;
    }
    const viable=species.filter(group=>group.members.length&&!group.stagnant),pool=viable.length?viable:species.filter(group=>group.members.length);
    const poolFitness=pool.reduce((sum,group)=>sum+group.sharedFitness,0),totalQuota=totalMembers;
    const quotas=pool.map(group=>({id:group.id,exact:poolFitness>0?group.sharedFitness/poolFitness*totalQuota:totalQuota/Math.max(1,pool.length)}));
    let assigned=0;for(const item of quotas){item.quota=Math.floor(item.exact);item.remainder=item.exact-item.quota;assigned+=item.quota}
    quotas.sort((a,b)=>b.remainder-a.remainder||a.id-b.id);for(let i=0;i<totalQuota-assigned;i++)if(quotas.length)quotas[i%quotas.length].quota++;
    const quotaById=new Map(quotas.map(item=>[item.id,item.quota]));
    for(const group of species){group.offspringQuota=quotaById.get(group.id)||0;group.reproductivePressure=group.members.length?group.offspringQuota/group.members.length:0}
    return{totalAdjustedFitness:totalAdjusted,totalRawFitness:totalRaw,totalMembers,quotaById,viableSpecies:pool.length,stagnantSpecies:species.filter(group=>group.stagnant).length};
  }

  function normalizeRegulatoryGenome(input){
    if(!input||!Array.isArray(input.copies))throw new TypeError('Regulatory genome requires a copies array');
    const ids=new Set(),copies=input.copies.map(g=>({id:Number(g.id),source:Number(g.source),target:Number(g.target),threshold:clamp(finite(g.threshold,.5),0,1),strength:clamp(finite(g.strength,0),-2,2),mode:g.mode==='repress'?'repress':'activate',environment:g.environment?String(g.environment):null,environmentWeight:clamp(finite(g.environmentWeight,0),-2,2)}));
    for(const gene of copies){if(!Number.isInteger(gene.id)||gene.id<1||gene.id>0xffffffff)throw new RangeError('Regulatory copy ID must be uint32 and nonzero');if(ids.has(gene.id))throw new Error('Duplicate regulatory copy ID '+gene.id);ids.add(gene.id);if(!Number.isInteger(gene.source)||gene.source<0||gene.source>9||!Number.isInteger(gene.target)||gene.target<0||gene.target>9)throw new RangeError('Regulatory loci must be in the range 0..9')}
    return{version:1,copies};
  }
  function createRegulatoryInnovationRegistry(state={}){
    let nextId=Math.max(1,Math.floor(finite(state.nextId,1)));
    function allocate(){if(nextId>0xffffffff)throw new RangeError('Regulatory copy ID space exhausted');return nextId++}
    return Object.freeze({allocate,snapshot:()=>({nextId})});
  }
  function mutateRegulatoryGenome(input,registry,random=Math.random,options={}){
    const genome=normalizeRegulatoryGenome(input),rates={point:.08,duplicate:.01,delete:.005,rewire:.01,mode:.005,...options.rates},limits={maxCopies:64,strengthStep:.12,thresholdStep:.08,...options.limits};
    for(const gene of genome.copies){
      if(random()<rates.point){gene.strength=clamp(gene.strength+(random()*2-1)*limits.strengthStep,-2,2);gene.threshold=clamp(gene.threshold+(random()*2-1)*limits.thresholdStep,0,1);gene.environmentWeight=clamp(gene.environmentWeight+(random()*2-1)*limits.strengthStep,-2,2)}
      if(random()<rates.mode)gene.mode=gene.mode==='activate'?'repress':'activate';
      if(random()<rates.rewire){gene.source=randomIndex(10,random);gene.target=randomIndex(10,random)}
    }
    if(random()<rates.delete&&genome.copies.length>1)genome.copies.splice(randomIndex(genome.copies.length,random),1);
    if(random()<rates.duplicate&&genome.copies.length<limits.maxCopies&&genome.copies.length){const source=genome.copies[randomIndex(genome.copies.length,random)],copy={...source,id:registry.allocate(),strength:clamp(source.strength+(random()*2-1)*limits.strengthStep,-2,2),threshold:clamp(source.threshold+(random()*2-1)*limits.thresholdStep,0,1)};if(random()<.5)copy.source=randomIndex(10,random);if(random()<.5)copy.target=randomIndex(10,random);genome.copies.push(copy)}
    genome.copies.sort((a,b)=>a.id-b.id);return normalizeRegulatoryGenome(genome);
  }
  function expressRegulatoryNetwork(input,loci,environment={},passes=2){
    const genome=normalizeRegulatoryGenome(input),base=Array.from({length:10},(_,i)=>clamp(finite(loci?.[i],.5),0,1));let expression=base.slice();
    for(let pass=0;pass<Math.max(1,Math.min(8,Math.floor(finite(passes,2))));pass++){const next=expression.slice();for(const gene of genome.copies){const source=expression[gene.source],env=gene.environment?finite(environment[gene.environment],0):0,signal=source+env*gene.environmentWeight-gene.threshold,effect=gene.mode==='repress'?-1:1;next[gene.target]=clamp(next[gene.target]+effect*signal*gene.strength,0,1)}expression=next}
    return expression;
  }

  function evaluateRegulation(loci,regulators=[],environment={},definitions={}){
    const expression={...loci};
    for(let pass=0;pass<Math.max(1,Math.min(8,finite(definitions.passes,2)));pass++){
      const next={...expression};
      for(const edge of regulators){const source=finite(expression[edge.source],finite(environment[edge.source],0)),target=finite(next[edge.target],0),signal=source-finite(edge.threshold,.5),strength=finite(edge.strength,1),effect=edge.mode==='repress'?-1:1;
        next[edge.target]=clamp(target+effect*signal*strength,-10,10)}
      Object.assign(expression,next);
    }
    return expression;
  }

  function expressPhenotypes(loci,regulators,environment,traits){
    const regulated=evaluateRegulation(loci,regulators,environment),out={};
    for(const [name,spec] of Object.entries(traits||{})){
      let value=finite(spec.intercept,0);
      for(const [locus,weight] of Object.entries(spec.loci||{}))value+=finite(regulated[locus],0)*finite(weight,0);
      for(const interaction of spec.interactions||[])value+=finite(regulated[interaction.a],0)*finite(regulated[interaction.b],0)*finite(interaction.weight,0);
      if(spec.environment)value+=finite(environment[spec.environment.field],0)*finite(spec.environment.weight,0);
      out[name]=clamp(value,finite(spec.min,-Infinity),finite(spec.max,Infinity));
    }
    return {expression:regulated,phenotype:out};
  }

  function alleleStatistics(values){
    const finiteValues=values.map(Number).filter(Number.isFinite),counts=new Map();for(const v of finiteValues)counts.set(v,(counts.get(v)||0)+1);
    const n=finiteValues.length,frequencies=[...counts.values()].map(c=>c/Math.max(1,n));
    return{sampleSize:n,alleleRichness:counts.size,frequencies:Object.fromEntries([...counts.entries()].map(([v,c])=>[String(v),c/Math.max(1,n)])),expectedHeterozygosity:n?1-frequencies.reduce((s,p)=>s+p*p,0):null};
  }

  function linearRegression(x,y){
    const pairs=x.map((v,i)=>[Number(v),Number(y[i])]).filter(([a,b])=>Number.isFinite(a)&&Number.isFinite(b)),n=pairs.length;
    if(n<3)return{n,slope:null,intercept:null,rSquared:null,correlation:null};
    const mx=pairs.reduce((s,p)=>s+p[0],0)/n,my=pairs.reduce((s,p)=>s+p[1],0)/n;
    const xx=pairs.reduce((s,p)=>s+(p[0]-mx)**2,0),xy=pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0),yy=pairs.reduce((s,p)=>s+(p[1]-my)**2,0);
    if(xx===0)return{n,slope:null,intercept:null,rSquared:null,correlation:null};
    const slope=xy/xx,intercept=my-slope*mx,correlation=xx>0&&yy>0?clamp(xy/Math.sqrt(xx*yy),-1,1):null,rSquared=correlation===null?null:correlation*correlation;
    return{n,slope,intercept,rSquared,correlation};
  }
  function parentOffspringHeritability(parentTrait,offspringTrait){const regression=linearRegression(parentTrait,offspringTrait);return{...regression,heritability:regression.slope===null?null:clamp(regression.slope,0,1),method:'mid-parent offspring regression'}}

  function seededRandom(seed=1){
    let state=(Number(seed)>>>0)||0x6d2b79f5;
    return function(){state^=state<<13;state^=state>>>17;state^=state<<5;return(state>>>0)/4294967296};
  }
  function quantile(sorted,p){if(!sorted.length)return null;const position=clamp(p,0,1)*(sorted.length-1),lo=Math.floor(position),hi=Math.ceil(position),fraction=position-lo;return sorted[lo]*(1-fraction)+sorted[hi]*fraction}
  function summarizeReplicates(values,options={}){
    const sample=values.map(Number).filter(Number.isFinite),n=sample.length;if(!n)return{n:0,mean:null,standardDeviation:null,standardError:null,confidenceInterval95:null,median:null};
    const mean=sample.reduce((sum,v)=>sum+v,0)/n,variance=n>1?sample.reduce((sum,v)=>sum+(v-mean)**2,0)/(n-1):0,sd=Math.sqrt(variance),sorted=sample.slice().sort((a,b)=>a-b),rng=seededRandom(options.seed??1),iterations=Math.max(100,Math.min(20000,Math.floor(options.bootstrapSamples??2000))),means=new Array(iterations);
    for(let i=0;i<iterations;i++){let total=0;for(let j=0;j<n;j++)total+=sample[Math.floor(rng()*n)];means[i]=total/n}
    means.sort((a,b)=>a-b);
    return{n,mean,standardDeviation:sd,standardError:sd/Math.sqrt(n),median:quantile(sorted,.5),firstQuartile:quantile(sorted,.25),thirdQuartile:quantile(sorted,.75),interquartileRange:quantile(sorted,.75)-quantile(sorted,.25),confidenceInterval95:[quantile(means,.025),quantile(means,.975)],method:'percentile bootstrap',bootstrapSamples:iterations};
  }
  function compareReplicates(aValues,bValues,options={}){
    const a=aValues.map(Number).filter(Number.isFinite),b=bValues.map(Number).filter(Number.isFinite);
    if(!a.length||!b.length)return{nA:a.length,nB:b.length,difference:null,pValue:null,confidenceInterval95:null,method:'two-sided permutation test'};
    const mean=values=>values.reduce((sum,v)=>sum+v,0)/values.length,observed=mean(a)-mean(b),pooled=a.concat(b),variance=values=>values.length>1?values.reduce((sum,v)=>sum+(v-mean(values))**2,0)/(values.length-1):0,pooledDeviation=Math.sqrt(((a.length-1)*variance(a)+(b.length-1)*variance(b))/Math.max(1,a.length+b.length-2)),cohensD=pooledDeviation>0?observed/pooledDeviation:null,rng=seededRandom(options.seed??1),iterations=Math.max(100,Math.min(50000,Math.floor(options.permutations??5000))),bootstrap=Math.max(100,Math.min(10000,Math.floor(options.bootstrapSamples??2000)));let extreme=0;const boot=new Array(bootstrap);
    for(let i=0;i<iterations;i++){const shuffled=pooled.slice();for(let j=shuffled.length-1;j>0;j--){const k=Math.floor(rng()*(j+1));[shuffled[j],shuffled[k]]=[shuffled[k],shuffled[j]]}const diff=mean(shuffled.slice(0,a.length))-mean(shuffled.slice(a.length));if(Math.abs(diff)>=Math.abs(observed))extreme++}
    for(let i=0;i<bootstrap;i++){let am=0,bm=0;for(let j=0;j<a.length;j++)am+=a[Math.floor(rng()*a.length)];for(let j=0;j<b.length;j++)bm+=b[Math.floor(rng()*b.length)];boot[i]=am/a.length-bm/b.length}
    boot.sort((x,y)=>x-y);
    return{nA:a.length,nB:b.length,difference:observed,cohensD,pValue:(extreme+1)/(iterations+1),confidenceInterval95:[quantile(boot,.025),quantile(boot,.975)],method:'two-sided permutation test with percentile bootstrap interval',permutations:iterations,bootstrapSamples:bootstrap};
  }
  function createExperimentManifest(input={}){
    const seed=Math.floor(finite(input.seed,1))>>>0,replicates=Math.floor(finite(input.replicates,1));
    if(replicates<1||replicates>10000)throw new RangeError('Replicates must be between 1 and 10000');
    const manifest={schemaVersion:1,modelVersion:String(input.modelVersion||'development'),seed,replicates,scenario:String(input.scenario||'baseline'),config:clone(input.config||{}),analysis:clone(input.analysis||{})};
    const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freeze(child)}return value};
    return freeze(manifest);
  }
  function deriveReplicateSeeds(manifest){
    const source=createExperimentManifest(manifest),seeds=[];
    for(let i=0;i<source.replicates;i++){let hash=(source.seed^0x9e3779b9)>>>0;const text=source.modelVersion+'|'+source.scenario+'|'+i;for(let j=0;j<text.length;j++){hash^=text.charCodeAt(j);hash=Math.imul(hash,16777619)>>>0}hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d)>>>0;hash^=hash>>>15;hash=Math.imul(hash,0x846ca68b)>>>0;hash^=hash>>>16;seeds.push(hash>>>0)}
    return seeds;
  }
  function kaplanMeier(observations,confidenceZ=1.96){
    const rows=observations.map(row=>({time:finite(row.time,NaN),event:!!row.event})).filter(row=>Number.isFinite(row.time)&&row.time>=0).sort((a,b)=>a.time-b.time),times=[...new Set(rows.filter(row=>row.event).map(row=>row.time))];
    let survival=1,greenwood=0;const curve=[{time:0,atRisk:rows.length,events:0,censored:0,survival:1,standardError:0,lower:1,upper:1}];
    for(const time of times){const atRisk=rows.filter(row=>row.time>=time).length,events=rows.filter(row=>row.time===time&&row.event).length,censored=rows.filter(row=>row.time===time&&!row.event).length;if(!atRisk||!events)continue;survival*=1-events/atRisk;if(atRisk>events)greenwood+=events/(atRisk*(atRisk-events));else greenwood=Infinity;
      const se=survival===0?0:survival*Math.sqrt(greenwood),lower=clamp(survival-confidenceZ*se,0,1),upper=clamp(survival+confidenceZ*se,0,1);
      curve.push({time,atRisk,events,censored,survival,standardError:se,lower,upper});
    }
    return{n:rows.length,events:rows.filter(row=>row.event).length,censored:rows.filter(row=>!row.event).length,curve,median:curve.find(point=>point.survival<=.5)?.time??null};
  }
  function correctPValues(values,method='BH'){
    const rows=values.map((p,index)=>({index,p:clamp(finite(p,1),0,1)})).sort((a,b)=>a.p-b.p),n=rows.length,adjusted=new Array(n);
    if(method==='holm'){let running=0;for(let i=0;i<n;i++){running=Math.max(running,(n-i)*rows[i].p);adjusted[rows[i].index]=Math.min(1,running)}}
    else{let running=1;for(let i=n-1;i>=0;i--){running=Math.min(running,rows[i].p*n/(i+1));adjusted[rows[i].index]=Math.min(1,running)}}
    return adjusted;
  }

  function parameterSweep(parameters={},limit=10000){
    const entries=Object.entries(parameters),combinations=[{}];
    for(const [key,raw] of entries){const values=Array.isArray(raw)?raw:[raw];if(!values.length)throw new RangeError('Sweep parameter '+key+' has no values');if(combinations.length*values.length>limit)throw new RangeError('Parameter sweep exceeds '+limit+' combinations');const next=[];for(const base of combinations)for(const value of values)next.push({...base,[key]:value});combinations.splice(0,combinations.length,...next)}
    return combinations.map((config,index)=>({id:index+1,config}));
  }
  function factorialDesign(dimensions={},limit=4096){
    const entries=Object.entries(dimensions),count=2**entries.length;
    if(count>limit)throw new RangeError('Factorial design exceeds '+limit+' runs');
    const ranges=entries.map(([key,range])=>{const min=finite(Array.isArray(range)?range[0]:range.min,NaN),max=finite(Array.isArray(range)?range[1]:range.max,NaN);if(!Number.isFinite(min)||!Number.isFinite(max)||max<min)throw new RangeError('Invalid factorial range for '+key);return{key,min,max}});
    return Array.from({length:count},(_,index)=>({id:index+1,config:Object.fromEntries(ranges.map((range,dimension)=>[range.key,(index&(1<<dimension))?range.max:range.min]))}));
  }
  function latinHypercubeDesign(dimensions={},samples=20,seed=1){
    const entries=Object.entries(dimensions),n=Math.floor(finite(samples,0));
    if(n<1||n>10000)throw new RangeError('Latin-hypercube samples must be between 1 and 10000');
    const ranges=entries.map(([key,range])=>{const min=finite(Array.isArray(range)?range[0]:range.min,NaN),max=finite(Array.isArray(range)?range[1]:range.max,NaN);if(!Number.isFinite(min)||!Number.isFinite(max)||max<min)throw new RangeError('Invalid Latin-hypercube range for '+key);return{key,min,max}});
    const rng=seededRandom(seed),columns=ranges.map(()=>{const order=Array.from({length:n},(_,i)=>i);for(let i=n-1;i>0;i--){const j=Math.floor(rng()*(i+1));[order[i],order[j]]=[order[j],order[i]]}return order.map((stratum)=> (stratum+rng())/n)});
    return Array.from({length:n},(_,row)=>({id:row+1,config:Object.fromEntries(ranges.map((range,column)=>[range.key,range.min+columns[column][row]*(range.max-range.min)]))}));
  }

  function replicateSeeds(baseSeed,count){
    const rng=seededRandom(baseSeed),n=Math.max(0,Math.min(10000,Math.floor(count)));return Array.from({length:n},()=>Math.max(1,Math.floor(rng()*0xffffffff)));
  }

  function pedigreeKinship(a,b,pedigree,depth=12,memo=new Map()){
    if(!a||!b)return 0;if(a===b)return .5;if(depth<=0)return 0;
    const lo=Math.min(a,b),hi=Math.max(a,b),key=lo+':'+hi+':'+depth;if(memo.has(key))return memo.get(key);
    const pa=pedigree.get(a),pb=pedigree.get(b),founderA=!pa||(!pa[0]&&!pa[1]),founderB=!pb||(!pb[0]&&!pb[1]);
    if(founderA&&founderB)return 0;
    const parents=founderA?pb:pa,other=founderA?a:b;
    const result=.5*(pedigreeKinship(other,parents[0],pedigree,depth-1,memo)+pedigreeKinship(other,parents[1],pedigree,depth-1,memo));
    memo.set(key,result);return result;
  }
  function inbreedingCoefficient(id,pedigree,depth=12){const parents=pedigree.get(id);if(!parents||!parents[0]||!parents[1])return 0;return pedigreeKinship(parents[0],parents[1],pedigree,depth)}

  return Object.freeze({normalizeGenome,createInnovationRegistry,mutateGenome,crossover,compileNetwork,activateNetwork,compatibilityDistance,assignSpecies,updateSpeciesStatistics,normalizeRegulatoryGenome,createRegulatoryInnovationRegistry,mutateRegulatoryGenome,expressRegulatoryNetwork,evaluateRegulation,expressPhenotypes,alleleStatistics,linearRegression,parentOffspringHeritability,seededRandom,summarizeReplicates,compareReplicates,createExperimentManifest,deriveReplicateSeeds,kaplanMeier,correctPValues,parameterSweep,factorialDesign,latinHypercubeDesign,replicateSeeds,pedigreeKinship,inbreedingCoefficient});
});
