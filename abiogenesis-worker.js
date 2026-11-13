'use strict';
importScripts('abiogenesis.js?v=20261113-resource-clouds-v1');

let world=null,random=null;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function summary(){
  return {time:world.time,stats:world.stats,particleCount:world.particles.length,bondCount:world.bonds.length,moleculeCount:(world.molecules||[]).length,resourceCloudCount:(world.resourceClouds||[]).length,carriedParticleCount:(world.resourceClouds||[]).reduce((n,c)=>n+c.particleIds.length,0),energySourceCount:(world.energySources||[]).length,compartmentCount:(world.compartments||[]).length};
}

onmessage=event=>{
  const message=event.data||{};
  try{
    if(message.type==='abiogenesis:init'){
      random=BoidsAbiogenesis.createSeededRandom(message.seed??1);
      world=BoidsAbiogenesis.createParticleWorld(message.particles||[],{bonds:message.bonds||[],resourceClouds:message.resourceClouds||[],molecules:message.molecules||[],energySources:message.energySources||[],compartments:message.compartments||[],time:message.time||0});
      postMessage({type:'abiogenesis:ready',...summary()});
      return;
    }
    if(message.type==='abiogenesis:compartment-create'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const compartment=BoidsAbiogenesis.createCompartment(world,message.cloudId,message.options||{});
      postMessage({type:'abiogenesis:compartment-created',requestId:message.requestId,compartment,world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:compartment-grow'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const result=BoidsAbiogenesis.growCompartment(world,message.cloudId,message.compartmentId,message.lipidMoleculeIds||[],message.options||{});
      postMessage({type:'abiogenesis:compartment-grown',requestId:message.requestId,result,world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:compartment-divide'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const result=BoidsAbiogenesis.divideCompartment(world,message.cloudId,message.compartmentId,message.options||{});
      postMessage({type:'abiogenesis:compartment-divided',requestId:message.requestId,result,world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:exchange'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const result=BoidsAbiogenesis.exchangeResource(world,message.fromCloudId,message.toCloudId,message.particleId,message.anchors,message.options||{});
      postMessage({type:'abiogenesis:exchange-result',requestId:message.requestId,result,world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:diffuse'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const transfers=BoidsAbiogenesis.diffuseResources(world,message.anchors,message.options||{});
      postMessage({type:'abiogenesis:diffused',requestId:message.requestId,transfers,world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:harvest'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const result=BoidsAbiogenesis.harvestEnergy(world,message.cloudId,message.sourceId,message.amount);
      postMessage({type:'abiogenesis:harvested',requestId:message.requestId,result,inventory:BoidsAbiogenesis.resourceInventory(world,message.cloudId),world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:metabolize'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const result=BoidsAbiogenesis.metabolizeMolecules(world,message.cloudId,message.inputMoleculeIds||[],message.outputs||[],message.options||{});
      postMessage({type:'abiogenesis:metabolized',requestId:message.requestId,result,inventory:BoidsAbiogenesis.resourceInventory(world,message.cloudId),world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:collect'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const collected=BoidsAbiogenesis.collectResources(world,message.cloudId,message.anchor,message.options||{});
      const inventory=BoidsAbiogenesis.resourceInventory(world,message.cloudId);
      postMessage({type:'abiogenesis:inventory',requestId:message.requestId,collected,inventory,world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:inventory'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      postMessage({type:'abiogenesis:inventory',requestId:message.requestId,inventory:BoidsAbiogenesis.resourceInventory(world,message.cloudId),world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:craft'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const molecule=BoidsAbiogenesis.craftMolecule(world,message.cloudId,message.atomIds||[],message.bonds||[],message.options||{});
      postMessage({type:'abiogenesis:crafted',requestId:message.requestId,molecule,inventory:BoidsAbiogenesis.resourceInventory(world,message.cloudId),world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:react'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const result=BoidsAbiogenesis.rearrangeMolecules(world,message.cloudId,message.inputMoleculeIds||[],message.outputs||[],message.options||{});
      postMessage({type:'abiogenesis:reacted',requestId:message.requestId,result,inventory:BoidsAbiogenesis.resourceInventory(world,message.cloudId),world:BoidsAbiogenesis.snapshotParticleWorld(world),...summary()});
      return;
    }
    if(message.type==='abiogenesis:transfer'){
      if(!world)throw new Error('Abiogenesis world has not been initialized');
      const transferred=BoidsAbiogenesis.transferResource(world,message.fromCloudId,message.toCloudId,message.particleId);
      postMessage({type:'abiogenesis:transferred',requestId:message.requestId,transferred,...summary()});
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
