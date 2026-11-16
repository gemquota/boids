'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),cosmos=require('../cosmology.js');
test('primordial world starts with independently distributed subatomic particles only',()=>{
 const w=cosmos.createWorld({seed:7,particleCount:120});
 assert.equal(w.bodies.length,120);assert.ok(w.bodies.every(b=>['proton','neutron','electron'].includes(b.kind)));
 assert.equal(cosmos.summary(w).atoms,0);
});
test('nucleosynthesis and recombination produce nuclei and atoms from subatomic constituents',()=>{
 const w=cosmos.createWorld({seed:11,particleCount:240});
 for(let i=0;i<10;i++)cosmos.step(w,1/60,{timeScale:4});
 assert.ok(w.bodies.some(b=>b.kind==='nucleus'||b.kind==='atom'));
 assert.ok(w.bodies.every(b=>Number.isFinite(b.mass)&&b.mass>0));
});
test('world advances through recombination into gas and stellar eras',()=>{
 const w=cosmos.createWorld({seed:19,particleCount:300});
 for(let i=0;i<300;i++)cosmos.step(w,1/60,{timeScale:4});
 assert.ok(['primordial-gas','stellar-era'].includes(w.phase));
 assert.ok(w.bodies.some(b=>['atom','gas','star'].includes(b.kind)));
});
test('stellar wind and supernova ejecta retain composition and outward momentum',()=>{
 const w=cosmos.createWorld({seed:3,particleCount:80});
 const star={id:'test-star',kind:'star',x:100,y:100,vx:0,vy:0,mass:12,radius:5,initialMass:12,age:1000,lifeExpectancy:20,fuel:1,windClock:4,composition:{H:4,He:3,C:2,O:2,Fe:1},metallicity:.2};
 w.bodies=[star];w.time=2;
 for(let i=0;i<3;i++)cosmos.step(w,1/60,{timeScale:4});
 assert.ok(w.stats.supernovae>=1||w.stats.blackHoles>=1);
 assert.ok(w.bodies.some(b=>b.kind==='ejecta'||b.kind==='gas'));
 const ejecta=w.bodies.find(b=>b.kind==='ejecta'||b.kind==='gas');
 assert.ok(ejecta.composition&&Object.values(ejecta.composition).some(v=>v>0));
});
test('snapshots preserve stellar populations and counters',()=>{
 const w=cosmos.createWorld({seed:2,particleCount:80});cosmos.step(w,.02);
 const restored=cosmos.restore(cosmos.snapshot(w));
 assert.deepEqual(restored, w);assert.equal(cosmos.summary(restored).bodyCount,w.bodies.length);
});

test('mass-dependent endings distinguish white dwarfs, neutron stars and black holes',()=>{
 const endings=[{mass:1.5,kind:'white-dwarf'},{mass:4,kind:'neutron-star'},{mass:12,kind:'black-hole'}];
 for(const item of endings){
  const w=cosmos.createWorld({seed:5,particleCount:40});
  w.bodies=[{id:'star',kind:'star',x:100,y:100,vx:0,vy:0,mass:item.mass,radius:5,initialMass:item.mass,age:1000,lifeExpectancy:20,fuel:1,windClock:0,composition:{H:1,He:1,C:1,O:1,Fe:1},metallicity:.2}];
  cosmos.resolveStellarDeath(w,w.bodies[0]);
  const remnant=w.bodies.find(b=>b.kind==='remnant');
  assert.equal(remnant&&remnant.remnant,item.kind);
 }
});
