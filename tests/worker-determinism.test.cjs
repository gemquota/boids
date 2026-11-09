const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('boids-worker.js', 'utf8');

function makeWorld(seed) {
  const messages = [];
  const sandbox = {
    postMessage: message => messages.push(message),
    setTimeout: () => 0,
    performance: { now: () => 1000 },
    console,
    Math,
    Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int32Array,
    Array, Object, Number, String, Boolean, Set, Map, Date, JSON,
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: 'boids-worker.js' });
  sandbox.cfg.seed = seed;
  sandbox.cfg.count = 96;
  sandbox.cfg.foodPatches = 9;
  sandbox.cfg.obstacles = 4;
  sandbox.cfg.drive = 0;
  const context = {
    setTransform() {},
    fillRect() {},
  };
  const canvas = { width: 1, height: 1, getContext: () => context };
  sandbox.init(canvas, 720, 480, 1);
  return sandbox;
}

function run(seed) {
  const world = makeWorld(seed);
  for (let tick = 0; tick < 180; tick++) world.update(1 / 60, 1000 + tick * (1000 / 60));
  return world;
}

const a = run(123456);
const b = run(123456);
const sa = a.exportSnapshot();
const sb = b.exportSnapshot();

for (const key of ['x', 'y', 'vx', 'vy', 'energy', 'age', 'individualId', 'parentA', 'parentB', 'traitGenes', 'genome']) {
  assert.deepEqual(Array.from(sa.arrays[key]), Array.from(sb.arrays[key]), 'same seed must reproduce ' + key);
}
assert.equal(sa.rngState, sb.rngState, 'same seed must reproduce RNG state');
assert.equal(new Set(Array.from(sa.arrays.individualId)).size, sa.N, 'individual IDs must be unique');

// A parent pair must be stored as persistent individual identities, not generation counters.
a.sex[0] = 1;
a.sex[1] = 0;
a.age[0] = 30;
a.age[1] = 30;
a.pregnant[0] = 0;
a.energy[0] = 1;
a.conceive(0, 1);
a.cfg.fertility = 1;
const before = a.N;
a.deliver(0);
assert.equal(a.N, before + 1, 'delivery should append one offspring');
assert.equal(a.parentA[before], a.individualId[0], 'offspring should retain maternal identity');
assert.equal(a.parentB[before], a.individualId[1], 'offspring should retain paternal identity');
assert.notEqual(a.individualId[before], a.individualId[0], 'offspring identity must be unique');

// Snapshot restore must preserve both the random stream and pedigree identifiers.
const restored = makeWorld(999);
restored.restoreSnapshot(a.exportSnapshot());
const restoredSnapshot = restored.exportSnapshot();
assert.deepEqual(Array.from(restoredSnapshot.arrays.individualId), Array.from(a.individualId.subarray(0, a.N)));
assert.deepEqual(Array.from(restoredSnapshot.arrays.parentA), Array.from(a.parentA.subarray(0, a.N)));
assert.equal(restoredSnapshot.rngState, a.rngState);
assert.equal(restoredSnapshot.schemaVersion, 3);

console.log('Worker deterministic replay, unique identities, pedigree inheritance, and schema-v3 restore passed.');
