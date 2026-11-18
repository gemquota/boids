/* Recursive plant root architecture and explicit root/surface fusion network.
 * Spatially indexed and linear-pass updates keep cost bounded as colonies grow.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsPlantStructures=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,Number(v)||0));
const dist2=(a,b)=>{const x=a.x-b.x,y=a.y-b.y;return x*x+y*y};
const pairKey=(type,a,b)=>type+':'+(a<b?a+':'+b:b+':'+a);
function create(){return{roots:[],connections:[],nextRootId:1,nextConnectionId:1,time:0,stats:{rootTips:0,rootConnections:0,surfaceConnections:0,rootBiomass:0}}}
function reset(s){s.roots.length=0;s.connections.length=0;s.nextRootId=1;s.nextConnectionId=1;s.time=0;s.stats={rootTips:0,rootConnections:0,surfaceConnections:0,rootBiomass:0};}
function addRoot(s,p,parent,x,y,angle,depth){const r={id:s.nextRootId++,plantId:p.root||p.id,nodeId:p.id,parentId:parent?parent.id:0,x,y,tipX:x,tipY:y,angle,length:0,targetLength:Math.max(9,14-depth*1.25),depth,children:0,age:0,health:1,kind:depth===0?'primary':'lateral'};s.roots.push(r);if(parent)parent.children++;return r}
function gradient(fields,x,y,key){if(!fields||!fields.ecologyFields||!fields.ecologyFields[key])return{x:0,y:0};const d=8,a=fields.ecology.sampleFields(fields.ecologyFields,x-d,y,{}),b=fields.ecology.sampleFields(fields.ecologyFields,x+d,y,{}),c=fields.ecology.sampleFields(fields.ecologyFields,x,y-d,{}),e=fields.ecology.sampleFields(fields.ecologyFields,x,y+d,{});return{x:(b[key]-a[key])/(2*d),y:(e[key]-c[key])/(2*d)}}
function makeTip(s,p,r,env,cfg,dt){
 const moisture=gradient(env,r.tipX,r.tipY,'moisture'),nutrients=gradient(env,r.tipX,r.tipY,'nutrients'),strength=cfg.rootTropism;
 const vx=Math.cos(r.angle)*.48+moisture.x*strength*110+nutrients.x*strength*38,vy=Math.sin(r.angle)*.48+moisture.y*strength*110+nutrients.y*strength*38+.42,mag=Math.hypot(vx,vy)||1,desired=Math.atan2(vy/mag,vx/mag),delta=Math.atan2(Math.sin(desired-r.angle),Math.cos(desired-r.angle));
 r.angle+=clamp(delta,-dt*1.8,dt*1.8);
 const habitat=env.ecology&&env.ecology.sampleFields?env.ecology.sampleFields(env.ecologyFields,r.tipX,r.tipY,{}):{moisture:.4,nutrients:.4};
 const growth=cfg.rootGrowthRate*dt*(.42+habitat.moisture*.48+habitat.nutrients*.22)*r.health;
 r.length+=growth;r.tipX=r.x+Math.cos(r.angle)*r.length;r.tipY=r.y+Math.sin(r.angle)*r.length;r.age+=dt;
 if(r.tipY>env.height*.985||r.tipX<3||r.tipX>env.width-3)r.health=Math.max(.2,r.health-dt*.025);
 if(r.length>=r.targetLength&&r.children<cfg.rootBranchLimit&&r.depth<cfg.rootDepthLimit&&r.health>.35){const spread=.58+Math.min(.32,r.depth*.035),side=r.children%2?1:-1;addRoot(s,p,r,r.tipX,r.tipY,r.angle+side*spread+((p.id%7)-3)*.025,r.depth+1)}
 const demand=dt*.00018*cfg.rootWaterUptake*(.35+habitat.moisture)*r.health;
 let water=0,nutrient=0;
 if(env.hydrology&&env.hydrology.consumeWater)water=env.hydrology.consumeWater(env.hydrologyFields,r.tipX,r.tipY,demand);
 if(env.ecology&&env.ecology.consumeNutrients)nutrient=env.ecology.consumeNutrients(env.ecologyFields,r.tipX,r.tipY,dt*.00012*cfg.rootNutrientUptake);
 p.rootWaterReserve=Math.min(.025,(p.rootWaterReserve||0)+demand*water);
 p.rootNutrientReserve=Math.min(.025,(p.rootNutrientReserve||0)+dt*.00012*cfg.rootNutrientUptake*nutrient);
}
function createConnection(s,a,b,type,cfg,keys){
 const key=pairKey(type,a.id,b.id);if(keys.has(key))return null;keys.add(key);
 const c={id:s.nextConnectionId++,a:a.id,b:b.id,type,age:0,strength:clamp(cfg[type==='root'?'rootFusionStrength':'surfaceFusionStrength']),health:1,transport:0};s.connections.push(c);return c;
}
function rootFusion(s,cfg,keys){
 const cell=Math.max(4,cfg.rootFusionDistance),bins=new Map(),degree=new Map(),tips=[];
 for(const c of s.connections)if(c.type==='root'){degree.set(c.a,(degree.get(c.a)||0)+1);degree.set(c.b,(degree.get(c.b)||0)+1)}
 for(const r of s.roots)if(r.health>.25&&r.length>r.targetLength*.55){tips.push(r);const x=Math.floor(r.tipX/cell),y=Math.floor(r.tipY/cell),key=x+','+y;let bin=bins.get(key);if(!bin)bins.set(key,bin=[]);bin.push(r)}
 const chance=Math.max(0,Math.min(.08,Number(cfg.simulationStep)||.05))*cfg.rootFusionProbability*.8,limit=cfg.rootFusionDistance*cfg.rootFusionDistance;
 for(const r of tips){const x=Math.floor(r.tipX/cell),y=Math.floor(r.tipY/cell);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)for(const other of bins.get((x+ox)+','+(y+oy))||[]){
  if(other.id<=r.id||(other.plantId===r.plantId&&other.nodeId===r.nodeId)||(degree.get(r.id)||0)>=2||(degree.get(other.id)||0)>=2)continue;
  const dx=r.tipX-other.tipX,dy=r.tipY-other.tipY;if(dx*dx+dy*dy>limit||Math.random()>chance)continue;
  if(createConnection(s,r,other,'root',cfg,keys)){degree.set(r.id,(degree.get(r.id)||0)+1);degree.set(other.id,(degree.get(other.id)||0)+1);r.health=Math.min(1,r.health+.025);other.health=Math.min(1,other.health+.025)}
 }}
}
function surfaceFusion(s,plants,cfg,dt,keys,rootsByNode){
 const cell=Math.max(4,cfg.surfaceFusionDistance),bins=new Map(),candidates=[];
 for(const p of plants)if(!p.senescent&&p.size>=cfg.surfaceFusionMaturity){candidates.push(p);const x=Math.floor(p.x/cell),y=Math.floor(p.y/cell),key=x+','+y;let bin=bins.get(key);if(!bin)bins.set(key,bin=[]);bin.push(p)}
 const maxD=cfg.surfaceFusionDistance,limit=maxD*maxD,moveRate=cfg.surfaceAlignment*dt*18,threshold=Math.max(2.5,maxD*.28)+.1;
 for(const a of candidates){const x=Math.floor(a.x/cell),y=Math.floor(a.y/cell);for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)for(const b of bins.get((x+ox)+','+(y+oy))||[]){
  if(b.id<=a.id||a.parent===b.id||b.parent===a.id||keys.has(pairKey('surface',a.id,b.id)))continue;
  const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy;if(d2>limit)continue;const d=Math.sqrt(d2);
  const mx=(a.x+b.x)*.5,my=(a.y+b.y)*.5,move=Math.min(moveRate,Math.max(0,(d-maxD*.28)*.5));
  if(d>0&&move>0){const adx=(mx-a.x)/d*move,ady=(my-a.y)/d*move,bdx=(mx-b.x)/d*move,bdy=(my-b.y)/d*move;a.x+=adx;a.y+=ady;b.x+=bdx;b.y+=bdy;for(const r of rootsByNode.get(a.id)||[]){r.x+=adx;r.tipX+=adx;r.y+=ady;r.tipY+=ady}for(const r of rootsByNode.get(b.id)||[]){r.x+=bdx;r.tipX+=bdx;r.y+=bdy;r.tipY+=bdy}}
  if(d<=threshold&&Math.random()<=cfg.surfaceFusionProbability*dt*.7)createConnection(s,a,b,'surface',cfg,keys);
 }}
}
function step(s,plants,dt,env,cfg){
 if(!s||!plants||!cfg)return s;dt=clamp(dt,0,.1);s.time+=dt;
 const byId=new Map(),rootsByNode=new Map(),rootById=new Map(),rootCounts=new Map(),rootConnectionCounts=new Map(),surfaceSupport=new Map(),keys=new Set();
 for(const p of plants)byId.set(p.id,p);
 for(const r of s.roots){rootById.set(r.id,r);rootsByNode.set(r.nodeId,(rootsByNode.get(r.nodeId)||0)+1)}
 for(const c of s.connections){keys.add(pairKey(c.type,c.a,c.b));if(c.type==='root'){const a=rootById.get(c.a),b=rootById.get(c.b);if(a)rootConnectionCounts.set(a.nodeId,(rootConnectionCounts.get(a.nodeId)||0)+1);if(b)rootConnectionCounts.set(b.nodeId,(rootConnectionCounts.get(b.nodeId)||0)+1)}else{surfaceSupport.set(c.a,(surfaceSupport.get(c.a)||0)+c.strength);surfaceSupport.set(c.b,(surfaceSupport.get(c.b)||0)+c.strength)}}
 for(const p of plants){if(p.senescent){for(const r of s.roots)if(r.nodeId===p.id)r.health=Math.max(0,r.health-dt*.004)}else if(!p.rootSystem&&p.age>=1.5&&p.biomass>.24){p.rootSystem=true;const spread=.24+((p.id%5)*.09);addRoot(s,p,null,p.x,p.y,Math.PI/2-spread,0);addRoot(s,p,null,p.x,p.y,Math.PI/2+spread,0);rootsByNode.set(p.id,2);}}
 const rootsAtStart=s.roots.length;
 for(let i=0;i<rootsAtStart;i++){const r=s.roots[i],p=byId.get(r.nodeId);if(p)makeTip(s,p,r,env,cfg,dt)}
 // Rebuild per-node root lists once; they also keep surface fusion's root anchors aligned.
 rootsByNode.clear();for(const r of s.roots){let list=rootsByNode.get(r.nodeId);if(!list)rootsByNode.set(r.nodeId,list=[]);list.push(r);rootById.set(r.id,r)}
 for(const p of plants){const count=(rootsByNode.get(p.id)||[]).reduce((n,r)=>n+(r.health>.2?1:0),0);p.rootMaintenance=count*cfg.rootMaintenance*dt;p.biomass=Math.max(0,p.biomass-p.rootMaintenance);p.rootConnectionCount=rootConnectionCounts.get(p.id)||0}
 const previousConnectionCount=s.connections.length;
 rootFusion(s,cfg,keys);surfaceFusion(s,plants,cfg,dt,keys,rootsByNode);
 for(let i=previousConnectionCount;i<s.connections.length;i++){const c=s.connections[i];if(c.type==='surface'){const a=byId.get(c.a),b=byId.get(c.b);a?.history?.push({time:s.time,event:'Formed surface fusion with node #'+c.b});b?.history?.push({time:s.time,event:'Formed surface fusion with node #'+c.a})}else{const ra=rootById.get(c.a),rb=rootById.get(c.b),a=ra&&byId.get(ra.nodeId),b=rb&&byId.get(rb.nodeId);a?.history?.push({time:s.time,event:'Established subsurface root graft'});if(b&&b!==a)b.history?.push({time:s.time,event:'Established subsurface root graft'})}}
 // Update connections in one pass. Root lookup is constant-time.
 const liveRootIds=new Set();for(const r of s.roots)liveRootIds.add(r.id);
 for(const c of s.connections){c.age+=dt;c.health=Math.max(0,c.health-dt*.00015);if(c.type==='root'){const a=rootById.get(c.a),b=rootById.get(c.b);if(!a||!b)continue;c.transport=clamp((a.health+b.health)*.5*c.strength);const pa=byId.get(a.nodeId),pb=byId.get(b.nodeId);if(pa&&pb&&pa.id!==pb.id){const delta=(pa.rootWaterReserve||0)-(pb.rootWaterReserve||0),transfer=Math.min(Math.abs(delta)*.02,.000002*c.transport);if(delta>0){pa.rootWaterReserve=Math.max(0,pa.rootWaterReserve-transfer);pb.rootWaterReserve=(pb.rootWaterReserve||0)+transfer}else{pb.rootWaterReserve=Math.max(0,(pb.rootWaterReserve||0)-transfer);pa.rootWaterReserve=(pa.rootWaterReserve||0)+transfer}const nutrientDelta=(pa.rootNutrientReserve||0)-(pb.rootNutrientReserve||0),nutrientTransfer=Math.min(Math.abs(nutrientDelta)*.02,.000001*c.transport);if(nutrientDelta>0){pa.rootNutrientReserve=Math.max(0,pa.rootNutrientReserve-nutrientTransfer);pb.rootNutrientReserve=(pb.rootNutrientReserve||0)+nutrientTransfer}else{pb.rootNutrientReserve=Math.max(0,(pb.rootNutrientReserve||0)-nutrientTransfer);pa.rootNutrientReserve=(pa.rootNutrientReserve||0)+nutrientTransfer}}}}
 s.roots=s.roots.filter(r=>byId.has(r.nodeId)&&r.health>.08);
 const validRoots=new Set(s.roots.map(r=>r.id));s.connections=s.connections.filter(c=>c.health>.05&&(c.type!=='root'||(validRoots.has(c.a)&&validRoots.has(c.b))));
 surfaceSupport.clear();let rootTips=0,rootBiomass=0,rootConnections=0,surfaceConnections=0;
 for(const r of s.roots){if(r.children===0)rootTips++;rootBiomass+=r.length*.00008}
 for(const c of s.connections){if(c.type==='root')rootConnections++;else{surfaceConnections++;surfaceSupport.set(c.a,(surfaceSupport.get(c.a)||0)+c.strength);surfaceSupport.set(c.b,(surfaceSupport.get(c.b)||0)+c.strength)}}
 for(const p of plants)p.surfaceSupport=surfaceSupport.get(p.id)||0;
 s.stats.rootTips=rootTips;s.stats.rootConnections=rootConnections;s.stats.surfaceConnections=surfaceConnections;s.stats.rootBiomass=rootBiomass;
 return s;
}
function draw(ctx,s,plants,time,cfg){
 if(!s)return;const byId=new Map(plants.map(p=>[p.id,p])),roots=new Map(s.roots.map(r=>[r.id,r]));
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 for(const r of s.roots){const p=byId.get(r.nodeId);if(!p)continue;ctx.strokeStyle=r.health<.45?'rgba(151,126,103,.35)':p.waterVariant==='mangrove'?'rgba(205,164,112,.72)':'rgba(174,151,119,.62)';ctx.lineWidth=Math.max(.55,1.45-r.depth*.16);ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.tipX,r.tipY);ctx.stroke()}
 for(const c of s.connections){if(c.type==='root'){const a=roots.get(c.a),b=roots.get(c.b);if(!a||!b)continue;ctx.strokeStyle='rgba(116,190,151,'+(.2+c.strength*.42)+')';ctx.lineWidth=1+c.strength;ctx.beginPath();ctx.moveTo(a.tipX,a.tipY);ctx.quadraticCurveTo((a.tipX+b.tipX)*.5,(a.tipY+b.tipY)*.5+2,b.tipX,b.tipY);ctx.stroke()}else{const a=byId.get(c.a),b=byId.get(c.b);if(!a||!b)continue;ctx.strokeStyle='rgba(112,245,210,'+(.2+c.strength*.45)+')';ctx.lineWidth=1.2+c.strength*1.4;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)*.5,(a.y+b.y)*.5-3,b.x,b.y);ctx.stroke()}}
 ctx.restore();
}
function inspect(s,nodeId){const roots=s.roots.filter(r=>r.nodeId===nodeId),ids=new Set(roots.map(r=>r.id)),connections=s.connections.filter(c=>c.type==='root'&&(ids.has(c.a)||ids.has(c.b)));return{rootSegments:roots.length,rootTips:roots.filter(r=>r.children===0).length,rootDepth:roots.reduce((m,r)=>Math.max(m,r.depth),0),rootConnections:connections.length,rootLength:roots.reduce((n,r)=>n+r.length,0)}}
return Object.freeze({create,reset,step,draw,inspect});
});
