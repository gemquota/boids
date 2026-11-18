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

test('Plant Lab displays only the main river and coastal edges, not minor tributaries or streams', () => {
  assert.match(source, /specs=\[\],tributaries=\[\],feeders=\[\]/);
  assert.match(source, /const paths=\[\{points:network\.main/);
  assert.doesNotMatch(source, /BoidsHydrology\.streamSegments\(hydrologyFields\)/);
});

test('Plant Lab uses a floating emoji launcher and three title-labelled bubble menus', () => {
  assert.match(source, /className='floatingControls'/);
  assert.match(source, /group\('Simulation','🌱'/);
  assert.match(source, /group\('View','👁️'/);
  assert.match(source, /group\('Tools','🧰'/);
  assert.match(source, /className='actionMenuTitle';heading\.textContent=name/);
  assert.doesNotMatch(source, /className='actionBar'/);
});


test('Plants render on a dedicated canvas and visible starter seedlings exist immediately', () => {
  assert.match(source, /<canvas id="plantLayer"/);
  assert.match(source, /plantCanvas\.width=Math\.round\(W\*dpr\)/);
  assert.match(source, /originKind:'starter-seedling'/);
  assert.match(source, /ctx=plantCtx;ctx\.setTransform/);
});

test('Plant Lab uses pinch gestures instead of zoom buttons', () => {
  assert.match(source, /const activePointers=new Map\(\);let pinchState=null/);
  assert.match(source, /pinchState\.zoom\*Math\.hypot\(dx,dy\)\/pinchState\.distance/);
  assert.doesNotMatch(source, /document\.querySelector\('#zoom(In|Out)'\)\.onclick/);
  assert.doesNotMatch(source, /label\(zoom(Out|In),/);
});
