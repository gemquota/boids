/* Recursive, data-driven emergence substrate shared by every compositional scale.
 * Pure deterministic core: callers provide RNG and own persistence/scheduling.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsEmergence=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:0));
const finite=(v,d=0)=>Number.isFinite(+v)?+v:d;
const clone=v=>JSON.parse(JSON.stringify(v));
class EntityStore{
  constructor(){this.entities=new Map();this.nextId=1;this.links=[]}
  create(type='entity',properties={},options={}){const id=options.id??this.nextId++;if(this.entities.has(id))throw Error('Duplicate entity '+id);const numericId=Number(id);if(Number.isSafeInteger(numericId)&&numericId>=this.nextId)this.nextId=numericId+1;const e={id,type,properties:{...properties},state:options.state??'active',energy:Math.max(0,finite(options.energy)),components:[],parent:options.parent??null,meta:{...(options.meta||{})}};this.entities.set(id,e);if(e.parent!==null)this.compose(e.parent,id);return e}
  get(id){return this.entities.get(id)||null}
  require(id){const e=this.get(id);if(!e)throw Error('Unknown entity '+id);return e}
  compose(parent,child){const p=this.require(parent),c=this.require(child);if(parent===child||this.descendants(child).includes(parent))throw Error('Composition cycle');if(c.parent!==null){const old=this.get(c.parent);if(old)old.components=old.components.filter(id=>id!==child)}c.parent=parent;if(!p.components.includes(child))p.components.push(child);return p}
  descendants(id,out=[]){for(const child of this.require(id).components){out.push(child);this.descendants(child,out)}return out}
  remove(id){const e=this.get(id);if(!e)return false;if(e.parent!==null){const p=this.get(e.parent);if(p)p.components=p.components.filter(v=>v!==id)}for(const childId of e.components){const child=this.get(childId);if(!child)continue;child.parent=e.parent;if(e.parent!==null){const parent=this.get(e.parent);if(parent&&!parent.components.includes(childId))parent.components.push(childId)}}this.entities.delete(id);this.links=this.links.filter(l=>l.a!==id&&l.b!==id);return true}
  link(a,b,type='related',properties={}){this.require(a);this.require(b);if(a===b)throw Error('Self link');const edge={a,b,type,properties:{...properties}};this.links.push(edge);return edge}
  unlink(a,b,type){const n=this.links.length;this.links=this.links.filter(e=>!(e.a===a&&e.b===b&&(!type||e.type===type)));return n-this.links.length}
  snapshot(){return{nextId:this.nextId,entities:Array.from(this.entities.values(),clone),links:clone(this.links)}}
  static restore(s){const store=new EntityStore();store.nextId=s.nextId||1;for(const e of s.entities||[])store.entities.set(e.id,clone(e));store.links=clone(s.links||[]);return store}
}
class SpatialIndex{
  constructor(cellSize=32){this.cellSize=Math.max(.001,cellSize);this.cells=new Map()}
  key(x,y){return Math.floor(x/this.cellSize)+','+Math.floor(y/this.cellSize)}
  rebuild(entities){this.cells.clear();for(const e of entities){const p=e.properties;if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;const k=this.key(p.x,p.y);if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(e)}}
  query(x,y,r){const out=[],s=this.cellSize,x0=Math.floor((x-r)/s),x1=Math.floor((x+r)/s),y0=Math.floor((y-r)/s),y1=Math.floor((y+r)/s),r2=r*r;for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++)for(const e of this.cells.get(cx+','+cy)||[]){const p=e.properties,dx=p.x-x,dy=p.y-y;if(dx*dx+dy*dy<=r2)out.push(e)}return out}
}
class FieldGrid{
  constructor(width,height,cols=32,rows=24){this.width=width;this.height=height;this.cols=cols;this.rows=rows;this.data=new Map()}
  define(name,initial=0){this.data.set(name,new Float32Array(this.cols*this.rows).fill(initial));return this}
  index(x,y){return Math.max(0,Math.min(this.rows-1,Math.floor(y/this.height*this.rows)))*this.cols+Math.max(0,Math.min(this.cols-1,Math.floor(x/this.width*this.cols)))}
  sample(name,x,y){const a=this.data.get(name);return a?a[this.index(x,y)]:0}
  add(name,x,y,value){const a=this.data.get(name);if(!a)throw Error('Unknown field '+name);const i=this.index(x,y);a[i]+=finite(value);return a[i]}
  diffuse(name,rate=0.1){const a=this.data.get(name);if(!a)throw Error('Unknown field '+name);const b=Float32Array.from(a),r=clamp(rate)*.25;for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){const i=y*this.cols+x;for(const j of [x+1<this.cols?i+1:-1,y+1<this.rows?i+this.cols:-1])if(j>=0){const flux=(a[j]-a[i])*r;b[i]+=flux;b[j]-=flux}}this.data.set(name,b);return this}
}
class EnergyEngine{
  constructor(){this.ledger={input:0,output:0,transferred:0,converted:0,dissipated:0}}
  source(e,amount){amount=Math.max(0,finite(amount));e.energy+=amount;this.ledger.input+=amount;return amount}
  transfer(a,b,amount){amount=Math.min(Math.max(0,a.energy),Math.max(0,finite(amount)));a.energy-=amount;b.energy+=amount;this.ledger.transferred+=amount;return amount}
  convert(e,input,output){input=Math.min(Math.max(0,e.energy),Math.max(0,finite(input)));output=Math.max(0,finite(output));e.energy=e.energy-input+output;this.ledger.converted+=output-input;return output-input}
  dissipate(e,amount){amount=Math.min(Math.max(0,e.energy),Math.max(0,finite(amount)));e.energy-=amount;this.ledger.dissipated+=amount;this.ledger.output+=amount;return amount}
  balance(){return this.ledger.input-this.ledger.output}
}
class InteractionEngine{
  constructor(rules=[]){this.rules=rules.slice()}
  register(rule){if(!rule.id||!rule.a||!rule.b)throw Error('Interaction requires id and type selectors');this.rules.push(clone(rule));return this}
  apply(store,index,dt){const forces=new Map();for(const rule of this.rules){const radius=Math.max(.001,finite(rule.radius,32));for(const a of store.entities.values()){if(a.type!==rule.a)continue;const p=a.properties;if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;for(const b of index.query(p.x,p.y,radius)){if(b.type!==rule.b||(rule.a===rule.b&&b.id<=a.id))continue;const q=b.properties,dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||.0001;if(d>radius)continue;const magnitude=finite(rule.strength)*(rule.mode==='repel'?-1:1)*Math.pow(Math.max(0,1-d/radius),finite(rule.exponent,1)),fx=dx/d*magnitude*dt,fy=dy/d*magnitude*dt;const fa=forces.get(a.id)||[0,0],fb=forces.get(b.id)||[0,0];fa[0]+=fx;fa[1]+=fy;fb[0]-=fx;fb[1]-=fy;forces.set(a.id,fa);forces.set(b.id,fb)}}}for(const [id,f] of forces){const p=store.require(id).properties,m=Math.max(.001,finite(p.mass,1));p.vx=finite(p.vx)+f[0]/m;p.vy=finite(p.vy)+f[1]/m}return forces.size}
}
class ConstraintEngine{
  constructor(rules=[]){this.rules=rules.slice()}
  add(rule){this.rules.push(clone(rule));return this}
  solve(store,iterations=1){for(let n=0;n<iterations;n++)for(const r of this.rules){const a=store.get(r.a),b=store.get(r.b);if(!a||!b)continue;const p=a.properties,q=b.properties,dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||.0001,rest=Math.max(.001,finite(r.rest,d)),error=d-rest,k=clamp(r.stiffness,.0,1),wa=1/Math.max(.001,finite(p.mass,1)),wb=1/Math.max(.001,finite(q.mass,1)),sum=wa+wb,c=error*k/sum,nx=dx/d,ny=dy/d;p.x+=nx*c*wa;p.y+=ny*c*wa;q.x-=nx*c*wb;q.y-=ny*c*wb}return this.rules.length}
}
class GraphEngine{
  constructor(store){this.store=store}
  neighbours(id,type){return this.store.links.filter(e=>(e.a===id||e.b===id)&&(!type||e.type===type)).map(e=>e.a===id?e.b:e.a)}
  components(type){const ids=Array.from(this.store.entities.values()).filter(e=>!type||e.type===type).map(e=>e.id),seen=new Set(),out=[];for(const id of ids){if(seen.has(id))continue;const group=[],stack=[id];seen.add(id);while(stack.length){const n=stack.pop();group.push(n);for(const m of this.neighbours(n))if((!type||this.store.get(m)?.type===type)&&!seen.has(m)){seen.add(m);stack.push(m)}}out.push(group)}return out}
  hasCycle(ids){const allowed=new Set(ids),seen=new Set();const visit=(id,parent)=>{seen.add(id);for(const n of this.neighbours(id)){if(!allowed.has(n))continue;if(!seen.has(n)){if(visit(n,id))return true}else if(n!==parent)return true}return false};for(const id of ids)if(!seen.has(id)&&visit(id,null))return true;return false}
}
class RuleEngine{
  constructor(options={}){this.rules=[];this.random=options.random||Math.random;this.energy=options.energy||new EnergyEngine();this.events=[]}
  register(rule){if(!rule.id||!Array.isArray(rule.inputs)||!Array.isArray(rule.outputs))throw Error('Reaction rule requires id, inputs and outputs');this.rules.push(clone(rule));return this}
  matches(entity,selector){if(!entity)return false;if(typeof selector==='string')return entity.type===selector;return entity.type===(selector.type||entity.type)&&Object.entries(selector.where||{}).every(([key,test])=>{const value=entity.properties[key],op=typeof test==='object'?test.op:'eq',target=typeof test==='object'?test.value:test;return op==='eq'?value===target:op==='gt'?value>target:op==='gte'?value>=target:op==='lt'?value<target:op==='lte'?value<=target:op==='neq'?value!==target:false})}
  run(store,dt=1){let fired=0;for(const r of this.rules){const probability=clamp(1-Math.exp(-Math.max(0,finite(r.rate,1))*Math.max(0,dt)),0,1);if(this.random()>probability)continue;const available=Array.from(store.entities.values()),selected=[],used=new Set();let valid=true;for(const selector of r.inputs){const entity=available.find(e=>!used.has(e.id)&&this.matches(e,selector));if(!entity){valid=false;break}used.add(entity.id);selected.push(entity)}if(!valid)continue;const catalystUsed=new Set(used),catalysts=[];let catalystsValid=true;for(const selector of r.catalysts||[]){const catalyst=available.find(e=>!catalystUsed.has(e.id)&&this.matches(e,selector));if(!catalyst){catalystsValid=false;break}catalystUsed.add(catalyst.id);catalysts.push(catalyst)}if(!catalystsValid)continue;if((r.conditions||[]).some(c=>{const e=selected[c.input??0],v=e?.properties?.[c.property],op=c.op||'gte';return !e||!(op==='eq'?v===c.value:op==='gt'?v>c.value:op==='gte'?v>=c.value:op==='lt'?v<c.value:op==='lte'?v<=c.value:v!==c.value)}))continue;const cost=Math.max(0,finite(r.energyCost)),availableEnergy=selected.reduce((sum,e)=>sum+Math.max(0,finite(e.energy)),0);if(cost>availableEnergy)continue;if(r.outputs.some(o=>!o||typeof o.type!=='string'||!o.type|| (o.properties!==undefined&&(!o.properties||typeof o.properties!=='object'||Array.isArray(o.properties)))))continue;const productEnergy=Math.max(0,finite(r.productEnergy,availableEnergy-cost));if(cost){this.energy.ledger.output+=cost;this.energy.ledger.dissipated+=cost}for(const e of selected)store.remove(e.id);const products=r.outputs.map(o=>store.create(o.type,o.properties||{},{energy:productEnergy/r.outputs.length}));this.events.push({rule:r.id,consumed:selected.map(e=>e.id),products:products.map(e=>e.id),catalysts:catalysts.map(e=>e.id)});fired++}return fired}
}
class TopologyEngine{
  constructor(store){this.store=store;this.graph=new GraphEngine(store)}
  assemble(type,ids,properties={}){const parent=this.store.create(type,properties);for(const id of ids)this.store.compose(parent.id,id);return parent}
  divide(id,childGroups){const parent=this.store.require(id),children=[];for(const group of childGroups){const child=this.store.create(parent.type,{...parent.properties},{energy:parent.energy/childGroups.length});for(const component of group)if(parent.components.includes(component))this.store.compose(child.id,component);children.push(child)}parent.energy=0;return children}
  connectedStructures(type){return this.graph.components(type)}
  closed(id){const members=this.store.descendants(id),set=new Set(members),edges=this.store.links.filter(e=>set.has(e.a)&&set.has(e.b));return members.length>2&&edges.length>=members.length}
}
class Scheduler{
  constructor(){this.phases=[];this.time=0;this.tick=0}
  add(name,fn,priority=0){this.phases.push({name,fn,priority});this.phases.sort((a,b)=>a.priority-b.priority);return this}
  step(dt,context){dt=Math.max(0,finite(dt));for(const phase of this.phases)phase.fn(dt,context);this.time+=dt;this.tick++;return this.tick}
}
function createRuntime(options={}){const store=new EntityStore(),spatial=new SpatialIndex(options.cellSize||32),fields=new FieldGrid(options.width||1024,options.height||768,options.cols||32,options.rows||24),energy=new EnergyEngine(),interactions=new InteractionEngine(),constraints=new ConstraintEngine(),graph=new GraphEngine(store),rules=new RuleEngine({random:options.random,energy}),topology=new TopologyEngine(store),scheduler=new Scheduler();scheduler.add('index',()=>spatial.rebuild(store.entities.values()),-100).add('interactions',(dt)=>{interactions.apply(store,spatial,dt)},0).add('constraints',()=>constraints.solve(store,options.constraintIterations||2),10).add('integrate',(dt)=>{for(const e of store.entities.values()){const p=e.properties;if(!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;p.x+=finite(p.vx)*dt;p.y+=finite(p.vy)*dt}},20).add('rules',dt=>rules.run(store,dt),30);return{store,spatial,fields,energy,interactions,constraints,graph,rules,topology,scheduler,step(dt){return scheduler.step(dt,this)}}}
return Object.freeze({EntityStore,SpatialIndex,FieldGrid,EnergyEngine,InteractionEngine,ConstraintEngine,GraphEngine,RuleEngine,TopologyEngine,Scheduler,createRuntime});
});
