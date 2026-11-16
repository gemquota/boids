/* Coupled watershed, groundwater, rainfall and tidal-coast simulation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsHydrology=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
function hash(seed,x,y,k=0){let n=(seed>>>0)^Math.imul((x+1)|0,0x9e3779b1)^Math.imul((y+1)|0,0x85ebca77)^Math.imul((k+1)|0,0xc2b2ae3d);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);n^=n>>>16;return(n>>>0)/4294967295}
function gaussian(x,y,cx,cy,sx,sy){return Math.exp(-(((x-cx)/sx)**2+((y-cy)/sy)**2)*.5)}
function cubicPath(w,h,p,steps=180){const o=[],[a,b,c,d]=p;for(let i=0;i<=steps;i++){const t=i/steps,u=1-t;o.push({x:(u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0])*w,y:(u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1])*h})}return o}
function quadraticPath(w,h,a,b,c,steps=96){const o=[];for(let i=0;i<=steps;i++){const t=i/steps,u=1-t;o.push({x:(u*u*a[0]+2*u*t*b[0]+t*t*c[0])*w,y:(u*u*a[1]+2*u*t*b[1]+t*t*c[1])*h})}return o}
function pointOnPath(p,t){const q=clamp(t,0,1)*(p.length-1),i=Math.min(p.length-2,Math.floor(q)),f=q-i,a=p[i],b=p[i+1];return{x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f}}
function channelNetwork(w,h){
 const main=cubicPath(w,h,[[.035,.045],[.12,.47],[.84,.53],[.965,.955]],220),specs=[
 {source:[.045,.44],control:[.075,.30],t:.18},{source:[.34,.035],control:[.30,.16],t:.34},
 {source:[.94,.22],control:[.82,.30],t:.56},{source:[.955,.62],control:[.88,.68],t:.76},
 {source:[.19,.955],control:[.24,.78],t:.47},{source:[.68,.96],control:[.72,.84],t:.86}
 ],tributaries=[],feeders=[],lakes=[];
 for(let i=0;i<specs.length;i++){const v=specs[i],e=pointOnPath(main,v.t),dx=e.x/w-v.source[0],dy=e.y/h-v.source[1],len=Math.hypot(dx*w,dy*h)||1,sign=i%2?1:-1,bend=Math.min(w,h)*(.052+.012*(i%3)),control=[(v.source[0]+e.x/w)*.5-dy*h/len*sign*bend/w,(v.source[1]+e.y/h)*.5+dx*w/len*sign*bend/h];tributaries.push(quadraticPath(w,h,v.source,control,[e.x/w,e.y/h],112))}
 for(let i=0;i<tributaries.length;i++){const p=tributaries[i];for(let j=0;j<2;j++){const t=j?.72:.34,a=pointOnPath(p,t),b=pointOnPath(p,Math.max(0,t-.025)),c=pointOnPath(p,Math.min(1,t+.025)),dx=c.x-b.x,dy=c.y-b.y,len=Math.hypot(dx,dy)||1,sgn=(i+j)%2?1:-1,nx=-dy/len*sgn,ny=dx/len*sgn,d=Math.min(w,h)*(.075+.012*((i+j)%3)),end=[clamp((a.x+nx*d)/w,.025,.975),clamp((a.y+ny*d)/h,.025,.975)],tx=dx/len,ty=dy/len,ctrl=[(end[0]+a.x/w)*.5+tx*d*.62/w,(end[1]+a.y/h)*.5+ty*d*.62/h];feeders.push(quadraticPath(w,h,end,ctrl,[a.x/w,a.y/h],64))}}
 for(const [t,sgn] of [[.405,1],[.685,-1]]){const a=pointOnPath(main,t),b=pointOnPath(main,Math.max(0,t-.015)),c=pointOnPath(main,Math.min(1,t+.015)),dx=c.x-b.x,dy=c.y-b.y,len=Math.hypot(dx,dy)||1,nx=-dy/len*sgn,ny=dx/len*sgn,d=Math.min(w,h)*.043,cx=a.x+nx*d,cy=a.y+ny*d,rx=Math.min(w,h)*.014,ry=Math.min(w,h)*.008;lakes.push({x:cx,y:cy,rx,ry,rotation:Math.atan2(dy,dx)});const tx=dx/len,ty=dy/len;feeders.push(quadraticPath(w,h,[cx/w,cy/h],[(cx+a.x)*.5/w+tx*offset*.62/w,(cy+a.y)*.5/h+ty*offset*.62/h],[a.x/w,a.y/h],32))}
 return{main,tributaries,feeders,lakes}
}
function carveChannel(s,p,radiusCells,depth){const r=Math.max(.45,radiusCells),reach=Math.ceil(r*2.25);for(let k=0;k<p.length-1;k++){const a=p[k],b=p[k+1],ax=a.x/s.cellW,ay=a.y/s.cellH,bx=b.x/s.cellW,by=b.y/s.cellH,steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)*2));for(let z=0;z<=steps;z++){const t=z/steps,gx=ax+(bx-ax)*t,gy=ay+(by-ay)*t,cx=Math.round(gx),cy=Math.round(gy);for(let oy=-reach;oy<=reach;oy++)for(let ox=-reach;ox<=reach;ox++){const x=cx+ox,y=cy+oy;if(x<0||y<0||x>=s.cols||y>=s.rows)continue;const d2=(x-gx)**2+(y-gy)**2;if(d2>reach*reach)continue;const i=y*s.cols+x;s.elevation[i]=Math.max(.025,s.elevation[i]-depth*Math.exp(-.5*d2/(r*r)))}}}}
function buildDrainage(s){const n=s.elevation.length,heap=new Int32Array(n),seen=new Uint8Array(n),popped=new Int32Array(n);let size=0,count=0;const push=i=>{let p=size++;while(p){const q=(p-1)>>1;if(s.filledElevation[heap[q]]<=s.filledElevation[i])break;heap[p]=heap[q];p=q}heap[p]=i};const pop=()=>{const top=heap[0],last=heap[--size];if(size){let p=0;while(true){const l=p*2+1,r=l+1;let b=p;if(l<size&&s.filledElevation[heap[l]]<s.filledElevation[heap[b]])b=l;if(r<size&&s.filledElevation[heap[r]]<s.filledElevation[heap[b]])b=r;if(b===p)break;heap[p]=heap[b];p=b}heap[p]=last}return top};s.downhill.fill(-1);s.filledElevation.set(s.elevation);const outlet=(x,y)=>{const i=y*s.cols+x;if(seen[i])return;seen[i]=1;push(i)};for(let x=0;x<s.cols;x++){if(s.coastDistance[x]<.235)outlet(x,0);const i=(s.rows-1)*s.cols+x;if(s.coastDistance[i]<.235)outlet(x,s.rows-1)}for(let y=1;y<s.rows-1;y++){if(s.coastDistance[y*s.cols]<.235)outlet(0,y);const x=s.cols-1,i=y*s.cols+x;if(s.coastDistance[i]<.235)outlet(x,y)}if(!size){outlet(0,0);outlet(s.cols-1,s.rows-1)}while(size){const i=pop();popped[count++]=i;const x=i%s.cols,y=(i/s.cols)|0,z=s.filledElevation[i];for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy;if(xx<0||yy<0||xx>=s.cols||yy>=s.rows)continue;const j=yy*s.cols+xx;if(seen[j])continue;seen[j]=1;s.downhill[j]=i;s.filledElevation[j]=Math.max(s.elevation[j],z+1e-5);push(j)}}s.order=new Int32Array(n);for(let i=0;i<n;i++)s.order[i]=popped[n-1-i];s.accumulation.fill(1);for(let k=0;k<n;k++){const i=s.order[k],j=s.downhill[i];if(j>=0)s.accumulation[j]+=s.accumulation[i]}}
function rebuildDerived(s){const n=s.elevation.length,high=[],coast=[];s.downhillSlope=new Float32Array(n);s.routingRate=new Float32Array(n);s.floodIndices=new Int32Array(n);s.floodCount=0;s.streamThreshold=Math.max(5,n*.0018/Math.max(.2,s.streamSensitivity||1));for(let i=0;i<n;i++){const e=s.elevation[i],d=s.downhill[i],slope=d>=0?Math.max(0,s.filledElevation[i]-s.filledElevation[d]):0;s.downhillSlope[i]=slope;s.routingRate[i]=.12+slope*2.4;if(e>.62)high.push(i);if(s.coastDistance[i]<.2)coast.push(i);s.floodplain[i]=clamp(Math.log1p(s.accumulation[i])/Math.log1p(n)*1.8)*clamp(1-slope*18)*clamp((.62-e)*2.2);s.flow[i]=clamp(s.accumulation[i]/n*8)*(.35+clamp(slope*35)*.65)}s.highlandIndices=Int32Array.from(high);s.coastalIndices=Int32Array.from(coast);s.streamCache=null}
function create(width,height,seed=1,options={}){
 const cols=Math.max(24,Math.min(256,Math.floor(options.cols||144))),rows=Math.max(16,Math.min(192,Math.floor(options.rows||96))),n=cols*rows;
 const s={width,height,cols,rows,seed:seed>>>0,cellW:width/(cols-1),cellH:height/(rows-1),time:0,tidePeriod:options.tidePeriod??180,tideAmplitude:options.tideAmplitude??.075,stormPeriod:options.stormPeriod??92,reliefScale:options.reliefScale??1,coastDepth:options.coastDepth??.22,channelIncision:options.channelIncision??.09,terrainNoise:options.terrainNoise??.025,rainfallScale:options.rainfallScale??1,infiltrationRate:options.infiltrationRate??.72,watershedDrainage:options.watershedDrainage??1,streamSensitivity:options.streamSensitivity??1};
 for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','floodplain','flow','accumulation','coastDistance','filledElevation'])s[k]=new Float32Array(n);
 s.downhill=new Int32Array(n);s.downhill.fill(-1);
 const network=channelNetwork(width,height);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x,nx=x/(cols-1),ny=y/(rows-1),noise=hash(s.seed,x,y,0)-.5,highA=gaussian(nx,ny,.29,.19,.19,.18),highB=gaussian(nx,ny,.73,.73,.2,.19),ridge=gaussian(nx,ny,.54,.42,.28,.12),coastA=Math.exp(-((nx/.22)**2+(ny/.2)**2)*.5),coastB=Math.exp(-(((1-nx)/.22)**2+((1-ny)/.2)**2)*.5),elev=.23+(highA*.48+highB*.43+ridge*.12)*s.reliefScale-Math.max(coastA,coastB)*s.coastDepth+noise*s.terrainNoise;s.elevation[i]=clamp(elev,.035,.92);s.coastDistance[i]=Math.min(Math.hypot(nx,ny),Math.hypot(1-nx,1-ny));s.soil[i]=.24+hash(s.seed,x,y,1)*.08;s.groundwater[i]=clamp(.16+(1-s.elevation[i])*.18);s.salinity[i]=0}
 carveChannel(s,network.main,1.75,.155);for(const p of network.tributaries)carveChannel(s,p,1.08,.095);for(const p of network.feeders)carveChannel(s,p,.72,.052);
 for(const lake of network.lakes)for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const dx=x*s.cellW-lake.x,dy=y*s.cellH-lake.y,c=Math.cos(lake.rotation),sn=Math.sin(lake.rotation),u=(dx*c+dy*sn)/lake.rx,v=(-dx*sn+dy*c)/lake.ry,d2=u*u+v*v;if(d2<9){const i=y*cols+x;s.elevation[i]=Math.max(.025,s.elevation[i]-.035*Math.exp(-.5*d2))}}
 buildDrainage(s);rebuildDerived(s);
 s.rainPotential=new Float32Array(n);s.nextSurface=new Float32Array(n);s.nextGround=new Float32Array(n);
 for(let i=0;i<n;i++){const e=s.elevation[i];s.rainPotential[i]=clamp(.58+e*.9+Math.max(0,e-.42)*1.5,.45,2.1)*(.55+.45*hash(s.seed,i%s.cols,(i/s.cols)|0,3))}
 return s;
}
function step(s,dt,time=s.time+dt){
 dt=clamp(dt,0,.25);s.time=time;
 const tide=.09+Math.sin(time*Math.PI*2/s.tidePeriod)*s.tideAmplitude;
 const storm=.5+.5*Math.sin(time*Math.PI*2/s.stormPeriod-.9),pulse=Math.pow(Math.max(0,storm),5);
 const rainBase=(.0008+pulse*.014)*s.rainfallScale;
 const nextSurface=s.nextSurface,nextGround=s.nextGround;nextSurface.set(s.surface);nextGround.set(s.groundwater);
 s.floodCount=0;
 for(let i=0;i<s.elevation.length;i++){
  const e=s.elevation[i];
  const rain=rainBase*s.rainPotential[i];s.rainfall[i]=rain;
  const coast=s.coastDistance[i],tidal=coast<.19?clamp((tide-e+.045)/.12)*clamp(1-coast/.2):0;
  const fresh=clamp(s.surface[i]+s.groundwater[i]*.45),soil=s.soil[i],rainDepth=rain*dt,infiltration=Math.min(rainDepth*s.infiltrationRate,Math.max(0,1-soil)*.018*dt);
  const saturation=clamp(soil+infiltration*2.8-dt*(.0008+soil*.0012)),excess=Math.max(0,soil-.68)*.012*dt+Math.max(0,rainDepth-infiltration)*.24;
  const surface=Math.max(0,s.surface[i]+excess+tidal*.004*dt),evaporation=(.00025+Math.max(0,.5-e)*.0002)*dt,groundwater=clamp(s.groundwater[i]+infiltration*.42-evaporation);
  nextSurface[i]=surface;nextGround[i]=groundwater;s.soil[i]=saturation;
  s.salinity[i]=clamp(Math.max(s.salinity[i]*Math.max(0,1-dt*.012),tidal*.92+Math.max(0,.25-fresh)*.08));
  const floodplain=s.floodplain[i]||0,channelWet=clamp(surface*3.2+Math.max(0,groundwater-.36)*2.4+tidal*.72);
  s.flood[i]=clamp(Math.max(channelWet,floodplain*clamp(.12+rain*28+surface*3)*.72));if(s.flood[i]>.075)s.floodIndices[s.floodCount++]=i;
 }
 // Route runoff one cell downhill in elevation order; preserve water volume at closed depressions.
 for(let k=0;k<s.order.length;k++){const i=s.order[k],down=s.downhill[i];if(down<0){nextSurface[i]=Math.min(1,nextSurface[i]*Math.max(0,1-dt*.8*s.watershedDrainage));continue}const stored=nextSurface[i],overflow=Math.max(0,stored-1),runoff=stored*clamp(s.routingRate[i]*dt*s.watershedDrainage,0,.95),flow=Math.min(stored,Math.max(overflow,runoff));if(flow>0){nextSurface[i]-=flow;nextSurface[down]+=flow}}
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
function streamSegments(s){if(s.streamCache)return s.streamCache;const out=[],threshold=s.streamThreshold;for(let i=0;i<s.downhill.length;i++){const j=s.downhill[i];if(j<0||s.accumulation[i]<threshold)continue;const x=i%s.cols,y=(i/s.cols)|0,xx=j%s.cols,yy=(j/s.cols)|0;out.push({x:x*s.cellW,y:y*s.cellH,x2:xx*s.cellW,y2:yy*s.cellH,width:Math.min(5,.55+Math.sqrt(s.accumulation[i]/threshold)*.62),accumulation:s.accumulation[i],floodplain:s.floodplain[i],flow:s.flow[i]})}s.streamCache=out;return out}
function serialize(s){if(!s)return null;const o={width:s.width,height:s.height,cols:s.cols,rows:s.rows,seed:s.seed,time:s.time,tidePeriod:s.tidePeriod,tideAmplitude:s.tideAmplitude,stormPeriod:s.stormPeriod,reliefScale:s.reliefScale,coastDepth:s.coastDepth,channelIncision:s.channelIncision,terrainNoise:s.terrainNoise,rainfallScale:s.rainfallScale,infiltrationRate:s.infiltrationRate,watershedDrainage:s.watershedDrainage,streamSensitivity:s.streamSensitivity};for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','floodplain','flow','accumulation','coastDistance','downhill','filledElevation'])o[k]=Array.from(s[k]);return o}
function restore(d,width,height,seed=1){
 if(!d||d.width!==width||d.height!==height||!Number.isInteger(d.cols)||!Array.isArray(d.elevation))return create(width,height,seed);
 const state=create(width,height,seed,{cols:d.cols,rows:d.rows,tidePeriod:d.tidePeriod,tideAmplitude:d.tideAmplitude,stormPeriod:d.stormPeriod,reliefScale:d.reliefScale,coastDepth:d.coastDepth,channelIncision:d.channelIncision,terrainNoise:d.terrainNoise,rainfallScale:d.rainfallScale,infiltrationRate:d.infiltrationRate,watershedDrainage:d.watershedDrainage,streamSensitivity:d.streamSensitivity});
 for(const k of ['elevation','soil','groundwater','surface','rainfall','salinity','flood','floodplain','flow','accumulation','coastDistance','downhill','filledElevation'])if(Array.isArray(d[k])&&d[k].length===state[k].length)state[k].set(d[k]);
 if(!Array.isArray(d.filledElevation)||d.filledElevation.length!==state.filledElevation.length)buildDrainage(state);
 for(let i=0;i<state.elevation.length;i++){const e=state.elevation[i];state.rainPotential[i]=clamp(.58+e*.9+Math.max(0,e-.42)*1.5,.45,2.1)*(.55+.45*hash(state.seed,i%state.cols,(i/state.cols)|0,3))}
 rebuildDerived(state);state.floodCount=0;for(let i=0;i<state.flood.length;i++)if(state.flood[i]>.075)state.floodIndices[state.floodCount++]=i;state.time=Number(d.time)||0;return state;
}
return Object.freeze({create,step,sample,consumeWater,streamSegments,channelNetwork,serialize,restore});
});