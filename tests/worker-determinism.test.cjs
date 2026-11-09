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
  vm.runInContext(source + `\nglobalThis.__boidsTest = { get cfg(){return cfg}, get N(){return N}, get rngState(){return rngState}, get sex(){return sex}, get age(){return age}, get pregnant(){return pregnant}, get energy(){return energy}, get individualId(){return individualId}, get parentA(){return parentA}, get parentB(){return parentB}, get pedigree(){return pedigree}, update, exportSnapshot, restoreSnapshot, conceive, deliver, kinshipRelatedness, init };`, sandbox, { filename: 'boids-worker.js' });
  const api = sandbox.__boidsTest;
  api.cfg.seed = seed;
  api.cfg.count = 96;
  api.cfg.foodPatches = 9;
  api.cfg.obstacles = 4;
  api.cfg.drive = 0;
  const context = {
    setTransform() {},
    fillRect() {},
  };
  const canvas = { width: 1, height: 1, getContext: () => context };
  api.init(canvas, 720, 480, 1);
  return sandbox;
}

function run(seed) {
  const world = makeWorld(seed);
  for (let tick = 0; tick < 180; tick++) world.__boidsTest.update(1 / 60, 1000 + tick * (1000 / 60));
  return world;
}

const a = run(123456);
const b = run(123456);
const sa = a.__boidsTest.exportSnapshot();
const sb = b.__boidsTest.exportSnapshot();

for (const key of ['x', 'y', 'vx', 'vy', 'energy', 'age', 'individualId', 'parentA', 'parentB', 'traitGenes', 'genome']) {
  assert.deepEqual(Array.from(sa.arrays[key]), Array.from(sb.arrays[key]), 'same seed must reproduce ' + key);
}
assert.equal(sa.rngState, sb.rngState, 'same seed must reproduce RNG state');
assert.equal(new Set(Array.from(sa.arrays.individualId)).size, sa.N, 'individual IDs must be unique');

// A parent pair must be stored as persistent individual identities, not generation counters.
const api = a.__boidsTest;
api.sex[0] = 1;
api.sex[1] = 0;
api.age[0] = 30;
api.age[1] = 30;
api.pregnant[0] = 0;
api.energy[0] = 1;
api.conceive(0, 1);
api.cfg.fertility = 1;
const before = api.N;
api.deliver(0);
assert.equal(api.N, before + 1, 'delivery should append one offspring');
assert.equal(api.parentA[before], api.individualId[0], 'offspring should retain maternal identity');
assert.equal(api.parentB[before], api.individualId[1], 'offspring should retain paternal identity');
assert.notEqual(api.individualId[before], api.individualId[0], 'offspring identity must be unique');
const firstChildId = api.individualId[before];
assert.equal(api.kinshipRelatedness(api.individualId[0], firstChildId), .5, 'parent and offspring should have 0.5 relatedness');
api.conceive(0, 1);
api.deliver(0);
const secondChildId = api.individualId[before + 1];
assert.equal(api.kinshipRelatedness(firstChildId, secondChildId), .5, 'full siblings should have 0.5 relatedness');

// Snapshot restore must preserve both the random stream and pedigree identifiers.
const restored = makeWorld(999);
restored.__boidsTest.restoreSnapshot(api.exportSnapshot());
const restoredSnapshot = restored.__boidsTest.exportSnapshot();
assert.deepEqual(Array.from(restoredSnapshot.arrays.individualId), Array.from(api.individualId.subarray(0, api.N)));
assert.deepEqual(Array.from(restoredSnapshot.arrays.parentA), Array.from(api.parentA.subarray(0, api.N)));
assert.equal(restoredSnapshot.rngState, api.rngState);
assert.equal(restoredSnapshot.schemaVersion, 5);
assert.ok(restoredSnapshot.pedigree.length >= api.N, 'snapshot should retain the pedigree graph');
assert.equal(restored.__boidsTest.kinshipRelatedness(firstChildId, secondChildId), .5, 'restored pedigree should preserve kinship');
assert.equal(restoredSnapshot.arrays.traitGenes.length, api.N * 10, 'ten inherited traits must be stored per agent');
assert.ok(restoredSnapshot.arrays.traitGenes[before * 10 + 6] >= .55, 'offspring acceleration trait must be inherited');

// Schema-v3 snapshots used six packed traits; migration must preserve those and initialise four new loci.
const legacy = api.exportSnapshot();
legacy.schemaVersion = 3;
const legacyTraits = new Float32Array(api.N * 6);
const legacyPaternalTraits = new Float32Array(api.N * 6);
for (let i = 0; i < api.N; i++) {
  legacyTraits.set(legacy.arrays.traitGenes.subarray(i * 10, i * 10 + 6), i * 6);
  legacyPaternalTraits.set(legacy.arrays.paternalTraits.subarray(i * 10, i * 10 + 6), i * 6);
}
legacy.arrays.traitGenes = legacyTraits;
legacy.arrays.paternalTraits = legacyPaternalTraits;
const migrated = makeWorld(777);
migrated.__boidsTest.restoreSnapshot(legacy);
const migratedTraits = migrated.__boidsTest.exportSnapshot().arrays.traitGenes;
assert.equal(migratedTraits.length, api.N * 10);
assert.equal(migratedTraits[6], 1, 'legacy acceleration locus should receive neutral migration value');
assert.equal(migratedTraits[8], .5, 'legacy risk locus should receive neutral migration value');
assert.equal(migrated.__boidsTest.kinshipRelatedness(firstChildId, secondChildId), .5, 'legacy restore should reconstruct the live pedigree from parent IDs');

console.log('Worker deterministic replay, unique identities, pedigree inheritance, and schema-v4 restore and schema-v3 phenotype migration passed.');
