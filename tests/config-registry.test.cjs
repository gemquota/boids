const assert = require('node:assert/strict');
const registry = require('../config-registry.js');

function control(id, value, min, max, step, label) {
  const output = { textContent: '' };
  const element = {
    id, type: 'range', value: String(value), defaultValue: String(value),
    min: String(min), max: String(max), step: String(step),
    labels: [{ textContent: label }],
    dataset: {},
    closest(selector) {
      if (selector === '[data-section]') return { dataset: { section: 'genetics' } };
      if (selector === 'details') return { querySelector: () => ({ textContent: 'Mutation & inheritance' }) };
      return null;
    }
  };
  return { element, output };
}
const controls = {
  mutation: control('mutation', .055, 0, .5, .005, 'Neural mutation'),
  count: control('count', 500, 10, 1000, 10, 'Population'),
  tiny: control('tiny', .00004, 0, .001, .00001, 'Small rate')
};
const root = {
  getElementById(id) {
    if (controls[id]) return controls[id].element;
    if (id.endsWith('Val')) return controls[id.slice(0, -3)]?.output || null;
    return null;
  },
  querySelector() { return null; }
};
const parameters = registry.create(root, ['mutation', 'count', 'tiny', 'missing']);
assert.deepEqual(parameters.ids, ['mutation', 'count', 'tiny']);
assert.equal(parameters.get('mutation').label, 'Neural mutation');
assert.equal(parameters.get('mutation').section, 'genetics');
assert.equal(parameters.get('mutation').group, 'Mutation & inheritance');
assert.equal(parameters.get('tiny').precision, 5);
assert.equal(parameters.normalize('mutation', .057), .055);
assert.equal(parameters.normalize('count', 2000), 1000);
assert.deepEqual(parameters.read(), { mutation: .055, count: 500, tiny: .00004 });
assert.deepEqual(parameters.apply({ mutation: .057, count: 203, tiny: .00006, unknown: 4 }), {
  mutation: .055, count: 200, tiny: .00006
});
assert.equal(controls.mutation.output.textContent, '0.055');
assert.equal(controls.count.output.textContent, '200');
assert.equal(controls.tiny.output.textContent, '0.00006');
console.log('Configuration registry discovery, metadata, normalization, reading, and application passed.');
