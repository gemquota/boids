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
  assert.deepEqual(molecule.composition,{C:1,H:1,O:1});
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
  assert.equal(p.stability,.8);assert.equal(p.replicationCapability,false);assert.equal(p.metabolismCapability,false);
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
