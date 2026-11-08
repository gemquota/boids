'use strict';
let canvas,ctx,W=1,H=1,dpr=1,N=0;
let x,y,vx,vy,kind,cellHead,link,cols=1,rows=1,cellSize=42;
let running=true,raf=0,last=0,frameCount=0,fps=60,meanSpeed=0,meanNeighbours=0,quality=1;
let pointer={x:-1e6,y:-1e6,active:false,mode:'repel',until:0};
let cfg={speed:2.5,force:.09,perception:42,separation:1.8,alignment:1.15,cohesion:1.05,trail:.14,flow:.45,wrap:true,mode:'ecosystem',vectors:false,predators:5,obstacles:7,food:1.0};
const TAU=Math.PI*2, colors=['#70f5d2','#78aaff','#ffc17a','#d89cff'];
const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function resize(w,h,ratio){W=w;H=h;dpr=Math.min(ratio||1,1.5);canvas.width=Math.max(1,Math.floor(W*dpr));canvas.height=Math.max(1,Math.floor(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#050a12';ctx.fillRect(0,0,W,H);rebuildGrid();}
function allocate(n,mode=cfg.mode){
 N=Math.max(300,Math.min(24000,n|0));x=new Float32Array(N);y=new Float32Array(N);vx=new Float32Array(N);vy=new Float32Array(N);kind=new Uint8Array(N);link=new Int32Array(N);
 for(let i=0;i<N;i++){let a=rand(0,TAU),s=rand(.7,cfg.speed);x[i]=rand(0,W);y[i]=rand(0,H);vx[i]=Math.cos(a)*s;vy[i]=Math.sin(a)*s;kind[i]=mode==='single'?0:mode==='school'?1:mode==='chaos'?i%4:Math.floor(Math.random()*4)}
 cellSize=cfg.perception;cols=Math.max(1,Math.ceil(W/cellSize));rows=Math.max(1,Math.ceil(H/cellSize));cellHead=new Int32Array(cols*rows);rebuildGrid();postMessage({type:'population',count:N});
}
function rebuildGrid(){
 if(!cellHead)return;
 cellHead.fill(-1);
 for(let i=0;i<N;i++){let cx=clamp((x[i]/cellSize)|0,0,cols-1),cy=clamp((y[i]/cellSize)|0,0,rows-1),c=cy*cols+cx;link[i]=cellHead[c];cellHead[c]=i}
}
function resizeGrid(){
 let s=Math.max(20,cfg.perception);let c=Math.max(1,Math.ceil(W/s)),r=Math.max(1,Math.ceil(H/s));
 if(c!==cols||r!==rows||s!==cellSize){cols=c;rows=r;cellSize=s;cellHead=new Int32Array(cols*rows)}
}
function steer(i,tx,ty,maxSpeed=cfg.speed,maxForce=cfg.force){
 let l2=tx*tx+ty*ty;if(l2<1e-8){steerX=0;steerY=0;return}let inv=maxSpeed/Math.sqrt(l2);let ax=tx*inv-vx[i],ay=ty*inv-vy[i],m2=ax*ax+ay*ay,lim=maxForce;
 if(m2>lim*lim){let k=lim/Math.sqrt(m2);ax*=k;ay*=k}steerX=ax;steerY=ay;
}
let obstacles=[],pred=[],pathData,pathCounts,steerX=0,steerY=0;
function seedEnvironment(){
 obstacles=[];for(let i=0;i<cfg.obstacles;i++)obstacles.push({x:rand(W*.12,W*.88),y:rand(H*.12,H*.88),r:rand(18,55),phase:rand(0,TAU)});
 pred=[];for(let i=0;i<cfg.predators;i++)pred.push({x:rand(0,W),y:rand(0,H),vx:rand(-1,1),vy:rand(-1,1),phase:rand(0,TAU)});
}
function update(dt,now){
 resizeGrid();rebuildGrid();let sepR=cellSize*.43,sep2=sepR*sepR,per2=cellSize*cellSize,neigh=0,speedSum=0,t=now*.00012;
 let px=pointer.x,py=pointer.y,pActive=pointer.active&&performance.now()<pointer.until;
 for(let i=0;i<N;i++){
  let ix=x[i],iy=y[i],guild=kind[i],sumX=0,sumY=0,alignX=0,alignY=0,sepX=0,sepY=0,count=0;
  let gx=(ix/cellSize)|0,gy=(iy/cellSize)|0;
  for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
   let cx=gx+ox,cy=gy+oy;
   if(cfg.wrap){cx=(cx+cols)%cols;cy=(cy+rows)%rows}else if(cx<0||cy<0||cx>=cols||cy>=rows)continue;
   for(let j=cellHead[cy*cols+cx];j!==-1;j=link[j]){
    if(j===i)continue;
    let dx=x[j]-ix,dy=y[j]-iy;
    if(cfg.wrap){if(dx>W*.5)dx-=W;else if(dx< -W*.5)dx+=W;if(dy>H*.5)dy-=H;else if(dy< -H*.5)dy+=H}
    let d2=dx*dx+dy*dy;if(d2>per2||d2<.0001)continue;
    let same=kind[i]===kind[j],interact=cfg.mode==='single'||cfg.mode==='school'||cfg.mode==='chaos'||same||(kind[i]===0&&kind[j]===2)||(kind[i]===2&&kind[j]===0);
    if(!interact)continue;
    count++;sumX+=dx;sumY+=dy;alignX+=vx[j];alignY+=vy[j];
    if(d2<sep2){let inv=1/d2;sepX-=dx*inv;sepY-=dy*inv}
   }
  }
  let ax=0,ay=0;
  if(count){
   let agentSpeed=cfg.speed*(guild===3?1.28:guild===2?.82:guild===1?.94:1),agentForce=cfg.force*(guild===3?1.18:1);
   steer(i,sepX,sepY,agentSpeed,agentForce);ax+=steerX*cfg.separation*(guild===0?1.35:guild===3?.78:1);ay+=steerY*cfg.separation*(guild===0?1.35:guild===3?.78:1);
   steer(i,alignX/count,alignY/count,agentSpeed,agentForce);ax+=steerX*cfg.alignment*(guild===1?1.3:guild===2?.72:1);ay+=steerY*cfg.alignment*(guild===1?1.3:guild===2?.72:1);
   steer(i,sumX/count,sumY/count,agentSpeed,agentForce);ax+=steerX*cfg.cohesion*(guild===2?1.25:guild===3?.78:1);ay+=steerY*cfg.cohesion*(guild===2?1.25:guild===3?.78:1);
  }
  // Smooth, multi-scale environmental current.
  ax+=Math.sin(iy*.0024+t+kind[i])*.34*cfg.flow+Math.cos(iy*.006-t*.7)*.12*cfg.flow;
  ay+=Math.cos(ix*.0021-t+kind[i])*.34*cfg.flow+Math.sin(ix*.005+t*.8)*.12*cfg.flow;
  // Soft repulsors around reef-like obstacles.
  for(let k=0;k<obstacles.length;k++){let o=obstacles[k],dx=ix-o.x,dy=iy-o.y,d2=dx*dx+dy*dy,rr=o.r+30;if(d2<rr*rr&&d2>1){let d=Math.sqrt(d2),f=(rr-d)/rr*1.5;ax+=dx/d*f;ay+=dy/d*f}}
  if(pActive){let dx=ix-px,dy=iy-py,d2=dx*dx+dy*dy;if(d2<28000&&d2>4){let d=Math.sqrt(d2),f=(1-d/167)*2.8*(pointer.mode==='attract'?-1:1);ax+=dx/d*f;ay+=dy/d*f}}
  // Predators create moving pressure fronts; only prey and small shoals flee.
  if(cfg.mode==='ecosystem'||cfg.mode==='mixed'){
   for(let k=0;k<pred.length;k++){let p=pred[k],dx=ix-p.x,dy=iy-p.y,d2=dx*dx+dy*dy;if(d2<19000&&d2>1&&(kind[i]===0||kind[i]===1)){let d=Math.sqrt(d2),f=(1-d/138)*2.3;ax+=dx/d*f;ay+=dy/d*f}}
  }
  let f2=ax*ax+ay*ay,lim=cfg.force*2.4;if(f2>lim*lim){let k=lim/Math.sqrt(f2);ax*=k;ay*=k}
  vx[i]+=ax*dt*60;vy[i]+=ay*dt*60;
  let s2=vx[i]*vx[i]+vy[i]*vy[i],max=cfg.speed*(guild===3?1.28:guild===2?.82:guild===1?.94:1);
  if(s2>max*max){let k=max/Math.sqrt(s2);vx[i]*=k;vy[i]*=k}else if(s2<.16){vx[i]*=1.04;vy[i]*=1.04}
  x[i]+=vx[i]*dt*60;y[i]+=vy[i]*dt*60;
  if(cfg.wrap){if(x[i]<0)x[i]+=W;else if(x[i]>=W)x[i]-=W;if(y[i]<0)y[i]+=H;else if(y[i]>=H)y[i]-=H}
  else {if(x[i]<8||x[i]>W-8)vx[i]*=-1;if(y[i]<8||y[i]>H-8)vy[i]*=-1;x[i]=clamp(x[i],8,W-8);y[i]=clamp(y[i],8,H-8)}
  speedSum+=Math.sqrt(vx[i]*vx[i]+vy[i]*vy[i]);neigh+=count;
 }
 // Predator motion is deliberately slower than prey.
 for(let k=0;k<pred.length;k++){let p=pred[k],best=-1,bestD=1e12;for(let j=0;j<N;j++){if(kind[j]>1)continue;let dx=x[j]-p.x,dy=y[j]-p.y,d2=dx*dx+dy*dy;if(cfg.wrap){if(dx>W*.5)dx-=W;else if(dx< -W*.5)dx+=W;if(dy>H*.5)dy-=H;else if(dy< -H*.5)dy+=H;d2=dx*dx+dy*dy}if(d2<bestD){bestD=d2;best=j}}let a=Math.sin(now*.0004+p.phase)*.035;if(best>=0&&bestD<220000){let dx=x[best]-p.x,dy=y[best]-p.y;if(cfg.wrap){if(dx>W*.5)dx-=W;else if(dx< -W*.5)dx+=W;if(dy>H*.5)dy-=H;else if(dy< -H*.5)dy+=H}let d=Math.hypot(dx,dy)||1;p.vx+=dx/d*.11;p.vy+=dy/d*.11}else{p.vx+=Math.cos(p.phase+a)*.025;p.vy+=Math.sin(p.phase+a)*.025}let l=Math.hypot(p.vx,p.vy)||1;p.vx=p.vx/l*1.45;p.vy=p.vy/l*1.45;p.x+=p.vx*dt*60;p.y+=p.vy*dt*60;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1}
 meanSpeed=speedSum/N;meanNeighbours=neigh/N;
}
function draw(){
 ctx.fillStyle='rgba(4,9,17,'+cfg.trail+')';ctx.fillRect(0,0,W,H);
 // Subtle reef geometry and current-field filaments.
 ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle='#527d91';ctx.lineWidth=1;
 for(let i=0;i<obstacles.length;i++){let o=obstacles[i];ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(o.x,o.y,o.r+7,0,TAU);ctx.stroke()}ctx.restore();
 // Batch all agents by species to avoid per-agent canvas state changes.
 pathCounts.fill(0);
 for(let i=0;i<N;i++){let k=kind[i],o=(pathCounts[k]++)*4,xx=x[i],yy=y[i],dx=vx[i],dy=vy[i],inv=1/(Math.sqrt(dx*dx+dy*dy)||1),len=k===3?7:5.2;pathData[o]=xx;pathData[o+1]=yy;pathData[o+2]=xx-dx*inv*len;pathData[o+3]=yy-dy*inv*len}
 for(let k=0;k<4;k++){let count=pathCounts[k];if(!count)continue;ctx.beginPath();for(let j=0;j<count*4;j+=4){ctx.moveTo(pathData[j],pathData[j+1]);ctx.lineTo(pathData[j+2],pathData[j+3])}ctx.strokeStyle=colors[k];ctx.globalAlpha=k===3?.9:.72;ctx.lineWidth=k===3?1.8:1.15;ctx.stroke()}
 ctx.globalAlpha=1;
 // Predator silhouettes.
 for(let i=0;i<pred.length;i++){let p=pred[i],a=Math.atan2(p.vy,p.vx);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='#ff758e';ctx.shadowColor='#ff526f';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(12,0);ctx.lineTo(-8,-6);ctx.lineTo(-4,0);ctx.lineTo(-8,6);ctx.closePath();ctx.fill();ctx.restore()}
 if(cfg.vectors){ctx.beginPath();for(let i=0;i<N;i+=Math.max(1,(N/650)|0)){ctx.moveTo(x[i],y[i]);ctx.lineTo(x[i]+vx[i]*8,y[i]+vy[i]*8)}ctx.strokeStyle='#ffffff42';ctx.lineWidth=.6;ctx.stroke()}
}
function frame(now){if(!running)return;let dt=Math.min((now-last)/1000,.033);last=now;update(dt,now);draw();frameCount++;if(now-raf>750){fps=Math.round(frameCount*1000/(now-raf));frameCount=0;raf=now;postMessage({type:'stats',fps,speed:meanSpeed,neighbours:meanNeighbours,count:N})}requestAnimationFrame(frame)}
function init(c){canvas=c;ctx=canvas.getContext('2d',{alpha:false,desynchronized:true});seedEnvironment();resize(W,H,1);allocate(3600);last=performance.now();raf=last;requestAnimationFrame(frame)}
onmessage=e=>{let m=e.data;if(m.type==='init'){init(m.canvas);return}if(m.type==='resize'){resize(m.width,m.height,m.dpr);seedEnvironment();return}if(m.type==='config'){Object.assign(cfg,m.values);if(m.values.count)allocate(m.values.count);if(m.values.obstacles!==undefined||m.values.predators!==undefined)seedEnvironment();return}if(m.type==='pointer'){pointer.x=m.x;pointer.y=m.y;pointer.active=m.active;pointer.mode=m.mode||'repel';pointer.until=performance.now()+800;return}if(m.type==='action'){if(m.action==='pause'){running=!running;if(running){last=performance.now();raf=last;requestAnimationFrame(frame)}}if(m.action==='reset'){allocate(N);seedEnvironment()}if(m.action==='scatter'){for(let i=0;i<N;i++){let a=rand(0,TAU);vx[i]=Math.cos(a)*rand(1,cfg.speed);vy[i]=Math.sin(a)*rand(1,cfg.speed);x[i]=rand(0,W);y[i]=rand(0,H)}}if(m.action==='pulse'){pointer={x:W/2,y:H/2,active:true,mode:'repel',until:performance.now()+1200}}if(m.action==='clear'){ctx.fillStyle='#050a12';ctx.fillRect(0,0,W,H)}}};
