// Bounded historical telemetry with windowed means and trend deltas.
export function createHistory({capacity=240,interval=30}={}){return{version:1,capacity,interval,lastTick:-Infinity,samples:[]}}
export function recordHistory(history,world,environment,plants=[]){
 if(world.tick-history.lastTick<history.interval)return null;
 const living=world.agents.filter(a=>!a.dead),mean=k=>living.length?living.reduce((n,a)=>n+(a.traits?.[k]||0),0)/living.length:0;
 const sample={tick:world.tick,population:living.length,dead:world.agents.length-living.length,births:world.births||0,deaths:world.deaths||0,meanEnergy:living.length?living.reduce((n,a)=>n+a.energy,0)/living.length:0,meanHealth:living.length?living.reduce((n,a)=>n+(a.health??1),0)/living.length:0,injured:living.filter(a=>a.injury>.05).length,predation:world.combat?.hits||0,biomass:plants.reduce((n,p)=>n+(p.energy||0),0),plantCount:plants.length,meanAttack:mean("attack"),meanDefense:mean("defense"),meanSpeed:mean("speed"),meanAggression:mean("aggression"),species:world.speciesCount||0,day:environment?.day||0,year:environment?.year||0,season:Math.floor(environment?.season||0),light:environment?.daylight||0};
 history.samples.push(sample);history.lastTick=world.tick;if(history.samples.length>history.capacity)history.samples.splice(0,history.samples.length-history.capacity);return sample;
}
export function averageHistory(history,key,window=12){
 const s=history.samples.slice(-Math.max(1,window));if(!s.length)return{mean:0,min:0,max:0,count:0,delta:0};
 const values=s.map(x=>Number(x[key]||0)),mean=values.reduce((a,b)=>a+b,0)/values.length;
 return{mean,min:Math.min(...values),max:Math.max(...values),count:values.length,delta:values.at(-1)-values[0]};
}
export function historySeries(history,key){return history.samples.map(s=>({tick:s.tick,value:s[key]??0}))}
