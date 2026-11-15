/* Coupled watershed, groundwater, rainfall and tidal-coast simulation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsHydrology=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function hash(seed,x,y,k=0){let n=(seed>>>0)^Math.imul((x+1)|0,0x9e3779b1)^Math.imul((y+1)|0,0x85ebca77)^Math.imul((k+1)|0,0xc2b2ae3d);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);n^=n>>>16;return(n>>>0)/4294967295}
function gaussian(x,y,cx,cy,sx,sy){return Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2)*.5)}
function create(width,height,seed=1,options={}){
 const cols=Math.max(24,Math.min(256,Math.floor(options.cols||144))),rows=Math.max(16,Math.min(192,Math.floor(options.rows||96))),n=cols*rows;
 const s={width,height,cols,rows,seed:seed>>>0,cellW:width/(cols-1),cellH:height/(rows-1),time:0,tidePeriod:options.tidePeriod??180,tideAmplitude:options.tideAmplitude??.075,stormPeriod:options.stormPeriod??92,reliefScale:options.reliefScale??1,coastDepth:options.coastDepth??.22,channelIncision:options.channelIncision??.09,terrainNoise:options.terrainNoise??.025,rainfallScale:options.rainfallScale??1,infiltrationRate:options.infiltrationRate??.72,watershedDrainage:options.watershedDrainage??1,streamSensitivity:options.streamSensitivity??1};
 for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','floodplain','flow','accumulation','coastDistance','filledElevation'])s[k]=new Float32Array(n);
 s.downhill=new Int32Array(n);s.downhill.fill(-1);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=y*cols+x,nx=x/(cols-1),ny=y/(rows-1),noise=hash(s.seed,x,y,0)-.5;
  const highA=gaussian(nx,ny,.29,.19,.19,.18),highB=gaussian(nx,ny,.73,.73,.2,.19),ridge=gaussian(nx,ny,.54,.42,.28,.12);
  const coastA=Math.exp(-((nx/.22)**2+(ny/.2)**2)*.5),coastB=Math.exp(-(((1-nx)/.22)**2+((1-ny)/.2)**2)*.5);
  const river=ny-(.52+.14*Math.sin(nx*Math.PI*1.6)+.06*Math.sin(nx*Math.PI*4.2+.8));
  let elev=.23+(highA*.48+highB*.43+ridge*.12)*s.reliefScale-Math.max(coastA,coastB)*s.coastDepth-Math.exp(-((river/.13)**2))*s.channelIncision+noise*s.terrainNoise;
  elev=clamp(elev,.035,.92);s.elevation[i]=elev;
  const coastDist=Math.min(Math.hypot(nx,ny),Math.hypot(1-nx,1-ny));s.coastDistance[i]=coastDist;
  s.soil[i]=.24+hash(s.seed,x,y,1)*.08;s.groundwater[i]=clamp(.16+(1-elev)*.18);s.salinity[i]=0;
 }
 // Priority-flood depression filling. Each cell receives a parent that leads
 // monotonically toward the boundary, preventing closed D8 sinks and broken catchments.
 const heap=[],push=(item)=>{let i=heap.length;heap.push(item);while(i){const p=(i-1)>>1;if(heap[p].z<=item.z)break;heap[i]=heap[p];i=p}heap[i]=item},pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let l=i*2+1,r=l+1,b=i;if(l<heap.length&&heap[l].z<heap[b].z)b=l;if(r<heap.length&&heap[r].z<heap[b].z)b=r;if(b===i)break;heap[i]=heap[b];i=b}heap[i]=last}return top};
 const visited=new Uint8Array(n);
 for(let x=0;x<cols;x++)for(const y of [0,rows-1]){const i=y*cols+x;if(!visited[i]){visited[i]=1;s.filledElevation[i]=s.elevation[i];push({i,z:s.filledElevation[i]})}}
 for(let y=1;y<rows-1;y++)for(const x of [0,cols-1]){const i=y*cols+x;if(!visited[i]){visited[i]=1;s.filledElevation[i]=s.elevation[i];push({i,z:s.filledElevation[i]})}}
 while(heap.length){const current=pop(),i=current.i,x=i%cols,y=(i/cols)|0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy;if(xx<0||yy<0||xx>=cols||yy>=rows)continue;const j=yy*cols+xx;if(visited[j])continue;visited[j]=1;s.downhill[j]=i;s.filledElevation[j]=Math.max(s.elevation[j],current.z+1e-7);push({i:j,z:s.filledElevation[j]})}}
 const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>s.filledElevation[b]-s.filledElevation[a]||b-a);
 for(let i=0;i<n;i++)s.accumulation[i]=1;
 for(const i of order){const j=s.downhill[i];if(j>=0)s.accumulation[j]+=s.accumulation[i]}
 s.streamThreshold=Math.max(3,cols*rows*.0028/Math.max(.2,s.streamSensitivity));s.order=order;s.rainPotential=new Float32Array(n);s.nextSurface=new Float32Array(n);s.nextGround=new Float32Array(n);
 for(let i=0;i<n;i++){const e=s.elevation[i],a=s.accumulation[i]/n,down=s.downhill[i],slope=down>=0?Math.max(0,s.filledElevation[i]-s.filledElevation[down]):0;s.rainPotential[i]=clamp(.58+e*.9+Math.max(0,e-.42)*1.5,.45,2.1)*(.55+.45*hash(s.seed,i%s.cols,(i/s.cols)|0,3));s.floodplain[i]=clamp(Math.log1p(s.accumulation[i])/Math.log1p(n)*1.8)*clamp(1-slope*18)*clamp((.62-e)*2.2);s.flow[i]=clamp(a*8)*(0.35+clamp(slope*35)*.65)}
 return s;
}
function step(s,dt,time=s.time+dt){
 dt=clamp(dt,0,.25);s.time=time;
 const tide=.09+Math.sin(time*Math.PI*2/s.tidePeriod)*s.tideAmplitude;
 const storm=.5+.5*Math.sin(time*Math.PI*2/s.stormPeriod-.9),pulse=Math.pow(Math.max(0,storm),5);
 const rainBase=(.0008+pulse*.014)*s.rainfallScale;
 const nextSurface=s.nextSurface,nextGround=s.nextGround;nextSurface.set(s.surface);nextGround.set(s.groundwater);
 for(let i=0;i<s.elevation.length;i++){
  const e=s.elevation[i];
  const rain=rainBase*s.rainPotential[i];s.rainfall[i]=rain;
  const coast=s.coastDistance[i],tidal=coast<.19?clamp((tide-e+.045)/.12)*clamp(1-coast/.2):0;
  const fresh=clamp(s.surface[i]+s.groundwater[i]*.45);
  const soil=s.soil[i],infiltration=Math.min(rain*dt*s.infiltrationRate,Math.max(0,1-soil)*.018*dt);
  let saturation=clamp(soil+infiltration*2.8-dt*(.0008+soil*.0012));
  const excess=Math.max(0,soil-.68)*.012+Math.max(0,rain-infiltration)*.24;
  let surface=Math.max(0,s.surface[i]+(excess+tidal*.004)*dt);
  const evaporation=(.00025+Math.max(0,.5-e)*.0002)*dt;
  let groundwater=clamp(s.groundwater[i]+infiltration*.42*dt-evaporation);
  const down=s.downhill[i],slope=down>=0?Math.max(0,e-s.elevation[down]):0;
  const drainage=Math.min(surface, surface*(.08+slope*1.8)*dt*s.watershedDrainage*s.watershedDrainage);
  surface-=drainage;
  nextSurface[i]=surface;nextGround[i]=groundwater;
  s.soil[i]=saturation;
  s.salinity[i]=clamp(Math.max(s.salinity[i]*Math.max(0,1-dt*.012),tidal*.92+Math.max(0,.25-fresh)*.08));
  const floodplain=s.floodplain[i]||0,channelWet=clamp(surface*3.2+Math.max(0,groundwater-.36)*2.4+tidal*.72);s.flood[i]=clamp(Math.max(channelWet,floodplain*clamp(.12+rain*28+surface*3)*.72));
 }
 // Route runoff one cell downhill in elevation order; preserve water volume at closed depressions.
 for(const i of s.order){const down=s.downhill[i];if(down<0)continue;const x=i%s.cols,y=(i/s.cols)|0,e=s.elevation[i],slope=Math.max(0,e-s.elevation[down]),flow=Math.min(nextSurface[i],nextSurface[i]*(.12+slope*2.4)*dt);if(flow>0){nextSurface[i]-=flow;nextSurface[down]+=flow}}
 // Groundwater slowly follows the same watershed, feeding channels and floodplain soils.
 for(const i of s.order){const down=s.downhill[i];if(down<0)continue;const flow=Math.max(0,nextGround[i]-.22)*.018*dt;if(flow>0){nextGround[i]-=flow;nextGround[down]=clamp(nextGround[down]+flow*.92)}}
 s.surface.set(nextSurface);s.groundwater.set(nextGround);
 return s;
}
function sample(s,x,y,out={}){
 const gx=clamp(x/s.width*(s.cols-1),0,s.cols-1),gy=clamp(y/s.height*(s.rows-1),0,s.rows-1),x0=Math.floor(gx),y0=Math.floor(gy),x1=Math.min(s.cols-1,x0+1),y1=Math.min(s.rows-1,y0+1),tx=gx-x0,ty=gy-y0;
 for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','floodplain','flow','accumulation','coastDistance']){const a=s[k],v0=a[y0*s.cols+x0]*(1-tx)+a[y0*s.cols+x1]*tx,v1=a[y1*s.cols+x0]*(1-tx)+a[y1*s.cols+x1]*tx;out[k]=v0*(1-ty)+v1*ty}
 out.tidalDepth=out.coastDistance<.2?Math.max(0,.09+Math.sin(s.time*Math.PI*2/s.tidePeriod)*s.tideAmplitude-out.elevation+.045)*clamp(1-out.coastDistance/.2):0;
 out.wetness=clamp(out.soil*.65+out.groundwater*.45+out.surface*2+out.flood*.3);return out;
}
function consumeWater(s,x,y,amount){const gx=clamp(x/s.width*(s.cols-1),0,s.cols-1),gy=clamp(y/s.height*(s.rows-1),0,s.rows-1),ix=Math.round(gx),iy=Math.round(gy),i=iy*s.cols+ix,need=Math.max(0,Number(amount)||0),available=s.soil[i]*.65+s.groundwater[i]*.3+s.surface[i]*2,taken=Math.min(need,available);if(need>0&&taken>0){const soilTake=Math.min(s.soil[i],taken*.72);s.soil[i]-=soilTake;const remain=taken-soilTake,groundTake=Math.min(s.groundwater[i],remain*.8);s.groundwater[i]-=groundTake;s.surface[i]=Math.max(0,s.surface[i]-Math.max(0,remain-groundTake)*.5)}return need>0?taken/need:1}
function streamSegments(s){
 const out=[],threshold=s.streamThreshold;
 for(let i=0;i<s.downhill.length;i++){const j=s.downhill[i];if(j<0||s.accumulation[i]<threshold)continue;const x=i%s.cols,y=(i/s.cols)|0,xx=j%s.cols,yy=(j/s.cols)|0;out.push({x:x*s.cellW,y:y*s.cellH,x2:xx*s.cellW,y2:yy*s.cellH,width:Math.min(5,.55+Math.sqrt(s.accumulation[i]/threshold)*.62),accumulation:s.accumulation[i],floodplain:s.floodplain[i],flow:s.flow[i]})}
 return out;
}
function serialize(s){if(!s)return null;const o={width:s.width,height:s.height,cols:s.cols,rows:s.rows,seed:s.seed,time:s.time,tidePeriod:s.tidePeriod,tideAmplitude:s.tideAmplitude,stormPeriod:s.stormPeriod,reliefScale:s.reliefScale,coastDepth:s.coastDepth,channelIncision:s.channelIncision,terrainNoise:s.terrainNoise,rainfallScale:s.rainfallScale,infiltrationRate:s.infiltrationRate,watershedDrainage:s.watershedDrainage,streamSensitivity:s.streamSensitivity};for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','floodplain','flow','accumulation','coastDistance','downhill'])o[k]=Array.from(s[k]);return o}
function restore(d,width,height,seed=1){if(!d||d.width!==width||d.height!==height||!Number.isInteger(d.cols)||!Array.isArray(d.elevation))return create(width,height,seed);const s=create(width,height,seed,{cols:d.cols,rows:d.rows,tidePeriod:d.tidePeriod,tideAmplitude:d.tideAmplitude,stormPeriod:d.stormPeriod,reliefScale:d.reliefScale,coastDepth:d.coastDepth,channelIncision:d.channelIncision,terrainNoise:d.terrainNoise,rainfallScale:d.rainfallScale,infiltrationRate:d.infiltrationRate,watershedDrainage:d.watershedDrainage,streamSensitivity:d.streamSensitivity});for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','floodplain','flow','accumulation','coastDistance','downhill'])if(Array.isArray(d[k])&&d[k].length===s[k].length)s[k].set(d[k]);s.time=Number(d.time)||0;return s}
return Object.freeze({create,step,sample,consumeWater,streamSegments,serialize,restore});
});