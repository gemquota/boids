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
  sandbox.importScripts = (...paths) => { for (const path of paths) { const filePath = path.split('?')[0]; vm.runInContext(fs.readFileSync(filePath, 'utf8'), sandbox, { filename: path }); } };
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
const failures = [];
const meanBudgetsMs = new Map([[100, 25], [250, 50], [500, 100], [1000, 220]]);
for (const count of [100, 250, 500, 1000]) {
  const world = makeWorld(count);
  const initialPopulation = world.N;
  for (let tick = 0; tick < 12; tick++) world.update(1 / 60, tick * (1000 / 60));
  const postWarmupPopulation = world.N;
  const measuredTicks = 36;
  const samples = [];
  for (let tick = 0; tick < measuredTicks; tick++) {
    const start = performance.now();
    world.update(1 / 60, 1000 + tick * (1000 / 60));
    samples.push(performance.now() - start);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const meanMsPerTick = samples.reduce((sum, value) => sum + value, 0) / measuredTicks;
  const medianMsPerTick = sorted[Math.floor((sorted.length - 1) * 0.5)];
  const p95MsPerTick = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
  const budget = meanBudgetsMs.get(count);
  results.push({
    requested: count,
    initialPopulation,
    postWarmupPopulation,
    finalPopulation: world.N,
    meanMsPerTick: Number(meanMsPerTick.toFixed(3)),
    medianMsPerTick: Number(medianMsPerTick.toFixed(3)),
    p95MsPerTick: Number(p95MsPerTick.toFixed(3)),
    budgetMs: budget,
  });
  if (!Number.isFinite(meanMsPerTick)) failures.push('N=' + count + ' benchmark produced a non-finite mean');
  else if (meanMsPerTick >= budget) failures.push('N=' + count + ' mean update cost ' + meanMsPerTick.toFixed(2) + 'ms exceeded ' + budget + 'ms budget');
}
console.log('Worker CPU benchmark (dimensionless reference workload; simulation only):');
for (const result of results) {
  console.log(
    'N=' + result.requested +
    ' initial=' + result.initialPopulation +
    ' postWarmup=' + result.postWarmupPopulation +
    ' final=' + result.finalPopulation +
    ' mean=' + result.meanMsPerTick + 'ms' +
    ' median=' + result.medianMsPerTick + 'ms' +
    ' p95=' + result.p95MsPerTick + 'ms' +
    ' budget=' + result.budgetMs + 'ms'
  );
}
assert.ok(failures.length === 0, failures.join('\n'));
