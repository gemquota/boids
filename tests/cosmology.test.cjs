'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),cosmos=require('../cosmology.js');
test('primordial world starts with independently distributed subatomic particles only',()=>{
 const w=cosmos.createWorld({seed:7,particleCount:120});
 assert.equal(w.bodies.length,120);assert.ok(w.bodies.every(b=>['proton','neutron','electron'].includes(b.kind)));
 assert.equal(cosmos.summary(w).atoms,0);
});
test('nucleosynthesis and recombination produce nuclei and atoms from subatomic constituents',()=>{
 const w=cosmos.createWorld({seed:11,particleCount:240});
 for(let i=0;i<7;i++)cosmos.step(w,.05,{timeScale:200});
 assert.ok(w.bodies.some(b=>b.kind==='nucleus'||b.kind==='atom'));
 assert.ok(w.bodies.every(b=>Number.isFinite(b.mass)&&b.mass>0));
});
test('world advances through recombination into gas and stellar eras',()=>{
 const w=cosmos.createWorld({seed:19,particleCount:300});
 for(let i=0;i<25;i++)cosmos.step(w,.05,{timeScale:200});
 assert.equal(w.phase,'stellar-era');
 assert.ok(w.bodies.some(b=>['atom','gas','star'].includes(b.kind)));
});
test('stellar wind and supernova ejecta retain composition and outward momentum',()=>{
 const w=cosmos.createWorld({seed:3,particleCount:80});
 const star={id:'test-star',kind:'star',x:100,y:100,vx:0,vy:0,mass:12,radius:5,initialMass:12,age:1000,lifeExpectancy:20,fuel:1,windClock:4,composition:{H:4,He:3,C:2,O:2,Fe:1},metallicity:.2};
 w.bodies=[star];w.time=240;
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
  const remnant=cosmos.resolveStellarDeath(w,w.bodies[0]);
  assert.equal(remnant.remnant,item.kind);
 }
});

test('recombination converts leftover free nucleons into hydrogen-1 and conserves baryon count',()=>{
 const w=cosmos.createWorld({seed:17,particleCount:100});
 const before=cosmos.totalBaryons(w.bodies);
 for(let i=0;i<13;i++)cosmos.step(w,.05,{timeScale:200});
 const after=cosmos.totalBaryons(w.bodies);
 assert.equal(after,before);
 assert.ok(w.bodies.some(b=>b.kind==='atom'&&b.isotope==='hydrogen-1'));
 assert.ok(w.bodies.every(b=>b.kind!=='neutron'),'free neutrons should decay during recombination');
});

test('primordial particles remain the visible opening era instead of being skipped',()=>{
 const w=cosmos.createWorld({seed:23,particleCount:250});
 assert.equal(w.phase,'primordial-plasma');
 assert.ok(w.bodies.some(b=>b.kind==='proton'));
 assert.ok(w.bodies.some(b=>b.kind==='neutron'));
 assert.ok(w.bodies.some(b=>b.kind==='electron'));
 for(let i=0;i<20;i++)cosmos.step(w,1/60,{timeScale:4});
 assert.equal(w.phase,'primordial-plasma');
 assert.ok(w.bodies.some(b=>['proton','neutron','electron','nucleus'].includes(b.kind)));
});

test('primordial epochs have deliberate duration and recombination is progressive',()=>{
 const w=cosmos.createWorld({seed:29,particleCount:250});
 for(let i=0;i<5;i++)cosmos.step(w,.05,{timeScale:200});
 assert.equal(w.phase,'primordial-plasma');
 assert.ok(w.bodies.every(b=>['proton','neutron','electron'].includes(b.kind)));
 cosmos.step(w,.05,{timeScale:200});
 assert.equal(w.phase,'primordial-nucleosynthesis');
 for(let i=0;i<6;i++)cosmos.step(w,.05,{timeScale:200});
 assert.equal(w.phase,'recombination');
 const before=w.bodies.filter(b=>b.kind==='atom').length;
 for(let i=0;i<4;i++)cosmos.step(w,.05,{timeScale:4});
 const after=w.bodies.filter(b=>b.kind==='atom').length;
 assert.ok(after>before,'recombination should convert particles gradually');
 assert.ok(w.time<180,'recombination must not skip straight into primordial gas');
});
