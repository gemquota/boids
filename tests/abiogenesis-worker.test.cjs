'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function makeWorker(){
  const messages=[];
  const sandbox={messages,postMessage:message=>messages.push(message)};
  vm.createContext(sandbox);
  sandbox.importScripts=path=>{
    const file=path.split('?')[0];
    vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
  };
  vm.runInContext(fs.readFileSync('abiogenesis-worker.js','utf8'),sandbox,{filename:'abiogenesis-worker.js'});
  return {sandbox,messages,send:data=>sandbox.onmessage({data})};
}

test('dedicated worker initializes, steps, snapshots and restores particle worlds',()=>{
  const worker=makeWorker();
  worker.send({type:'abiogenesis:init',seed:7,particles:[
    {id:'a',element:'C',position:{x:10,y:10,z:0},velocity:{x:.1,y:0,z:0}},
    {id:'b',element:'O',position:{x:20,y:10,z:0},velocity:{x:-.1,y:0,z:0}}
  ],molecules:[{id:'co',type:'CO',atomIds:['a','b'],bondIds:[],composition:{C:1,O:1},energy:1}]});
  assert.equal(worker.messages.at(-1).type,'abiogenesis:ready');
  assert.equal(worker.messages.at(-1).moleculeCount,1);
  worker.send({type:'abiogenesis:step',steps:3,dt:1/60,includeWorld:true,options:{thermalJitter:0}});
  const frame=worker.messages.at(-1);
  assert.equal(frame.type,'abiogenesis:frame');assert.equal(frame.stats.steps,3);assert.equal(frame.world.particles.length,2);assert.equal(frame.moleculeCount,1);assert.equal(frame.world.molecules[0].id,'co');
  worker.send({type:'abiogenesis:snapshot',requestId:'save-1'});
  const snapshot=worker.messages.at(-1);assert.equal(snapshot.requestId,'save-1');assert.ok(snapshot.randomState);
  const restored=makeWorker();
  restored.send({type:'abiogenesis:restore',world:snapshot.world,randomState:snapshot.randomState});
  assert.equal(restored.messages.at(-1).type,'abiogenesis:ready');
  restored.send({type:'abiogenesis:step',steps:1,dt:1/60,includeWorld:true,options:{thermalJitter:0}});
  assert.equal(restored.messages.at(-1).world.stats.steps,4);
});

test('dedicated worker returns useful errors for invalid message order',()=>{
  const worker=makeWorker();
  worker.send({type:'abiogenesis:step'});
  assert.equal(worker.messages.at(-1).type,'abiogenesis:error');
  assert.match(worker.messages.at(-1).message,/not been initialized/);
});


test('worker supports selective collection, inventory and molecular crafting actions',()=>{
  const worker=makeWorker();
  worker.send({type:'abiogenesis:init',seed:3,particles:[
    {id:'c',element:'C',position:{x:0,y:0}},
    {id:'h',element:'H',position:{x:1,y:0}},
    {id:'o',element:'O',position:{x:3,y:0}}
  ],resourceClouds:[{id:'cargo',ownerId:'cell',particleIds:['c','h'],energy:2}]});
  worker.send({type:'abiogenesis:inventory',cloudId:'cargo'});
  assert.equal(worker.messages.at(-1).inventory.particleCount,2);
  worker.send({type:'abiogenesis:collect',cloudId:'cargo',anchor:{position:{x:0,y:0} },options:{radius:5,maxCount:1}});
  assert.deepEqual(Array.from(worker.messages.at(-1).collected),['o']);
  worker.send({type:'abiogenesis:craft',cloudId:'cargo',atomIds:['c','h'],bonds:[{a:'c',b:'h'}],options:{id:'CH'}});
  assert.equal(worker.messages.at(-1).type,'abiogenesis:crafted');
  assert.equal(worker.messages.at(-1).inventory.moleculeCount,1);
  assert.equal(worker.messages.at(-1).world.molecules[0].id,'CH');
});


test('worker exposes finite energy harvesting and metabolic conversion',()=>{
  const worker=makeWorker();
  worker.send({type:'abiogenesis:init',seed:8,particles:[{id:'c',element:'C'},{id:'h',element:'H'}],
    resourceClouds:[{id:'cargo',ownerId:'cell',particleIds:['c','h'],energy:0,energyCapacity:5}],
    energySources:[{id:'sun',type:'light',energy:10,efficiency:.5}]});
  worker.send({type:'abiogenesis:harvest',cloudId:'cargo',sourceId:'sun',amount:2});
  assert.equal(worker.messages.at(-1).type,'abiogenesis:harvested');
  assert.equal(worker.messages.at(-1).inventory.energy,2);
  assert.equal(worker.messages.at(-1).world.energySources[0].energy,6);
});
