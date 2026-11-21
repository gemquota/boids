// Procedural landscape, watershed network and cyclic climate.
export function createEnvironment(width,height,seed=31,{cols=48,rows=30}={}){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const fields=[],river=[],tributaries=[];const coast=width*.13;
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const nx=x/(cols-1),ny=y/(rows-1),latitude=Math.abs(ny-.5)*2;
  const ridge=.5+.13*Math.sin(nx*7.4)+.07*Math.sin(nx*17.1+ny*4),tributary=.5+.18*Math.sin(nx*12+1.4)+.035*Math.sin(nx*31+ny*9);
  const coastDist=Math.max(0,(coast/width-nx)*width),riverDist=Math.min(Math.abs(ny-ridge),Math.abs(ny-tributary));
  const elevation=Math.max(0,Math.min(1,.25+latitude*.22+Math.abs(ny-ridge)*.55+(random()-.5)*.13));
  const tributaryWet=Math.min(Math.abs(ny-(.18+.42*nx)),Math.abs(ny-(.82-.31*nx)),Math.abs(ny-(.28+.16*Math.sin(nx*8))));const water=nx<coast/width||riverDist<.018||(nx>.55&&Math.abs(ny-(.25+.08*Math.sin(nx*9)))<.012)||(nx>.16&&tributaryWet<.009);
  fields.push({elevation,latitude,water,temperature:Math.max(0,1-latitude*.62+(random()-.5)*.06),moisture:Math.min(1,.16+(water?.68:Math.max(0,.48-riverDist*5))+(random()-.5)*.08),nutrients:.2+random()*.45,light:.5});
 }
 for(let i=0;i<cols;i++){const x=i/(cols-1)*width,y=(.5+.13*Math.sin(i/(cols-1)*7.4)+.07*Math.sin(i/(cols-1)*17.1))*height;river.push({x,y})}
 return{version:1,width,height,cols,rows,fields,river,seed,state,clock:0,dayLength:1200,seasonLength:12000,season:0,day:0,year:0,coastWidth:coast};
}
export function sampleEnvironment(env,x,y){
 const gx=Math.max(0,Math.min(env.cols-1,Math.floor(x/env.width*env.cols))),gy=Math.max(0,Math.min(env.rows-1,Math.floor(y/env.height*env.rows))),f=env.fields[gy*env.cols+gx];
 const season=env.season,latitude=f.latitude,seasonal=Math.cos(season*Math.PI*2)*(.18*(1-latitude)+.04),dayPhase=(env.clock%env.dayLength)/env.dayLength,solar=Math.max(0,Math.sin(dayPhase*Math.PI*2-Math.PI/2));
 return{...f,temperature:Math.max(0,Math.min(1,f.temperature+seasonal)),light:solar*(1-latitude*.25),daylight:solar,season,day:env.day,year:env.year};
}
export function advanceEnvironment(env,dt=1){
 const before=env.clock;env.clock+=dt;env.day=Math.floor(env.clock/env.dayLength);env.year=Math.floor(env.clock/(env.seasonLength*4));env.season=(env.clock% (env.seasonLength*4))/env.seasonLength;
 const phase=(env.clock%env.seasonLength)/env.seasonLength;
 for(let y=0;y<env.rows;y++)for(let x=0;x<env.cols;x++){const f=env.fields[y*env.cols+x],latitude=f.latitude,water=f.water?1:0;f.light=Math.max(0,Math.sin((env.clock%env.dayLength)/env.dayLength*Math.PI*2-Math.PI/2));f.moisture=Math.max(.03,Math.min(1,f.moisture+(water?.00002:-.000015)*dt+Math.sin(phase*Math.PI*2)*.00004*dt));f.temperature=Math.max(0,Math.min(1,f.temperature+(Math.cos(env.season*Math.PI/2)*(1-latitude)-.5)*.00002*dt))}
 return{day:env.day,year:env.year,season:Math.floor(env.season),daylight:Math.max(0,Math.sin((env.clock%env.dayLength)/env.dayLength*Math.PI*2-Math.PI/2))};
}
export function environmentSummary(env){const water=env.fields.filter(f=>f.water).length;return{day:env.day,year:env.year,season:Math.floor(env.season),waterCoverage:water/env.fields.length,meanMoisture:env.fields.reduce((n,f)=>n+f.moisture,0)/env.fields.length,meanTemperature:env.fields.reduce((n,f)=>n+f.temperature,0)/env.fields.length}}
