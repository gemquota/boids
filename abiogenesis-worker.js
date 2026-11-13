'use strict';
importScripts('abiogenesis.js?v=20261113-abiogenesis-physics-v3');

let world=null,random=null;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function summary(){
  return {time:world.time,stats:world.stats,particleCount:world.particles.length,bondCount:world.bonds.length};
}

onmessage=event=>{
  const message=event.data||{};
  try{
    if(message.type==='abiogenesis:init'){
      random=BoidsAbiogenesis.createSeededRandom(message.seed??1);
      world=BoidsAbiogenesis.createParticleWorld(message.particles||[],{bonds:message.bonds||[],time:message.time||0});
      postMessage({type:'abiogenesis:ready',...summary()});
      return;
    }
    if(message.type==='abiogenesis:step'){
      if(!world||!random)throw new Error('Abiogenesis world has not been initialized');
      const steps=clamp(Math.floor(Number(message.steps)||1),1,240);
      const dt=clamp(Number(message.dt)||1/60,.0001,.05);
      const options={...(message.options||{}),random};
      let stats=world.stats;
      for(let i=0;i<steps;i++)stats=BoidsAbiogenesis.stepParticleWorld(world,dt,options);
      postMessage({type:'abiogenesis:frame',...summary(),randomState:random.state,
        world:message.includeWorld?BoidsAbiogenesis.snapshotParticleWorld(world):undefined});
      return;
    }
    if(message.type==='abiogenesis:snapshot'){
      if(!world||!random)throw new Error('Abiogenesis world has not been initialized');
      postMessage({type:'abiogenesis:snapshot',requestId:message.requestId,
        world:BoidsAbiogenesis.snapshotParticleWorld(world),randomState:random.state});
      return;
    }
    if(message.type==='abiogenesis:restore'){
      world=BoidsAbiogenesis.restoreParticleWorld(message.world);
      random=BoidsAbiogenesis.createSeededRandom(message.randomState);
      postMessage({type:'abiogenesis:ready',...summary()});
      return;
    }
    postMessage({type:'abiogenesis:error',message:'Unknown abiogenesis worker message'});
  }catch(error){
    postMessage({type:'abiogenesis:error',message:error&&error.message?error.message:String(error),requestId:message.requestId});
  }
};
