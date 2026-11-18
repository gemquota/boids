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

test('Plant Lab surface network has one trunk and one tributary, without feeder branches', () => {
  assert.match(source, /specs=\[\[\.24,-1,-1,\.03,\.18\]\],tributaries=\[\],feeders=\[\]/);
  assert.match(source, /main=buildRiverNetwork\(\)\.main,sourceT=\[\.18,\.5,\.82\]/);
});

test('Plant Lab uses a floating emoji launcher and three title-labelled bubble menus', () => {
  assert.match(source, /className='floatingControls'/);
  assert.match(source, /group\('Simulation','🌱'/);
  assert.match(source, /group\('View','👁️'/);
  assert.match(source, /group\('Tools','🧰'/);
  assert.match(source, /className='actionMenuTitle';heading\.textContent=name/);
  assert.doesNotMatch(source, /className='actionBar'/);
});
