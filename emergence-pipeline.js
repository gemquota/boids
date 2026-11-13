/* BOIDS emergence pipeline: pre-chemical organisation through proto-organisms.
 * This layer models mesoscale prebiotic processes; atomistic chemistry remains in abiogenesis.js.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BoidsEmergencePipeline=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const finite=(v,d=0)=>Number.isFinite(+v)?+v:d;
  function rng(seed){let s=(seed>>>0)||0x6d2b79f5;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}}
  class PrimordialWorld{
    constructor(options={}){
      this.width=Math.max(100,finite(options.width,960));this.height=Math.max(100,finite(options.height,620));
      this.random=rng(options.seed??20261114);this.time=0;this.tick=0;this.nextId=1;
      this.entities=[];this.clusters=[];this.energy=finite(options.energy,100);this.events=[];
      this.fields={heat:new Float32Array(64*40),nutrient:new Float32Array(64*40),redox:new Float32Array(64*40)};
      this.seed(options.count||180);
    }
    seed(count){
      const kinds=['monomer','amphiphile','mineral','catalyst','energy'];
      for(let i=0;i<count;i++){
        const r=this.random(),kind=r<.42?'monomer':r<.62?'amphiphile':r<.84?'mineral':r<.94?'catalyst':'energy';
        const x=this.random()*this.width,y=this.random()*this.height,a=this.random()*Math.PI*2,s=.08+this.random()*.55;
        this.entities.push({id:this.nextId++,kind,x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:kind==='mineral'?4+this.random()*4:2.2+this.random()*2,
          energy:kind==='energy'?1+this.random()*3:.1+this.random()*.5,adsorbed:null,bonds:[],age:0,activity:0,composition:kind==='monomer'?['C','H','O','N'][Math.floor(this.random()*4)]:null});
      }
      this.seedFields();
    }
    seedFields(){for(let i=0;i<this.fields.heat.length;i++){this.fields.heat[i]=.15+this.random()*.7;this.fields.nutrient[i]=.2+this.random()*.8;this.fields.redox[i]=this.random()}}
    cell(x,y){return clamp(Math.floor(y/this.height*40),0,39)*64+clamp(Math.floor(x/this.width*64),0,63)}
    sample(field,e){return this.fields[field][this.cell(e.x,e.y)]}
    emit(type,detail={}){this.events.push({time:this.time,type,...detail});if(this.events.length>80)this.events.shift()}
    step(dt=1/60){
      dt=clamp(finite(dt,1/60),0,.05);this.time+=dt;this.tick++;
      const active=this.entities.filter(e=>e.kind!=='energy');
      for(const e of this.entities){
        e.age+=dt;
        const thermal=.06+this.sample('heat',e)*.2;
        if(e.kind!=='mineral'&&!e.adsorbed){e.vx+=(this.random()-.5)*thermal;e.vy+=(this.random()-.5)*thermal;
          e.vx*=.992;e.vy*=.992;e.x+=e.vx*dt*30;e.y+=e.vy*dt*30;
          if(e.x<e.r||e.x>this.width-e.r)e.vx*=-1;if(e.y<e.r||e.y>this.height-e.r)e.vy*=-1;
          e.x=clamp(e.x,e.r,this.width-e.r);e.y=clamp(e.y,e.r,this.height-e.r)}
        if(e.kind==='energy'&&e.energy>0){e.energy=Math.max(0,e.energy-dt*.04);const i=this.cell(e.x,e.y);this.fields.heat[i]=clamp(this.fields.heat[i]+dt*.025,0,2);this.fields.redox[i]=clamp(this.fields.redox[i]+dt*.012,0,2)}
      }
      const grid=new Map(),size=24;
      for(const e of active){const k=Math.floor(e.x/size)+','+Math.floor(e.y/size);if(!grid.has(k))grid.set(k,[]);grid.get(k).push(e)}
      for(const a of active){
        if(a.kind==='mineral')continue;
        const gx=Math.floor(a.x/size),gy=Math.floor(a.y/size);
        for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)for(const b of grid.get((gx+ox)+','+(gy+oy))||[]){
          if(b.id<=a.id||b.kind==='energy')continue;
          const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001;
          if(d<a.r+b.r+2&&a.bonds.length<4&&b.bonds.length<4){
            const mineral=(a.kind==='mineral'||b.kind==='mineral'),prob=(mineral?.018:.004)*dt*60*(1+this.sample('nutrient',a));
            if(this.random()<prob){a.bonds.push(b.id);b.bonds.push(a.id);a.activity++;b.activity++;this.emit('aggregation',{a:a.id,b:b.id,catalysed:mineral})}
            const push=(a.r+b.r-d)*.08;a.x-=dx/d*push;a.y-=dy/d*push;b.x+=dx/d*push;b.y+=dy/d*push;
          }
        }
      }
      if(this.tick%30===0)this.diffuseFields();
      if(this.tick%120===0)this.rebuildClusters();
      return this.metrics();
    }
    diffuseFields(){for(const field of Object.values(this.fields)){const next=Float32Array.from(field);for(let y=0;y<40;y++)for(let x=0;x<64;x++){const i=y*64+x;for(const j of [x<63?i+1:-1,y<39?i+64:-1])if(j>=0){const flux=(field[j]-field[i])*.025;next[i]+=flux;next[j]-=flux}}field.set(next)}}
    rebuildClusters(){
      const byId=new Map(this.entities.map(e=>[e.id,e])),seen=new Set(),clusters=[];
      for(const e of this.entities){if(e.kind==='energy'||seen.has(e.id))continue;const stack=[e.id],members=[];seen.add(e.id);
        while(stack.length){const id=stack.pop(),node=byId.get(id);if(!node)continue;members.push(node);for(const other of node.bonds)if(!seen.has(other)){seen.add(other);stack.push(other)}}
        if(members.length>1)clusters.push({id:Math.min(...members.map(v=>v.id)),members:members.map(v=>v.id),size:members.length,mineral:members.some(v=>v.kind==='mineral'),stability:members.reduce((n,v)=>n+v.bonds.length,0)/(members.length*4),activity:members.reduce((n,v)=>n+v.activity,0)});
      }
      this.clusters=clusters;return clusters;
    }
    catalyse(){
      let count=0;for(const e of this.entities){if(e.kind!=='catalyst'&&e.kind!=='mineral')continue;const nearby=this.entities.filter(p=>p.kind==='monomer'&&!p.adsorbed&&Math.hypot(p.x-e.x,p.y-e.y)<42).slice(0,4);
        for(const p of nearby){p.adsorbed=e.id;p.vx*=.2;p.vy*=.2;p.activity++;count++}}
      this.energy=Math.max(0,this.energy-count*.015);this.emit('surface-catalysis',{adsorbed:count});return count;
    }
    release(){let count=0;for(const e of this.entities)if(e.adsorbed){e.adsorbed=null;e.vx+=(this.random()-.5)*.5;e.vy+=(this.random()-.5)*.5;count++}this.emit('desorption',{released:count});return count}
    aggregate(){let formed=0;for(const e of this.entities){if(e.kind!=='monomer'||e.bonds.length)continue;const b=this.entities.find(p=>p.kind==='monomer'&&p.id!==e.id&&p.bonds.length<4&&Math.hypot(p.x-e.x,p.y-e.y)<30);if(b&&e.bonds.length<4){e.bonds.push(b.id);b.bonds.push(e.id);formed++}}this.rebuildClusters();this.emit('aggregation-pulse',{bonds:formed});return formed}
    metrics(){const count=this.entities.length,byKind={};for(const e of this.entities)byKind[e.kind]=(byKind[e.kind]||0)+1;const bonds=this.entities.reduce((n,e)=>n+e.bonds.length,0)/2;return{time:this.time,count,bonds,clusters:this.clusters.length,largestCluster:this.clusters.reduce((m,c)=>Math.max(m,c.size),0),mineralClusters:this.clusters.filter(c=>c.mineral).length,adsorbed:this.entities.filter(e=>e.adsorbed).length,energy:this.energy,byKind}}
    chemistrySeed(){
      const particles=[],idMap=new Map();
      for(const e of this.entities){if(e.kind==='energy')continue;const element=e.composition|| (e.kind==='amphiphile'?'C':e.kind==='mineral'?'P':'O'),id='pre-'+particles.length;idMap.set(e.id,id);
        particles.push({id,element,mass:element==='H'?.65:1,radius:e.r,charge:0,valence:element==='C'?4:element==='H'?1:element==='O'?2:3,
          position:{x:e.x,y:e.y,z:0},velocity:{x:e.vx,y:e.vy,z:0},thermalEnergy:.1,metadata:{origin:'primordial-aggregate',sourceEntity:e.id,adsorbed:!!e.adsorbed}});
      }
      const bonds=[];for(const e of this.entities)for(const other of e.bonds)if(e.id<other&&idMap.has(other))bonds.push({a:idMap.get(e.id),b:idMap.get(other),type:'adhesion',strength:.18,restLength:2});return{particles,bonds,seed:this.tick+this.entities.length,clusters:this.clusters.map(c=>({...c}))};
    }
    snapshot(){return{width:this.width,height:this.height,time:this.time,tick:this.tick,nextId:this.nextId,energy:this.energy,entities:this.entities.map(e=>({...e,bonds:e.bonds.slice()})),clusters:this.clusters.map(c=>({...c,members:c.members.slice()})),fields:Object.fromEntries(Object.entries(this.fields).map(([k,v])=>[k,Array.from(v)]))}}
  }
  return Object.freeze({PrimordialWorld});
});
