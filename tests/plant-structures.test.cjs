'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const Structures = require('../plant-structures.js');

function environment() {
  return {
    width: 400,
    height: 300,
    ecologyFields: {},
    ecology: {
      sampleFields(_fields, _x, _y, out = {}) {
        out.moisture = .5;
        out.nutrients = .5;
        return out;
      },
      consumeNutrients() { return 1; }
    },
    hydrology: { consumeWater() { return 1; } },
    hydrologyFields: {}
  };
}

function config() {
  return {
    rootTropism: 0,
    rootGrowthRate: .42,
    rootBranchLimit: 0,
    rootDepthLimit: 0,
    rootWaterUptake: 0,
    rootNutrientUptake: 0,
    rootMaintenance: .00001,
    rootFusionDistance: 10,
    rootFusionProbability: 0,
    rootFusionStrength: .6,
    surfaceFusionDistance: 30,
    surfaceFusionProbability: 0,
    surfaceFusionStrength: .6,
    surfaceAlignment: .5,
    surfaceFusionMaturity: .2,
    simulationStep: .1
  };
}

test('root setup, maintenance and telemetry remain finite', () => {
  const state = Structures.create();
  const plants = [
    { id: 1, root: 1, x: 100, y: 100, age: 2, biomass: .5, size: .8, senescent: false, history: [] },
    { id: 2, root: 2, x: 120, y: 100, age: 2, biomass: .5, size: .8, senescent: false, history: [] }
  ];
  Structures.step(state, plants, .1, environment(), config());
  assert.equal(state.roots.length, 4);
  for (const plant of plants) {
    assert.equal(plant.rootSystem, true);
    assert.ok(Number.isFinite(plant.rootMaintenance));
    assert.ok(plant.rootMaintenance >= 0);
    assert.equal(plant.rootConnectionCount, 0);
    assert.ok(Number.isFinite(plant.surfaceSupport));
  }
  assert.equal(state.stats.rootTips, 4);
  assert.ok(Number.isFinite(state.stats.rootBiomass));
});

test('surface fusion uses local neighbours and preserves attached root positions', () => {
  const state = Structures.create();
  const plants = [
    { id: 1, root: 1, x: 100, y: 100, age: 2, biomass: .5, size: .8, senescent: false, history: [] },
    { id: 2, root: 2, x: 120, y: 100, age: 2, biomass: .5, size: .8, senescent: false, history: [] }
  ];
  Structures.step(state, plants, .1, environment(), config());
  const distance = Math.abs(plants[1].x - plants[0].x);
  assert.ok(distance < 20, 'eligible nodes should align gradually');
  const rootsForFirst = state.roots.filter(root => root.nodeId === 1);
  assert.ok(rootsForFirst.length > 0);
  assert.ok(rootsForFirst.every(root => Math.abs(root.x - plants[0].x) < 1e-9));
});
