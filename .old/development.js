/* Neonatal attachment windows and independently maturing adult bonding anatomy. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsDevelopment=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ROLES=['locomotor','grasping','sensory','defensive','striking','adhesive'];
const ORGAN_BLUEPRINTS=[
{organType:'vision',x:.29,y:-.12,radius:.075,role:'sensory'},{organType:'vision',x:.29,y:.12,radius:.075,role:'sensory'},
{organType:'neuralGanglion',x:.015,y:0,radius:.105,role:'coordination'},{organType:'digestive',x:-.16,y:0,radius:.17,role:'digestion'},
{organType:'contractilePump',x:-.015,y:.13,radius:.095,role:'transport'},
{organType:'exchangeMembrane',x:-.08,y:-.19,radius:.065,role:'respiration'},{organType:'exchangeMembrane',x:-.08,y:.19,radius:.065,role:'respiration'}];
function organMean(m,type){const list=(m?.structures||[]).filter(s=>s&&s.kind==='organ'&&s.organType===type);if(!list.length)return 1;return list.reduce((sum,s)=>sum+clamp((s.health??1)*(s.efficiency??1),0,1),0)/list.length}
function getOrganEffects(m){return{vision:organMean(m,'vision'),neural:organMean(m,'neuralGanglion'),digestion:organMean(m,'digestive'),transport:organMean(m,'contractilePump'),exchange:organMean(m,'exchangeMembrane')}}
function updateOrganCondition(m,dt,energy,thirst){if(!m)return getOrganEffects(m);const energyStress=clamp((.42-energy)/.42,0,1),waterStress=clamp((thirst-.58)/.42,0,1);for(const s of m.structures||[]){if(s.kind!=='organ')continue;const sensitivity=s.organType==='exchangeMembrane'?.0009:s.organType==='digestive'?.0007:.0005,stress=energyStress*.65+waterStress*(s.organType==='exchangeMembrane'?1.25:.35),repair=energy>.58&&thirst<.38?.00035:0;s.health=clamp((s.health??1)+dt*(repair-sensitivity*stress),.08,1)}return getOrganEffects(m)}
function ensureStructures(m){
 if(!m)return m;
 const organs=Array.isArray(m.structures)?m.structures.filter(s=>s&&s.kind==='organ').map(s=>({...s})):[];
 if(!organs.length)for(let i=0;i<ORGAN_BLUEPRINTS.length;i++)organs.push({id:'organ-'+i,kind:'organ',health:1,efficiency:1,...ORGAN_BLUEPRINTS[i]});
 const appendages=(m.limbs||[]).map((limb,index)=>({id:'appendage-'+index,kind:'appendage',organType:'limb',...limb}));
 m.structures=[...organs,...appendages];return m;
}
function createState(morphology,random=Math.random){
  const m=morphology||{};
  m.neonatalBondSites=Array.from({length:4},(_,index)=>({index,state:'available',progress:0,role:null}));
  m.neonatalAvailableCount=4;
  m.neonatalBondWindow=m.neonatalBondWindow??6;
  m.neonatalConversionDuration=m.neonatalConversionDuration??7;
  m.adultBondingPotential=m.adultBondingPotential??(1+(random()<.42?1:0));
  m.adultBondingProgress=m.adultBondingProgress??0;
  m.bondingSites=0;m.bondingSitesLeft=0;m.bondingSitesRight=0;
  return ensureStructures(m);
}
function advance(m,age,dt,random=Math.random,traits={}){
  if(!m)return m;
  if(!Array.isArray(m.neonatalBondSites))createState(m,random);
  const window=Math.max(.1,m.neonatalBondWindow??4),duration=Math.max(.1,m.neonatalConversionDuration??7);
  for(const site of m.neonatalBondSites){
    if(site.state!=='available'&&site.state!=='converting')continue;
    if(age<=window)continue;
    site.state='converting';site.progress=clamp((site.progress||0)+Math.max(0,dt)/duration,0,1);
    if(site.progress>=1){
      const weights=[1.1,.8,.9,.7,.55,.75],bias=clamp(traits.adhesiveBias||0,-.8,.8);
      weights[5]*=1+bias;weights[0]*=1-clamp(traits.locomotionBias||0,-.5,.8);
      let roll=random()*weights.reduce((a,b)=>a+b,0),role=ROLES[0];
      for(let i=0;i<weights.length;i++){roll-=weights[i];if(roll<=0){role=ROLES[i];break}}
      const side=site.index%2===0?-1:1,phase=random()*Math.PI*2;
      m.limbs=m.limbs||[];m.limbs.push({side,anchor:(site.index-1.5)*.13,length:.48+random()*.42,thickness:.42+random()*.38,joints:1+Math.floor(random()*2),phase,spread:.7+random()*.6,role,neonatalOrigin:true});
      site.state='converted';site.role=role;
    }
  }
  m.neonatalAvailableCount=m.neonatalBondSites.reduce((count,site)=>count+(site.state==='available'?1:0),0);
  const target=Math.max(0,Math.floor(m.adultBondingPotential??1));
  const matureAge=Math.max(window+1,8),rate=Math.max(0,dt)/Math.max(1,m.adultBondingMaturation??3.5);
  if(age>matureAge&&m.adultBondingProgress<target)m.adultBondingProgress=Math.min(target,m.adultBondingProgress+rate);
  const total=Math.floor(m.adultBondingProgress+1e-6);
  const bias=clamp(m.bondingBias||0,-1,1),right=Math.round(total*(.5+bias*.5));
  m.bondingSites=total;m.bondingSitesRight=right;m.bondingSitesLeft=total-right;
  return ensureStructures(m);
}
function availableNeonatalSite(m,occupied=()=>false){
  for(const site of m?.neonatalBondSites||[])if(site.state==='available'&&!occupied('neonatal'+site.index))return 'neonatal'+site.index;
  return null;
}
return Object.freeze({createState,advance,availableNeonatalSite,ensureStructures,getOrganEffects,updateOrganCondition});
});