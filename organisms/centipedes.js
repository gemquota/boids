// Segment art follows a heritable three-stage morphology tree:
// common base -> one of six branch forms -> one of six deeper variants.
export const MORPHOLOGY_BRANCHES = Object.freeze([
  { id: 0, name: "Interlocking carapace", description: "Armour and overlapping plates" },
  { id: 1, name: "Swept paddle fins and legs", description: "Propulsion and locomotion structures" },
  { id: 2, name: "Pleural spine array", description: "Spines, barbs and defensive structures" },
  { id: 3, name: "Photosynthetic frond disc", description: "Fronds, sacs and plant-like structures" },
  { id: 4, name: "Focusing ocellus lens", description: "Optical and sensory structures" },
  { id: 5, name: "Faceted mineral lattice", description: "Mineralised plates and crystalline structures" }
]);

const FORM_COUNT = 6;
const STAGE_ONE_OFFSET = 1;
const STAGE_TWO_OFFSET = STAGE_ONE_OFFSET + MORPHOLOGY_BRANCHES.length * FORM_COUNT;
const STAGE_THREE_OFFSET = STAGE_TWO_OFFSET + MORPHOLOGY_BRANCHES.length * FORM_COUNT * FORM_COUNT;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomIndex = (random, length) => Math.min(length - 1, Math.floor(random() * length));

export const CENTIPEDE_SPRITES = [
  { index: 0, stage: 0, name: "Base segment", src: "./art/segments/base.webp" }
];

for (let branch = 0; branch < MORPHOLOGY_BRANCHES.length; branch++) {
  for (let form = 0; form < FORM_COUNT; form++) {
    const index = CENTIPEDE_SPRITES.length;
    CENTIPEDE_SPRITES.push({
      index, stage: 1, branch, form,
      name: MORPHOLOGY_BRANCHES[branch].name,
      src: `./art/segments/level1/b${branch + 1}/f${form}.webp`
    });
  }
}
for (let branch = 0; branch < MORPHOLOGY_BRANCHES.length; branch++) {
  for (let form = 0; form < FORM_COUNT; form++) {
    for (let variant = 0; variant < FORM_COUNT; variant++) {
      const index = CENTIPEDE_SPRITES.length;
      CENTIPEDE_SPRITES.push({
        index, stage: 2, branch, form, variant,
        name: MORPHOLOGY_BRANCHES[branch].name,
        src: `./art/segments/level2/b${branch + 1}/f${form}/v${variant}.webp`
      });
    }
  }
}

for (let branch = 0; branch < MORPHOLOGY_BRANCHES.length; branch++) {
  for (let form = 0; form < FORM_COUNT; form++) {
    for (let variant = 0; variant < FORM_COUNT; variant++) {
      for (let apex = 0; apex < FORM_COUNT; apex++) {
        const index = CENTIPEDE_SPRITES.length;
        CENTIPEDE_SPRITES.push({
          index, stage: 3, branch, form, variant, apex,
          name: MORPHOLOGY_BRANCHES[branch].name,
          src: `./art/segments/level3/b${branch + 1}/f${form}/v${variant}/a${apex}.webp`
        });
      }
    }
  }
}

function morphologyIndex(morphology = {}) {
  const branch = clamp(Math.floor(morphology.branch ?? 0), 0, 5);
  const form = clamp(Math.floor(morphology.form ?? 0), 0, 5);
  const variant = clamp(Math.floor(morphology.variant ?? 0), 0, 5);
  const apex = clamp(Math.floor(morphology.apex ?? 0), 0, 5);
  return { branch, form, variant, apex };
}

export function centipedeProgression(morphology) {
  const { branch, form, variant, apex } = morphologyIndex(morphology);
  const branchForm = branch * FORM_COUNT + form;
  const branchFormVariant = branchForm * FORM_COUNT + variant;
  return [
    0,
    STAGE_ONE_OFFSET + branchForm,
    STAGE_TWO_OFFSET + branchFormVariant,
    STAGE_THREE_OFFSET + branchFormVariant * FORM_COUNT + apex
  ];
}

export function centipedeSpriteIndex(morphology, segmentAge = 0) {
  const path = centipedeProgression(morphology);
  if (segmentAge < 900) return path[0];
  if (segmentAge < 4200) return path[1];
  if (segmentAge < 11000) return path[2];
  return path[3];
}

export function createCentipedeMorphology(traits = {}, random = Math.random) {
  const speed = clamp(Number(traits.speed ?? 1), 0.25, 2);
  const perception = clamp(Number(traits.perception ?? 1), 0.25, 2);
  const metabolism = clamp(Number(traits.metabolism ?? 1), 0.25, 2);
  const fertility = clamp(Number(traits.fertility ?? 1), 0.25, 2);
  const hue = Number(traits.hue ?? 190);
  const greenAffinity = clamp(1 - Math.abs(hue - 155) / 85, 0, 1);
  const weights = [
    1.1 + (1.4 - speed) * 0.3,
    0.6 + speed * 0.9,
    0.85 + fertility * 0.15,
    0.65 + greenAffinity * 0.65 + (1.2 - metabolism) * 0.2,
    0.65 + perception * 0.9,
    0.65 + metabolism * 0.7
  ];
  let choice = random() * weights.reduce((sum, weight) => sum + weight, 0);
  let branch = weights.length - 1;
  for (let i = 0; i < weights.length; i++) {
    choice -= weights[i];
    if (choice <= 0) { branch = i; break; }
  }
  return {
    branch,
    form: randomIndex(random, FORM_COUNT),
    variant: randomIndex(random, FORM_COUNT),
    apex: randomIndex(random, FORM_COUNT)
  };
}

export function inheritCentipedeMorphology(first = {}, second = {}, random = Math.random) {
  const a = morphologyIndex(first);
  const b = morphologyIndex(second);
  let branch = random() < 0.5 ? a.branch : b.branch;
  const matching = [a, b].filter(parent => parent.branch === branch);
  let form = matching.length
    ? matching[randomIndex(random, matching.length)].form
    : randomIndex(random, FORM_COUNT);
  let variant = matching.length
    ? matching[randomIndex(random, matching.length)].variant
    : randomIndex(random, FORM_COUNT);
  let apex = matching.length
    ? matching[randomIndex(random, matching.length)].apex
    : randomIndex(random, FORM_COUNT);

  if (random() < 0.035) {
    branch = randomIndex(random, MORPHOLOGY_BRANCHES.length);
    form = randomIndex(random, FORM_COUNT);
    variant = randomIndex(random, FORM_COUNT);
    apex = randomIndex(random, FORM_COUNT);
  } else {
    if (random() < 0.12) form = randomIndex(random, FORM_COUNT);
    if (random() < 0.18) variant = randomIndex(random, FORM_COUNT);
    if (random() < 0.22) apex = randomIndex(random, FORM_COUNT);
  }
  return { branch, form, variant, apex };
}

export function centipedeSegmentCount(mass = 0.7) {
  return Math.max(1, Math.min(64, 1 + Math.floor((Math.max(0.7, mass) - 0.7) * 6.8)));
}

// Growth combines food availability, physical condition, age and inherited
// growth efficiency. High metabolism diverts more resources away from growth.
export function growCentipedeMass(mass = 0.7, energy = 0.7, dt = 1, traits = {}, age = 0, health = 1) {
  const current = clamp(Number(mass) || 0.7, 0.7, 10);
  const nutrition = clamp((Number(energy) - 0.3) / 0.7, 0, 1);
  const condition = clamp(Number.isFinite(health) ? health : 1, 0.2, 1);
  const inheritedGrowth = clamp(Number(traits.segmentGrowth ?? 1), 0.65, 1.45);
  const metabolicCost = clamp(1.15 - ((Number(traits.metabolism ?? 1) - 1) * 0.3), 0.7, 1.3);
  const developmentalWindow = clamp(1 - Math.max(0, age) / 26000, 0.08, 1);
  const increment = 0.00072 * nutrition * condition * inheritedGrowth * metabolicCost * developmentalWindow * Math.max(0, dt);
  return Math.min(10, current + increment);
}

export function initializeCentipede(agent, random = Math.random) {
  if (!agent.morphology) agent.morphology = createCentipedeMorphology(agent.traits, random);
  agent.mass = 0.7;
  agent.segments = [{ bornAt: 0 }];
  agent.trail = [{ x: agent.x, y: agent.y }];
  return agent;
}

export function advanceCentipede(agent, dt = 1, width = Infinity, height = Infinity) {
  if (!agent.segments?.length) initializeCentipede(agent);
  agent.mass = growCentipedeMass(agent.mass, agent.energy, dt, agent.traits, agent.age, agent.health);
  const desired = centipedeSegmentCount(agent.mass);
  while (agent.segments.length < desired) agent.segments.push({ bornAt: agent.age });

  const trail = agent.trail || (agent.trail = [{ x: agent.x, y: agent.y }]);
  const last = trail[0];
  const headX = Number.isFinite(width) ? ((last.x % width) + width) % width : last.x;
  const headY = Number.isFinite(height) ? ((last.y % height) + height) % height : last.y;
  let dx = agent.x - headX, dy = agent.y - headY;
  if (Number.isFinite(width) && dx > width / 2) dx -= width;
  if (Number.isFinite(width) && dx < -width / 2) dx += width;
  if (Number.isFinite(height) && dy > height / 2) dy -= height;
  if (Number.isFinite(height) && dy < -height / 2) dy += height;
  if (dx * dx + dy * dy >= 4) trail.unshift({ x: last.x + dx, y: last.y + dy });
  const maxPoints = Math.max(24, desired * 8 + 8);
  if (trail.length > maxPoints) trail.length = maxPoints;
}

// Return the point and local heading at a distance behind the head.
export function sampleCentipedeTrail(trail, distance, spacing = 10) {
  if (!trail?.length) return { x: 0, y: 0, angle: 0 };
  let remaining = distance;
  for (let i = 0; i < trail.length - 1; i++) {
    const a = trail[i], b = trail[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
    if (length >= remaining && length > 0) {
      const t = remaining / length;
      return { x: a.x + dx * t, y: a.y + dy * t, angle: Math.atan2(dy, dx) };
    }
    remaining -= length;
  }
  const a = trail[trail.length - 1], b = trail[Math.max(0, trail.length - 2)];
  return { x: a.x, y: a.y, angle: Math.atan2(a.y - b.y, a.x - b.x) };
}
