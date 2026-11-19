'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync(require.resolve('../plant-lab.html'), 'utf8');

test('dispersed spores are not rejected merely for landing beside their parent', () => {
  assert.match(source, /plantPositionClear\(s\.x,s\.y,\.2,s\.parentId\|\|0\)/);
});

test('dry landed spores remain dormant long enough to retry germination', () => {
  assert.match(source, /s\.dormant=true;s\.settleClock=0/);
  assert.match(source, /if\(s\.dormant\)plantCounters\.sporesRejectedDry\+\+/);
  assert.match(source, /sporeLife:36/);
});

test('spore landings and germinations are separately observable', () => {
  assert.match(source, /plantCounters\.sporesLanded\+\+/);
  assert.match(source, /' · landed '\+plantCounters\.sporesLanded\+' · germinated '\+plantCounters\.sporesGerminated/);
});

test('Plant Lab uses a restrained hierarchy of one river, four tributaries and three fine streaks', () => {
  assert.match(source, /specs=\[\[\.2,-1,-1,\.035,\.14\],\[\.42,1,-1,\.045,\.17\],\[\.66,-1,-1,\.035,\.16\],\[\.82,1,-1,\.025,\.12\]\]/);
  assert.match(source, /streakSpecs=\[\[\.31,1,-1,\.018,\.075\],\[\.55,-1,-1,\.022,\.085\],\[\.74,1,-1,\.016,\.065\]\]/);
  assert.match(source, /network\.tributaries\.map/);
  assert.match(source, /network\.feeders\.map/);
  assert.match(source, /width:Math\.max\(1\.2,H\*\.0022\),alpha:\.48/);
});

test('Plant Lab uses a floating emoji launcher and three title-labelled bubble menus', () => {
  assert.match(source, /className='floatingControls'/);
  assert.match(source, /group\('Simulation','🌱'/);
  assert.match(source, /group\('View','👁️'/);
  assert.match(source, /group\('Tools','🧰'/);
  assert.match(source, /className='actionMenuTitle';heading\.textContent=name/);
  assert.doesNotMatch(source, /className='actionBar'/);
});


test('Plants render persistently on the world canvas with a minimum visible silhouette', () => {
  assert.doesNotMatch(source, /plantLayer|plantCanvas|plantCtx/);
  assert.match(source, /originKind:'starter-seedling'/);
  assert.match(source, /r=Math\.max\(2\.4,/);
  assert.match(source, /ctx\.globalAlpha=1;ctx\.strokeStyle='rgba\(218,255,231,1\)'/);
  assert.match(source, /drawPlantNode\(p\)/);
});

test('Plant Lab uses pinch gestures instead of zoom buttons', () => {
  assert.match(source, /const activePointers=new Map\(\);let pinchState=null/);
  assert.match(source, /pinchState\.zoom\*Math\.hypot\(dx,dy\)\/pinchState\.distance/);
  assert.doesNotMatch(source, /document\.querySelector\('#zoom(In|Out)'\)\.onclick/);
  assert.doesNotMatch(source, /label\(zoom(Out|In),/);
});


test('Plant Lab draws plants and spores inside the same world transform as terrain and roots', () => {
  const draw = source.slice(source.indexOf('function draw(){'), source.indexOf('function frame(now)'));
  assert.equal((draw.match(/ctx\.translate\(W\*\.5\+camera\.x/g) || []).length, 1);
  assert.match(draw, /BoidsPlantStructures\.draw\(ctx,structureState,plants,simTime,cfg\);drawPlantLayer\(\)/);
  assert.doesNotMatch(draw, /ctx\.restore\(\);ctx\.save\(\);ctx\.translate\(W\*\.5\+camera\.x/);
});

test('Plant render isolates every organism and skips invalid coordinates without aborting the frame', () => {
  const start = source.indexOf('function drawPlantLayer(){');
  const end = source.indexOf('function draw(){', start);
  const layer = source.slice(start, end);
  assert.match(layer, /for\(const p of plants\)\{if\(!p\)continue;if\(!Number\.isFinite\(p\.x\)\|\|!Number\.isFinite\(p\.y\)\)/);
  assert.match(layer, /ctx\.save\(\);try\{ctx\.globalAlpha=1/);
  assert.match(layer, /catch\(error\)\{if\(!failedPlantRenderIds\.has\(p\.id\)\)/);
  assert.match(layer, /finally\{ctx\.restore\(\)\}/);
});

test('Plant render failures retain a visible fallback and are logged once per plant', () => {
  const start = source.indexOf('function drawPlantLayer(){');
  const end = source.indexOf('function draw(){', start);
  const layer = source.slice(start, end);
  assert.match(layer, /plantDebugEvent\('plant-render-fallback'/);
  assert.match(layer, /drawPlantFallback\(p\)/);
  assert.match(source, /function drawPlantFallback\(p\)/);
  assert.match(source, /failedPlantRenderIds\.has\(p\.id\)/);
  assert.match(source, /plant-render-recovered/);
});

test('Plant Lab exposes a bounded diagnostic log with tap-to-copy controls', () => {
  assert.match(source, /plantDebugLimit=180/);
  assert.match(source, /plantDebugEntries\.splice\(0,plantDebugEntries\.length-plantDebugLimit\)/);
  assert.match(source, /id="plantDebugPanel"/);
  assert.match(source, /id="copyPlantDebug"/);
  assert.match(source, /navigator\.clipboard\.writeText\(value\)/);
  assert.match(source, /execCommand\('copy'\)/);
  assert.match(source, /Open plant debug log/);
});

test('Plant lifecycle removals and stage changes are recorded with plant identity', () => {
  assert.match(source, /plant-lifecycle-removal/);
  assert.match(source, /plant-stage-change/);
  assert.match(source, /plant-invalid-position/);
  assert.match(source, /plant-invalid-growth-state/);
});
