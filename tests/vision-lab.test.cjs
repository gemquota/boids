const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('vision-lab.html', 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'Vision Lab must have its inline application script');
const script = match[1];
new vm.Script(script, { filename: 'vision-lab.html:inline-script' });

const groupsStart = script.indexOf('const groups=');
const groupsEnd = script.indexOf('const enumLabels=', groupsStart);
assert.ok(groupsStart >= 0 && groupsEnd > groupsStart, 'parameter groups must be declared');
const groups = vm.runInNewContext(script.slice(groupsStart, groupsEnd).replace(/^const groups=/, '').replace(/;\s*$/, ''));
const paramsStart = script.indexOf('const params={') + 'const params='.length;
const paramsEnd = script.indexOf('};', paramsStart) + 1;
const params = vm.runInNewContext('(' + script.slice(paramsStart, paramsEnd) + ')');
const keys = groups.flatMap(group => group.items.map(item => item[0]));
assert.equal(groups.length, 7, 'parameter taxonomy should retain seven major categories');
assert.equal(keys.length, new Set(keys).size, 'every slider must occur in exactly one category');
assert.deepEqual([...keys].sort(), Object.keys(params).sort(), 'every live parameter must be categorised exactly once');
for (const group of groups) {
  assert.ok(group.shadeColors && Object.keys(group.shadeColors).length >= 2, group.name + ' should have subcategory shades');
  for (const item of group.items) assert.ok(group.shadeColors[item[7]], item[0] + ' must have a valid subcategory colour');
}
assert.match(script, /function eyeForRay\(i\)/, 'ray indices must be mapped to an actual eye');
assert.match(script, /function reportSimulationError\(error\)/, 'runtime failures must be shown in the simulation viewport');
assert.match(script, /requestAnimationFrame\(frame\)/, 'the animation loop must be started');

const calls = {};
const context2d = new Proxy({}, {
  get(target, property) {
    if (property in target) return target[property];
    if (typeof property === 'symbol') return undefined;
    return (...args) => { calls[property] = (calls[property] || 0) + 1; };
  },
  set(target, property, value) { target[property] = value; return true; }
});
class Element {
  constructor(id = '') {
    this.id = id; this.children = []; this.style = { setProperty() {} };
    this.listeners = {}; this.value = id === 'overlayOpacity' ? '72' : '';
    this.checked = false; this.textContent = ''; this.className = '';
    this.dataset = {}; this.width = 0; this.height = 0; this.hidden = false;
  }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
  setAttribute() {}
  querySelector() { return new Element('nested-input'); }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { x: 0, y: 0, left: 0, top: 0, right: 720, bottom: 500, width: 720, height: 500 }; }
  getContext() { return context2d; }
  setPointerCapture() {}
}
const elements = new Map();
const document = {
  hidden: false,
  getElementById(id) { if (!elements.has(id)) elements.set(id, new Element(id)); return elements.get(id); },
  createElement(tag) { return new Element(tag); },
  addEventListener() {}
};
const window = { devicePixelRatio: 1, innerWidth: 720, innerHeight: 900, addEventListener() {} };
const frames = [];
const sandbox = {
  document, window, performance: { now: () => 16 }, requestAnimationFrame: fn => frames.push(fn),
  ResizeObserver: class { observe() {} }, console, Math, Map, Set, JSON, Number, String, Object, Array,
  Date, Blob, URL, Float32Array, Uint8Array
};
vm.runInNewContext(script, sandbox, { filename: 'vision-lab.html:inline-script' });
assert.equal(frames.length, 1, 'startup should schedule the first animation frame');
frames.shift()(16);
assert.ok((calls.clearRect || 0) > 0, 'the first frame should render into the canvas');
assert.ok((calls.stroke || 0) + (calls.fill || 0) > 0, 'the first frame should draw the creature and scene');
assert.ok(elements.get('metricRays').textContent.includes('/'), 'the first sensory update should populate ray telemetry');
assert.equal(elements.get('stateText').textContent, 'SENSING', 'the simulation should remain active after its first sensory update');
console.log('Vision Lab taxonomy, parameter coverage, eye-to-ray mapping, startup, first sensory update and first rendered frame passed.');
