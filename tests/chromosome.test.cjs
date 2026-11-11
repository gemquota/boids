'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const DNA=require('../chromosome.js');
test('stores genes as independent hexadecimal byte strings',()=>{const g=DNA.encode({traits:[.25,1.5],connections:[3,12,-.742,7,15,.125],innovations:[42,43]});assert.equal(g.length,4);assert.ok(g.every(x=>/^(?:[0-9A-F]{2})+$/.test(x)));assert.equal(g[0].length,12);assert.equal(g[2].length,26)});
test('round-trips traits, integer endpoints, weights and innovation IDs',()=>{const input={traits:[.25,1.5],connections:[3,12,-.742,7,15,.125],innovations:[42,43]},d=DNA.decode(DNA.encode(input));assert.deepEqual(Array.from(d.traitIds),[0x11,0x23]);assert.equal(DNA.traitIndex(d.traitIds[0]),0);assert.equal(DNA.traitIndex(d.traitIds[1]),1);assert.deepEqual(Array.from(d.traits),input.traits);assert.deepEqual(Array.from(d.source),[3,7]);assert.deepEqual(Array.from(d.destination),[12,15]);assert.deepEqual(Array.from(d.innovation),[42,43]);assert.ok(Math.abs(d.weight[0]+.742)<1e-6);assert.equal(d.weight[1],.125);assert.ok(d.source instanceof Uint16Array);assert.ok(d.destination instanceof Uint16Array)});
test('rejects fractional neuron indices and malformed records',()=>{assert.throws(()=>DNA.connectionGene(1,2.5,3,.2),/unsigned integer/);assert.throws(()=>DNA.decode(['02AB']),/length/);assert.throws(()=>DNA.decode(['GG']),/hexadecimal/)});
test('round-trips typed structural neural regulatory and modifier gene families',()=>{
  const input={traits:[.2,.8],connections:[],structural:[{innovation:91,source:2,destination:4,enabled:false,recurrent:true}],neuralNodes:[{id:2,type:'hidden',activation:'relu',bias:.3},{id:4,type:'output',activation:'sigmoid',bias:-.2}],neuralConnections:[{innovation:91,weight:.75}],regulatoryNodes:[{id:7,locus:'aggression',environment:'harshness',activation:'tanh',bias:.1,threshold:.2,effect:.4,environmentSensitivity:.3}],regulatoryEdges:[{id:8,source:7,target:7,weight:-.6,enabled:true}],modifiers:[{id:12,targetTrait:0,loci:[0,1,2],coefficient:.15,mode:1}]};
  const genes=DNA.encode(input),decoded=DNA.decode(genes);
  assert.ok(genes.every(gene=>/^(?:[0-9A-F]{2})+$/.test(gene)));
  assert.equal(decoded.structural[0].innovation,91);assert.equal(decoded.structural[0].enabled,false);assert.equal(decoded.structural[0].recurrent,true);
  assert.deepEqual(decoded.neuralNodes.map(node=>[node.id,node.type,node.activation]),[[2,'hidden','relu'],[4,'output','sigmoid']]);
  assert.deepEqual(decoded.neuralConnections,[{innovation:91,weight:.75}]);
  assert.equal(decoded.regulatoryNodes[0].locusId,DNA.TRAIT_IDS[0]);assert.equal(decoded.regulatoryNodes[0].environmentId,1);assert.ok(Math.abs(decoded.regulatoryNodes[0].effect-.4)<1e-6);
  assert.ok(Math.abs(decoded.regulatoryEdges[0].weight+.6)<1e-6);assert.equal(decoded.regulatoryEdges[0].enabled,true);
  assert.deepEqual(decoded.modifiers[0],{id:12,targetTrait:0,loci:[0,1,2],coefficient:.15,mode:1});
});
test('typed chromosome records retain integer node indices and reject invalid references',()=>{
  assert.throws(()=>DNA.structuralGene(1,1.5,2),/unsigned integer/);
  assert.throws(()=>DNA.neuralNodeGene(4294967296,'hidden','tanh',0),/unsigned integer/);
  assert.throws(()=>DNA.modifierGene(1,0,[0,0],.2),/distinct trait indices/);
});
test('allows variable length and reordered genes',()=>{const g=DNA.encode({traits:[.2,.8],connections:[1,9,.4],innovations:[9]}),d=DNA.decode([g[2],g[1],g[0]]);assert.equal(d.source.length,1);assert.equal(d.traits.length,2);assert.equal(d.source[0],1)});
