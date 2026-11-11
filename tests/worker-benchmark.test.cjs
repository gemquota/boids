const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const MiB = 1024 * 1024;

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
  vm.runInContext(source + '\nglobalThis.__bench = { get N(){return N}, get cfg(){return cfg}, get accumulator(){return accumulator}, get lastSteps(){return lastSteps}, init, update, draw, frame, exportSnapshot, restoreSnapshot };', sandbox, { filename: 'boids-worker.js' });
  sandbox.__bench.cfg.seed = 20261110;
  sandbox.__bench.cfg.count = count;
  sandbox.__bench.cfg.foodPatches = 14;
  sandbox.__bench.cfg.obstacles = 10;
  sandbox.__bench.cfg.drive = 0;
  const ctx = new Proxy({}, { get: (target, key) => target[key] || (() => {}), set: (target, key, value) => (target[key] = value, true) });
  sandbox.__bench.init({ width: 1, height: 1, getContext: () => ctx }, 960, 640, 1);
  return sandbox.__bench;
}

const results = [];
const failures = [];
const meanBudgetsMs = new Map([[100, 25], [250, 50], [500, 100], [1000, 220]]);
for (const count of [100, 250, 500, 1000]) {
  const heapBefore = process.memoryUsage().heapUsed;
  const world = makeWorld(count);
  const initialPopulation = world.N;
  for (let tick = 0; tick < 12; tick++) { world.update(1 / 60, tick * (1000 / 60)); world.draw(); }
  const postWarmupPopulation = world.N;
  const measuredTicks = 36;
  const updateSamples = [], drawSamples = [];
  for (let tick = 0; tick < measuredTicks; tick++) {
    let start = performance.now();
    world.update(1 / 60, 1000 + tick * (1000 / 60));
    updateSamples.push(performance.now() - start);
    start = performance.now();
    world.draw();
    drawSamples.push(performance.now() - start);
  }
  const summarize = samples => {
    const sorted = [...samples].sort((a, b) => a - b);
    return {
      mean: samples.reduce((sum, value) => sum + value, 0) / samples.length,
      median: sorted[Math.floor((sorted.length - 1) * .5)],
      p95: sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * .95) - 1)],
    };
  };
  const update = summarize(updateSamples), draw = summarize(drawSamples);
  let now = performance.now();
  let maxFrameSteps = 0, maxBacklogMs = 0;
  for (let tick = 0; tick < 12; tick++) {
    now += 100;
    world.frame(now);
    maxFrameSteps = Math.max(maxFrameSteps, world.lastSteps);
    maxBacklogMs = Math.max(maxBacklogMs, world.accumulator * 1000);
  }
  const snapshot = world.exportSnapshot();
  const snapshotBytes = Buffer.byteLength(JSON.stringify(snapshot));
  const restored = makeWorld(count);
  const restoreStart = performance.now();
  restored.restoreSnapshot(snapshot);
  const restoreMs = performance.now() - restoreStart;
  const heapDeltaMiB = (process.memoryUsage().heapUsed - heapBefore) / MiB;
  const meanMsPerTick = update.mean;
  const budget = meanBudgetsMs.get(count);
  results.push({
    requested: count,
    initialPopulation,
    postWarmupPopulation,
    finalPopulation: world.N,
    meanMsPerTick: Number(update.mean.toFixed(3)),
    medianMsPerTick: Number(update.median.toFixed(3)),
    p95MsPerTick: Number(update.p95.toFixed(3)),
    meanDrawMs: Number(draw.mean.toFixed(3)),
    medianDrawMs: Number(draw.median.toFixed(3)),
    p95DrawMs: Number(draw.p95.toFixed(3)),
    maxFrameSteps,
    maxBacklogMs: Number(maxBacklogMs.toFixed(3)),
    snapshotBytes,
    restoreMs: Number(restoreMs.toFixed(3)),
    heapDeltaMiB: Number(heapDeltaMiB.toFixed(2)),
    budgetMs: budget,
  });
  if (!Number.isFinite(meanMsPerTick)) failures.push('N=' + count + ' benchmark produced a non-finite mean');
  else if (meanMsPerTick >= budget) failures.push('N=' + count + ' mean update cost ' + meanMsPerTick.toFixed(2) + 'ms exceeded ' + budget + 'ms budget');
}
console.log('Worker baseline benchmark (Node simulation + no-op Canvas context; not a device/browser rendering benchmark):');
for (const result of results) {
  console.log(
    'N=' + result.requested +
    ' initial=' + result.initialPopulation +
    ' postWarmup=' + result.postWarmupPopulation +
    ' final=' + result.finalPopulation +
    ' mean=' + result.meanMsPerTick + 'ms' +
    ' median=' + result.medianMsPerTick + 'ms' +
    ' p95=' + result.p95MsPerTick + 'ms' +
    ' drawMean=' + result.meanDrawMs + 'ms' +
    ' drawP95=' + result.p95DrawMs + 'ms' +
    ' maxFrameSteps=' + result.maxFrameSteps +
    ' maxBacklog=' + result.maxBacklogMs + 'ms' +
    ' snapshot=' + result.snapshotBytes + 'B' +
    ' restore=' + result.restoreMs + 'ms' +
    ' heapDelta=' + result.heapDeltaMiB + 'MiB' +
    ' budget=' + result.budgetMs + 'ms'
  );
}
assert.ok(failures.length === 0, failures.join('\n'));
