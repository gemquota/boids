const assert = require('node:assert/strict');
const schema = require('../config-schema.js');

assert.equal(schema.extraSliderDefs.length, 22, 'extra dynamics definitions must remain complete');
assert.equal(schema.expressionTraits.length, 10, 'all ten inherited traits must be declared');
assert.equal(schema.expressionFields.length, 6, 'each trait must expose six expression controls');
assert.equal(schema.expressionMutationFields.length, 3, 'each trait must expose three inheritance controls');
assert.equal(schema.expressionCurves.length, 7, 'all supported expression curves must be declared');

const ids = [
  ...schema.extraSliderDefs.map(item => item.id),
  ...schema.expressionTraits.flatMap(trait => schema.expressionFields.map(field => `expr_${trait.key}_${field.key}`)),
  ...schema.expressionTraits.flatMap(trait => schema.expressionMutationFields.map(field => `trait_${trait.key}_${field.key}`))
];
assert.equal(ids.length, 112, 'schema must generate 112 controls');
assert.equal(new Set(ids).size, ids.length, 'generated control IDs must be unique');
assert.ok(schema.extraSliderDefs.every(item => Number.isFinite(item.min) && Number.isFinite(item.max) && item.min < item.max && item.step > 0));
assert.ok(schema.expressionTraits.every(item => item.key && item.label && item.upper > item.max && item.rate > 0 && item.heritability >= 0 && item.heritability <= 1));
assert.ok(schema.expressionFields.every(item => item.key && item.label && item.step > 0));
assert.ok(schema.expressionMutationFields.every(item => item.key && item.label && item.step > 0));
assert.ok(Object.isFrozen(schema) && Object.isFrozen(schema.extraSliderDefs) && Object.isFrozen(schema.expressionTraits));
assert.deepEqual(schema.expressionCurves.map(([value]) => value), ['linear','exponential','logarithmic','sigmoid','threshold','plateau','inverse']);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'attackRangeScale').value, 1.25);
assert.equal(schema.expressionTraits.find(item => item.key === 'speed').upper, 8);
console.log('Shared configuration schema: 112 generated controls, bounds, defaults and curve options passed.');
