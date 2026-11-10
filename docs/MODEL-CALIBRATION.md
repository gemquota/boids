# Model calibration and release validation

## Status

The current BOIDS worker is a deterministic, dimensionless artificial-ecology model. It is not a calibrated biological simulation. The numeric constants below are exploratory modelling choices, not direct measurements of a real species.

## Units and state

- Position is expressed in canvas/world units.
- Velocity is world units per simulation second.
- The worker advances with a fixed 1/60-second timestep.
- Energy is a bounded internal reserve, currently clamped to 0–1.2.
- Age, lifespan, gestation, food stock, body mass, speed, and trait loci are dimensionless or model-time quantities unless a control explicitly defines a world-unit range.
- The seasonal resource cycle currently has a 240-second period.
- Food quality is bounded to 0.7–1.3; patch productivity is bounded to 0.65–1.35.
- Shelter cover is a geometric proximity heuristic around obstacle circles, not a fluid or line-of-sight solver.
- Temperature is a smooth spatial/temporal anomaly used to vary maintenance cost, not degrees Celsius.
- Movement and acceleration energy costs are phenomenological coefficients.

## Explicit assumptions

1. Flocking forces are steering heuristics inspired by classic local-interaction models. They are not a force law derived from animal biomechanics.
2. Body mass has a maintenance exponent of 0.75 and a modest speed penalty. These are illustrative allometric trade-offs, not species-calibrated exponents.
3. Food patch quality scales energy yield; productivity scales carrying stock and regeneration.
4. Predation is conspecific and depends on relative size, aggression, bite strength, risk tolerance, sensory range, kin relatedness, juvenile vulnerability, and shelter cover.
5. Kinship is a depth-limited pedigree estimate. It ignores inbreeding corrections and may understate distant relatedness after old pedigree records are pruned.
6. Neural innovation IDs are endpoint-derived. This supports homologous matching for the fixed-size genome, but is not a complete historical-innovation NEAT implementation.
7. Selection differentials compare the average traits of parents that produced offspring with the current population mean. They are descriptive, not regression-based selection gradients.
8. Lifetime reproductive success is the count of delivered offspring attributed to each parent. It does not yet model inclusive fitness or offspring quality.

## Calibration targets before biological claims

- Compare baseline flocking behaviour against Reynolds-style separation, alignment, and cohesion expectations.
- Test the order/disorder response across density and noise sweeps, with independent seeds.
- Verify energy accounting under no-food, abundant-food, and depleted-food conditions.
- Measure whether body-mass and speed trade-offs create context-dependent optima rather than one dominant phenotype.
- Verify that kin affinity reduces attacks on close relatives without making all predation disappear.
- Compare shelter and no-shelter attack success under matched geometries.
- Test resource recovery after depletion and population response to seasonal scarcity.
- Measure selection differentials over multiple independent runs and report uncertainty.
- Compare learning and non-learning controls before interpreting neural reward as adaptation.

## Release validation gates

- Worker syntax and inline application script syntax checks.
- Deterministic replay from identical seed and state.
- Snapshot schema migration tests for six-to-ten-locus traits, pedigree, innovations, and food-patch fields.
- Pedigree parent/offspring and sibling relatedness tests.
- Homologous neural-gene distance tests under gene-order permutation.
- Functional worker export request/response tests.
- Performance measurements at 100, 250, 500, and 1,000 agents.
- Live update/draw/backlog timing metrics in the Observatory.
- Manual browser/touch verification on the deployed GitHub Pages build.

### Latest automated reference result

GitHub Actions Node VM benchmark, fixed 14 food patches, 10 obstacles, 12 warm-up ticks, and 36 measured updates:

| Requested population | Actual at end | Mean worker update |
|---:|---:|---:|
| 100 | 99 | 2.540 ms/tick |
| 250 | 248 | 6.205 ms/tick |
| 500 | 498 | 14.465 ms/tick |
| 1,000 | 992 | 24.483 ms/tick |

A targeted optimization moved pedigree relatedness calculation out of the general neighbour scan and computes it only for the nearest viable prey candidate. On the same CI runner, the 1,000-agent reference workload fell from 89.702 ms/tick to 24.483 ms/tick (about 3.7× faster). This is a worker-only CPU comparison, not a mobile-device frame-rate claim.

## Performance interpretation

The automated worker benchmark measures simulation update cost in Node's VM with a fixed 14 food patches and 10 obstacles. It excludes browser rendering, GPU/compositor work, touch input, and device-specific worker overhead. The CI benchmark now enforces population-specific mean-update regression budgets:

| Population | Mean update budget |
|---:|---:|
| 100 | 12 ms/tick |
| 250 | 24 ms/tick |
| 500 | 48 ms/tick |
| 1,000 | 96 ms/tick |

Each run also reports median and p95 update times for diagnosis; only the mean is currently a hard gate because tail latency is more sensitive to shared-runner scheduling noise. These are regression ceilings with headroom above the recorded reference means, not real-time guarantees or mobile frame-rate claims. The simulation's 60 Hz timestep is 16.67 ms, so a worker update above that budget cannot sustain 60 updates per second even before rendering. Compare results across commits and profile representative Android devices before making end-to-end performance claims.
