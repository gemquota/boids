const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');

const source = fs.readFileSync('boids-worker.js', 'utf8');

function makeWorld(count) {
  const sandbox = {
    postMessage() {},
    setTimeout: () => 0,
    performance,
    console,
    Math,
    Float32Array, Float64Array, Uint8Array, Uint16Array, Uint32Array, Int32Array,
    Array, Object, Number, String, Boolean, Set, Map, Date, JSON,
  };
  vm.createContext(sandbox);
  sandbox.importScripts = (...paths) => { for (const path of paths) vm.runInContext(fs.readFileSync(path, 'utf8'), sandbox, { filename: path }); };
  vm.runInContext(source + '\nglobalThis.__bench = { get N(){return N}, get cfg(){return cfg}, init, update };', sandbox, { filename: 'boids-worker.js' });
  sandbox.__bench.cfg.seed = 20261110;
  sandbox.__bench.cfg.count = count;
  sandbox.__bench.cfg.foodPatches = 14;
  sandbox.__bench.cfg.obstacles = 10;
  sandbox.__bench.cfg.drive = 0;
  const ctx = { setTransform() {}, fillRect() {} };
  sandbox.__bench.init({ width: 1, height: 1, getContext: () => ctx }, 960, 640, 1);
  return sandbox.__bench;
}

const results = [];
for (const count of [100, 250, 500, 1000]) {
  const world = makeWorld(count);
  for (let tick = 0; tick < 12; tick++) world.update(1 / 60, tick * (1000 / 60));
  const start = performance.now();
  const measuredTicks = 36;
  for (let tick = 0; tick < measuredTicks; tick++) world.update(1 / 60, 1000 + tick * (1000 / 60));
  const msPerTick = (performance.now() - start) / measuredTicks;
  results.push({ requested: count, actual: world.N, msPerTick: Number(msPerTick.toFixed(3)) });
  assert.ok(Number.isFinite(msPerTick), 'benchmark should produce a finite update time');
  assert.ok(msPerTick < 250, '1000-agent reference workload exceeded 250ms per simulation tick');
}
console.log('Worker CPU benchmark (dimensionless reference workload):');
for (const result of results) console.log('N=' + result.requested + ' actual=' + result.actual + ' ms/tick=' + result.msPerTick);
