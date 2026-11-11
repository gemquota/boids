/* Deterministic, bounded spatial habitat fields. No global RNG state is consumed. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsEcology=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,Number(value)||0));
const TAU=Math.PI*2;
function hashNoise(seed,x,y,channel){let n=(seed>>>0)^Math.imul((x+1)|0,0x9e3779b1)^Math.imul((y+1)|0,0x85ebca77)^Math.imul((channel+1)|0,0xc2b2ae3d);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);n^=n>>>16;return(n>>>0)/4294967295}
function createFields(width,height,seed=1,options={}){
  const cols=Math.max(4,Math.min(128,Math.floor(options.cols||32))),rows=Math.max(4,Math.min(128,Math.floor(options.rows||24))),count=cols*rows,fields={width:Math.max(1,Number(width)||1),height:Math.max(1,Number(height)||1),cols,rows,seed:seed>>>0};
  for(const key of ['temperature','moisture','nutrients','currentX','currentY','shelter','suitability'])fields[key]=new Float32Array(count);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const i=y*cols+x,nx=x/(cols-1),ny=y/(rows-1),noiseA=hashNoise(fields.seed,x,y,0),noiseB=hashNoise(fields.seed,x,y,1),noiseC=hashNoise(fields.seed,x,y,2);
    const riverCenter=.52+.14*Math.sin(nx*TAU*.8)+.06*Math.sin(nx*TAU*2.1+.8),riverBand=Math.exp(-Math.pow((ny-riverCenter)/.16,2));
    const temperature=clamp(.24+ny*.52+(noiseA-.5)*.18),moisture=clamp(.18+riverBand*.62+(noiseB-.5)*.2),nutrients=clamp(.16+moisture*.44+noiseC*.28);
    const currentX=clamp(.5+(noiseA-.5)*.3+.06*Math.cos(ny*TAU)),currentY=clamp(.5+(noiseB-.5)*.3+.06*Math.sin(nx*TAU));
    const shelter=clamp(noiseC*.34+riverBand*.28),suitability=clamp(.5+moisture*.22+nutrients*.18-Math.abs(temperature-.5)*.25);
    fields.temperature[i]=temperature;fields.moisture[i]=moisture;fields.nutrients[i]=nutrients;fields.currentX[i]=currentX;fields.currentY[i]=currentY;fields.shelter[i]=shelter;fields.suitability[i]=suitability;
  }
  return fields;
}
function sampleArray(fields,array,x,y){const gx=clamp((Number(x)||0)/fields.width*(fields.cols-1),0,fields.cols-1),gy=clamp((Number(y)||0)/fields.height*(fields.rows-1),0,fields.rows-1),x0=Math.floor(gx),y0=Math.floor(gy),x1=Math.min(fields.cols-1,x0+1),y1=Math.min(fields.rows-1,y0+1),tx=gx-x0,ty=gy-y0,a=array[y0*fields.cols+x0],b=array[y0*fields.cols+x1],c=array[y1*fields.cols+x0],d=array[y1*fields.cols+x1],top=a+(b-a)*tx,bottom=c+(d-c)*tx;return top+(bottom-top)*ty}
function sampleFields(fields,x,y,out={}){if(!fields)return out;for(const key of ['temperature','moisture','nutrients','currentX','currentY','shelter','suitability'])out[key]=sampleArray(fields,fields[key],x,y);return out}
function serializeFields(fields){if(!fields)return null;const out={width:fields.width,height:fields.height,cols:fields.cols,rows:fields.rows,seed:fields.seed};for(const key of ['temperature','moisture','nutrients','currentX','currentY','shelter','suitability'])out[key]=Array.from(fields[key]);return out}
function restoreFields(data,width,height,seed=1){if(!data||!Number.isInteger(data.cols)||!Number.isInteger(data.rows)||data.width!==width||data.height!==height)return createFields(width,height,seed);const count=data.cols*data.rows,keys=['temperature','moisture','nutrients','currentX','currentY','shelter','suitability'];if(keys.some(key=>!Array.isArray(data[key])||data[key].length!==count))return createFields(width,height,seed);const fields={width,height,cols:data.cols,rows:data.rows,seed:(data.seed??seed)>>>0};for(const key of keys)fields[key]=Float32Array.from(data[key],value=>clamp(value));return fields}
return Object.freeze({createFields,sampleFields,serializeFields,restoreFields,hashNoise});
});