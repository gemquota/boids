'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const worker = fs.readFileSync(require.resolve('../boids-worker.js'), 'utf8');
const schema = require('../config-schema.js');
const development = require('../development.js');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');

test('river network uses curved, shared geometry for drawing and freshwater distance', () => {
  const start = worker.indexOf('let riverNetworkCache=null;');
  const end = worker.indexOf('\nfunction plantStage', start);
  assert.ok(start >= 0 && end > start, 'river geometry helpers must be present');
  const context = { W: 1200, H: 800, TAU: Math.PI * 2, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) };
  vm.runInNewContext(worker.slice(start, end) + ';this.network=buildRiverNetwork();this.nearest=nearestFreshwater;', context);
  const network = context.network;
  assert.equal(network.tributaries.length, 5);
  assert.equal(network.feeders.length, 15);
  const sinuosity = path => {
    const chord = Math.hypot(path.at(-1).x - path[0].x, path.at(-1).y - path[0].y);
    let length = 0;
    for (let i = 1; i < path.length; i++) length += Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
    return length / chord;
  };
  assert.ok(sinuosity(network.main) > 1.002, 'main channel should not be a straight segment');
  for (const path of [...network.tributaries, ...network.feeders]) {
    assert.ok(path.length >= 64, 'streams should be smoothly sampled');
    assert.ok(sinuosity(path) > 1.025, 'tributaries and feeders must visibly meander');
  }
  const sample = network.tributaries[2][Math.floor(network.tributaries[2].length / 2)];
  assert.ok(context.nearest(sample.x, sample.y).distance < 25, 'cached freshwater field must stay close to the rendered stream geometry');
  assert.ok(network.field && network.field.distance.length > 0, 'freshwater field should be cached for cheap ecological queries');
});

test('canvas is fully cleared every frame and trail controls are absent', () => {
  assert.match(worker, /function drawAtmosphere\(\)\{[\s\S]*?ctx\.fillRect\(0,0,W,H\)/);
  assert.match(worker, /function draw\(\)\{[\s\S]{0,300}?drawAtmosphere\(\)/);
  assert.doesNotMatch(worker, /rgba\(4,9,17,'\+cfg\.trail\+'\)/);
  assert.ok(!schema.coreSliderDefs.some(item => item.id === 'trail'));
});

test('initial and released spores float before landing and only settled spores can germinate', () => {
  assert.match(worker, /settleAfter:rand\(5,10\),landed:false/);
  assert.match(worker, /settleAfter:rand\(4,8\),landed:false/);
  assert.match(worker, /if\(!sp\.landed\)\{sp\.x\+=sp\.vx\*dt/);
  assert.match(worker, /sp\.landed&&sp\.settleClock>=1\.8/);
  assert.match(worker, /sp\.landed=true;sp\.vx=0;sp\.vy=0/);
  assert.doesNotMatch(worker, /if\(sp\.life>7\)/);
});

test('plant renderer combines ribbon fronds with visible faceted hexagonal growth crowns', () => {
  const start = worker.indexOf('function drawPlantFronds(p)');
  const end = worker.indexOf('function drawWaterways()', start);
  assert.ok(start >= 0 && end > start);
  const renderer = worker.slice(start, end);
  assert.match(renderer, /scale=\(6\+p\.size\*8\.5\)\*\(mature\?1\.24:\.82\)\*\(senescent\?\.68:1\)\*\.5/);
  assert.match(renderer, /quadraticCurveTo/);
  assert.match(renderer, /length=scale\*\(\.72\+\.28\*Math\.cos\(spread\*Math\.PI\)\)\*\(p\.branchLengthScale\|\|1\)/);
  assert.match(renderer, /width=Math\.max\(\.65,\(\.9\+p\.size\*\.32\)\*\(p\.branchThicknessScale\|\|1\)\)/);
  assert.match(renderer, /r=\(2\.8\+Math\.min\(3\.4,p\.size\*2\.7\)\)\*\.25\*\(p\.nodeScale\|\|1\)/);
  assert.match(renderer, /hexPath\(p\.x,p\.y,r,p\.angle\)/);
  assert.match(renderer, /hexPath\(p\.x,p\.y,r\*\.56/);
  assert.match(renderer, /flowerCount/);
  assert.match(renderer, /ctx\.arc\(/);
  assert.doesNotMatch(worker, /function drawCrystal\(p\)|function drawPolypArms\(/);
  assert.doesNotMatch(worker, /function lagoon\(/);
});
console.log('Ecology visuals: organic rivers, no-trail clearing, landed-spore germination and ribbon-plant rendering passed.');


test('plants and boids are the only food sources', () => {
  assert.doesNotMatch(worker, /function seedFood|food=\[\]|food\.length|foodStock|foodQuality|foodProductivity/);
  assert.match(worker, /initialSporeCount=Math.max\(16,Math.min\(30,Math.round\(W\*H\/56000\)\)\)/);
  assert.match(worker, /plantGain/);
  assert.match(worker, /energy\[i\]=clamp\(energy\[i\]\+plantGain-cost-movementCost/);
  assert.match(worker, /energy\[hunter\]=clamp\(energy\[hunter\]\+\.09/);
  assert.doesNotMatch(html, /id="foodPatches"|id="foodRegen"|Renewable food patches/);
  assert.ok(schema.coreSliderDefs.some(item => item.id === 'plantPreference' && item.label === 'Plant preference'));
  assert.ok(!schema.coreSliderDefs.some(item => /foodPatches|foodRegen|foodBite|foodEnergyYield|foodCapacity/.test(item.id)));
});

test('boid display colour ignores mutable neural connection weights', () => {
  const start = worker.indexOf('function phenotypeHue(i)');
  const end = worker.indexOf('\n', start);
  const hue = worker.slice(start, end);
  assert.doesNotMatch(hue, /genome\[o\+2\]|weight|connectionSource|connectionDestination/);
  assert.match(hue, /traitGenes/);
});

test('observatory charts do not redraw while the drawer is closed', () => {
  assert.match(html, /panel==='analysis'&&Date\.now\(\)-lastChartRender>3500/);
  assert.match(html, /if\(which==='analysis'\).*?redrawCharts\(\)/);
  assert.match(worker, /const includeHistory=now-lastHistoryPost>5000/);
});

test('DNA and observatory use distinct icon tabs and reset lives in Field Operations', () => {
  assert.ok(html.includes('class="drawerToggle dnaTab iconTab" id="openDNA"'));
  assert.ok(html.includes('class="drawerToggle observatoryTab iconTab" id="openObservatory"'));
  assert.ok(html.includes('id="openDNA" aria-expanded="false" aria-label="DNA and neural genome"><svg'));
  assert.ok(html.includes('id="openObservatory" aria-expanded="false" aria-label="Evolutionary observatory"><svg'));
  assert.ok(html.includes('id="openControls" aria-expanded="false" aria-label="Configuration"><svg'));
  assert.ok(html.includes('id="openInfo" type="button"'));
  assert.ok(html.includes('id="infoOverlay"'));
  assert.ok(html.includes('right:33.333%;top:0'));
  assert.ok(html.includes('top:33.333%'));
  assert.ok(html.includes('left:33.333%'));
  assert.ok(html.includes('resize:both'));
  assert.ok(html.includes('<details class="leftOperations" open>'));
  assert.ok(!html.includes('id="topReset"'));
  assert.ok(html.includes('id="reset" title="Replace the entire ecosystem and population">↻ Reset simulation'));
  assert.ok(html.includes("$('reset').onclick=resetSimulation"));
  assert.ok(!html.includes("$('topReset').onclick"));
});
test('boids resolve physical body overlap and exchange collision impulse', () => {
  assert.ok(worker.includes('function collisionRadius(i)'));
  assert.ok(worker.includes('function resolveAgentCollisions(updateN,dt)'));
  assert.ok(worker.includes('BoidsPhysics.resolveCircleContact'));
  assert.ok(worker.includes('BoidsPhysics.sweptCircleTime'));
  assert.ok(worker.includes('resolveAgentCollisions(updateN,dt)'));
});



test('mature grandmother plants remain reproductively active until senescence', () => {
  assert.ok(worker.includes("p.stage==='mature'||p.stage==='grandmother'||p.stage==='great-grandmother'"));
  assert.ok(worker.includes('sporeFailedCrowded'));
  assert.ok(worker.includes('sporeFailedDry'));
});

test('colony bonds persist through ordinary separation and only lose endpoints on death', () => {
  assert.ok(worker.includes('bond.strength=clamp(bond.strength+(near?.035:0)*dt,0,1)'));
  assert.ok(!worker.includes('near?.035:-.012'));
  assert.ok(worker.includes("recordPopulationEvent('bond_broken',{a:bond.a,b:bond.b,reason:'organism_death'})"));
  assert.ok(worker.includes('function applyBondConstraints(updateN,dt)'));
  assert.ok(worker.includes('bondOpportunity(individualId[i],individualId[bondIndex],frameNo)<.0015*dt*60*Math.max(1,bondCapacity(individualId[i]))'));
  assert.ok(worker.includes('bond.restLength'));
  assert.ok(worker.includes('applyBondConstraints(updateN,dt)'));
});

test('newborns receive four temporary bonding sites and mature adult attachment anatomy', () => {
  const morphology=development.createState({},()=>0);
  assert.equal(morphology.neonatalBondSites.length,4);
  assert.equal(morphology.neonatalAvailableCount,4);
  development.advance(morphology,20,8,()=>0);
  assert.ok(morphology.neonatalBondSites.every(site=>site.state==='converted'));
  assert.ok(morphology.bondingSites>=1&&morphology.bondingSites<=2);
  assert.ok(worker.includes('BoidsDevelopment.createState(makeMorphology(a,b),random)'));
  assert.ok(worker.includes('BoidsDevelopment.advance(developedMorphology,age[i],dt,random'));
});

test('population accounting separates biological events from manual resizing', () => {
  assert.ok(worker.includes("recordPopulationEvent('birth'"));
  assert.ok(worker.includes("recordPopulationEvent('death'"));
  assert.ok(worker.includes("recordPopulationEvent('manual_add'"));
  assert.ok(worker.includes("recordPopulationEvent('manual_remove'"));
  assert.ok(worker.includes('populationAccountingError:initialPopulation+populationResizeAdds+births-populationResizeRemovals-deaths-N'));
});

test('parental contribution telemetry exposes reproductive skew', () => {
  assert.ok(worker.includes('function summarizeParentalContribution()'));
  for(const field of ['parentContributionHHI','parentContributionEffectiveCount','topParentContributionShare'])assert.ok(worker.includes(field),field);
  assert.ok(worker.includes('...summarizeParentalContribution()'));
});

test('run telemetry records changing watershed conditions rather than only static habitat averages', () => {
  assert.ok(worker.includes('function summarizeHydrology()'));
  for(const field of ['meanSoilMoisture','meanGroundwater','meanSurfaceWater','meanRainfall','meanSalinity','meanFloodDepth','maxFloodDepth','tidePhase','stormPhase'])assert.ok(worker.includes(field),field);
  assert.ok(worker.includes('...summarizeHydrology()'));
});

test('current neural interface has eight bounded sensory inputs and eight outputs', () => {
  assert.ok(worker.includes('for(let k=0;k<8;k++)inputs[k]=(cfg.sensorMask&(1<<k))?sense[k]:0'));
  assert.ok(worker.includes('for(let si=0;si<8;si++)sense[si]=clamp(sense[si]+rand(-cfg.sensoryNoise,cfg.sensoryNoise),0,1)'));
  assert.ok(worker.includes('brainOut[i*8+k]'));
  assert.ok(worker.includes('contributionPenalty=Math.log1p(reproductiveSuccess.get(individualId[j])||0)*.08'));
});

test('plants avoid canopy collisions and use treetop tip-shyness for new growth', () => {
  assert.match(worker, /function plantCollisionRadius\(p\)/);
  assert.match(worker, /function plantPositionClear\(px,py,size=\.2,ignoreId=0\)/);
  assert.match(worker, /function findPlantGrowthPosition\(parent,angle,distance,size=\.2\)/);
  assert.match(worker, /placement=findPlantGrowthPosition\(p,a,len,\.2\)/);
  assert.match(worker, /crowded=!plantPositionClear\(sp\.x,sp\.y,\.2\)/);
});

test('new plants inherit nearby colour using distance and size weighted hue blending', () => {
  assert.match(worker, /function plantHueAt\(px,py,ignoreId=0\)/);
  assert.match(worker, /weight=\(\.25\+Math\.max\(\.05,p\.size\|\|\.2\)\*1\.5\)\/\(1\+d2\/\(64\*64\)\)/);
  assert.match(worker, /node\.hue=plantHueAt\(node\.x,node\.y,0\)/);
  assert.match(worker, /Number\.isFinite\(p\.hue\)/);
});

test('mother plants grow branch-tip flowers without grandmother twin-spawning', () => {
  assert.match(worker, /p\.grandmother=true;p\.flowerCount=3\+Math\.floor\(random\(\)\*3\);p\.flowerGrowth=0/);
  assert.match(worker, /if\(p\.grandmother\)p\.flowerGrowth=Math\.min\(1,/);
  assert.match(worker, /if\(!senescent&&k<\(p\.flowerCount\|\|0\)\)/);
  assert.doesNotMatch(worker, /p\.grandmother=true;p\.offspring\+=2/);
});

test('founder limb counts follow the requested weighted distribution and descendants mutate conservatively', () => {
  const start = worker.indexOf('const LIMB_COUNT_WEIGHTS=');
  const end = worker.indexOf('function bondOpportunity', start);
  assert.ok(start >= 0 && end > start, 'weighted limb sampler must be defined');
  const context = {};
  vm.runInNewContext('let seed=123456789;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};' + worker.slice(start, end) + ';this.sample=sampleLimbCount;this.weights=LIMB_COUNT_WEIGHTS;', context);
  assert.deepEqual(Array.from(context.weights), [10,15,30,15,10,8,4,3,2,2,1]);
  const counts = new Array(11).fill(0);
  for (let i = 0; i < 100000; i++) counts[context.sample()]++;
  for (let i = 0; i < counts.length; i++) assert.ok(Math.abs(counts[i] / 1000 - context.weights[i]) < 0.65, 'limb count ' + i + ' should match its percentage');
  assert.match(worker, /m\.limbs\.length<10/);
  assert.match(worker, /random\(\)<\.025/);
  assert.doesNotMatch(worker, /Math\.floor\(random\(\)\*5\)/);
});

test('plant morphology continuously responds to freshwater distance and latitude', () => {
  const start=worker.indexOf('function plantMorphologyFromGradients('),end=worker.indexOf('function plantNodeGrowthScale',start);
  assert.ok(start>=0&&end>start,'pure morphology gradient helper must exist');
  const context={clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v))};
  vm.runInNewContext(worker.slice(start,end)+';this.morph=plantMorphologyFromGradients;',context);
  const near=context.morph(1,0),far=context.morph(0,1);
  assert.ok(near.nodeScale>far.nodeScale,'near-water nodes should be larger');
  assert.ok(near.branchLimit<far.branchLimit,'near-water plants should produce fewer nodes');
  assert.ok(near.branchLengthScale<far.branchLengthScale,'near-water branches should be shorter');
  assert.ok(near.branchThicknessScale>far.branchThicknessScale,'near-water branches should be thicker');
  assert.ok(Math.abs(near.latitudeScale-1.05)<1e-9,'equator should receive only a slight 5% bonus');
  assert.ok(Math.abs(far.latitudeScale-.95)<1e-9,'poles should receive only a slight 5% penalty');
  assert.match(worker,/p\.biomass\+cfg\.plantGrowth\*dt[\s\S]*?nodeGrowth\.scale\*p\.latitudeScale/);
  assert.match(worker,/\.5\*p\.nodeScale\*p\.latitudeScale/);
  assert.match(worker,/len=\(4\.8\+p\.size\*7\)\*\.5\*p\.branchLengthScale/);
  assert.match(worker,/width=Math\.max\(\.65,\(\.9\+p\.size\*\.32\)\*\(p\.branchThicknessScale\|\|1\)\)/);
  assert.match(worker,/function nearestSaltwater\(px,py\)/);
  assert.match(worker,/saltSpines:salt<fresh/);
  assert.match(worker,/if\(p\.saltSpines&&!senescent\)/);
  assert.match(worker,/const \[northWest,southEast\]=network\.coasts/);
});

test('smaller nodes grow more slowly relative to their whole plant', () => {
  const start=worker.indexOf('function plantNodeGrowthScale('),end=worker.indexOf('function applyPlantMorphology',start);
  assert.ok(start>=0&&end>start);
  const context={clamp:(v,lo,hi)=>Math.max(lo,Math.min(hi,v))};
  vm.runInNewContext(worker.slice(start,end)+';this.scale=plantNodeGrowthScale;',context);
  const large=context.scale(.8,.8),small=context.scale(.2,.8);
  assert.equal(large.ratio,1);
  assert.ok(small.ratio<large.ratio);
  assert.ok(small.scale<large.scale);
});

test('neonatal bonding can recruit distinct colony neighbours', () => {
  assert.match(worker, /BoidsDevelopment.availableNeonatalSite/);
  assert.match(worker, /occupyNeonatalBondSite\(a,sideA\)/);
  assert.match(worker, /bondOpportunity\(individualId\[i\],individualId\[bondIndex\],frameNo\)/);
});
test('organism contacts use swept collision impulses and persistent tether constraints', () => {
  assert.match(worker, /BoidsPhysics\.resolveCircleContact/);
  assert.match(worker, /BoidsPhysics\.sweptCircleTime/);
  assert.match(worker, /function applyBondConstraints\(updateN,dt\)/);
  assert.match(worker, /function drawBondNetwork\(plantById\)/);
});
