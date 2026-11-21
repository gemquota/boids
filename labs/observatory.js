// Read-only analysis of serialisable world snapshots.
export function summarize(world,habitat){
 const a=world.agents,n=a.length,mean=k=>n?a.reduce((s,x)=>s+(x[k]||0),0)/n:0;
 return{population:n,births:world.births,deaths:world.deaths,meanEnergy:mean("energy"),meanAge:mean("age"),plants:habitat?.plants.length||0,tick:Math.floor(world.tick),meanSpeed:n?a.reduce((s,x)=>s+Math.hypot(x.vx,x.vy),0)/n:0};
}
