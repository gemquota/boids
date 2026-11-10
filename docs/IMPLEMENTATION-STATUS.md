# Work log and current implementation status

This file describes the merged evolutionary-ecology foundation and the current completion workstream. The checkbox backlog is authoritative for task-level status.

## Implemented in the live worker

- Fixed-step deterministic updates, seeded RNG, shuffled evaluation order, double-buffered movement state and spatial indexing.
- Ten inherited quantitative trait loci with configurable expression and mutation.
- Plant-only basal resource ecology, clonal plants/spores, freshwater network, hydration, seasonal effects, reefs/shelter and conspecific predation.
- Variable-length NEAT-style node/connection genomes, historical innovations, structural mutation, recurrent execution, innovation-aligned crossover and separate learned-weight overlays.
- Compatibility-based species assignment, adaptive threshold, fitness sharing, age/stagnation tracking, species-specific integer quotas, champion reproductive pressure and same-species mate preference with fallback.
- Inherited cis-regulatory modifiers that affect trait-expression bias and environmental responsiveness.
- Population telemetry for binned allele frequencies/richness, expected gene diversity, pedigree inbreeding, preliminary heritability using conception-time parental trait records, species entropy, regulatory activity and idealised sex-ratio effective size.
- Observatory population/genetics/species/neural views and run-analysis export.
- Worker snapshot schema 14 with legacy migration and a distinct IndexedDB `storageSchemaVersion: 2` envelope, full variable genomes, innovation/species state, regulatory modifiers, learned weights, recurrent state, pedigree and RNG/ecology state.

## Implemented as standalone/tested analysis primitives

- Regulatory activation/repression and multi-locus/epistatic expression helpers.
- Replicate summaries, bootstrap intervals, permutation comparisons and effect sizes.
- Regression/correlation, deterministic replicate seed derivation and parameter-sweep generation.
- Kaplan-Meier survival summaries and multiple-comparison p-value correction.
- Immutable experiment manifest creation.

These utilities are not equivalent to an isolated experiment runner. The live worker/UI does not yet orchestrate independent experiment worlds with pause/resume/cancellation and full replay.

## Still incomplete

1. Explicit champion elitism and structural-innovation protection beyond reproductive pressure.
2. Stable gene-copy identities, duplication/deletion/rearrangement, live trans-regulatory networks and stage-specific expression.
3. Stronger population-genetic estimation: variance-based/effective population size, additive genetic variance, trait covariance, uncertainty and survivorship-bias-resistant heritability.
4. Broader spatial habitat, nutrient, temperature, fragmentation, refugia and disturbance dynamics.
5. Isolated multi-replicate experiment execution, factorial/Latin-hypercube orchestration, progress/cancellation, comparison UI and replayable archives.
6. Additional per-species innovation/topology inspection and deeper regulatory-network visualisation.
7. Android and cross-browser interaction/performance profiling, long-duration memory checks and deployed Pages smoke tests.

## Validation note

The evolutionary model test suite previously had a deterministic fixture bug: a test intended to isolate split mutation used an RNG that also triggered the default recurrent-mutation probability. The fixture now explicitly sets unrelated mutation rates to zero. This preserves the assertion and makes the test test the intended mechanism.

A feature is complete only when it is integrated where intended, covered by tests, persisted/migrated where stateful, observable where user-facing, documented with assumptions, and benchmarked where it adds recurring cost.
