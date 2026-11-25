// Node tests for packSegments / bodyColor in src/gpu/boids-renderer.js.
// Pure JS — no DOM, no WebGPU device, no repo code. Run: node --test tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { packSegments, bodyColor } from '../src/gpu/boids-renderer.js';

const agent = (over = {}) => ({
  x: 100, y: 200, vx: 1, vy: 0, radius: 4, dead: false, segments: 3,
  traits: { hue: 195, speed: 1 },
  bodySegments: [
    { x: 100, y: 200, angle: 0 },
    { x: 96, y: 200, angle: 0 },
    { x: 92, y: 200, angle: 0 },
  ],
  ...over,
});

test('bodyColor returns 3 finite channels in [0,1]', () => {
  const c = bodyColor({ hue: 195, speed: 1 });
  assert.equal(c.length, 3);
  for (const v of c) assert.ok(Number.isFinite(v) && v >= 0 && v <= 1, String(v));
});

test('packSegments emits head + body segments, includes dead agents grey', () => {
  const { data, count } = packSegments([agent(), agent({ dead: true }), agent({ x: 300 })]);
  // 3 agents x (1 head + 2 body segments) = 9 instances. Dead agents are
  // drawn grey at .42 alpha in app.js; the GPU path must not make corpses
  // vanish. #69777b = (105,119,123)/255.
  assert.equal(count, 9);
  assert.equal(data.length, 9 * 8);
  assert.equal(data[0], 100); // head x
  assert.equal(data[1], 200); // head y
  assert.ok(data[2] > 0); // head radius
  assert.equal(data[8], 96); // first body segment x (instance 1)
  const deadHead = 3 * 8; // second agent's head instance
  assert.ok(Math.abs(data[deadHead + 4] - 105 / 255) < 1e-6); // grey r
  assert.ok(Math.abs(data[deadHead + 5] - 119 / 255) < 1e-6); // grey g
  assert.ok(Math.abs(data[deadHead + 6] - 123 / 255) < 1e-6); // grey b
  assert.ok(Math.abs(data[deadHead + 7] - 0.42) < 1e-6); // dead alpha (Float32)
});

test('packSegments caps segments at 128 like app.js', () => {
  const segs = Array.from({ length: 200 }, (_, i) => ({ x: i, y: i, angle: 0 }));
  const { count } = packSegments([agent({ segments: 200, bodySegments: segs })]);
  assert.equal(count, 128); // 1 head + 127 body segments
});

test('packSegments radius floor keeps tiny agents visible at high zoom', () => {
  const { data } = packSegments([agent({ radius: 0.5 })], 4);
  assert.ok(data[2] >= 1.1 / 4);
});
