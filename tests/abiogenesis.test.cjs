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
