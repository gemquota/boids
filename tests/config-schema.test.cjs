const assert = require('node:assert/strict');
const schema = require('../config-schema.js');

assert.equal(schema.coreSliderDefs.length, 64, 'all core controls must be schema-defined');
assert.equal(schema.extraSliderDefs.length, 37, 'extra dynamics, regulatory and topology definitions must remain complete');
assert.equal(schema.expressionTraits.length, 10, 'all ten inherited traits must be declared');
assert.equal(schema.expressionFields.length, 6, 'each trait must expose six expression controls');
assert.equal(schema.expressionMutationFields.length, 3, 'each trait must expose three inheritance controls');
assert.equal(schema.expressionCurves.length, 7, 'all supported expression curves must be declared');

const ids = [
  ...schema.coreSliderDefs.map(item => item.id),
  ...schema.extraSliderDefs.map(item => item.id),
  ...schema.expressionTraits.flatMap(trait => schema.expressionFields.map(field => `expr_${trait.key}_${field.key}`)),
  ...schema.expressionTraits.flatMap(trait => schema.expressionMutationFields.map(field => `trait_${trait.key}_${field.key}`))
];
assert.equal(ids.length, 191, 'schema must define all 191 sliders');
assert.equal(new Set(ids).size, ids.length, 'generated control IDs must be unique');
assert.ok(!ids.includes('trail'), 'trail control must remain removed');
assert.ok(schema.coreSliderDefs.every(item => item.id && item.label && Number.isFinite(item.min) && Number.isFinite(item.max) && item.min < item.max && item.step > 0 && ['motion','brain','genetics','reproduction','selection','world','dynamics'].includes(item.section)));
assert.ok(schema.extraSliderDefs.every(item => Number.isFinite(item.min) && Number.isFinite(item.max) && item.min < item.max && item.step > 0));
assert.ok(schema.expressionTraits.every(item => item.key && item.label && item.upper > item.max && item.rate > 0 && item.heritability >= 0 && item.heritability <= 1));
assert.ok(schema.expressionFields.every(item => item.key && item.label && item.step > 0));
assert.ok(schema.expressionMutationFields.every(item => item.key && item.label && item.step > 0));
assert.ok(Object.isFrozen(schema) && Object.isFrozen(schema.coreSliderDefs) && Object.isFrozen(schema.extraSliderDefs) && Object.isFrozen(schema.expressionTraits));
assert.deepEqual(schema.expressionCurves.map(([value]) => value), ['linear','exponential','logarithmic','sigmoid','threshold','plateau','inverse']);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'attackRangeScale').value, 1.25);
assert.ok(Object.isFrozen(schema.fieldGuide), 'field-guide metadata must be immutable');
assert.equal(schema.fieldGuide.obstacleBuffer.length, 3, 'existing detailed field-guide explanations must be preserved');
assert.equal(schema.fieldGuide.predatorSearch.length, 3, 'extended dynamics field-guide explanations must be preserved');
assert.deepEqual(schema.normalizeDependencies({ ageMin: 40 }, { ageMin: 18, ageMax: 30, lifespan: 100 }), { ageMax: 45 });
assert.deepEqual(schema.normalizeDependencies({ ageMax: 90 }, { ageMin: 18, ageMax: 80, lifespan: 85 }), { lifespan: 100 });
assert.deepEqual(schema.normalizeDependencies({ lifespan: 120 }, { ageMin: 18, ageMax: 80, lifespan: 100 }), {});
assert.deepEqual(schema.normalizeDependencies({ ageMin: 18 }, { ageMin: 18, ageMax: 30, lifespan: 100 }), {});
assert.deepEqual(schema.normalizeDependencies({ expr_speed_min: 1.2 }, { expr_speed_min: 0.75, expr_speed_max: 1.1 }), { expr_speed_max: 1.21 });
assert.deepEqual(schema.normalizeDependencies({ expr_speed_max: 0 }, { expr_speed_min: 0, expr_speed_max: 0 }), { expr_speed_max: 0.01 });
assert.deepEqual(schema.normalizeDependencies({ expr_speed_max: 1.5 }, { expr_speed_min: 1.8, expr_speed_max: 2.25 }), { expr_speed_min: 1.49 });
assert.equal(schema.expressionTraits.find(item => item.key === 'speed').upper, 8);
assert.deepEqual(schema.resolveWorkerMapping('count'), { target: 'cfg', key: 'count' });
assert.deepEqual(schema.resolveWorkerMapping('flockNoise'), { target: 'cfg', key: 'flockNoise' });
assert.deepEqual(schema.resolveWorkerMapping('expr_speed_curve'), { target: 'geneExpression', trait: 'speed', field: 'curve' });
assert.deepEqual(schema.resolveWorkerMapping('expr_speed_min'), { target: 'geneExpression', trait: 'speed', field: 'min' });
assert.deepEqual(schema.resolveWorkerMapping('trait_aggression_rate'), { target: 'traitMutation', trait: 'aggression', field: 'rate' });
assert.deepEqual(schema.resolveWorkerMapping('expr_unknown_min'), { target: 'cfg', key: 'expr_unknown_min' });
assert.equal(schema.extraSliderDefs.find(item => item.id === 'regulatoryMutationRate').value, .025);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'regulatoryMutationMagnitude').value, .12);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'speciesTarget').value, 8);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'speciesThreshold').value, 3);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'speciesThresholdAdaptation').value, .001);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'speciesStagnationLimit').value, 80);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'activationMutationRate').value, .01);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'nodeDeletionRate').value, .005);
assert.equal(schema.extraSliderDefs.find(item => item.id === 'recurrentMutationRate').value, .01);
console.log('Shared configuration schema: 191 sliders, field guide, dependency rules, bounds, defaults and curve options passed.');
