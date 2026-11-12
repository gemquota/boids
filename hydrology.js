/* Coupled watershed, groundwater, rainfall and tidal-coast simulation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsHydrology=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function hash(seed,x,y,k=0){let n=(seed>>>0)^Math.imul((x+1)|0,0x9e3779b1)^Math.imul((y+1)|0,0x85ebca77)^Math.imul((k+1)|0,0xc2b2ae3d);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);n^=n>>>16;return(n>>>0)/4294967295}
function gaussian(x,y,cx,cy,sx,sy){return Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2)*.5)}
function create(width,height,seed=1,options={}){
 const cols=Math.max(20,Math.min(72,Math.floor(options.cols||40))),rows=Math.max(16,Math.min(56,Math.floor(options.rows||30))),n=cols*rows;
 const s={width,height,cols,rows,seed:seed>>>0,cellW:width/(cols-1),cellH:height/(rows-1),time:0,tidePeriod:options.tidePeriod||180,tideAmplitude:options.tideAmplitude||.075,stormPeriod:options.stormPeriod||92};
 for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','accumulation','coastDistance'])s[k]=new Float32Array(n);
 s.downhill=new Int32Array(n);s.downhill.fill(-1);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=y*cols+x,nx=x/(cols-1),ny=y/(rows-1),noise=hash(s.seed,x,y,0)-.5;
  const highA=gaussian(nx,ny,.29,.19,.19,.18),highB=gaussian(nx,ny,.73,.73,.2,.19),ridge=gaussian(nx,ny,.54,.42,.28,.12);
  const coastA=Math.exp(-((nx/.22)**2+(ny/.2)**2)*.5),coastB=Math.exp(-(((1-nx)/.22)**2+((1-ny)/.2)**2)*.5);
  const river=ny-(.52+.14*Math.sin(nx*Math.PI*1.6)+.06*Math.sin(nx*Math.PI*4.2+.8));
  let elev=.23+highA*.48+highB*.43+ridge*.12-Math.max(coastA,coastB)*.22-Math.exp(-(river/.13)**2)*.09+noise*.025;
  elev=clamp(elev,.035,.92);s.elevation[i]=elev;
  const coastDist=Math.min(Math.hypot(nx,ny),Math.hypot(1-nx,1-ny));s.coastDistance[i]=coastDist;
  s.soil[i]=.24+hash(s.seed,x,y,1)*.08;s.groundwater[i]=clamp(.16+(1-elev)*.18);s.salinity[i]=0;
 }
 // D8 drainage follows the lowest neighbouring terrain cell. Tiny deterministic tie-breaks prevent flat loops.
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const i=y*cols+x,e=s.elevation[i];let best=-1,bestScore=e;
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy;if(xx<0||yy<0||xx>=cols||yy>=rows)continue;const j=yy*cols+xx,score=s.elevation[j]-(j<i?1e-7:0);if(score<bestScore){bestScore=score;best=j}}
  s.downhill[i]=best;
 }
 // Accumulate upstream area in descending elevation order.
 const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>s.elevation[b]-s.elevation[a]);for(let i=0;i<n;i++)s.accumulation[i]=1;
 for(const i of order){const j=s.downhill[i];if(j>=0)s.accumulation[j]+=s.accumulation[i]}
 s.streamThreshold=Math.max(5,cols*rows*.0035);s.order=order;
 return s;
}
function step(s,dt,time=s.time+dt){
 dt=clamp(dt,0,.25);s.time=time;
 const tide=.09+Math.sin(time*Math.PI*2/s.tidePeriod)*s.tideAmplitude;
 const storm=.5+.5*Math.sin(time*Math.PI*2/s.stormPeriod-.9),pulse=Math.pow(Math.max(0,storm),5);
 const rainBase=.0008+pulse*.014;
 const nextSurface=new Float32Array(s.surface.length),nextGround=new Float32Array(s.groundwater.length);
 for(let i=0;i<s.elevation.length;i++){
  const x=i%s.cols,y=(i/s.cols)|0,nx=x/(s.cols-1),ny=y/(s.rows-1),e=s.elevation[i];
  const orographic=clamp(.58+e*.9+Math.max(0,e-.42)*1.5,.45,2.1);
  const rain=rainBase*orographic*(.55+.45*hash(s.seed,x,y,3));s.rainfall[i]=rain;
  const coast=s.coastDistance[i],tidal=coast<.19?clamp((tide-e+.045)/.12)*clamp(1-coast/.2):0;
  const fresh=clamp(s.surface[i]+s.groundwater[i]*.45);
  const soil=s.soil[i],infiltration=Math.min(rain*dt*.72,Math.max(0,1-soil)*.018*dt);
  let saturation=clamp(soil+infiltration*2.8-dt*(.0008+soil*.0012));
  const excess=Math.max(0,soil-.68)*.012+Math.max(0,rain-infiltration)*.24;
  let surface=Math.max(0,s.surface[i]+(excess+tidal*.004)*dt);
  const evaporation=(.00025+Math.max(0,.5-e)*.0002)*dt;
  let groundwater=clamp(s.groundwater[i]+infiltration*.42*dt-evaporation);
  const down=s.downhill[i],slope=down>=0?Math.max(0,e-s.elevation[down]):0;
  const drainage=Math.min(surface, surface*(.08+slope*1.8)*dt);
  surface-=drainage;
  nextSurface[i]=surface;nextGround[i]=groundwater;
  s.soil[i]=saturation;
  s.salinity[i]=clamp(Math.max(s.salinity[i]*Math.max(0,1-dt*.012),tidal*.92+Math.max(0,.25-fresh)*.08));
  s.flood[i]=clamp(Math.max(surface*2.8,Math.max(0,groundwater-.39)*2.2,tidal*.72));
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
 for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','accumulation','coastDistance']){const a=s[k],v0=a[y0*s.cols+x0]*(1-tx)+a[y0*s.cols+x1]*tx,v1=a[y1*s.cols+x0]*(1-tx)+a[y1*s.cols+x1]*tx;out[k]=v0*(1-ty)+v1*ty}
 out.tidalDepth=out.coastDistance<.2?Math.max(0,.09+Math.sin(s.time*Math.PI*2/s.tidePeriod)*s.tideAmplitude-out.elevation+.045)*clamp(1-out.coastDistance/.2):0;
 out.wetness=clamp(out.soil*.65+out.groundwater*.45+out.surface*2+out.flood*.3);return out;
}
function streamSegments(s){
 const out=[],threshold=s.streamThreshold;
 for(let i=0;i<s.downhill.length;i++){const j=s.downhill[i];if(j<0||s.accumulation[i]<threshold||s.surface[i]<.0008)continue;const x=i%s.cols,y=(i/s.cols)|0,xx=j%s.cols,yy=(j/s.cols)|0;out.push({x:x*s.cellW,y:y*s.cellH,x2:xx*s.cellW,y2:yy*s.cellH,width:Math.min(3.2,.65+s.accumulation[i]/(threshold*3))})}
 return out;
}
function serialize(s){if(!s)return null;const o={width:s.width,height:s.height,cols:s.cols,rows:s.rows,seed:s.seed,time:s.time,tidePeriod:s.tidePeriod,tideAmplitude:s.tideAmplitude,stormPeriod:s.stormPeriod};for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','accumulation','coastDistance','downhill'])o[k]=Array.from(s[k]);return o}
function restore(d,width,height,seed=1){if(!d||d.width!==width||d.height!==height||!Number.isInteger(d.cols)||!Array.isArray(d.elevation))return create(width,height,seed);const s=create(width,height,seed,{cols:d.cols,rows:d.rows,tidePeriod:d.tidePeriod,tideAmplitude:d.tideAmplitude,stormPeriod:d.stormPeriod});for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','accumulation','coastDistance','downhill'])if(Array.isArray(d[k])&&d[k].length===s[k].length)s[k].set(d[k]);s.time=Number(d.time)||0;return s}
return Object.freeze({create,step,sample,streamSegments,serialize,restore});
});