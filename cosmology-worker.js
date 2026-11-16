'use strict';
importScripts('cosmology.js?v=20261116-stellar-era');
let world=null;
onmessage=e=>{const m=e.data||{};try{
 if(m.type==='cosmos:init'){world=BoidsCosmology.createWorld(m.options||{});postMessage({type:'cosmos:ready',summary:BoidsCosmology.summary(world),world:BoidsCosmology.snapshot(world)});return}
 if(m.type==='cosmos:restore'){world=BoidsCosmology.restore(m.world);postMessage({type:'cosmos:ready',summary:BoidsCosmology.summary(world),world:BoidsCosmology.snapshot(world)});return}
 if(m.type==='cosmos:step'){if(!world)throw new Error('Cosmology world is not initialised');const n=Math.max(1,Math.min(120,Math.floor(m.steps||1)));let summary;for(let i=0;i<n;i++)summary=BoidsCosmology.step(world,m.dt||1/60,m.options||{});postMessage({type:'cosmos:frame',summary,world:BoidsCosmology.snapshot(world)});return}
 if(m.type==='cosmos:snapshot'){if(!world)throw new Error('Cosmology world is not initialised');postMessage({type:'cosmos:snapshot',world:BoidsCosmology.snapshot(world)});return}
 throw new Error('Unknown cosmology message: '+m.type);
}catch(error){postMessage({type:'cosmos:error',message:error.message||String(error)})}};
