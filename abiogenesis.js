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
  const BOND_TYPES=new Set(['covalent','ionic','hydrogen','van-der-waals','adhesion','membrane']);
  function normalizeParticle(input){
    if(!input||input.id===undefined)throw new TypeError('Particle requires a stable id');
    const element=ELEMENTS.has(input.element)?input.element:'OTHER';
    return {id:String(input.id),element,mass:Math.max(.0001,finite(input.mass,1)),radius:Math.max(.0001,finite(input.radius,.5)),
      charge:clamp(finite(input.charge),-8,8),valence:Math.max(0,Math.min(8,Math.floor(finite(input.valence,1)))),
      bonds:Array.isArray(input.bonds)?input.bonds.map(String):[],position:{x:finite(input.position&&input.position.x),y:finite(input.position&&input.position.y),z:finite(input.position&&input.position.z)},
      velocity:{x:finite(input.velocity&&input.velocity.x),y:finite(input.velocity&&input.velocity.y),z:finite(input.velocity&&input.velocity.z)},
      thermalEnergy:Math.max(0,finite(input.thermalEnergy,.1)),metadata:input.metadata&&typeof input.metadata==='object'?clone(input.metadata):{}};
  }
  function normalizeBond(input){
    if(!input||input.a===undefined||input.b===undefined||String(input.a)===String(input.b))throw new TypeError('Bond requires two distinct endpoints');
    const type=BOND_TYPES.has(input.type)?input.type:'covalent';
    return {id:String(input.id===undefined?[input.a,input.b].sort().join('~'):input.id),a:String(input.a),b:String(input.b),type,
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
    const atoms=input.atoms.map(normalizeParticle),ids=new Set(atoms.map(a=>a.id));
    if(ids.size!==atoms.length)throw new Error('Molecule atom IDs must be unique');
    const bonds=input.bonds.map(normalizeBond);
    for(const b of bonds)if(!ids.has(b.a)||!ids.has(b.b))throw new Error('Molecular bond endpoint is missing');
    return {id:String(input.id===undefined?'molecule':input.id),atoms,bonds,composition:atoms.reduce((o,a)=>(o[a.element]=(o[a.element]||0)+1,o),{}),
      energy:Math.max(0,finite(input.energy)),properties:input.properties&&typeof input.properties==='object'?clone(input.properties):{}};
  }
  function applyReaction(pool,reaction,options={}){
    if(!reaction||!Array.isArray(reaction.inputs)||!Array.isArray(reaction.outputs))throw new TypeError('Reaction requires input and output stoichiometry');
    const available=new Map();for(const item of pool)available.set(item.type,(available.get(item.type)||0)+Math.max(0,finite(item.amount)));
    for(const input of reaction.inputs)if((available.get(input.type)||0)<input.amount)return {occurred:false,reason:'insufficient-reactants'};
    if(reaction.catalyst&&(!pool.some(p=>p.type===reaction.catalyst.type&&p.amount>=finite(reaction.catalyst.amount,1))))return {occurred:false,reason:'missing-catalyst'};
    const energy=finite(reaction.energyDelta);
    if(energy>finite(options.availableEnergy,Infinity))return {occurred:false,reason:'insufficient-energy'};
    for(const input of reaction.inputs){const item=pool.find(p=>p.type===input.type);let left=input.amount;for(const p of pool){if(p.type!==input.type||left<=0)continue;const used=Math.min(p.amount,left);p.amount-=used;left-=used}}
    for(const output of reaction.outputs){let item=pool.find(p=>p.type===output.type);if(!item){item={type:output.type,amount:0};pool.push(item)}item.amount+=output.amount}
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
    return {reachableTypes:Array.from(reachable).sort(),productiveReactionIds:productive.map(r=>String(r.id)),closed:productive.length>0&&productive.some(r=>(r.outputs||[]).some(o=>(r.inputs||[]).some(i=>i.type===o.type)))};
  }
  function assembleCompartment(lipids,contents,options={}){
    if(!Array.isArray(lipids)||lipids.length<3)throw new RangeError('A compartment requires at least three lipid components');
    const permeability=clamp(finite(options.permeability,.5),0,1),stability=clamp(finite(options.stability,.5),0,1);
    return {id:String(options.id||'compartment'),lipidIds:lipids.map(x=>String(x.id===undefined?x:x.id)),contents:contents.map(x=>String(x.id===undefined?x:x.id)),
      permeability,stability,integrity:clamp(finite(options.integrity,stability),0,1),growth:0,replicationCapability:false,
      metabolismCapability:false,createdAt:finite(options.createdAt),metadata:options.metadata&&typeof options.metadata==='object'?clone(options.metadata):{}};
  }

  const CAPABILITIES={
    aggregation:{anyOf:[]},
    bonding:{allOf:['aggregation']},
    molecularFormation:{allOf:['bonding']},
    chemicalReactions:{allOf:['molecularFormation']},
    polymerisation:{allOf:['chemicalReactions']},
    autocatalyticNetworks:{allOf:['chemicalReactions','polymerisation']},
    lipidAssembly:{allOf:['bonding']},
    compartments:{allOf:['lipidAssembly']},
    protocells:{allOf:['compartments']},
    molecularReplication:{allOf:['polymerisation']},
    cellularReproduction:{allOf:['protocells','molecularReplication']},
    fusion:{allOf:['protocells']},
    adhesion:{allOf:['protocells']},
    colonialOrganisation:{anyOf:[['adhesion'],['cellularReproduction','adhesion']]},
    differentiation:{allOf:['colonialOrganisation']},
    anatomicalDevelopment:{allOf:['differentiation']},
    multicellularEvolution:{allOf:['colonialOrganisation','differentiation','anatomicalDevelopment']}
  };
  function evaluateCapabilities(observed={},definitions=CAPABILITIES){
    const enabled=new Set(Object.keys(observed).filter(k=>observed[k]===true)),unmet={};let changed=true,passes=0;
    while(changed&&passes++<=Object.keys(definitions).length){changed=false;
      for(const [name,rule] of Object.entries(definitions)){if(enabled.has(name))continue;
        const all=(rule.allOf||[]).every(dep=>enabled.has(dep));
        const any=!(rule.anyOf&&rule.anyOf.length)||rule.anyOf.some(path=>path.every(dep=>enabled.has(dep)));
        if(all&&any){enabled.add(name);changed=true}
      }
    }
    for(const [name,rule] of Object.entries(definitions))if(!enabled.has(name))unmet[name]={
      allOf:(rule.allOf||[]).filter(dep=>!enabled.has(dep)),
      anyOf:(rule.anyOf||[]).filter(path=>!path.every(dep=>enabled.has(dep))).map(path=>path.filter(dep=>!enabled.has(dep)))};
    return {enabled:Array.from(enabled).sort(),unmet,passes};
  }
  return {ELEMENTS,BOND_TYPES,CAPABILITIES,normalizeParticle,normalizeBond,canBond,formBond,breakBond,bondForce,connectedComponents,
    normalizeMolecule,applyReaction,polymerise,autocatalyticClosure,assembleCompartment,evaluateCapabilities};
});
