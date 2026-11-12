'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const evo=require('../evolution.js');

const genome={
  nodes:[
    {id:0,type:'input'},
    {id:1,type:'input'},
    {id:2,type:'hidden'},
    {id:3,type:'output'}
  ],
  connections:[
    {innovation:1,source:0,destination:2,weight:.5},
    {innovation:2,source:2,destination:3,weight:1}
  ]
};

test('rare interface mutations add named sensory and behavior neurons without ID collisions',()=>{
  const registry=evo.createInnovationRegistry();
  const mutated=evo.mutateGenome(genome,registry,()=>.5,{
    rates:{weight:0,bias:0,addConnection:0,splitConnection:0,addInput:1,addOutput:1,toggleConnection:0,deleteConnection:0,recurrent:0},
    limits:{maxNodes:32,maxConnections:32,maxInputs:8,maxOutputs:8}
  });
  const ids=mutated.nodes.map(node=>node.id);
  assert.equal(new Set(ids).size,ids.length);
  const sensory=mutated.nodes.find(node=>node.type==='input'&&node.channel);
  const behavior=mutated.nodes.find(node=>node.type==='output'&&node.channel);
  assert.ok(sensory);
  assert.ok(behavior);
  assert.ok(mutated.connections.some(edge=>edge.source===sensory.id));
  assert.ok(mutated.connections.some(edge=>edge.destination===behavior.id));
  const compiled=evo.compileNetwork(mutated);
  assert.equal(compiled.inputs.length,3);
  assert.equal(compiled.outputs.length,2);
  const active=evo.activateNetwork(compiled,[.1,.2,.3],new Float32Array(mutated.nodes.length));
  assert.equal(active.outputs.length,2);
});
