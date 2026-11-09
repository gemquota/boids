# BOIDS model overhaul roadmap

This roadmap is the implementation contract for moving the project from a flocking demo with evolutionary features toward a reproducible artificial ecology. It deliberately separates completed mechanics from planned work. A passing static check is not evidence that an ecological outcome is scientifically valid.

## Design invariants

1. There is one evolving boid population. Hunting, scavenging, avoidance, cooperation, and social strategies are behavioural and heritable differences within that population, never a separate predator caste.
2. Every agent has a persistent unique identity. Generation depth is not identity and must never be used as a proxy for kinship.
3. Every simulation update reads a coherent state snapshot. Results must not depend on array order.
4. Physical traits have interacting benefits and costs. No trait should be a free advantage across every environment.
5. Energy and reproduction are accounted for through explicit flows. Feeding, attacks, gestation, birth, and death must have measurable costs and transfers.
6. Evolution is evaluated through survival and realised reproduction, not a decorative fitness number.
7. Randomness is seeded and captured in snapshots so experiments can be repeated.
8. UI controls, documentation, model code, and validation checks must describe the same mechanics.

## Phase status

### Phase 1. Deterministic simulation core

**Status: foundational implementation committed on evolutionary-ecology-phase1; automated and browser regression testing still required.**

- Replace in-place movement with read/write position and velocity buffers. Agents sense the same pre-update positions and velocities.
- Shuffle the agent evaluation order with a seeded PRNG so immediate resource claims do not systematically favour low array indices.
- Use a fixed 1/60-second simulation step with a bounded catch-up loop.
- Replace ambient Math.random calls with a serialisable xorshift PRNG.
- Preserve the fixed-step accumulator when rendering falls behind, so the simulation slows rather than silently skipping simulation time.
- Assign unique 32-bit individual IDs and store actual maternal and paternal IDs.
- Upgrade ancestry buffers to 32-bit values and migrate old snapshots without pretending legacy generation counters are real parent identities.
- Include RNG state and the next identity counter in schema-v6 world snapshots.
- Preserve per-agent render caches during death compaction.

Remaining Phase 1 work:
- Add runtime tests that compare two runs from the same seed and state.
- Verify pause/resume, restore, population resizing, and topology changes against the fixed-step clock.

### Phase 2. Interaction and energy accounting

**Status: first interaction-resolution slice implemented.** Food contact claims are collected from the same pre-movement positions and allocated proportionally when a patch is oversubscribed. Attack proposals are queued and resolved after agent decisions; one successful attacker receives the kill reward for a given target. These rules still need focused runtime tests and richer outcome telemetry.

Remaining work:
- Define and test energy transfer for feeding, predation, maintenance, movement, reproduction, and growth.
- Make body mass affect maintenance, reserves, acceleration, turning, attack leverage, and reproductive cost.
- Track food consumed, energy gained, energy spent, attack attempts, capture success, and failed pursuit.
- Add unit tests for conservation/accounting invariants and edge cases.

### Phase 3. Heritable phenotype and trade-offs

**Status: first ten-locus phenotype implementation committed on evolutionary-ecology-phase2-phenotype; runtime migration and selection tests still required.**

The inherited phenotype now includes aggression, body mass, speed, bite strength, kin affinity, sensory range, acceleration, agility, risk tolerance, and exploration. The added loci affect movement acceleration, neural turning, attack commitment, threat response, food attraction, and exploratory noise. Body mass now has a nonlinear maintenance cost and a modest maximum-speed trade-off. Schema-v4 snapshots preserve all ten loci and migrate schema-v3 six-locus snapshots with neutral starting values for the four new traits.

Remaining work: add empirical or explicit dimensionless trait scaling, richer covariance and variance tracking, and selection tests showing that costs and benefits vary across environments.

- Use bounded quantitative traits with mutation and recombination.
- Avoid one-directional scaling where a larger value is always better.
- Use explicit allometric or phenomenological relationships and document assumptions.
- Keep visual size, collision size, energetic size, and hunting size derived from the same phenotype.
- Track trait means, variance, covariance, and distributions by cohort and lineage.

### Phase 4. Pedigree and population genetics

**Status: first persistent pedigree and relatedness implementation committed on evolutionary-ecology-phase3-pedigree; population-genetic statistics remain outstanding.**

- Persistent pedigree records now retain each individual's two parent IDs after those parents die, with a bounded 100,000-record history and an explicit truncation counter.
- A depth-limited recursive kinship coefficient is converted to a relatedness estimate and used to reduce attack probability against relatives according to inherited kin affinity.
- Schema-v5 snapshots preserve the pedigree graph; older snapshots reconstruct the pedigree records available from currently living agents' parent IDs.

Remaining work:
- Use persistent parent IDs to build a pedigree.
- Calculate kinship from shared ancestors or a pedigree relationship matrix, with a documented depth/approximation policy.
- Distinguish identity-by-descent from simple phenotype or genome similarity.
- Track per-locus allele frequencies, heterozygosity, effective population size, inbreeding, and trait heritability.
- Make mate choice operate on explicit genetic or phenotypic targets.
- Preserve pedigree and genetic statistics through save/restore and export.

### Phase 5. Neuroevolution and lifetime learning

**Status: first innovation-tracked neural genome implementation committed on evolutionary-ecology-phase4-neuroevolution; topology and learning upgrades remain.**

- Neural connections now carry stable innovation IDs derived from their directed endpoint pair.
- Crossover aligns matching innovations and treats unmatched genes as disjoint candidates instead of assuming array slot g is homologous in both parents.
- Neural distance for mate preference compares innovation sets and homologous weights rather than positional endpoints.
- Innovation registries and per-agent maternal/paternal innovation arrays persist in schema-v6 snapshots; older genomes receive reconstructed endpoint-based IDs during restore.

Remaining work:
- Give connection genes stable historical/innovation IDs so crossover can align homologous genes.
- Separate connection topology, weights, biases, and enabled state.
- Decide whether to evolve topology (innovation-tracked NEAT-like approach) or use a fixed homologous topology. Do not claim topology evolution while crossing unrelated array slots.
- Add interpretable sensory channels for relative prey size, prey speed, prey energy/condition, kinship, resource density, crowding, and environmental state.
- Let the controller make decisions about pursuit, target choice, attack commitment, escape, foraging, cooperation, and mating.
- Separate inherited starting weights from lifetime plasticity. Define a measurable reward/fitness signal and evaluate learning against non-learning controls.

### Phase 6. Spatial ecology and changing environments

- Add resource renewal, patch depletion, spatial gradients, seasonal cycles, and resource quality.
- Add shelters, bottlenecks, territories, refugia, and habitat gradients.
- Add environmental variation such as currents and temperature as fields with explicit spatial and temporal scales.
- Test whether different niches support distinct stable strategies.
- Include perturbation experiments: resource collapse, habitat fragmentation, current shifts, and population bottlenecks.

### Phase 7. Experimental design and observability

- Add experiment seeds, scenario definitions, parameter sweeps, replicates, and run metadata.
- Track per-trait selection differentials and selection gradients.
- Track lifetime reproductive success, age-specific survival, cohort survival, and lineage contribution.
- Record attack attempts, target choices, capture success, energy profitability, and strategy frequencies.
- Distinguish genome-wide diversity from colour signatures and neural topology summaries.
- Export CSV/JSON time series and experiment metadata.
- Add experiment comparison tools with confidence intervals across independent replicates.

### Phase 8. Performance, calibration, and release quality

- Profile the corrected model at 100, 250, 500, and 1,000 agents on desktop and representative mobile devices.
- Optimise neighbour queries, collision/attack resolution, food lookup, telemetry aggregation, and rendering based on measurements.
- Consider GPU compute only after the CPU reference model is correct and profiling demonstrates a bottleneck.
- Calibrate qualitative parameters against explicit target behaviours or published empirical ranges where appropriate. Otherwise label them dimensionless and illustrative.
- Maintain automated syntax, structural, deterministic replay, state migration, and model-invariant tests.
- Test the deployed build on real browsers and touch devices.
- Keep the Observatory focused on causal model outputs rather than decorative charts.

## Validation gates

A phase is not complete merely because its code exists. Each phase needs:
- A documented mechanism and explicit assumptions.
- Automated regression tests for its invariants.
- A repeatable experiment demonstrating the intended behaviour.
- Performance measurements where per-agent cost changes.
- UI labels and help text that match the actual implementation.
- Snapshot migration and export coverage where state or telemetry changes.

## Current limitations

The current model remains an exploratory artificial ecology, not a calibrated biological model. Phase 1 removes several sources of update-order bias, but feeding claims and attack proposals are now resolved in batches after collection, but the wider energy model remains simplified. Randomised agent order remains useful for any other immediate state changes. Parent IDs improve pedigree correctness, but the kinship estimate is depth-limited to eight pedigree generations and becomes a lower bound when the bounded pedigree store has discarded ancestors. The ten-locus phenotype is in place, but its selection gradients and heritability are not yet measured. Neural connections now use endpoint-derived innovation IDs for homology, but they do not yet have full historical innovation events, enabled-state genes, bias genes, or species-aware NEAT selection. The current fitness and learning reward remain heuristic.
