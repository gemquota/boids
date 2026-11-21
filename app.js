import{createWorld,stepWorld,resizeWorld,randomWorld}from"./core/simulation.js";
import{createHabitat,updateEcology}from"./organisms/ecology.js";
import{inheritTraits,describeGenome}from"./organisms/genetics.js";
import{summarize}from"./labs/observatory.js";
const canvas=document.querySelector("#world"),ctx=canvas.getContext("2d"),stats=document.querySelector("#stats"),panel=document.querySelector("#panel");
let w=innerWidth,h=innerHeight,dpr=1,world,habitat,running=true,last=0,tab="FIELD",showPlants=true,showHabitat=false;
function fit(){const nw=innerWidth,nh=innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=nw*dpr;canvas.height=nh*dpr;canvas.style.width=nw+"px";canvas.style.height=nh+"px";ctx.setTransform(dpr,0,0,dpr,0,0);if(world)resizeWorld(world,nw,nh);w=nw;h=nh}
function reset(){world=createWorld(w,h,500,Math.floor(Math.random()*999999));habitat=createHabitat(w,h,world.seed);drawPanel()}
function draw(){ctx.fillStyle="#06121b";ctx.fillRect(0,0,w,h);if(showHabitat){for(let y=0;y<habitat.rows;y++)for(let x=0;x<habitat.cols;x++){const f=habitat.fields[y*habitat.cols+x];ctx.fillStyle="rgba(62,150,133,"+(f.moisture*.15)+")";ctx.fillRect(x*w/habitat.cols,y*h/habitat.rows,w/habitat.cols+1,h/habitat.rows+1)}}
 if(showPlants)for(const p of habitat.plants){ctx.fillStyle="rgba(101,214,157,"+(.25+p.energy*.65)+")";ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}
 for(const a of world.agents){const angle=Math.atan2(a.vy,a.vx);ctx.save();ctx.translate(a.x,a.y);ctx.rotate(angle);ctx.fillStyle="hsl("+a.traits.hue+" 68% 68%)";ctx.beginPath();ctx.moveTo(5.5,0);ctx.lineTo(-3.5,-2.4);ctx.lineTo(-2.3,0);ctx.lineTo(-3.5,2.4);ctx.closePath();ctx.fill();ctx.restore()}
 const s=summarize(world,habitat);stats.textContent=s.population+" agents · "+s.plants+" plants · "+s.births+" births · "+s.deaths+" deaths";
}
function drawPanel(){const s=summarize(world,habitat);const meanTraits={};for(const k of ["speed","perception","metabolism","fertility","hue"])meanTraits[k]=world.agents.length?world.agents.reduce((v,a)=>v+(a.traits[k]||0),0)/world.agents.length:0;
 panel.innerHTML=tab==="FIELD"?'<h2>FIELD</h2><p>Population: '+s.population+'</p><p>Mean energy: '+s.meanEnergy.toFixed(2)+'</p><p>Plants: '+s.plants+'</p><label><input id="plants" type="checkbox" '+(showPlants?"checked":"")+'> Show vegetation</label><label><input id="habitat" type="checkbox" '+(showHabitat?"checked":"")+'> Habitat moisture overlay</label>':tab==="DNA"?'<h2>DNA · inherited traits</h2><p>Population trait means</p>'+Object.entries(meanTraits).map(([k,v])=>'<p>'+k+' · '+v.toFixed(3)+'</p>').join('')+'<p>Offspring inherit a parental trait mix with bounded mutation. The genome package remains optional to Core.</p>':'<h2>OBSERVATORY</h2><p>Simulation tick: '+s.tick+'</p><p>Population: '+s.population+'</p><p>Births: '+s.births+' · Deaths: '+s.deaths+'</p><p>Mean energy: '+s.meanEnergy.toFixed(3)+'</p><p>Mean age: '+s.meanAge.toFixed(1)+'</p><p>Mean speed: '+s.meanSpeed.toFixed(3)+'</p><p>Plant population: '+s.plants+'</p><button id="export">Export snapshot</button>';
 panel.querySelector("#plants")?.addEventListener("change",e=>{showPlants=e.target.checked});panel.querySelector("#habitat")?.addEventListener("change",e=>{showHabitat=e.target.checked});panel.querySelector("#export")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify({version:1,world,habitat})],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="boids-snapshot.json";a.click();URL.revokeObjectURL(a.href)});
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;panel.classList.add("open");drawPanel();document.querySelectorAll("[data-tab]").forEach(x=>x.classList.toggle("active",x===b))});
document.querySelector("#close").onclick=()=>panel.classList.remove("open");
document.querySelector("#pause").onclick=e=>{running=!running;e.target.textContent=running?"Pause":"Resume"};
document.querySelector("#reset").onclick=reset;
addEventListener("resize",fit);fit();reset();
function loop(t){const dt=Math.min((t-last)/16.67||1,2);last=t;if(running){stepWorld(world,dt,{inheritTraits:traits=>inheritTraits(traits,traits,()=>randomWorld(world))});updateEcology(habitat,world.agents,dt)}draw();requestAnimationFrame(loop)}requestAnimationFrame(loop);
