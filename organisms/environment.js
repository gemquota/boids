// Procedural landscape, branching watershed, latitude, seasons and day/night climate.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\nexport const ENVIRONMENT_PRESETS=Object.freeze({temperate:{temperature:0,moisture:0,nutrients:0,coast:.13,tributaries:3},tropical:{temperature:.14,moisture:.1,nutrients:.08,coast:.16,tributaries:3},arid:{temperature:.1,moisture:-.22,nutrients:-.08,coast:.09,tributaries:1},alpine:{temperature:-.2,moisture:.03,nutrients:.12,coast:.12,tributaries:4},wetland:{temperature:.04,moisture:.24,nutrients:.12,coast:.2,tributaries:4}});
const mainY=x=>.5+.13*Math.sin(x*7.4)+.07*Math.sin(x*17.1);
const tributaryY=(index,x)=>index===0?.16+.42*x+.035*Math.sin(x*13):index===1?.86-.31*x+.03*Math.sin(x*11+1.4):.28+.16*Math.sin(x*8);
export function createEnvironment(width,height,seed=31,{cols=48,rows=30}={}){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const coastWidth=width*profile.coast,fields=[],river=[],tributaries=[],lakes=[];
 const lakeSpecs=[[.34,.035,.025],[.73,.022,.018]];
 for(const [x,rx,ry] of lakeSpecs)lakes.push({x:x*width,y:mainY(x)*height+.025*height,rx:rx*width,ry:ry*height});
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const nx=x/(cols-1),ny=y/(rows-1),latitude=Math.abs(ny-.5)*2;
  const mainDistance=Math.abs(ny-mainY(nx)),tributaryDistance=Math.min(...[0,1,2].map(i=>Math.abs(ny-tributaryY(i,nx))));
  const inLake=lakes.some(l=>Math.pow((nx*width-l.x)/l.rx,2)+Math.pow((ny*height-l.y)/l.ry,2)<1);
  const water=nx<coastWidth/width||mainDistance<.018||(nx>.14&&tributaryDistance<.009)||inLake;
  const elevation=clamp(.28+latitude*.2+mainDistance*.62+(random()-.5)*.12,0,1);
  const baseTemperature=clamp(1-latitude*.62+profile.temperature+(random()-.5)*.06,0,1);
  const baseMoisture=clamp(.16+(water?.68:Math.max(0,.48-Math.min(mainDistance,tributaryDistance)*5))+profile.moisture+(random()-.5)*.08,0,1);
  fields.push({elevation,latitude,water,baseTemperature,baseMoisture,temperature:baseTemperature,moisture:baseMoisture,nutrients:clamp(.2+(water?.2:0)+profile.nutrients+random()*.45,0,1),light:.5});
 }
 for(let i=0;i<cols;i++){const x=i/(cols-1);river.push({x:x*width,y:mainY(x)*height})}
 for(let index=0;index<profile.tributaries;index++){const path=[],start=[.16,.86,.32][index],merge=[.48,.69,.84][index],curve=[.08,-.09,.055][index];for(let i=0;i<=24;i++){const t=i/24,x=.12+(merge-.12)*t,y=start+(mainY(merge)-start)*t+Math.sin(t*Math.PI)*curve+.025*Math.sin(t*8*Math.PI+start*12)*(1-t);path.push({x:x*width,y:y*height})}tributaries.push(path)}
 return{version:1,preset,width,height,cols,rows,fields,river,tributaries,lakes,seed,state,clock:0,dayLength:1200,seasonLength:12000,season:0,day:0,year:0,coastWidth};
}
export function sampleEnvironment(env,x,y){
 const gx=clamp(Math.floor(x/env.width*env.cols),0,env.cols-1),gy=clamp(Math.floor(y/env.height*env.rows),0,env.rows-1),f=env.fields[gy*env.cols+gx];
 const seasonIndex=Math.floor(env.season)%4,dayPhase=(env.clock%env.dayLength)/env.dayLength,solar=Math.max(0,Math.sin(dayPhase*Math.PI*2));
 const seasonal=Math.sin(seasonIndex*Math.PI/2)*(.08+.16*f.latitude),temperature=clamp(f.baseTemperature+seasonal,0,1);
 return{...f,temperature,light:solar*(1-f.latitude*.25),daylight:solar,season:env.season,day:env.day,year:env.year};
}
export function advanceEnvironment(env,dt=1){
 env.clock+=dt;env.day=Math.floor(env.clock/env.dayLength);env.year=Math.floor(env.clock/(env.seasonLength*4));env.season=(env.clock%(env.seasonLength*4))/env.seasonLength;
 const seasonIndex=Math.floor(env.season)%4,phase=(env.clock%env.seasonLength)/env.seasonLength,dayPhase=(env.clock%env.dayLength)/env.dayLength,solar=Math.max(0,Math.sin(dayPhase*Math.PI*2));
 for(const f of env.fields){const seasonalRain=Math.sin(seasonIndex*Math.PI/2)*.035;f.light=solar*(1-f.latitude*.25);f.moisture=clamp(f.baseMoisture+seasonalRain+(f.water?.08:0),.02,1);f.temperature=clamp(f.baseTemperature+Math.sin(seasonIndex*Math.PI/2)*(.08+.16*f.latitude),0,1)}
 return{day:env.day,year:env.year,season:seasonIndex,daylight:solar,seasonProgress:phase};
}
export function environmentSummary(env){
 const water=env.fields.filter(f=>f.water).length,mean=k=>env.fields.reduce((n,f)=>n+f[k],0)/env.fields.length;
 return{preset:env.preset,day:env.day,year:env.year,season:Math.floor(env.season)%4,waterCoverage:water/env.fields.length,meanMoisture:mean("moisture"),meanTemperature:mean("temperature"),meanElevation:mean("elevation"),meanLight:mean("light")};
}
