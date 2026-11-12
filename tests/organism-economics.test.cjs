'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const eco=require('../organism-economics.js');

test('energy accounting separates basal, tissue, brain, vision, limbs, bonding and movement',()=>{
  const base=eco.calculateEnergyCosts({bodyMass:1,speed:.2,maxSpeed:1,basalCost:.00004});
  const complex=eco.calculateEnergyCosts({bodyMass:1.4,speed:.2,maxSpeed:1,basalCost:.00004,brainNodes:40,brainConnections:100,visionRange:90,visionArc:Math.PI*2,visionRays:64,pollingHz:20,limbLoad:8,bondLoad:3,aggression:1,reproductiveLoad:1});
  for(const key of ['basal','tissue','brain','vision','limbs','bonding','aggression','reproduction','locomotion','maintenance','movement','total'])assert.ok(Number.isFinite(complex[key])&&complex[key]>=0,key);
  assert.ok(complex.total>base.total);
  assert.equal(complex.total,complex.maintenance+complex.movement);
});

test('construction cost increases with body, neural, sensory, limb and bonding investment',()=>{
  const base=eco.calculateConstructionCost({});
  const developed=eco.calculateConstructionCost({bodyMass:2,limbLoad:8,brainNodes:40,brainConnections:100,visionLoad:2,bondingSites:4});
  assert.ok(developed.total>base.total);
  assert.equal(developed.total,developed.tissue+developed.limbs+developed.brain+developed.vision+developed.bonding);
});

test('bond helpers count capacity, strength and clean up dead endpoints',()=>{
  const links=[{a:1,b:2,targetType:'agent',kind:'mutualistic',strength:.8},{a:1,b:7,targetType:'plant',kind:'commensal',strength:.4},{a:2,b:3,targetType:'agent',strength:.2}];
  assert.equal(eco.countBonds(links,1),2);
  assert.ok(Math.abs(eco.bondLoad(links,1)-1.2)<1e-12);
  assert.equal(eco.hasBond(links,2,1),true);
  const normalized=eco.normalizeBond({a:1,b:2,targetType:'agent',sideA:'right',sideB:'left'});
  assert.equal(normalized.sideA,'right');assert.equal(normalized.sideB,'left');
  assert.equal(eco.pruneBonds([{a:1,b:2,targetType:'agent',sideA:'right',sideB:'left',strength:.5}],new Set([1,2]),new Set()).at(0).sideA,'right');
  assert.equal(eco.hasBond(links,1,7,'plant'),true);
  assert.equal(eco.pairKey(9,2),eco.pairKey(2,9));
  assert.equal(eco.pruneBonds(links,new Set([1,2]),new Set([7])).length,2);
});
