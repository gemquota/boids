(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BoidsCosmology=api;
})(typeof self!=='undefined'?self:globalThis,function(){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const finite=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const clone=v=>JSON.parse(JSON.stringify(v));
  function rng(seed){let s=(Number(seed)>>>0)||1;return ()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296}}
  function composition(){return {H:0,He:0,C:0,N:0,O:0,Ne:0,Mg:0,Si:0,S:0,Fe:0,Au:0}}
  function addComposition(a,b,scale=1){const out=composition();for(const k of Object.keys(out))out[k]=Math.max(0,finite(a&&a[k])+finite(b&&b[k])*scale);return out}
  function massOf(c){return Object.values(c).reduce((n,v)=>n+finite(v),0)}
  function body(id,kind,x,y,mass,extra={}){return {id,kind,x,y,vx:0,vy:0,mass:Math.max(.0001,mass),radius:Math.max(1,Math.sqrt(Math.max(.0001,mass))*1.5),composition:composition(),age:0,temperature:1,metallicity:0,...extra}}
  function createWorld(options={}){
    const random=rng(options.seed||20261116),bodies=[];let id=0;
    const count=clamp(Math.floor(finite(options.particleCount,250)),40,600),protons=Math.floor(count*.46),neutrons=Math.floor(count*.09),electrons=count-protons-neutrons;
    for(const [kind,n,mass] of [['proton',protons,.08],['neutron',neutrons,.08],['electron',electrons,.00008]]){
      for(let i=0;i<n;i++){const a=random()*Math.PI*2,r=Math.sqrt(random())*170,p=body('p'+id++,kind,480+Math.cos(a)*r,310+Math.sin(a)*r,mass,{charge:kind==='proton'?1:kind==='electron'?-1:0,temperature:.9+random()*.2});p.vx=(random()-.5)*7;p.vy=(random()-.5)*7;bodies.push(p)}
    }
    return {bodies,time:0,phase:'primordial-plasma',nextId:id,seed:options.seed||20261116,stats:{nuclei:0,atoms:0,clouds:0,starsBorn:0,starsDead:0,supernovae:0,whiteDwarfs:0,neutronStars:0,blackHoles:0,ejectedMass:0},width:960,height:620,randomState:0};
  }
  function totalBaryons(bodies){return bodies.reduce((n,b)=>n+(b.kind==='proton'||b.kind==='neutron'?1:b.kind==='nucleus'||b.kind==='atom'?finite(b.baryons,1):0),0)}
  function mergeNucleons(world,random){
    const free=world.bodies.filter(b=>b.kind==='proton'||b.kind==='neutron'),used=new Set(),made=[];
    for(const p of free){if(used.has(p.id))continue;let best=null,bd=58;
      for(const q of free){if(q===p||used.has(q.id)||q.kind===p.kind)continue;const d=Math.hypot(q.x-p.x,q.y-p.y);if(d<bd){bd=d;best=q}}
      if(!best||random()>clamp(.68+(.58-bd/100),.45,.9))continue;
      used.add(p.id);used.add(best.id);const proton=p.kind==='proton'?p:best,neutron=p.kind==='neutron'?p:best;
      const n=body('p'+world.nextId++,'nucleus',(p.x+best.x)/2,(p.y+best.y)/2,2,{baryons:2,protons:1,neutrons:1,element:'H',isotope:'deuterium',composition:{...composition(),H:2},temperature:(p.temperature+best.temperature)*.5});
      n.vx=(p.vx+best.vx)/2;n.vy=(p.vy+best.vy)/2;made.push(n);
    }
    world.bodies=world.bodies.filter(b=>!used.has(b.id)).concat(made);
  }
  function combineNuclei(world,random){
    const nuclei=world.bodies.filter(b=>b.kind==='nucleus'),used=new Set(),made=[];
    for(const a of nuclei){if(used.has(a.id))continue;let partner=null,dist=26;
      for(const b of nuclei){if(a===b||used.has(b.id))continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<dist){dist=d;partner=b}}
      if(!partner||random()>.24)continue;
      const p=a.protons+partner.protons,n=a.neutrons+partner.neutrons;
      if(p>3||n>3||p+n>4)continue;
      used.add(a.id);used.add(partner.id);
      const el=p===2&&n===2?'He':p===2?'He':p===3?'Li':'H';
      const c=composition();c[el]=(a.baryons+partner.baryons);
      const nu=body('p'+world.nextId++,'nucleus',(a.x+partner.x)/2,(a.y+partner.y)/2,a.mass+partner.mass,{baryons:a.baryons+partner.baryons,protons:p,neutrons:n,element:el,isotope:el==='He'?(n===2?'helium-4':'helium-3'):el==='Li'?'lithium-7':'deuterium',composition:c,temperature:(a.temperature+partner.temperature)*.5});
      nu.vx=(a.vx+partner.vx)/2;nu.vy=(a.vy+partner.vy)/2;made.push(nu);
    }
    world.bodies=world.bodies.filter(b=>!used.has(b.id)).concat(made);
  }
  function recombine(world){
    for(const b of world.bodies){if(b.kind==='nucleus'){b.kind='atom';b.electrons=Math.max(0,b.protons);b.charge=b.protons-b.electrons;b.radius+=1;world.stats.atoms++;}}
    world.phase='primordial-gas';
  }
  function gravityStep(world,dt){
    const bodies=world.bodies,ax=new Float64Array(bodies.length),ay=new Float64Array(bodies.length),G=8,soft=18;
    for(let i=0;i<bodies.length;i++){const a=bodies[i];if(a.kind==='electron'||a.kind==='proton'||a.kind==='neutron')continue;
      for(let j=i+1;j<bodies.length;j++){const b=bodies[j];if(b.kind==='electron'||b.kind==='proton'||b.kind==='neutron')continue;
        const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy+soft*soft,d=Math.sqrt(d2),f=G*a.mass*b.mass/(d2*d);
        ax[i]+=f*dx/Math.max(a.mass,.01);ay[i]+=f*dy/Math.max(a.mass,.01);ax[j]-=f*dx/Math.max(b.mass,.01);ay[j]-=f*dy/Math.max(b.mass,.01);
      }
    }
    for(let i=0;i<bodies.length;i++){const b=bodies[i];if(b.kind==='electron'||b.kind==='proton'||b.kind==='neutron')continue;
      b.vx=(b.vx+ax[i]*dt)*.999;b.vy=(b.vy+ay[i]*dt)*.999;b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.x<4||b.x>world.width-4)b.vx*=-.8;if(b.y<4||b.y>world.height-4)b.vy*=-.8;
      b.x=clamp(b.x,4,world.width-4);b.y=clamp(b.y,4,world.height-4);
    }
  }
  function formClouds(world,random){
    const atoms=world.bodies.filter(b=>b.kind==='atom'),used=new Set(),clouds=[];
    for(const a of atoms){if(used.has(a.id))continue;const group=[a];
      for(const b of atoms){if(used.has(b.id))continue;if(group.length>=7)break;if(Math.hypot(a.x-b.x,a.y-b.y)<52&&random()<.7){group.push(b)}}
      if(group.length<4)continue;group.forEach(item=>used.add(item.id));
      const mass=group.reduce((n,b)=>n+b.mass,0),c=group.reduce((o,b)=>addComposition(o,b.composition),composition());
      const x=group.reduce((n,b)=>n+b.x*b.mass,0)/mass,y=group.reduce((n,b)=>n+b.y*b.mass,0)/mass;
      const cloud=body('p'+world.nextId++,'gas',x,y,mass,{composition:c,temperature:.7,metallicity:(c.C+c.O+c.Fe)/Math.max(1,mass)});cloud.vx=group.reduce((n,b)=>n+b.vx,0)/group.length;cloud.vy=group.reduce((n,b)=>n+b.vy,0)/group.length;clouds.push(cloud);
    }
    world.bodies=world.bodies.filter(b=>!used.has(b.id)).concat(clouds);world.stats.clouds+=clouds.length;
  }
  function formStars(world,random){
    const gas=world.bodies.filter(b=>b.kind==='gas'),used=new Set(),stars=[];
    for(const a of gas){if(used.has(a.id))continue;const nearby=gas.filter(b=>!used.has(b.id)&&Math.hypot(a.x-b.x,a.y-b.y)<105);
      if(nearby.length<2||random()>.08)continue;
      const group=nearby.slice(0,Math.min(nearby.length,12));group.forEach(b=>used.add(b.id));
      const mass=group.reduce((n,b)=>n+b.mass,0),c=group.reduce((o,b)=>addComposition(o,b.composition),composition());
      const star=body('p'+world.nextId++,'star',group.reduce((n,b)=>n+b.x*b.mass,0)/mass,group.reduce((n,b)=>n+b.y*b.mass,0)/mass,mass,{composition:c,initialMass:mass,luminosity:Math.pow(mass,.8),temperature:Math.pow(mass,.35),metallicity:(c.C+c.O+c.Fe)/Math.max(1,mass),stage:mass<1.2?'red-dwarf':'main-sequence',fuel:mass*1.2,lifeExpectancy:clamp(180/Math.pow(Math.max(.5,mass),1.7),12,420),windClock:0,remnant:null});
      star.vx=group.reduce((n,b)=>n+b.vx*b.mass,0)/mass;star.vy=group.reduce((n,b)=>n+b.vy*b.mass,0)/mass;stars.push(star);
    }
    world.bodies=world.bodies.filter(b=>!used.has(b.id)).concat(stars);world.stats.starsBorn+=stars.length;
  }
  function eject(world,star,amount,compositionVector,velocity,kind='gas'){
    const n=kind==='supernova'?30:3,share=amount/n;
    for(let i=0;i<n;i++){const a=(Math.PI*2*i/n)+((i%3)*.07),speed=velocity*(.78+(i%5)*.11),c=composition();for(const k of Object.keys(c))c[k]=finite(compositionVector[k])*share/Math.max(.0001,massOf(compositionVector));
      const b=body('p'+world.nextId++,kind==='supernova'?'ejecta':'gas',star.x+Math.cos(a)*star.radius,star.y+Math.sin(a)*star.radius,share,{composition:c,metallicity:star.metallicity,temperature:kind==='supernova'?3:.9,origin:star.id,shock:kind==='supernova'?1:0});
      b.vx=star.vx+Math.cos(a)*speed;b.vy=star.vy+Math.sin(a)*speed;world.bodies.push(b);
    }
    world.stats.ejectedMass+=amount;
  }
  function resolveStellarDeath(world,s){
    const mass=finite(s.initialMass,s.mass),base=composition();
    for(const k of Object.keys(base))base[k]=finite(s.composition&&s.composition[k]);
    if(mass<2.2){s.kind='remnant';s.remnant='white-dwarf';s.stage='white-dwarf';s.radius=3;s.mass=Math.max(.4,mass*.55);world.stats.whiteDwarfs++;world.stats.starsDead++;}
    else if(mass<8){s.kind='remnant';s.remnant='neutron-star';s.stage='neutron-star';s.radius=4;s.mass=1.4;world.stats.neutronStars++;world.stats.starsDead++;eject(world,s,Math.max(0,mass-1.4),base,3,'supernova');world.stats.supernovae++;}
    else if(mass<19){s.kind='remnant';s.remnant='black-hole';s.stage='black-hole';s.radius=6;s.mass=Math.max(3,mass*.35);world.stats.blackHoles++;world.stats.starsDead++;eject(world,s,Math.max(0,mass-s.mass),base,4,'supernova');world.stats.supernovae++;}
    else{s.kind='remnant';s.remnant='black-hole';s.stage='black-hole';s.radius=7;s.mass=Math.max(5,mass*.65);world.stats.blackHoles++;world.stats.starsDead++;eject(world,s,Math.max(0,mass-s.mass),base,1.4,'wind');}
    return s;
  }
  function stellarEvolution(world,dt,random){
    const additions=[];
    for(const s of world.bodies.filter(b=>b.kind==='star')){
      s.age+=dt;s.fuel=Math.max(0,s.fuel-dt*s.initialMass*.012);s.windClock+=dt;
      if(s.windClock>4){s.windClock=0;const amount=Math.min(s.mass*.003,s.mass*.08);if(amount>.001){const wind=composition();wind.He=amount*.35;wind.C=amount*.08;wind.O=amount*.04;wind.H=amount*.53;eject(world,s,amount,wind,1.1,'wind');s.mass-=amount}}
      if(s.age>s.lifeExpectancy*.55)s.stage='giant';
      if(s.age>=s.lifeExpectancy)resolveStellarDeath(world,s);
    }
  }
  function nucleosynthesis(world,random){
    for(const s of world.bodies.filter(b=>b.kind==='star')){
      const f=clamp(s.age/Math.max(1,s.lifeExpectancy),0,1),m=s.initialMass;
      const burn= Math.min(s.fuel*.002,dtSafe(s.mass)*.0008);
      s.fuel=Math.max(0,s.fuel-burn);
      const made=composition();
      made.He=burn*.55;made.C=burn*(m>1.5?.13:.025);made.O=burn*(m>3?.16:.012);
      made.Ne=burn*(m>5?.045:0);made.Mg=burn*(m>7?.035:0);made.Si=burn*(m>9?.025:0);made.S=burn*(m>10?.018:0);made.Fe=burn*(m>12?.025:0);
      s.composition=addComposition(s.composition,made);
      s.luminosity=Math.max(.1,Math.pow(Math.max(.1,s.mass),3.2)*(1+f*.25));
    }
  }
  function dtSafe(m){return Math.max(.1,Math.min(10,m))}
  function step(world,dt=1/60,options={}){
    if(!world)throw new TypeError('Cosmology world required');
    const random=rng(world.seed+Math.floor(world.time*100000)+1),scale=clamp(finite(options.timeScale,4),1,200),elapsed=clamp(dt,0,.05)*scale;
    world.time+=elapsed;
    if(world.time<.35){world.phase='primordial-plasma';mergeNucleons(world,random);if(world.time>.16)combineNuclei(world,random)}
    else if(world.time<.7){world.phase='recombination';recombine(world)}
    else if(world.time<1.1){world.phase='primordial-gas';if(world.time>.85)formClouds(world,random)}
    else{world.phase='stellar-era';if(world.time%1.4<elapsed)formStars(world,random);gravityStep(world,dt,options);nucleosynthesis(world,random);stellarEvolution(world,elapsed,random)}
    world.bodies=world.bodies.filter(b=>b.mass>.00001&&Number.isFinite(b.x)&&Number.isFinite(b.y));
    if(world.bodies.length>900)world.bodies=world.bodies.slice(-900);
    return summary(world);
  }
  function summary(w){
    const count=k=>w.bodies.filter(b=>b.kind===k).length;
    return {time:w.time,phase:w.phase,bodyCount:w.bodies.length,protons:count('proton'),neutrons:count('neutron'),electrons:count('electron'),nuclei:count('nucleus'),atoms:count('atom'),gas:count('gas'),ejecta:count('ejecta'),stars:count('star'),remnants:count('remnant'),stats:{...w.stats},elements:w.bodies.reduce((o,b)=>{for(const [k,v] of Object.entries(b.composition||{}))o[k]=(o[k]||0)+v;return o},{})};
  }
  function snapshot(w){return clone(w)}
  function restore(s){if(!s||!Array.isArray(s.bodies))throw new TypeError('Invalid cosmology snapshot');return clone(s)}
  return {createWorld,step,summary,snapshot,restore,totalBaryons,addComposition,massOf,resolveStellarDeath};
});
