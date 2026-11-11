'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const ecology=require('../ecology.js');
test('habitat fields are deterministic and do not depend on call order',()=>{
  const a=ecology.createFields(1200,800,9123),b=ecology.createFields(1200,800,9123),c=ecology.createFields(1200,800,9124);
  assert.deepEqual(ecology.serializeFields(a),ecology.serializeFields(b));
  assert.notDeepEqual(ecology.serializeFields(a),ecology.serializeFields(c));
});
test('field interpolation is smooth, bounded and clamps world boundaries',()=>{
  const fields=ecology.createFields(1000,600,77),a=ecology.sampleFields(fields,-100,-100),b=ecology.sampleFields(fields,0,0),c=ecology.sampleFields(fields,1000,600),d=ecology.sampleFields(fields,1100,700);
  for(const sample of [a,b,c,d])for(const key of ['temperature','moisture','nutrients','currentX','currentY','shelter','suitability'])assert.ok(Number.isFinite(sample[key])&&sample[key]>=0&&sample[key]<=1, key);
  assert.deepEqual(a,b);assert.deepEqual(c,d);
  const left=ecology.sampleFields(fields,400,300),right=ecology.sampleFields(fields,401,300);
  assert.ok(Math.abs(left.moisture-right.moisture)<.1,'adjacent samples should interpolate instead of jumping grid cells');
});
test('field snapshots round-trip typed grids and reject incompatible dimensions',()=>{
  const fields=ecology.createFields(800,500,45),saved=ecology.serializeFields(fields),restored=ecology.restoreFields(saved,800,500,45),resized=ecology.restoreFields(saved,900,500,45);
  assert.deepEqual(ecology.serializeFields(restored),saved);
  assert.equal(resized.width,900);assert.notDeepEqual(ecology.serializeFields(resized),saved);
});
