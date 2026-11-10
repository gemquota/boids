'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const worker = fs.readFileSync(require.resolve('../boids-worker.js'), 'utf8');
const schema = require('../config-schema.js');
const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');

test('river network uses curved, shared geometry for drawing and freshwater distance', () => {
  const start = worker.indexOf('let riverNetworkCache=null;');
  const end = worker.indexOf('\nfunction plantStage', start);
  assert.ok(start >= 0 && end > start, 'river geometry helpers must be present');
  const context = { W: 1200, H: 800, TAU: Math.PI * 2, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)) };
  vm.runInNewContext(worker.slice(start, end) + ';this.network=buildRiverNetwork();this.nearest=nearestFreshwater;', context);
  const network = context.network;
  assert.equal(network.tributaries.length, 5);
  assert.equal(network.feeders.length, 10);
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
  assert.match(worker, /function draw\(\)\{ctx\.globalAlpha=1;ctx\.fillStyle='#040911';ctx\.fillRect\(0,0,W,H\)/);
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
  assert.match(renderer, /quadraticCurveTo/);
  assert.match(renderer, /r=2\.8\+Math\.min\(3\.4,p\.size\*2\.7\)/);
  assert.match(renderer, /hexPath\(p\.x,p\.y,r,p\.angle\)/);
  assert.match(renderer, /hexPath\(p\.x,p\.y,r\*\.56/);
  assert.doesNotMatch(renderer, /ctx\.arc\(/);
  assert.doesNotMatch(worker, /function drawCrystal\(p\)|function drawPolypArms\(/);
  assert.doesNotMatch(worker, /function lagoon\(/);
});
console.log('Ecology visuals: organic rivers, no-trail clearing, landed-spore germination and ribbon-plant rendering passed.');


test('plants and boids are the only food sources', () => {
  assert.doesNotMatch(worker, /function seedFood|food=\[\]|food\.length|foodStock|foodQuality|foodProductivity/);
  assert.match(worker, /Math.max\(64,Math.min\(120,Math.round\(W\*H\/14000\)\)\)/);
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
  assert.doesNotMatch(hue, /genome\[o\+2\]|weight/);
  assert.match(hue, /traitGenes/);
});

test('observatory charts do not redraw while the drawer is closed', () => {
  assert.match(html, /panel==='analysis'&&Date\.now\(\)-lastChartRender>3500/);
  assert.match(html, /if\(which==='analysis'\).*?redrawCharts\(\)/);
  assert.match(worker, /const includeHistory=now-lastHistoryPost>5000/);
});
