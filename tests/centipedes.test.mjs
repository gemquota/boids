import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CENTIPEDE_SPRITES, MORPHOLOGY_BRANCHES, centipedeProgression,
  createCentipedeMorphology, inheritCentipedeMorphology,
  centipedeSpriteIndex, centipedeSegmentCount, growCentipedeMass,
  initializeCentipede, advanceCentipede, sampleCentipedeTrail, updateCentipedeBodies
} from '../organisms/centipedes.js';

const agent = (overrides = {}) => ({
  id: 1, x: 12, y: 24, age: 0, energy: 0.9,
  traits: { hue: 180, speed: 1, perception: 1, metabolism: 1, fertility: 1, segmentGrowth: 1 },
  ...overrides
});

test('the artwork tree exposes four stages with 1, 36, 216 and 1296 sprites', () => {
  assert.equal(MORPHOLOGY_BRANCHES.length, 6);
  assert.equal(CENTIPEDE_SPRITES.length, 1549);
  assert.equal(CENTIPEDE_SPRITES.filter(sprite => sprite.stage === 0).length, 1);
  assert.equal(CENTIPEDE_SPRITES.filter(sprite => sprite.stage === 1).length, 36);
  assert.equal(CENTIPEDE_SPRITES.filter(sprite => sprite.stage === 2).length, 216);
  assert.equal(CENTIPEDE_SPRITES.filter(sprite => sprite.stage === 3).length, 1296);
  assert.ok(CENTIPEDE_SPRITES.every(sprite => sprite.src.startsWith('./art/segments/')));
});

test('each inherited morphology resolves to a four-stage art path', () => {
  const morphology = { branch: 2, form: 4, variant: 1, apex: 5 };
  const path = centipedeProgression(morphology);
  assert.equal(path.length, 4);
  assert.equal(path[0], 0);
  assert.equal(CENTIPEDE_SPRITES[path[1]].stage, 1);
  assert.equal(CENTIPEDE_SPRITES[path[1]].branch, 2);
  assert.equal(CENTIPEDE_SPRITES[path[1]].form, 4);
  assert.equal(CENTIPEDE_SPRITES[path[2]].stage, 2);
  assert.equal(CENTIPEDE_SPRITES[path[2]].branch, 2);
  assert.equal(CENTIPEDE_SPRITES[path[2]].form, 4);
  assert.equal(CENTIPEDE_SPRITES[path[2]].variant, 1);
  assert.equal(CENTIPEDE_SPRITES[path[3]].stage, 3);
  assert.equal(CENTIPEDE_SPRITES[path[3]].branch, 2);
  assert.equal(CENTIPEDE_SPRITES[path[3]].form, 4);
  assert.equal(CENTIPEDE_SPRITES[path[3]].variant, 1);
  assert.equal(CENTIPEDE_SPRITES[path[3]].apex, 5);
  assert.deepEqual([
    centipedeSpriteIndex(morphology, 0),
    centipedeSpriteIndex(morphology, 1200),
    centipedeSpriteIndex(morphology, 5000),
    centipedeSpriteIndex(morphology, 12000)
  ], path);
});

test('initial morphology is trait-weighted and uses the seeded random source', () => {
  const random = () => 0.5;
  const morphology = createCentipedeMorphology({ speed: 1.2, perception: 1.4, metabolism: 0.8, hue: 155 }, random);
  assert.ok(morphology.branch >= 0 && morphology.branch < 6);
  assert.equal(morphology.form, 3);
  assert.equal(morphology.variant, 3);
  assert.equal(morphology.apex, 3);
});

test('offspring morphology recombines parental branch forms with bounded mutation', () => {
  const child = inheritCentipedeMorphology(
    { branch: 1, form: 2, variant: 4, apex: 3 },
    { branch: 4, form: 5, variant: 1, apex: 2 },
    () => 0.4
  );
  assert.ok(child.branch >= 0 && child.branch < 6);
  assert.ok(child.form >= 0 && child.form < 6);
  assert.ok(child.variant >= 0 && child.variant < 6);
  assert.ok(child.apex >= 0 && child.apex < 6);
});

test('a new centipede starts with one base-art segment and retains inherited morphology', () => {
  const morphology = { branch: 3, form: 2, variant: 5, apex: 4 };
  const a = initializeCentipede(agent({ morphology }), () => 0.1);
  assert.equal(a.segments.length, 1);
  assert.deepEqual(a.morphology, morphology);
  assert.deepEqual(a.trail, [{ x: 12, y: 24 }]);
});

test('segment growth responds to food, inherited efficiency, condition and age', () => {
  const hungry = growCentipedeMass(0.7, 0.25, 1000);
  const fed = growCentipedeMass(0.7, 0.95, 1000);
  const efficient = growCentipedeMass(0.7, 0.95, 1000, { segmentGrowth: 1.4 });
  const inefficient = growCentipedeMass(0.7, 0.95, 1000, { segmentGrowth: 0.7 });
  const healthy = growCentipedeMass(0.7, 0.95, 1000, { segmentGrowth: 1 }, 0, 1);
  const unhealthy = growCentipedeMass(0.7, 0.95, 1000, { segmentGrowth: 1 }, 0, 0.3);
  const young = growCentipedeMass(0.7, 0.95, 1000, { segmentGrowth: 1 }, 0);
  const old = growCentipedeMass(0.7, 0.95, 1000, { segmentGrowth: 1 }, 20000);
  assert.equal(hungry, 0.7);
  assert.ok(fed > hungry);
  assert.ok(efficient > inefficient);
  assert.ok(healthy > unhealthy);
  assert.ok(young > old);
});

test('segment count scales beyond 64 without exceeding the expanded cap', () => {
  assert.equal(centipedeSegmentCount(0.7), 1);
  assert.ok(centipedeSegmentCount(3) > 1);
  assert.equal(centipedeSegmentCount(10), 80);
  assert.equal(centipedeSegmentCount(100), 128);
});

test('new segments are added behind the original as mass increases', () => {
  const a = initializeCentipede(agent());
  a.mass = 1;
  a.age = 1000;
  a.x = 17;
  advanceCentipede(a, 1);
  assert.equal(a.segments.length, 3);
  assert.equal(a.segments[0].bornAt, 0);
  assert.equal(a.segments[1].bornAt, 1000);
  assert.equal(a.segments[2].bornAt, 1000);
  assert.equal(a.trail.length, 2);
});

test('body segments sample the actual movement trail behind the head', () => {
  const point = sampleCentipedeTrail([{ x: 20, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 0 }], 15);
  assert.deepEqual(point, { x: 5, y: 0, angle: Math.PI });
});

test('movement history follows the short path across wrapped world edges', () => {
  const a = initializeCentipede(agent({ x: 98, y: 40 }));
  a.x = 2;
  advanceCentipede(a, 1, 100, 80);
  assert.equal(a.trail.length, 2);
  assert.equal(a.trail[0].x, 102);
});


test('body segments follow at a fixed world-distance spacing independent of speed', () => {
  const a = agent({ x: 30, y: 20, vx: 4, vy: 0, radius: 2, segments: 4, massScale: 1, phenotype: { radius: 2 }, segmentTrail: Array.from({ length: 30 }, (_, i) => ({ x: 30 - i * 2, y: 20 })) });
  updateCentipedeBodies([a]);
  assert.equal(a.bodySegments.length, 4);
  for (let i = 1; i < a.bodySegments.length; i++) {
    const previous = a.bodySegments[i - 1], point = a.bodySegments[i];
    const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
    assert.ok(distance >= 2 * .56 - .01 && distance <= 2 * .56 + .01);
  }
});

test('overlapping body segments are separated by segment collision resolution', () => {
  const make = (id, y) => agent({ id, x: 30, y, vx: 0, vy: 0, radius: 2, segments: 2, massScale: 1, phenotype: { radius: 2 }, segmentTrail: [{ x: 30, y }, { x: 25, y }] });
  const a = make(1, 20), b = make(2, 21);
  updateCentipedeBodies([a, b]);
  const distance = Math.hypot(a.bodySegments[1].x - b.bodySegments[1].x, a.bodySegments[1].y - b.bodySegments[1].y);
  assert.ok(distance >= 1.4);
});


test('segment impacts transfer mass-aware momentum and produce rotational response', () => {
  const make = (id, y, vx) => agent({ id, x: 30, y, vx, vy: 0, radius: 3, mass: id === 1 ? 2 : 1, segments: 3, massScale: 1, phenotype: { radius: 3 }, segmentTrail: [{ x: 30, y }, { x: 25, y }, { x: 20, y }] });
  const a = make(1, 20, 2), b = make(2, 21, -2);
  updateCentipedeBodies([a, b]);
  assert.notEqual(a.vx, 2);
  assert.notEqual(b.vx, -2);
  assert.ok(Math.abs(a.vx - 2) < Math.abs(b.vx + 2), 'the heavier organism receives the smaller velocity change');
  assert.ok(Number.isFinite(a.spin) && Number.isFinite(b.spin));
});
