/* Deterministic 2D contact mechanics shared by the worker and Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BoidsPhysics=api;})(typeof self!=='undefined'?self:globalThis,function(){
'use strict';
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function sweptCircleTime(px,py,vx,vy,rx,ry,rvx,rvy,radius){
  const sx=px-rx,sy=py-ry,dx=vx-rvx,dy=vy-rvy;
  const c=sx*sx+sy*sy-radius*radius;
  if(c<=0)return 0;
  const a=dx*dx+dy*dy;if(a<1e-12)return null;
  const b=2*(sx*dx+sy*dy),disc=b*b-4*a*c;if(disc<0)return null;
  const t=(-b-Math.sqrt(disc))/(2*a);
  return t>=0&&t<=1?t:null;
}
function resolveCircleContact(a,b,options={}){
  const dx=finite(b.x)-finite(a.x),dy=finite(b.y)-finite(a.y),d2=dx*dx+dy*dy;
  const distance=Math.sqrt(d2),minimum=Math.max(0,finite(a.radius))+Math.max(0,finite(b.radius));
  if(distance>=minimum)return {hit:false,impulse:0,penetration:0};
  const nx=distance>1e-8?dx/distance:1,ny=distance>1e-8?dy/distance:0;
  const invA=1/Math.max(.001,finite(a.mass,1)),invB=1/Math.max(.001,finite(b.mass,1)),sum=invA+invB;
  const penetration=minimum-distance,slop=Math.max(0,finite(options.slop,.01));
  const correction=Math.max(0,penetration-slop)*clamp(finite(options.positionPercent,.78),0,1)/sum;
  a.x-=nx*correction*invA;a.y-=ny*correction*invA;
  b.x+=nx*correction*invB;b.y+=ny*correction*invB;
  const rvx=finite(b.vx)-finite(a.vx),rvy=finite(b.vy)-finite(a.vy),normalVelocity=rvx*nx+rvy*ny;
  let impulse=0;
  if(normalVelocity<0){
    const restitution=clamp(finite(options.restitution,.22),0,1);
    impulse=-(1+restitution)*normalVelocity/sum;
    const ix=impulse*nx,iy=impulse*ny;
    a.vx-=ix*invA;a.vy-=iy*invA;b.vx+=ix*invB;b.vy+=iy*invB;
    const tx=rvx-normalVelocity*nx,ty=rvy-normalVelocity*ny,tl=Math.hypot(tx,ty);
    if(tl>1e-8){
      const friction=clamp(finite(options.friction,.16),0,1),jt=Math.min(friction*impulse,tl/sum),jx=tx/tl*jt,jy=ty/tl*jt;
      a.vx+=jx*invA;a.vy+=jy*invA;b.vx-=jx*invB;b.vy-=jy*invB;
    }
  }
  return {hit:true,impulse,penetration,normalX:nx,normalY:ny};
}
function solveBond(a,b,options={}){
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,rest=Math.max(.1,finite(options.restLength,d));
  const error=d-rest,stiffness=clamp(finite(options.stiffness,.16),0,1),damping=clamp(finite(options.damping,.12),0,1);
  const nx=dx/d,ny=dy/d,invA=1/Math.max(.001,finite(a.mass,1)),invB=1/Math.max(.001,finite(b.mass,1)),sum=invA+invB;
  const correction=error*stiffness/sum;
  a.x+=nx*correction*invA;a.y+=ny*correction*invA;
  b.x-=nx*correction*invB;b.y-=ny*correction*invB;
  const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny,force=relative*damping/sum;
  a.vx+=nx*force*invA;a.vy+=ny*force*invA;
  b.vx-=nx*force*invB;b.vy-=ny*force*invB;
  return {distance:d,error};
}
return Object.freeze({sweptCircleTime,resolveCircleContact,solveBond});
});