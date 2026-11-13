'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const bio=require('../abiogenesis.js');

function particle(id,element='C',valence=4,x=0){return bio.normalizeParticle({id,element,valence,position:{x,y:0,z:0},thermalEnergy:.2})}

test('particles preserve stable identity, physical state and elemental identity',()=>{
  const p=particle('a','C');assert.equal(p.id,'a');assert.equal(p.element,'C');assert.equal(p.valence,4);assert.equal(p.position.x,0);
  assert.throws(()=>bio.normalizeParticle({element:'C'}),/stable id/);
});

test('bond formation enforces valence and duplicate constraints',()=>{
  const a=particle('a'),b=particle('b'),c=particle('c');const particles=[a,b,c],bonds=[];
  assert.ok(bio.formBond(particles,bonds,'a','b',{bond:{strength:2,restLength:1}}));
  assert.equal(bio.formBond(particles,bonds,'a','b'),null);
  assert.ok(bio.formBond(particles,bonds,'a','c'));assert.equal(bio.formBond(particles,bonds,'a','c'),null);
  assert.equal(a.bonds.length,2);assert.equal(bonds.length,2);
});

test('bond constraints produce restoring forces and break cleanly',()=>{
  const a=particle('a'),b=particle('b');b.position.x=2;
  const bond=bio.normalizeBond({a:'a',b:'b',restLength:1,strength:3,damping:0});
  const force=bio.bondForce(a,b,bond);assert.ok(force.x<0);assert.ok(force.energy>0);
  const particles=[a,b],bonds=[bond];assert.ok(bio.breakBond(particles,bonds,bond.id));assert.deepEqual(a.bonds,[]);assert.deepEqual(b.bonds,[]);
});

test('bond topology resolves connected molecular components',()=>{
  const particles=[particle('a'),particle('b'),particle('c'),particle('d')];
  const groups=bio.connectedComponents(particles,[bio.normalizeBond({a:'a',b:'b'}),bio.normalizeBond({a:'b',b:'c'})]);
  assert.deepEqual(groups,[['a','b','c'],['d']]);
});

test('molecular composition is derived from constituent atoms and bonds',()=>{
  const molecule=bio.normalizeMolecule({id:'m1',atoms:[particle('c1','C'),particle('h1','H'),particle('o1','O')],bonds:[{a:'c1',b:'h1'},{a:'c1',b:'o1'}]});
  assert.deepEqual(molecule.composition,{C:1,H:1,O:1});assert.deepEqual(molecule.atoms[0].bonds,['h1','o1']);assert.deepEqual(molecule.atoms[1].bonds,['c1']);
  assert.throws(()=>bio.normalizeMolecule({atoms:[particle('x')],bonds:[{a:'x',b:'missing'}]}),/missing/);
});

test('reactions require stoichiometric inputs, catalysts and available energy',()=>{
  const pool=[{type:'A',amount:2},{type:'enzyme',amount:1}];
  const reaction={id:'r1',inputs:[{type:'A',amount:2}],outputs:[{type:'B',amount:1}],catalyst:{type:'enzyme',amount:1},energyDelta:3};
  assert.equal(bio.applyReaction(pool,reaction,{availableEnergy:2}).occurred,false);
  const result=bio.applyReaction(pool,reaction,{availableEnergy:3});assert.equal(result.occurred,true);
  assert.equal(pool.find(x=>x.type==='B').amount,1);assert.equal(pool.find(x=>x.type==='A').amount,0);
  assert.equal(bio.applyReaction(pool,reaction,{availableEnergy:9}).reason,'insufficient-reactants');
});

test('polymerisation creates explicit links between a sequence of monomers',()=>{
  const units=[particle('a'),particle('b'),particle('c')];
  const polymer=bio.polymerise(units,[],['a','c','b'],{id:'p1',strength:2});
  assert.deepEqual(polymer.sequence,['a','c','b']);assert.equal(polymer.bonds.length,2);assert.equal(polymer.bonds[0].strength,2);
});

test('autocatalytic closure distinguishes reachable products from a closed loop',()=>{
  const reactions=[{id:'seed',inputs:[{type:'A'}],outputs:[{type:'B'}]},{id:'loop',inputs:[{type:'B'}],outputs:[{type:'A'}]}];
  const result=bio.autocatalyticClosure(reactions,['A']);assert.deepEqual(result.reachableTypes,['A','B']);assert.equal(result.closed,true);
  assert.equal(bio.autocatalyticClosure(reactions.slice(0,1),['A']).closed,false);
});

test('lipid compartments are variable-capability structures, not automatically living cells',()=>{
  const p=bio.assembleCompartment(['l1','l2','l3'],['m1'],{stability:.8,permeability:.3});
  assert.equal(p.stability,.8);assert.deepEqual(p.capabilities,{metabolicActivity:false,molecularReplication:false,growth:false,environmentalResponsiveness:false});
});

test('capability graph allows partial and alternative emergence without granting life wholesale',()=>{
  const partial=bio.evaluateCapabilities({aggregation:true,bonding:true,lipidAssembly:true});
  assert.ok(partial.enabled.includes('aggregation'));assert.ok(partial.enabled.includes('bonding'));assert.ok(!partial.enabled.includes('molecularFormation'));assert.ok(!partial.enabled.includes('compartments'));
  assert.ok(!partial.enabled.includes('protocells'));assert.ok(!partial.enabled.includes('cellularReproduction'));
  const later=bio.evaluateCapabilities({aggregation:true,bonding:true,lipidAssembly:true,compartments:true,protocells:true,polymerisation:true,molecularReplication:true,adhesion:true,cellularReproduction:true,colonialOrganisation:true,differentiation:true,anatomicalDevelopment:true,multicellularEvolution:true});
  assert.ok(later.enabled.includes('colonialOrganisation'));assert.ok(later.enabled.includes('multicellularEvolution'));
  assert.ok(!later.enabled.includes('fusion'));
  const blocked=bio.evaluateCapabilities({aggregation:true,bonding:true,molecularReplication:true});assert.ok(!blocked.enabled.includes('molecularReplication'),'an observed capability must wait for its prerequisites');
});

test('spatial particle step resolves elastic collisions and conserves momentum',()=>{
  const world=bio.createParticleWorld([
    bio.normalizeParticle({id:'a',mass:1,radius:1,position:{x:-.9,y:0,z:0},velocity:{x:1,y:0,z:0}}),
    bio.normalizeParticle({id:'b',mass:1,radius:1,position:{x:.9,y:0,z:0},velocity:{x:-1,y:0,z:0}})
  ]);
  const stats=bio.stepParticleWorld(world,.01,{cellSize:3,thermalJitter:0,restitution:1,electrostatic:0});
  assert.equal(stats.collisions,1);
  assert.ok(world.particles[0].velocity.x<0);assert.ok(world.particles[1].velocity.x>0);
  assert.ok(Math.abs(world.particles[0].velocity.x+world.particles[1].velocity.x)<1e-8);
});

test('spatial hash discovers nearby particles without considering distant cells',()=>{
  const particles=[];for(let i=0;i<40;i++)particles.push(bio.normalizeParticle({id:String(i),position:{x:i*20,y:0,z:0},radius:.2}));
  particles[0].position.x=0;particles[1].position.x=.3;
  const world=bio.createParticleWorld(particles);
  const stats=bio.stepParticleWorld(world,.001,{cellSize:2,thermalJitter:0,electrostatic:0});
  assert.equal(stats.candidatePairs,1);
});

test('bond kinetics form a persistent spring and break when overstretched',()=>{
  const world=bio.createParticleWorld([
    bio.normalizeParticle({id:'a',valence:1,radius:.5,position:{x:0,y:0,z:0}}),
    bio.normalizeParticle({id:'b',valence:1,radius:.5,position:{x:.9,y:0,z:0}})
  ]);
  const formed=bio.stepParticleWorld(world,.001,{cellSize:2,thermalJitter:0,electrostatic:0,enableBondFormation:true,bondProbability:1,bondStrength:4});
  assert.equal(formed.bondsFormed,1);assert.equal(world.bonds.length,1);
  world.particles[1].position.x=5;
  const broken=bio.stepParticleWorld(world,.001,{cellSize:2,thermalJitter:0,electrostatic:0,breakStretch:2});
  assert.equal(broken.bondsBroken,1);assert.equal(world.bonds.length,0);
});

test('particle-world snapshots preserve identities and deterministic continuation',()=>{
  const make=()=>bio.createParticleWorld([
    bio.normalizeParticle({id:'x',position:{x:0,y:0,z:0},velocity:{x:.1,y:0,z:0}}),
    bio.normalizeParticle({id:'y',position:{x:1,y:0,z:0},velocity:{x:-.1,y:0,z:0}})
  ],{bonds:[{a:'x',b:'y',restLength:1,strength:2}]});
  const a=make(),b=make(),rngA=()=>.5,rngB=()=>.5;
  bio.stepParticleWorld(a,.01,{thermalJitter:.02,random:rngA});
  bio.stepParticleWorld(b,.01,{thermalJitter:.02,random:rngB});
  const restored=bio.restoreParticleWorld(bio.snapshotParticleWorld(a));
  assert.deepEqual(restored.particles,a.particles);assert.deepEqual(restored.bonds,a.bonds);assert.deepEqual(restored.particles[0].bonds,['y']);
  bio.stepParticleWorld(a,.01,{thermalJitter:.02,random:rngA});
  bio.stepParticleWorld(b,.01,{thermalJitter:.02,random:rngB});
  assert.deepEqual(b.particles,a.particles);assert.deepEqual(b.bonds,a.bonds);
});

test('spatial hash searches enough cells when particles have large radii',()=>{
  const world=bio.createParticleWorld([
    bio.normalizeParticle({id:'wide-a',radius:3,position:{x:0,y:0,z:0}}),
    bio.normalizeParticle({id:'wide-b',radius:3,position:{x:5,y:0,z:0}})
  ]);
  const stats=bio.stepParticleWorld(world,.001,{cellSize:1,thermalJitter:0,electrostatic:0});
  assert.equal(stats.collisions,1);
});

test('seeded random streams are reproducible and expose restorable state',()=>{
  const a=bio.createSeededRandom(987),b=bio.createSeededRandom(987);
  assert.deepEqual(Array.from({length:8},()=>a()),Array.from({length:8},()=>b()));
  const state=a.state,restored=bio.createSeededRandom(1);restored.setState(state);
  assert.equal(restored(),a());
});

test('bounded particle worlds reflect particles without losing them outside the domain',()=>{
  const world=bio.createParticleWorld([
    bio.normalizeParticle({id:'wall',radius:1,position:{x:9.9,y:5,z:0},velocity:{x:10,y:0,z:0}})
  ]);
  bio.stepParticleWorld(world,.05,{thermalJitter:0,electrostatic:0,bounds:{width:10,height:10},restitution:1});
  const p=world.particles[0];assert.ok(p.position.x<=9);assert.ok(p.position.x>=1);assert.ok(p.velocity.x<0);
});

test('collision positional correction respects inverse mass and preserves centre of mass',()=>{
  const world=bio.createParticleWorld([
    bio.normalizeParticle({id:'heavy',mass:4,radius:1,position:{x:0,y:0,z:0}}),
    bio.normalizeParticle({id:'light',mass:1,radius:1,position:{x:1,y:0,z:0}})
  ]);
  bio.stepParticleWorld(world,.001,{thermalJitter:0,electrostatic:0});
  const [a,b]=world.particles;
  assert.ok(Math.abs((4*a.position.x+b.position.x)-1)<1e-8);
  assert.ok(Math.abs((b.position.x-a.position.x)-2)<1e-8);
});

test('reaction stoichiometry aggregates repeated reactants before consuming anything',()=>{
  const pool=[{type:'A',amount:3},{type:'A',amount:.5}];
  const reaction={inputs:[{type:'A',amount:2},{type:'A',amount:2}],outputs:[{type:'B',amount:1}]};
  assert.equal(bio.applyReaction(pool,reaction).reason,'insufficient-reactants');
  assert.equal(pool.reduce((n,p)=>n+p.amount,0),3.5);
  pool[1].amount=.5;pool.push({type:'A',amount:1});
  const ok=bio.applyReaction(pool,reaction);assert.equal(ok.occurred,true);
  assert.equal(pool.filter(p=>p.type==='A').reduce((n,p)=>n+p.amount,0),.5);
});

test('metabolism, molecular replication, membrane stability and environmental response remain independent evidence',()=>{
  const state=bio.evaluateCapabilities({aggregation:true,bonding:true,molecularFormation:true,chemicalReactions:true,metabolicActivity:true,
    lipidAssembly:true,compartments:true,protocells:true,membraneStability:true,materialExchange:true,environmentalResponsiveness:true});
  assert.ok(state.enabled.includes('metabolicActivity'));
  assert.ok(state.enabled.includes('membraneStability'));
  assert.ok(state.enabled.includes('environmentalResponsiveness'));
  assert.ok(!state.enabled.includes('molecularReplication'));
  assert.ok(!state.enabled.includes('compartmentGrowth'));
  assert.ok(!state.enabled.includes('cellularReproduction'));
  const replicated=bio.evaluateCapabilities({aggregation:true,bonding:true,molecularFormation:true,chemicalReactions:true,polymerisation:true,molecularReplication:true});
  assert.ok(replicated.enabled.includes('molecularReplication'));
  assert.ok(!replicated.enabled.includes('metabolicActivity'));
});

test('elemental valence defaults reflect the element identity',()=>{
  assert.equal(bio.normalizeParticle({id:'h',element:'H'}).valence,1);
  assert.equal(bio.normalizeParticle({id:'c',element:'C'}).valence,4);
  assert.equal(bio.normalizeParticle({id:'n',element:'N'}).valence,3);
  assert.equal(bio.normalizeParticle({id:'o',element:'O'}).valence,2);
  assert.equal(bio.normalizeParticle({id:'s',element:'S'}).valence,2);
});

test('molecule construction rejects duplicate bonds and over-valent atom topology',()=>{
  const a=bio.normalizeParticle({id:'a',element:'H'}),b=bio.normalizeParticle({id:'b',element:'H'});
  assert.throws(()=>bio.normalizeMolecule({atoms:[a,b],bonds:[{a:'a',b:'b'},{a:'b',b:'a'}]}),/Duplicate/);
  const c=bio.normalizeParticle({id:'c',element:'C'}),h1=bio.normalizeParticle({id:'h1',element:'H'}),h2=bio.normalizeParticle({id:'h2',element:'H'});
  assert.throws(()=>bio.normalizeMolecule({atoms:[c,h1,h2],bonds:[{a:'c',b:'h1'},{a:'c',b:'h2'},{a:'h1',b:'h2'}]}),/valence/);
});


test('resource clouds remain loosely attached to a moving cell anchor',()=>{
  const particles=[
    {id:'cargo-a',element:'C',mass:1,radius:.2,position:{x:0,y:0},velocity:{x:0,y:0}},
    {id:'cargo-b',element:'O',mass:2,radius:.2,position:{x:2,y:0},velocity:{x:0,y:0}},
    {id:'free',element:'H',position:{x:-10,y:0},velocity:{x:0,y:0}}
  ];
  const world=bio.createParticleWorld(particles);
  const cloud=bio.createResourceCloud(world,'cell-1',['cargo-a','cargo-b'],{radius:8,followStrength:2,damping:.2});
  assert.equal(cloud.particleIds.length,2);
  for(let i=0;i<30;i++)bio.stepParticleWorld(world,1/60,{thermalJitter:0,cellAnchors:{'cell-1':{position:{x:20,y:0},velocity:{x:0,y:0}}}});
  const a=world.particles.find(p=>p.id==='cargo-a'),free=world.particles.find(p=>p.id==='free');
  assert.ok(a.position.x>0,'owned cargo should follow the cell');
  assert.equal(free.position.x,-10,'unowned particles should not be pulled along');
  assert.ok(Math.hypot(a.position.x-20,a.position.y)<20);
});
test('resource cloud transfer and consumption preserve explicit material ownership',()=>{
  const world=bio.createParticleWorld([{id:'a',element:'C'},{id:'b',element:'O'}]);
  bio.createResourceCloud(world,'cell-a',['a']);
  bio.createResourceCloud(world,'cell-b',['b']);
  assert.equal(bio.transferResource(world,'cloud-cell-a','cloud-cell-b','a'),true);
  assert.deepEqual(world.resourceClouds[0].particleIds,[]);
  assert.deepEqual(world.resourceClouds[1].particleIds,['b','a']);
  const consumed=bio.consumeResource(world,'cloud-cell-b','a');
  assert.equal(consumed.id,'a');
  assert.equal(world.particles.some(p=>p.id==='a'),false);
  assert.deepEqual(world.resourceClouds[1].particleIds,['b']);
});
test('resource cloud membership survives particle-world snapshots',()=>{
  const world=bio.createParticleWorld([{id:'cargo',element:'P'}]);
  bio.createResourceCloud(world,'cell-7',['cargo']);
  const restored=bio.restoreParticleWorld(bio.snapshotParticleWorld(world));
  assert.deepEqual(restored.resourceClouds[0].particleIds,['cargo']);
  assert.equal(restored.resourceClouds[0].ownerId,'cell-7');
});


test('cells selectively collect nearby unowned resources and inventory their stockpile',()=>{
  const world=bio.createParticleWorld([
    {id:'near-C',element:'C',position:{x:1,y:0}},
    {id:'near-O',element:'O',position:{x:2,y:0}},
    {id:'far-N',element:'N',position:{x:30,y:0}},
    {id:'owned-H',element:'H',position:{x:0,y:0}}
  ]);
  bio.createResourceCloud(world,'cell-a',['owned-H'],{energy:4,energyCapacity:10});
  bio.createResourceCloud(world,'cell-b',[]);
  const collected=bio.collectResources(world,'cloud-cell-a',{position:{x:0,y:0}},{radius:5,elements:['C','O'],maxCount:1});
  assert.deepEqual(collected,['near-C']);
  const inventory=bio.resourceInventory(world,'cloud-cell-a');
  assert.equal(inventory.particleCount,2);
  assert.equal(inventory.elements.H,1);
  assert.equal(inventory.elements.C,1);
  assert.equal(inventory.energy,4);
  assert.deepEqual(bio.collectResources(world,'cloud-cell-b',{position:{x:0,y:0}},{radius:5}),['near-O']);
});
test('molecular crafting preserves atom identity and records explicit bonds',()=>{
  const world=bio.createParticleWorld([
    {id:'carbon',element:'C',position:{x:0,y:0}},
    {id:'hydrogen',element:'H',position:{x:1,y:0}}
  ]);
  bio.createResourceCloud(world,'cell-1',['carbon','hydrogen']);
  const molecule=bio.craftMolecule(world,'cloud-cell-1',['carbon','hydrogen'],[{a:'carbon',b:'hydrogen',type:'covalent',strength:3}],{id:'methane-fragment',type:'CH'});
  assert.equal(molecule.type,'CH');
  assert.deepEqual(molecule.atomIds,['carbon','hydrogen']);
  assert.equal(world.bonds.length,1);
  assert.equal(bio.resourceInventory(world,'cloud-cell-1').moleculeCount,1);
});
test('molecular reactions rearrange bonds without creating or losing atoms',()=>{
  const world=bio.createParticleWorld([
    {id:'c',element:'C'},{id:'h1',element:'H'},{id:'h2',element:'H'}
  ]);
  const cloud=bio.createResourceCloud(world,'cell-1',['c','h1','h2'],{energy:3});
  bio.craftMolecule(world,cloud.id,['c','h1'],[{a:'c',b:'h1'}],{id:'m1',type:'CH',energy:2});
  bio.craftMolecule(world,cloud.id,['h2'],[],{id:'m2',type:'H',energy:1});
  const result=bio.rearrangeMolecules(world,cloud.id,['m1','m2'],[
    {id:'product',type:'CH2',atomIds:['c','h1','h2'],bonds:[{a:'c',b:'h1'},{a:'c',b:'h2'}]}
  ],{energyCost:2});
  assert.equal(result.occurred,true);
  assert.equal(cloud.energy,1);
  assert.deepEqual(result.atomIds.sort(),['c','h1','h2']);
  assert.equal(world.particles.length,3);
  assert.equal(world.molecules.length,1);
  assert.equal(world.molecules[0].type,'CH2');
  assert.equal(world.bonds.length,2);
});
test('molecular reactions reject non-conserving products before mutating state',()=>{
  const world=bio.createParticleWorld([{id:'a',element:'C'},{id:'b',element:'H'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['a','b'],{energy:2});
  bio.craftMolecule(world,cloud.id,['a','b'],[{a:'a',b:'b'}],{id:'input',energy:1});
  assert.throws(()=>bio.rearrangeMolecules(world,cloud.id,['input'],[{type:'broken',atomIds:['a']}]),/conserve/i);
  assert.equal(world.molecules.length,1);
  assert.equal(world.bonds.length,1);
  assert.equal(cloud.energy,2);
});
test('consuming a constituent safely disassembles its molecular record',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'},{id:'h',element:'H'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['c','h']);
  bio.craftMolecule(world,cloud.id,['c','h'],[{a:'c',b:'h'}],{id:'CH'});
  assert.ok(bio.consumeResource(world,cloud.id,'h'));
  assert.equal(world.molecules.length,0);
  assert.equal(world.bonds.length,0);
  assert.deepEqual(world.particles.map(p=>p.id),['c']);
});
test('resource inventories and molecular records survive deterministic snapshots',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'},{id:'h',element:'H'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['c','h'],{energy:7,energyCapacity:12});
  bio.craftMolecule(world,cloud.id,['c','h'],[{a:'c',b:'h'}],{id:'CH',energy:2});
  const restored=bio.restoreParticleWorld(bio.snapshotParticleWorld(world));
  const inventory=bio.resourceInventory(restored,cloud.id);
  assert.equal(inventory.moleculeCount,1);
  assert.equal(inventory.energy,7);
  assert.equal(inventory.energyCapacity,12);
});
test('resource ownership is exclusive across cell clouds',()=>{
  assert.throws(()=>bio.createParticleWorld([{id:'x',element:'O'}],{resourceClouds:[
    {ownerId:'a',particleIds:['x']},{ownerId:'b',particleIds:['x']}
  ]}),/multiple resource clouds/i);
});


test('collection and transfer move bonded molecules as intact resource units',()=>{
  const world=bio.createParticleWorld([
    {id:'c',element:'C',position:{x:1,y:0}},
    {id:'h',element:'H',position:{x:1.5,y:0}},
    {id:'free',element:'O',position:{x:2,y:0}}
  ]);
  bio.createResourceCloud(world,'cell-a',['c','h']);
  bio.createResourceCloud(world,'cell-b',[]);
  bio.craftMolecule(world,'cloud-cell-a',['c','h'],[{a:'c',b:'h'}],{id:'CH'});
  const collected=bio.collectResources(world,'cloud-cell-b',{position:{x:0,y:0}},{radius:4});
  assert.deepEqual(collected,['free']);
  assert.equal(bio.transferResource(world,'cloud-cell-a','cloud-cell-b','c'),true);
  assert.deepEqual(world.resourceClouds[0].particleIds,[]);
  assert.deepEqual(world.resourceClouds[1].particleIds.sort(),['c','free','h']);
  assert.equal(bio.resourceInventory(world,'cloud-cell-b').moleculeCount,1);
});
test('failed molecule crafting leaves existing particles and bonds unchanged',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'},{id:'h1',element:'H'},{id:'h2',element:'H'},{id:'h3',element:'H'},{id:'h4',element:'H'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['c','h1','h2','h3','h4']);
  bio.craftMolecule(world,cloud.id,['c','h1','h2','h3'],[{a:'c',b:'h1'},{a:'c',b:'h2'},{a:'c',b:'h3'}],{id:'CH3'});
  const before=world.bonds.length;
  assert.throws(()=>bio.craftMolecule(world,cloud.id,['c','h4'],[{a:'c',b:'h4'}],{id:'bad'}),/already belongs/i);
  assert.equal(world.bonds.length,before);
  assert.equal(world.molecules.length,1);
});


test('environmental energy harvesting conserves source energy and accounts for inefficiency',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['c'],{energy:0,energyCapacity:5});
  const source=bio.createEnergySource(world,{id:'sunlight',type:'light',energy:20,efficiency:.5});
  const result=bio.harvestEnergy(world,cloud.id,source.id,3);
  assert.equal(result.stored,3);
  assert.equal(result.consumed,6);
  assert.equal(result.dissipated,3);
  assert.equal(source.energy,14);
  assert.equal(cloud.energy,3);
  assert.equal(world.stats.energyDissipated,3);
});
test('metabolism converts molecular stored energy into cell energy and heat without creating energy',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'},{id:'h',element:'H'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['c','h'],{energy:0,energyCapacity:5});
  bio.craftMolecule(world,cloud.id,['c','h'],[{a:'c',b:'h'}],{id:'fuel',type:'fuel',energy:5});
  const result=bio.metabolizeMolecules(world,cloud.id,['fuel'],[
    {id:'spent',type:'spent',atomIds:['c','h'],bonds:[{a:'c',b:'h'}],energy:1}
  ],{captureEfficiency:.5});
  assert.equal(result.energyReleased,4);
  assert.equal(result.energyHarvested,2);
  assert.equal(result.heatDissipated,2);
  assert.equal(cloud.energy,2);
  assert.equal(world.molecules[0].energy,1);
  assert.equal(world.stats.energyHarvested,2);
  assert.equal(world.stats.energyDissipated,2);
});
test('energy sources and metabolic state survive particle-world snapshots',()=>{
  const world=bio.createParticleWorld([{id:'a',element:'N'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['a'],{energy:2,energyCapacity:9});
  bio.createEnergySource(world,{id:'gradient',type:'chemical-gradient',energy:7,efficiency:.8});
  bio.harvestEnergy(world,cloud.id,'gradient',1);
  const restored=bio.restoreParticleWorld(bio.snapshotParticleWorld(world));
  assert.equal(restored.energySources[0].energy,5.75);
  assert.equal(restored.resourceClouds[0].energy,3);
});


test('cell-to-cell exchange is gated by contact, permeability, selectivity and receiver energy',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'},{id:'o',element:'O'}]);
  const a=bio.createResourceCloud(world,'cell-a',['c']);
  const b=bio.createResourceCloud(world,'cell-b',['o'],{energy:2,metadata:{permeability:.4}});
  const anchors={'cell-a':{position:{x:0,y:0}},'cell-b':{position:{x:5,y:0}}};
  assert.equal(bio.exchangeResource(world,a.id,b.id,'c',anchors,{contactRadius:10,permeability:1,random:()=>0,allowedElements:['H']}).reason,'selective-transport-rejected');
  const result=bio.exchangeResource(world,a.id,b.id,'c',anchors,{contactRadius:10,permeability:1,random:()=>0,energyCost:1});
  assert.equal(result.transferred,true);
  assert.deepEqual(a.particleIds,[]);
  assert.deepEqual(b.particleIds.sort(),['c','o']);
  assert.equal(b.energy,1);
});
test('resource diffusion moves materials down composition gradients between nearby cells',()=>{
  const world=bio.createParticleWorld([
    {id:'c1',element:'C'},{id:'c2',element:'C'},{id:'c3',element:'C'},{id:'c4',element:'C'}
  ]);
  const a=bio.createResourceCloud(world,'cell-a',['c1','c2','c3']);
  const b=bio.createResourceCloud(world,'cell-b',['c4']);
  const transfers=bio.diffuseResources(world,{'cell-a':{position:{x:0,y:0}},'cell-b':{position:{x:8,y:0}}},{contactRadius:20,permeability:1,random:()=>0,maxTransfers:4});
  assert.equal(transfers.length,1);
  assert.equal(a.particleIds.length,2);
  assert.equal(b.particleIds.length,2);
});
test('exchange transfers bonded compounds intact and refuses distant cells',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'},{id:'h',element:'H'}]);
  const a=bio.createResourceCloud(world,'cell-a',['c','h']),b=bio.createResourceCloud(world,'cell-b',[]);
  bio.craftMolecule(world,a.id,['c','h'],[{a:'c',b:'h'}],{id:'CH'});
  const far={'cell-a':{position:{x:0,y:0}},'cell-b':{position:{x:100,y:0}}};
  assert.equal(bio.exchangeResource(world,a.id,b.id,'c',far,{contactRadius:10}).reason,'cells-out-of-range');
  const near={'cell-a':{position:{x:0,y:0}},'cell-b':{position:{x:4,y:0}}};
  const result=bio.exchangeResource(world,a.id,b.id,'h',near,{contactRadius:10,random:()=>0});
  assert.equal(result.transferred,true);
  assert.deepEqual(b.particleIds.sort(),['c','h']);
  assert.equal(bio.resourceInventory(world,b.id).moleculeCount,1);
});


test('compartment assembly recruits amphiphilic lipids and internal contents from the cloud',()=>{
  const particles=[];for(let i=0;i<6;i++){particles.push({id:'c'+i,element:'C'},{id:'h'+i,element:'H'})}
  particles.push({id:'o1',element:'O'},{id:'o2',element:'O'});
  const world=bio.createParticleWorld(particles),cloud=bio.createResourceCloud(world,'cell-1',particles.map(p=>p.id),{energy:5});
  for(let i=0;i<6;i++)bio.craftMolecule(world,cloud.id,['c'+i,'h'+i],[{a:'c'+i,b:'h'+i}],{id:'lipid-'+i,type:'lipid',properties:{amphiphilic:true}});
  bio.craftMolecule(world,cloud.id,['o1'],[],{id:'nutrient-1',type:'nutrient'});
  bio.craftMolecule(world,cloud.id,['o2'],[],{id:'nutrient-2',type:'nutrient'});
  const compartment=bio.createCompartment(world,cloud.id,{id:'proto-1',membraneMoleculeIds:['lipid-0','lipid-1','lipid-2'],contents:['nutrient-1','nutrient-2']});
  assert.equal(compartment.membraneMoleculeIds.length,3);
  assert.equal(compartment.contents.length,2);
  assert.equal(cloud.particleIds.length,6);
  assert.ok(compartment.radius>0);
});
test('compartment growth consumes carried lipids and stored energy',()=>{
  const particles=[];for(let i=0;i<4;i++)particles.push({id:'c'+i,element:'C'},{id:'h'+i,element:'H'});particles.push({id:'o1',element:'O'},{id:'o2',element:'O'});
  const world=bio.createParticleWorld(particles),cloud=bio.createResourceCloud(world,'cell-1',particles.map(p=>p.id),{energy:4});
  for(let i=0;i<4;i++)bio.craftMolecule(world,cloud.id,['c'+i,'h'+i],[{a:'c'+i,b:'h'+i}],{id:'lipid-'+i,type:'lipid',properties:{amphiphilic:true}});
  bio.craftMolecule(world,cloud.id,['o1'],[],{id:'n1',type:'nutrient'});bio.craftMolecule(world,cloud.id,['o2'],[],{id:'n2',type:'nutrient'});
  const compartment=bio.createCompartment(world,cloud.id,{id:'proto',membraneMoleculeIds:['lipid-0','lipid-1','lipid-2'],contents:['n1','n2']});
  const before=compartment.membraneArea;
  const grown=bio.growCompartment(world,cloud.id,compartment.id,['lipid-3'],{energyCost:1});
  assert.equal(grown.grown,true);assert.ok(compartment.membraneArea>before);
  assert.equal(cloud.energy,3);assert.ok(!cloud.particleIds.includes('c3'));
});
test('compartment division partitions membrane, contents and mobile resources into viable daughters',()=>{
  const particles=[];for(let i=0;i<6;i++)particles.push({id:'c'+i,element:'C'},{id:'h'+i,element:'H'});
  particles.push({id:'o1',element:'O'},{id:'o2',element:'O'},{id:'free',element:'P'});
  const world=bio.createParticleWorld(particles),cloud=bio.createResourceCloud(world,'cell-1',particles.map(p=>p.id),{energy:6});
  for(let i=0;i<6;i++)bio.craftMolecule(world,cloud.id,['c'+i,'h'+i],[{a:'c'+i,b:'h'+i}],{id:'lipid-'+i,type:'lipid',properties:{amphiphilic:true}});
  bio.craftMolecule(world,cloud.id,['o1'],[],{id:'n1',type:'nutrient'});bio.craftMolecule(world,cloud.id,['o2'],[],{id:'n2',type:'nutrient'});
  const parent=bio.createCompartment(world,cloud.id,{id:'proto',membraneMoleculeIds:['lipid-0','lipid-1','lipid-2','lipid-3','lipid-4','lipid-5'],contents:['n1','n2']});
  cloud.particleIds.push('free');
  const result=bio.divideCompartment(world,cloud.id,parent.id,{energyCost:2,minLipidsPerDaughter:3,minContentsPerDaughter:1});
  assert.equal(result.occurred,true);assert.equal(result.children.length,2);assert.equal(parent.state,'divided');
  assert.equal(result.children[0].membraneMoleculeIds.length,3);assert.equal(result.children[1].contents.length,1);
  assert.equal(world.resourceClouds.length,3);
  assert.deepEqual(world.resourceClouds[1].particleIds.concat(world.resourceClouds[2].particleIds),['free']);
  assert.equal(world.resourceClouds[1].energy+world.resourceClouds[2].energy,4);
});
test('failed compartment division records a failure without fabricating offspring',()=>{
  const world=bio.createParticleWorld([{id:'a',element:'C'},{id:'b',element:'C'},{id:'c',element:'C'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['a','b','c'],{energy:5});
  const compartment={id:'small',ownerId:'cell-1',membraneMoleculeIds:['m1','m2','m3'],contents:['n1','n2'],state:'active',generation:0,membraneArea:3,capacity:2,permeability:.3,stability:.5,integrity:.8};
  world.compartments.push(compartment);
  const result=bio.divideCompartment(world,cloud.id,compartment.id,{minLipidsPerDaughter:3});
  assert.equal(result.occurred,false);assert.equal(result.reason,'insufficient-membrane');
  assert.equal(world.compartments.length,1);assert.equal(world.stats.divisionFailures,1);
});


test('reaction energy-budget rejection occurs before bonds, molecules or reserves mutate',()=>{
  const world=bio.createParticleWorld([{id:'c',element:'C'},{id:'h',element:'H'}]);
  const cloud=bio.createResourceCloud(world,'cell-1',['c','h'],{energy:4});
  bio.craftMolecule(world,cloud.id,['c','h'],[{a:'c',b:'h'}],{id:'fuel',energy:1});
  assert.throws(()=>bio.rearrangeMolecules(world,cloud.id,['fuel'],[
    {id:'impossible',type:'product',atomIds:['c','h'],bonds:[{a:'c',b:'h'}],energy:5}
  ],{energyCost:2}),/cannot create molecular energy/i);
  assert.equal(world.molecules[0].id,'fuel');
  assert.equal(world.bonds.length,1);
  assert.equal(cloud.energy,4);
});
