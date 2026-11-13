/* Foundational abiogenesis primitives.
 * Pure model layer: the worker owns scheduling, RNG state, persistence and spatial indexing.
 * No capability is granted merely because an entity has reached a named life stage.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BoidsAbiogenesis=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const clone=v=>JSON.parse(JSON.stringify(v));

  const ELEMENTS=new Set(['H','C','N','O','P','S','OTHER']);
  const ELEMENT_VALENCE={H:1,C:4,N:3,O:2,P:5,S:2,OTHER:1};
  const BOND_TYPES=new Set(['covalent','ionic','hydrogen','van-der-waals','adhesion','membrane']);
  function normalizeParticle(input){
    if(!input||input.id===undefined)throw new TypeError('Particle requires a stable id');
    const element=ELEMENTS.has(input.element)?input.element:'OTHER';
    return {id:String(input.id),element,mass:Math.max(.0001,finite(input.mass,1)),radius:Math.max(.0001,finite(input.radius,.5)),
      charge:clamp(finite(input.charge),-8,8),valence:Math.max(0,Math.min(8,Math.floor(finite(input.valence,ELEMENT_VALENCE[element])))),
      bonds:Array.isArray(input.bonds)?input.bonds.map(String):[],position:{x:finite(input.position&&input.position.x),y:finite(input.position&&input.position.y),z:finite(input.position&&input.position.z)},
      velocity:{x:finite(input.velocity&&input.velocity.x),y:finite(input.velocity&&input.velocity.y),z:finite(input.velocity&&input.velocity.z)},
      thermalEnergy:Math.max(0,finite(input.thermalEnergy,.1)),metadata:input.metadata&&typeof input.metadata==='object'?clone(input.metadata):{}};
  }
  function normalizeBond(input){
    if(!input||input.a===undefined||input.b===undefined||String(input.a)===String(input.b))throw new TypeError('Bond requires two distinct endpoints');
    const type=BOND_TYPES.has(input.type)?input.type:'covalent';
    return {id:String(input.id===undefined?JSON.stringify([String(input.a),String(input.b)].sort()):input.id),a:String(input.a),b:String(input.b),type,
      strength:clamp(finite(input.strength,1),0,1000),elasticity:clamp(finite(input.elasticity,.5),0,1),
      damping:clamp(finite(input.damping,.1),0,1),restLength:Math.max(0,finite(input.restLength,0)),
      energy:Math.max(0,finite(input.energy)),formedAt:finite(input.formedAt),metadata:input.metadata&&typeof input.metadata==='object'?clone(input.metadata):{}};
  }
  function canBond(a,b,options={}){
    if(a.id===b.id||a.bonds.length>=a.valence||b.bonds.length>=b.valence)return false;
    if(a.bonds.includes(b.id)||b.bonds.includes(a.id))return false;
    const compatible=options.compatibility?options.compatibility(a,b):true;
    return !!compatible;
  }
  function formBond(particles,bonds,aId,bId,options={}){
    const a=particles.find(p=>String(p.id)===String(aId)),b=particles.find(p=>String(p.id)===String(bId));
    if(!a||!b)throw new Error('Cannot bond missing particle');
    if(!canBond(a,b,options))return null;
    const bond=normalizeBond({a:a.id,b:b.id,...options.bond});
    a.bonds.push(b.id);b.bonds.push(a.id);bonds.push(bond);return bond;
  }
  function breakBond(particles,bonds,bondId){
    const index=bonds.findIndex(b=>b.id===String(bondId));if(index<0)return null;
    const [bond]=bonds.splice(index,1);
    for(const id of [bond.a,bond.b]){const p=particles.find(item=>item.id===id);if(p)p.bonds=p.bonds.filter(other=>other!==(id===bond.a?bond.b:bond.a))}
    return bond;
  }
  function bondForce(a,b,bond){
    const dx=b.position.x-a.position.x,dy=b.position.y-a.position.y,dz=b.position.z-a.position.z;
    const distance=Math.hypot(dx,dy,dz)||1e-9,extension=distance-bond.restLength;
    const relative=((b.velocity.x-a.velocity.x)*dx+(b.velocity.y-a.velocity.y)*dy+(b.velocity.z-a.velocity.z)*dz)/distance;
    const magnitude=-bond.strength*extension-bond.damping*relative;
    return {x:magnitude*dx/distance,y:magnitude*dy/distance,z:magnitude*dz/distance,extension,energy:Math.abs(magnitude*extension)*.5};
  }
  function connectedComponents(particles,bonds){
    const adjacency=new Map(particles.map(p=>[p.id,[]]));
    for(const b of bonds){if(adjacency.has(b.a)&&adjacency.has(b.b)){adjacency.get(b.a).push(b.b);adjacency.get(b.b).push(b.a)}}
    const seen=new Set(),groups=[];
    for(const p of particles){if(seen.has(p.id))continue;const stack=[p.id],group=[];seen.add(p.id);
      while(stack.length){const id=stack.pop();group.push(id);for(const next of adjacency.get(id)||[])if(!seen.has(next)){seen.add(next);stack.push(next)}}
      groups.push(group);
    }return groups;
  }
  function normalizeMolecule(input){
    if(!input||!Array.isArray(input.atoms)||!Array.isArray(input.bonds))throw new TypeError('Molecule requires atoms and bonds');
    const atoms=input.atoms.map(normalizeParticle),byId=new Map(atoms.map(a=>[a.id,a]));
    if(byId.size!==atoms.length)throw new Error('Molecule atom IDs must be unique');
    const bonds=input.bonds.map(normalizeBond),pairs=new Set();
    for(const atom of atoms)atom.bonds=[];
    for(const bond of bonds){
      const a=byId.get(bond.a),b=byId.get(bond.b);
      if(!a||!b)throw new Error('Molecular bond endpoint is missing');
      const pair=JSON.stringify([bond.a,bond.b].sort());if(pairs.has(pair))throw new Error('Duplicate molecular bond');pairs.add(pair);
      if(a.bonds.length>=a.valence||b.bonds.length>=b.valence)throw new Error('Molecular topology exceeds atom valence');
      a.bonds.push(b.id);b.bonds.push(a.id);
    }
    return {id:String(input.id===undefined?'molecule':input.id),atoms,bonds,composition:atoms.reduce((o,a)=>(o[a.element]=(o[a.element]||0)+1,o),{}),
      energy:Math.max(0,finite(input.energy)),properties:input.properties&&typeof input.properties==='object'?clone(input.properties):{}};
  }
  function applyReaction(pool,reaction,options={}){
    if(!Array.isArray(pool)||!reaction||!Array.isArray(reaction.inputs)||!Array.isArray(reaction.outputs)||!reaction.inputs.length||!reaction.outputs.length)throw new TypeError('Reaction requires a pool and non-empty input/output stoichiometry');
    const available=new Map();for(const item of pool){const amount=finite(item.amount,-1);if(amount<0)throw new RangeError('Pool quantities must be finite and non-negative');available.set(item.type,(available.get(item.type)||0)+amount)}
    const demand=new Map();
    for(const input of reaction.inputs){const amount=finite(input.amount,-1);if(amount<=0)throw new RangeError('Reactant quantities must be positive');demand.set(input.type,(demand.get(input.type)||0)+amount)}
    for(const [type,amount] of demand)if((available.get(type)||0)<amount)return {occurred:false,reason:'insufficient-reactants'};
    if(reaction.catalyst){const required=finite(reaction.catalyst.amount,1);if(required<=0)throw new RangeError('Catalyst quantity must be positive');if((available.get(reaction.catalyst.type)||0)<required)return {occurred:false,reason:'missing-catalyst'}}
    for(const output of reaction.outputs)if(finite(output.amount,-1)<=0)throw new RangeError('Product quantities must be positive');
    const energy=finite(reaction.energyDelta);
    if(energy>finite(options.availableEnergy,Infinity))return {occurred:false,reason:'insufficient-energy'};
    for(const [type,amount] of demand){let left=amount;for(const item of pool){if(item.type!==type||left<=0)continue;const used=Math.min(item.amount,left);item.amount-=used;left-=used}}
    for(const output of reaction.outputs){let item=pool.find(p=>p.type===output.type);if(!item){item={type:output.type,amount:0};pool.push(item)}item.amount+=finite(output.amount)}
    return {occurred:true,energyDelta:energy,products:reaction.outputs.map(clone)};
  }
  function polymerise(monomers,bonds,sequence,options={}){
    if(!Array.isArray(sequence)||sequence.length<2)throw new RangeError('A polymer requires at least two monomers');
    const byId=new Map(monomers.map(m=>[String(m.id),m]));
    const units=sequence.map(id=>byId.get(String(id)));
    if(units.some(x=>!x))throw new Error('Polymer sequence references a missing monomer');
    const links=units.slice(1).map((unit,i)=>normalizeBond({a:units[i].id,b:unit.id,type:options.bondType||'covalent',strength:options.strength||1}));
    return {id:String(options.id||'polymer'),sequence:sequence.map(String),monomerCount:units.length,bonds:links,energy:Math.max(0,finite(options.energy))};
  }
  function autocatalyticClosure(reactions,seedTypes){
    const reachable=new Set(seedTypes.map(String));let changed=true,iterations=0;
    while(changed&&iterations++<=reactions.length+1){changed=false;
      for(const r of reactions){const inputs=(r.inputs||[]).every(i=>reachable.has(String(i.type)));
        const catalyst=!r.catalyst||reachable.has(String(r.catalyst.type));
        if(inputs&&catalyst)for(const o of r.outputs||[])if(!reachable.has(String(o.type))){reachable.add(String(o.type));changed=true}
      }
    }
    const productive=reactions.filter(r=>(r.outputs||[]).some(o=>reachable.has(String(o.type)))&&(r.inputs||[]).every(i=>reachable.has(String(i.type))));
    const graph=new Map();
    for(const r of productive)for(const input of r.inputs||[])for(const output of r.outputs||[]){
      const from=String(input.type),to=String(output.type);
      if(!graph.has(from))graph.set(from,[]);graph.get(from).push(to);
    }
    const visiting=new Set(),visited=new Set();let closed=false;
    function visit(node){
      if(visiting.has(node)){closed=true;return}
      if(visited.has(node)||closed)return;
      visiting.add(node);for(const next of graph.get(node)||[])visit(next);
      visiting.delete(node);visited.add(node);
    }
    for(const node of graph.keys())visit(node);
    return {reachableTypes:Array.from(reachable).sort(),productiveReactionIds:productive.map(r=>String(r.id)),closed};
  }
  function assembleCompartment(lipids,contents,options={}){
    if(!Array.isArray(lipids)||lipids.length<3)throw new RangeError('A compartment requires at least three lipid components');
    const permeability=clamp(finite(options.permeability,.5),0,1),stability=clamp(finite(options.stability,.5),0,1);
    return {id:String(options.id||'compartment'),lipidIds:lipids.map(x=>String(x.id===undefined?x:x.id)),contents:contents.map(x=>String(x.id===undefined?x:x.id)),
      permeability,stability,integrity:clamp(finite(options.integrity,stability),0,1),growth:0,
      capabilities:{metabolicActivity:false,molecularReplication:false,growth:false,environmentalResponsiveness:false},createdAt:finite(options.createdAt),metadata:options.metadata&&typeof options.metadata==='object'?clone(options.metadata):{}};
  }

  function createSeededRandom(seed=1){let state=(Number(seed)>>>0)||0x6d2b79f5;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};Object.defineProperty(random,'state',{get:()=>state>>>0});random.setState=value=>{state=(Number(value)>>>0)||0x6d2b79f5};return random}
  function snapshotParticleWorld(world){return clone({particles:world.particles,bonds:world.bonds,resourceClouds:world.resourceClouds||[],molecules:world.molecules||[],time:world.time,stats:world.stats})}
  function restoreParticleWorld(snapshot){const world=createParticleWorld(snapshot.particles,{bonds:snapshot.bonds,resourceClouds:snapshot.resourceClouds||[],molecules:snapshot.molecules||[],time:snapshot.time});world.stats={steps:0,collisions:0,bondsFormed:0,bondsBroken:0,thermalEnergy:0,kineticEnergy:0,...(snapshot.stats||{})};return world}
  function normalizeResourceCloud(input,particleIds){
    if(!input||input.ownerId===undefined)throw new TypeError('Resource cloud requires an ownerId');
    const ids=Array.from(new Set((input.particleIds||[]).map(String)));
    for(const id of ids)if(!particleIds.has(id))throw new Error('Resource cloud references missing particle '+id);
    return {id:String(input.id||'cloud-'+input.ownerId),ownerId:String(input.ownerId),particleIds:ids,
      radius:Math.max(.1,finite(input.radius,28)),followStrength:clamp(finite(input.followStrength,1.8),0,100),
      damping:clamp(finite(input.damping,.16),0,1),containment:clamp(finite(input.containment,.8),0,100),
      maxAcceleration:Math.max(.01,finite(input.maxAcceleration,18)),energy:Math.max(0,finite(input.energy)),energyCapacity:Math.max(0,finite(input.energyCapacity,100)),metadata:input.metadata&&typeof input.metadata==='object'?clone(input.metadata):{}};
  }
  function createResourceCloud(world,ownerId,particleIds,options={}){
    if(!world||!Array.isArray(world.particles))throw new TypeError('Resource cloud requires a particle world');
    const ids=new Set(world.particles.map(p=>p.id)),cloud=normalizeResourceCloud({ownerId,particleIds,...options},ids);
    if(world.resourceClouds.some(c=>c.id===cloud.id))throw new Error('Resource cloud ID must be unique');
    world.resourceClouds.push(cloud);return cloud;
  }
  function resourceInventory(world,cloudId){
    const cloud=world.resourceClouds.find(c=>c.id===String(cloudId));if(!cloud)throw new Error('Resource cloud not found');
    const owned=new Set(cloud.particleIds),particles=world.particles.filter(p=>owned.has(p.id)),elements={},compounds={};
    for(const p of particles){elements[p.element]=(elements[p.element]||0)+1;const compound=p.metadata&&p.metadata.compound;if(compound)compounds[compound]=(compounds[compound]||0)+1}
    const molecules=(world.molecules||[]).filter(m=>m.atomIds.every(id=>owned.has(id)));
    return {ownerId:cloud.ownerId,particleCount:particles.length,moleculeCount:molecules.length,mass:particles.reduce((n,p)=>n+p.mass,0),
      energy:cloud.energy,energyCapacity:cloud.energyCapacity,elements,compounds,molecules:molecules.map(m=>({id:m.id,type:m.type,composition:m.composition,energy:m.energy}))};
  }
  function collectResources(world,cloudId,anchor,options={}){
    const cloud=world.resourceClouds.find(c=>c.id===String(cloudId));if(!cloud)throw new Error('Resource cloud not found');
    if(!anchor||!anchor.position)throw new TypeError('Collection requires a cell anchor position');
    const owned=new Set(world.resourceClouds.flatMap(c=>c.particleIds)),allowed=options.elements?new Set(options.elements):null;
    const radius=Math.max(0,finite(options.radius,cloud.radius)),limit=Math.max(0,Math.floor(finite(options.maxCount,Infinity)));
    const candidates=world.particles.filter(p=>!owned.has(p.id)&&(!allowed||allowed.has(p.element)))
      .map(p=>({p,d:Math.hypot(p.position.x-finite(anchor.position.x),p.position.y-finite(anchor.position.y),p.position.z-finite(anchor.position.z))}))
      .filter(x=>x.d<=radius).sort((a,b)=>a.d-b.d||a.p.id.localeCompare(b.p.id));
    const collected=candidates.slice(0,limit).map(x=>x.p.id);cloud.particleIds.push(...collected);return collected;
  }
  function craftMolecule(world,cloudId,atomIds,bondSpecs=[],options={}){
    const cloud=world.resourceClouds.find(c=>c.id===String(cloudId));if(!cloud)throw new Error('Resource cloud not found');
    const ids=Array.from(new Set((atomIds||[]).map(String)));if(!ids.length||ids.length!==(atomIds||[]).length)throw new Error('Molecule requires unique atom IDs');
    if(ids.some(id=>!cloud.particleIds.includes(id)))throw new Error('Molecule atoms must be carried by the owning cloud');
    const occupied=new Set((world.molecules||[]).flatMap(m=>m.atomIds));
    if(ids.some(id=>occupied.has(id)))throw new Error('Atom already belongs to a molecule');
    const byId=new Map(world.particles.map(p=>[p.id,p])),atoms=ids.map(id=>byId.get(id));
    if(atoms.some(p=>!p))throw new Error('Molecule references missing atoms');
    const normalized=normalizeMolecule({id:options.id||'molecule-'+(world.molecules.length+1),atoms,bonds:bondSpecs,energy:options.energy,properties:options.properties});
    if(world.molecules.some(m=>m.id===normalized.id))throw new Error('Molecule ID must be unique');
    const bondIds=[];
    for(const spec of normalized.bonds){
      const existing=world.bonds.find(b=>(b.a===spec.a&&b.b===spec.b)||(b.a===spec.b&&b.b===spec.a));
      if(existing)throw new Error('Molecule bond already exists in particle world');
      const bond=formBond(world.particles,world.bonds,spec.a,spec.b,{bond:{...spec}});
      if(!bond)throw new Error('Molecule bond violates particle valence or topology');
      bondIds.push(bond.id);
    }
    const molecule={id:normalized.id,type:String(options.type||'molecule'),atomIds:ids,bondIds,composition:normalized.composition,
      energy:normalized.energy,properties:normalized.properties,metadata:options.metadata&&typeof options.metadata==='object'?clone(options.metadata):{}};
    world.molecules.push(molecule);return molecule;
  }
  function rearrangeMolecules(world,cloudId,inputMoleculeIds,outputs,options={}){
    const cloud=world.resourceClouds.find(c=>c.id===String(cloudId));if(!cloud)throw new Error('Resource cloud not found');
    const inputs=(inputMoleculeIds||[]).map(id=>(world.molecules||[]).find(m=>m.id===String(id)));
    if(!inputs.length||inputs.some(m=>!m))throw new Error('Reaction references a missing input molecule');
    const inputAtoms=inputs.flatMap(m=>m.atomIds),inputSet=new Set(inputAtoms);
    if(inputSet.size!==inputAtoms.length||inputAtoms.some(id=>!cloud.particleIds.includes(id)))throw new Error('Input molecules must be distinct and fully carried by this cloud');
    if(!Array.isArray(outputs)||!outputs.length)throw new Error('Reaction requires output molecules');
    const outputAtoms=outputs.flatMap(o=>(o.atomIds||[]).map(String));
    if(outputAtoms.length!==inputAtoms.length||new Set(outputAtoms).size!==outputAtoms.length||outputAtoms.some(id=>!inputSet.has(id)))throw new Error('Reaction must conserve every input atom exactly once');
    const cost=Math.max(0,finite(options.energyCost));if(cost>cloud.energy)throw new Error('Insufficient stored energy for reaction');
    for(const molecule of inputs)for(const id of molecule.bondIds||[]){const bond=world.bonds.find(b=>b.id===id);if(bond)breakBond(world.particles,world.bonds,id)}
    const removeIds=new Set(inputs.map(m=>m.id));world.molecules=world.molecules.filter(m=>!removeIds.has(m.id));cloud.energy-=cost;
    const totalEnergy=inputs.reduce((n,m)=>n+m.energy,0),productEnergy=Math.max(0,totalEnergy),created=[];
    for(let i=0;i<outputs.length;i++){const output=outputs[i],share=productEnergy/outputs.length;
      created.push(craftMolecule(world,cloudId,output.atomIds,output.bonds||[],{...output,energy:finite(output.energy,share)}))}
    return {occurred:true,consumed:inputs.map(m=>m.id),products:created.map(m=>m.id),atomIds:outputAtoms,energyCost:cost};
  }
  function transferResource(world,fromCloudId,toCloudId,particleId){
    const from=world.resourceClouds.find(c=>c.id===String(fromCloudId)),to=world.resourceClouds.find(c=>c.id===String(toCloudId));
    if(!from||!to)throw new Error('Resource cloud not found');
    const id=String(particleId),index=from.particleIds.indexOf(id);
    if(index<0||to.particleIds.includes(id))return false;
    from.particleIds.splice(index,1);to.particleIds.push(id);return true;
  }
  function consumeResource(world,cloudId,particleId){
    const cloud=world.resourceClouds.find(c=>c.id===String(cloudId));if(!cloud)return null;
    const id=String(particleId),member=cloud.particleIds.indexOf(id);if(member<0)return null;
    const containing=(world.molecules||[]).filter(m=>m.atomIds.includes(id));for(const molecule of containing){for(const bondId of molecule.bondIds||[])if(world.bonds.some(b=>b.id===bondId))breakBond(world.particles,world.bonds,bondId);world.molecules=world.molecules.filter(m=>m.id!==molecule.id)}
    const index=world.particles.findIndex(p=>p.id===id);if(index<0)return null;
    cloud.particleIds.splice(member,1);
    for(const bond of world.bonds.filter(b=>b.a===id||b.b===id))breakBond(world.particles,world.bonds,bond.id);
    return world.particles.splice(world.particles.findIndex(p=>p.id===id),1)[0];
  }
  function applyResourceCloudForces(world,anchors,forces,dt){
    if(!Array.isArray(world.resourceClouds)||!anchors)return;
    const index=new Map(world.particles.map((p,i)=>[p.id,i]));
    for(const cloud of world.resourceClouds){
      const anchor=anchors[cloud.ownerId];if(!anchor||!anchor.position)continue;
      const ap=anchor.position,av=anchor.velocity||{x:0,y:0,z:0};
      for(const id of cloud.particleIds){
        const i=index.get(id);if(i===undefined)continue;const p=world.particles[i];
        const dx=finite(ap.x)-p.position.x,dy=finite(ap.y)-p.position.y,dz=finite(ap.z)-p.position.z;
        const distance=Math.hypot(dx,dy,dz)||1e-9,excess=Math.max(0,distance-cloud.radius);
        const strength=cloud.followStrength+(excess/distance)*cloud.containment;
        const ax=dx*strength-finite(cloud.damping)* (p.velocity.x-finite(av.x));
        const ay=dy*strength-finite(cloud.damping)* (p.velocity.y-finite(av.y));
        const az=dz*strength-finite(cloud.damping)* (p.velocity.z-finite(av.z));
        const mag=Math.hypot(ax,ay,az)||1,scale=Math.min(1,cloud.maxAcceleration/mag);
        forces[i].x+=ax*scale*p.mass;forces[i].y+=ay*scale*p.mass;forces[i].z+=az*scale*p.mass;
      }
    }
  }
  function createParticleWorld(inputs=[],options={}){
    const particles=inputs.map(normalizeParticle),ids=new Set(particles.map(p=>p.id));
    if(ids.size!==particles.length)throw new Error('Particle IDs must be unique');
    const bonds=(options.bonds||[]).map(normalizeBond);for(const p of particles)p.bonds=[];
    for(const b of bonds){if(!ids.has(b.a)||!ids.has(b.b))throw new Error('Bond endpoint is missing');const a=particles.find(p=>p.id===b.a),c=particles.find(p=>p.id===b.b);if(a.bonds.length>=a.valence||c.bonds.length>=c.valence)throw new Error('Bond topology exceeds particle valence');if(a.bonds.includes(c.id)||c.bonds.includes(a.id))throw new Error('Duplicate particle bond');a.bonds.push(c.id);c.bonds.push(a.id)}
    const resourceClouds=(options.resourceClouds||[]).map(c=>normalizeResourceCloud(c,ids));
    const owned=new Set();for(const cloud of resourceClouds)for(const id of cloud.particleIds){if(owned.has(id))throw new Error('Particle cannot belong to multiple resource clouds');owned.add(id)}
    const molecules=(options.molecules||[]).map(m=>clone(m));
    return {particles,bonds,resourceClouds,molecules,time:Math.max(0,finite(options.time)),stats:{steps:0,collisions:0,bondsFormed:0,bondsBroken:0,thermalEnergy:0,kineticEnergy:0}};
  }
  function stepParticleWorld(world,dt,options={}){
    dt=clamp(finite(dt),0,.05);if(!world||!Array.isArray(world.particles)||!Array.isArray(world.bonds))throw new TypeError('Invalid particle world');
    if(dt===0)return world.stats;
    const ps=world.particles,n=ps.length,cellSize=Math.max(.01,finite(options.cellSize,2)),captureRadius=Math.max(0,finite(options.captureRadius,.35));
    const softening=Math.max(.001,finite(options.softening,.2)),electrostatic=finite(options.electrostatic,.015),thermal= Math.max(0,finite(options.thermalJitter,.01));
    const restitution=clamp(finite(options.restitution,.65),0,1),breakStretch=Math.max(1,finite(options.breakStretch,3)),breakEnergy=Math.max(0,finite(options.breakEnergy,Infinity));
    const random=typeof options.random==='function'?options.random:Math.random;
    const cells=new Map(),forces=Array.from({length:n},()=>({x:0,y:0,z:0})),index=new Map(ps.map((p,i)=>[p.id,i]));
    let maxRadius=0;for(const p of ps)maxRadius=Math.max(maxRadius,p.radius);
    const span=Math.max(1,Math.ceil((maxRadius*2+captureRadius)/cellSize));
    const cellKey=(x,y,z)=>Math.floor(x/cellSize)+','+Math.floor(y/cellSize)+','+Math.floor(z/cellSize);
    for(let i=0;i<n;i++){const p=ps[i],key=cellKey(p.position.x,p.position.y,p.position.z);let bucket=cells.get(key);if(!bucket)cells.set(key,bucket=[]);bucket.push(i)}
    const candidates=[];
    for(let i=0;i<n;i++){
      const a=ps[i],gx=Math.floor(a.position.x/cellSize),gy=Math.floor(a.position.y/cellSize),gz=Math.floor(a.position.z/cellSize);
      for(let oz=-span;oz<=span;oz++)for(let oy=-span;oy<=span;oy++)for(let ox=-span;ox<=span;ox++){
        const bucket=cells.get((gx+ox)+','+(gy+oy)+','+(gz+oz));if(!bucket)continue;
        for(const j of bucket){if(j<=i)continue;const b=ps[j],dx=b.position.x-a.position.x,dy=b.position.y-a.position.y,dz=b.position.z-a.position.z;
          const distance=Math.hypot(dx,dy,dz)||1e-9,range=a.radius+b.radius+captureRadius+cellSize*.0;if(distance>Math.max(range,cellSize))continue;
          candidates.push([i,j,distance,dx/distance,dy/distance,dz/distance,dx,dy,dz]);
        }
      }
    }
    let collisions=0,bondsFormed=0,bondsBroken=0;
    for(const pair of candidates){
      const [i,j,distance,nx,ny,nz,dx,dy,dz]=pair,a=ps[i],b=ps[j],overlap=a.radius+b.radius-distance;
      if(overlap>0){
        collisions++;const invA=1/a.mass,invB=1/b.mass,total=invA+invB;
        const correctionA=overlap*invA/total,correctionB=overlap*invB/total;
        a.position.x-=nx*correctionA;a.position.y-=ny*correctionA;a.position.z-=nz*correctionA;
        b.position.x+=nx*correctionB;b.position.y+=ny*correctionB;b.position.z+=nz*correctionB;
        const relative=(b.velocity.x-a.velocity.x)*nx+(b.velocity.y-a.velocity.y)*ny+(b.velocity.z-a.velocity.z)*nz;
        if(relative<0){const impulse=-(1+restitution)*relative/total;
          a.velocity.x-=impulse*invA*nx;a.velocity.y-=impulse*invA*ny;a.velocity.z-=impulse*invA*nz;
          b.velocity.x+=impulse*invB*nx;b.velocity.y+=impulse*invB*ny;b.velocity.z+=impulse*invB*nz;
        }
      }
      const chargeForce=electrostatic*a.charge*b.charge/(distance*distance+softening*softening);
      forces[i].x-=chargeForce*nx;forces[i].y-=chargeForce*ny;forces[i].z-=chargeForce*nz;
      forces[j].x+=chargeForce*nx;forces[j].y+=chargeForce*ny;forces[j].z+=chargeForce*nz;
      if(options.enableBondFormation&&distance<=a.radius+b.radius+captureRadius&&canBond(a,b)&&random()<clamp(finite(options.bondProbability,.02)*Math.exp(-Math.max(0,a.thermalEnergy+b.thermalEnergy)*finite(options.temperatureSensitivity,.1)),0,1)){
        const bond=normalizeBond({a:a.id,b:b.id,type:options.bondType||'covalent',strength:finite(options.bondStrength,2),restLength:Math.max(a.radius+b.radius,finite(options.bondRestLength,a.radius+b.radius)),damping:finite(options.bondDamping,.15),formedAt:world.time});
        a.bonds.push(b.id);b.bonds.push(a.id);world.bonds.push(bond);bondsFormed++;
      }
    }
    const broken=[];
    for(const bond of world.bonds){
      const ia=index.get(bond.a),ib=index.get(bond.b);if(ia===undefined||ib===undefined){broken.push(bond.id);continue}
      const a=ps[ia],b=ps[ib],f=bondForce(a,b,bond);
      forces[ia].x+=f.x;forces[ia].y+=f.y;forces[ia].z+=f.z;
      forces[ib].x-=f.x;forces[ib].y-=f.y;forces[ib].z-=f.z;
      const distance=Math.hypot(b.position.x-a.position.x,b.position.y-a.position.y,b.position.z-a.position.z);
      if(distance>Math.max(bond.restLength*breakStretch,bond.restLength+1)||f.energy>breakEnergy)broken.push(bond.id);
    }
    for(const id of broken){if(breakBond(ps,world.bonds,id))bondsBroken++}
    applyResourceCloudForces(world,options.cellAnchors,forces,dt);
    let kineticEnergy=0,thermalEnergy=0;
    for(let i=0;i<n;i++){
      const p=ps[i],f=forces[i],invMass=1/p.mass;
      const jitter=(random()-.5)*2*thermal*Math.sqrt(dt);
      p.velocity.x+=(f.x*invMass)*dt+jitter;p.velocity.y+=(f.y*invMass)*dt+(random()-.5)*2*thermal*Math.sqrt(dt);p.velocity.z+=(f.z*invMass)*dt+(random()-.5)*2*thermal*Math.sqrt(dt);
      p.position.x+=p.velocity.x*dt;p.position.y+=p.velocity.y*dt;p.position.z+=p.velocity.z*dt;
      const bounds=options.bounds,boundRestitution=clamp(finite(options.boundRestitution,restitution),0,1);
      if(bounds){
        for(const [axis,size] of [['x',bounds.width],['y',bounds.height],['z',bounds.depth]]){
          if(!Number.isFinite(size)||size<=0)continue;
          const min=p.radius,max=size-p.radius;
          if(p.position[axis]<min){p.position[axis]=min;p.velocity[axis]=Math.abs(p.velocity[axis])*boundRestitution}
          else if(p.position[axis]>max){p.position[axis]=max;p.velocity[axis]=-Math.abs(p.velocity[axis])*boundRestitution}
        }
      }
      kineticEnergy+=.5*p.mass*(p.velocity.x**2+p.velocity.y**2+p.velocity.z**2);thermalEnergy+=p.thermalEnergy;
    }
    world.time+=dt;world.stats={steps:world.stats.steps+1,collisions,bondsFormed:world.stats.bondsFormed+bondsFormed,bondsBroken:world.stats.bondsBroken+bondsBroken,thermalEnergy,kineticEnergy,candidatePairs:candidates.length};
    return world.stats;
  }

  const CAPABILITIES={
    aggregation:{anyOf:[]},
    bonding:{allOf:['aggregation']},
    molecularFormation:{allOf:['bonding']},
    chemicalReactions:{allOf:['molecularFormation']},
    polymerisation:{allOf:['chemicalReactions']},
    autocatalyticNetworks:{allOf:['chemicalReactions','polymerisation']},
    metabolicActivity:{allOf:['chemicalReactions']},
    environmentalResponsiveness:{allOf:[]},
    lipidAssembly:{allOf:['bonding']},
    compartments:{allOf:['lipidAssembly']},
    protocells:{allOf:['compartments']},
    membraneStability:{allOf:['compartments']},
    materialExchange:{allOf:['compartments']},
    compartmentGrowth:{allOf:['metabolicActivity','materialExchange']},
    molecularReplication:{allOf:['polymerisation']},
    cellularReproduction:{allOf:['protocells','molecularReplication','compartmentGrowth']},
    fusion:{allOf:['protocells']},
    adhesion:{allOf:['protocells']},
    colonialOrganisation:{anyOf:[['adhesion'],['cellularReproduction','adhesion']]},
    differentiation:{allOf:['colonialOrganisation']},
    anatomicalDevelopment:{allOf:['differentiation']},
    multicellularEvolution:{allOf:['colonialOrganisation','differentiation','anatomicalDevelopment']}
  };
  function evaluateCapabilities(observed={},definitions=CAPABILITIES){
    const enabled=new Set(),unmet={};let changed=true,passes=0;
    while(changed&&passes++<=Object.keys(definitions).length){changed=false;
      for(const [name,rule] of Object.entries(definitions)){
        if(enabled.has(name)||observed[name]!==true)continue;
        const all=(rule.allOf||[]).every(dep=>enabled.has(dep));
        const any=!(rule.anyOf&&rule.anyOf.length)||rule.anyOf.some(path=>path.every(dep=>enabled.has(dep)));
        if(all&&any){enabled.add(name);changed=true}
      }
    }
    for(const [name,rule] of Object.entries(definitions))if(!enabled.has(name))unmet[name]={
      unobserved:observed[name]!==true,
      allOf:(rule.allOf||[]).filter(dep=>!enabled.has(dep)),
      anyOf:(rule.anyOf||[]).filter(path=>!path.every(dep=>enabled.has(dep))).map(path=>path.filter(dep=>!enabled.has(dep)))};
    return {enabled:Array.from(enabled).sort(),unmet,passes};
  }
  return {ELEMENTS,ELEMENT_VALENCE,BOND_TYPES,CAPABILITIES,createSeededRandom,snapshotParticleWorld,restoreParticleWorld,createParticleWorld,stepParticleWorld,normalizeParticle,normalizeBond,canBond,formBond,breakBond,bondForce,connectedComponents,
    normalizeMolecule,applyReaction,polymerise,autocatalyticClosure,assembleCompartment,normalizeResourceCloud,createResourceCloud,resourceInventory,collectResources,craftMolecule,rearrangeMolecules,transferResource,consumeResource,evaluateCapabilities};
});
