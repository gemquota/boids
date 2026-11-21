'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {PrimordialWorld}=require('../emergence-pipeline.js');
const Abiogenesis=require('../abiogenesis.js');

test('primordial worlds are deterministic for a fixed seed',()=>{
  const a=new PrimordialWorld({seed:19,count:120}),b=new PrimordialWorld({seed:19,count:120});
  for(let i=0;i<90;i++){a.step(1/60);b.step(1/60)}
  assert.deepEqual(a.entities.map(e=>[e.kind,e.x,e.y,e.bonds]),b.entities.map(e=>[e.kind,e.x,e.y,e.bonds]));
  assert.equal(a.metrics().count,120);
});

test('aggregation forms clusters without duplicate adhesion edges',()=>{
  const world=new PrimordialWorld({seed:7,count:180});
  for(let i=0;i<240;i++)world.step(1/60);
  world.aggregate();world.rebuildClusters();
  const edges=new Set();
  for(const e of world.entities)for(const id of e.bonds)if(e.id<id){const key=e.id+':'+id;assert.equal(edges.has(key),false);edges.add(key)}
  assert.ok(world.metrics().bonds>0);
  assert.ok(world.metrics().clusters>0);
});

test('primordial export preserves constituents and imports into chemistry with valid adhesion topology',()=>{
  const primordial=new PrimordialWorld({seed:42,count:180});
  for(let i=0;i<240;i++)primordial.step(1/60);
  primordial.aggregate();
  const seed=primordial.chemistrySeed(),counts=new Map(seed.particles.map(p=>[p.id,0]));
  for(const b of seed.bonds){counts.set(b.a,counts.get(b.a)+1);counts.set(b.b,counts.get(b.b)+1)}
  assert.equal(seed.particles.length,176);
  assert.ok(seed.particles.every(p=>counts.get(p.id)<=p.valence));
  assert.equal(new Set(seed.bonds.map(b=>[b.a,b.b].sort().join('|'))).size,seed.bonds.length);
  const half=Math.floor(seed.particles.length/2);
  const world=Abiogenesis.createParticleWorld(seed.particles,{bonds:seed.bonds,resourceClouds:[
    {id:'a',ownerId:'a',particleIds:seed.particles.slice(0,half).map(p=>p.id)},
    {id:'b',ownerId:'b',particleIds:seed.particles.slice(half).map(p=>p.id)}
  ]});
  assert.equal(world.particles.length,seed.particles.length);
  assert.equal(Abiogenesis.snapshotParticleWorld(world).bonds.length,seed.bonds.length);
});
