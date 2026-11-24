// Heritable modular plant development: typed chromosome, regulatory expression, morphology and spore dispersal.
import{encodeChromosome,decodeChromosome,mutateChromosome}from"./genome.js";
export const PLANT_TRAITS=Object.freeze(["growth","branching","rooting","shadeTolerance","droughtTolerance","sporeRate","dispersal","longevity","waterAffinity","lightAffinity","pigment","leafSize"]);
const defaults={growth:.8,branching:.5,rooting:.7,shadeTolerance:.4,droughtTolerance:.5,sporeRate:.35,dispersal:.6,longevity:1,waterAffinity:.7,lightAffinity:.7,pigment:145,leafSize:.7};
const regulatoryTargets=Object.freeze([0,1,2,5,8,9]);
export function createPlantGenome(random=Math.random,source=null){
 const traits={};for(const k of PLANT_TRAITS){const base=source?.traits?.[k]??defaults[k];traits[k]=k==="pigment"?Math.max(0,Math.min(360,base+(random()-.5)*28)):Math.max(.05,Math.min(2,base+(random()-.5)*.24))}
 const genes=PLANT_TRAITS.map((name,locus)=>({type:"trait",locus,name,value:traits[name]}));
 for(const target of regulatoryTargets)genes.push({type:"regulator",locus:PLANT_TRAITS.length+target,target,value:(random()-.5)*.5});
 return{version:1,traits,chromosome:encodeChromosome(genes),regulators:genes.filter(g=>g.type==="regulator"),nodes:[],spores:0};
}
export function inheritPlantGenome(a,b,random=Math.random){
 const A=decodeChromosome(a.chromosome),B=new Map(decodeChromosome(b.chromosome).map(g=>[g.type+":"+g.locus,g]));
 const genes=A.map(g=>{const mate=B.get(g.type+":"+g.locus),value=mate&&random()<.5?mate.value:g.value,mutated=random()<.09?value+(random()-.5)*(g.type==="trait"&&g.name==="pigment"?24:.22):value;return g.type==="trait"?{...g,value:g.name==="pigment"?Math.max(0,Math.min(360,mutated)):Math.max(.05,Math.min(2,mutated))}:{...g,value:Math.max(-1,Math.min(1,mutated))}});
 const chromosome=mutateChromosome(encodeChromosome(genes),{rate:.015,random}),expressed=decodeChromosome(chromosome),traits={...defaults};
 for(const g of expressed)if(g.type==="trait"&&PLANT_TRAITS.includes(g.name))traits[g.name]=g.value;
 return{version:1,traits,chromosome,regulators:expressed.filter(g=>g.type==="regulator"),nodes:[],spores:0};
}
export function germinatePlant(x,y,genome,random=Math.random){
 return{id:Math.floor(random()*0x7fffffff),x,y,age:0,energy:.45,health:1,genome,traits:genome.traits,nodes:[{id:0,parent:null,x:0,y:0,length:2,angle:-Math.PI/2,age:0,order:0}],nextNodeId:1,sporeCooldown:120,kind:"plant"};
}
export function growPlant(plant,environment,dt=1,random=Math.random){
 const t=plant.traits||defaults,reg=(plant.genome?.regulators||[]),regulate=i=>Math.max(.2,1+(reg.find(g=>g.target===i)?.value||0)),light=environment.light??.5,water=environment.moisture??.5,temp=environment.temperature??.5,nutrients=environment.nutrients??.5;
 const waterFit=Math.max(.05,1-Math.abs(water-t.waterAffinity)*.9+t.rooting*(1-water)*.18),lightFit=Math.max(.05,1-Math.abs(light-t.lightAffinity)*.9+(1-light)*t.shadeTolerance*.35),stress=Math.max(0,.22-water*t.droughtTolerance*.5);
 const gain=Math.max(0,t.growth*regulate(0)*.00135*waterFit*lightFit*(.35+nutrients)*Math.max(.1,1-Math.abs(temp-.55)))*dt;
 plant.energy=Math.max(0,Math.min(1.5,(plant.energy||0)+gain-stress*.0006*dt));plant.age+=dt;plant.sporeCooldown-=dt;
 const cap=Math.min(72,5+Math.floor(plant.energy*24*t.branching*regulate(1)));
 if(plant.energy>.52&&plant.nodes.length<cap&&random()<Math.min(.9,gain*55+(.0004*t.branching*regulate(1)))*dt){
  const parent=plant.nodes[Math.floor(random()*plant.nodes.length)]||plant.nodes[0],side=random()<.5?-1:1,angle=parent.angle+side*(.25+random()*.8);
  plant.nodes.push({id:plant.nextNodeId++,parent:parent.id,x:parent.x+Math.cos(angle)*parent.length,y:parent.y+Math.sin(angle)*parent.length,length:2.8+t.growth*5,angle,age:0,order:parent.order+1});plant.energy-=.012;
 }
 let spores=0;if(plant.energy>.7&&plant.sporeCooldown<=0&&random()<t.sporeRate*regulate(5)*.08*dt){spores=1;plant.energy-=.12;plant.sporeCooldown=100+random()*180}
 return{spores,stress,biomass:plant.nodes.reduce((n,node)=>n+node.length*.015,0)};
}

export function classifyPlantStage(plant){
 const age=plant.age||0,life=(plant.traits?.longevity||1)*26000;
 if(age<100)return"seedling";
 if(age<650)return"juvenile";
 if(age>life*.76)return"senescent";
 return"mature";
}
