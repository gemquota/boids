const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../emergence.js');

test('entities compose recursively and preserve graph snapshots',()=>{
  const s=new E.EntityStore(),a=s.create('particle'),b=s.create('molecule'),c=s.create('cell');
  s.compose(b.id,a.id);s.compose(c.id,b.id);
  assert.deepEqual(s.descendants(c.id),[b.id,a.id]);
  assert.throws(()=>s.compose(a.id,c.id),/cycle/i);
  const restored=E.EntityStore.restore(s.snapshot());
  assert.deepEqual(restored.descendants(c.id),[b.id,a.id]);
});

test('spatial index finds local entities without global scans',()=>{
  const s=new E.EntityStore();s.create('a',{x:2,y:3});s.create('b',{x:50,y:50});
  const index=new E.SpatialIndex(10);index.rebuild(s.entities.values());
  assert.deepEqual(index.query(0,0,8).map(e=>e.type),['a']);
});

test('fields diffuse and conserve the grid sum',()=>{
  const f=new E.FieldGrid(2,2,2,2).define('heat');f.add('heat',0,0,4);
  const before=Array.from(f.data.get('heat')).reduce((a,b)=>a+b,0);
  f.diffuse('heat',.25);
  const after=Array.from(f.data.get('heat')).reduce((a,b)=>a+b,0);
  assert.ok(after>0&&Math.abs(after-before)<1e-6);
});

test('declarative interactions apply equal and opposite attraction',()=>{
  const s=new E.EntityStore(),a=s.create('A',{x:0,y:0,vx:0,vy:0,mass:1}),b=s.create('B',{x:5,y:0,vx:0,vy:0,mass:1});
  const index=new E.SpatialIndex(10);index.rebuild(s.entities.values());
  const engine=new E.InteractionEngine([{id:'bind',a:'A',b:'B',radius:10,strength:2,mode:'attract'}]);
  engine.apply(s,index,1);
  assert.ok(a.properties.vx>0);assert.ok(b.properties.vx<0);
  assert.ok(Math.abs(a.properties.vx+b.properties.vx)<1e-9);
});

test('constraints converge toward a declared bond length',()=>{
  const s=new E.EntityStore(),a=s.create('x',{x:0,y:0,mass:1}),b=s.create('x',{x:10,y:0,mass:1});
  new E.ConstraintEngine([{a:a.id,b:b.id,rest:4,stiffness:.5}]).solve(s,2);
  assert.ok(Math.abs(Math.hypot(b.properties.x-a.properties.x,b.properties.y-a.properties.y)-4)<6);
});

test('energy transfers and dissipation are explicitly accounted',()=>{
  const energy=new E.EnergyEngine(),a={energy:5},b={energy:0};
  energy.transfer(a,b,2);energy.dissipate(b,1);
  assert.equal(a.energy,3);assert.equal(b.energy,1);
  assert.equal(energy.ledger.transferred,2);assert.equal(energy.ledger.output,1);
});

test('reaction rules match material types and preserve catalysts',()=>{
  const s=new E.EntityStore(),a=s.create('A',{purity:1},{energy:3}),b=s.create('B'),cat=s.create('catalyst');
  const rules=new E.RuleEngine({random:()=>0});
  rules.register({id:'synthesis',inputs:['A',{type:'B'}],catalysts:['catalyst'],conditions:[{input:0,property:'purity',op:'gte',value:1}],outputs:[{type:'AB'}],rate:1000,energyCost:1});
  assert.equal(rules.run(s,1),1);
  assert.equal(s.get(a.id),null);assert.equal(s.get(b.id),null);
  assert.equal(s.get(cat.id).type,'catalyst');
  assert.equal(Array.from(s.entities.values()).find(e=>e.type==='AB').energy,2);
});

test('topology assembles and detects connected cycles',()=>{
  const s=new E.EntityStore(),a=s.create('unit'),b=s.create('unit'),c=s.create('unit');
  s.link(a.id,b.id);s.link(b.id,c.id);s.link(c.id,a.id);
  const topology=new E.TopologyEngine(s),group=topology.assemble('colony',[a.id,b.id,c.id]);
  assert.deepEqual(topology.connectedStructures('unit'),[[a.id,b.id,c.id]]);
  assert.equal(topology.closed(group.id),true);
});

test('scheduler runs phases in stable priority order',()=>{
  const scheduler=new E.Scheduler(),order=[];
  scheduler.add('late',()=>order.push('late'),10).add('early',()=>order.push('early'),-1);
  scheduler.step(.5,{});
  assert.deepEqual(order,['early','late']);assert.equal(scheduler.time,.5);
});
