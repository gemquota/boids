# Work log and current implementation status

This file describes the merged evolutionary-ecology foundation and the current completion workstream. The checkbox backlog is authoritative for task-level status.

## Implemented in the live worker

- Fixed-step deterministic updates, seeded RNG, shuffled evaluation order, double-buffered movement state and spatial indexing.
- Ten inherited quantitative trait loci with configurable expression and mutation.
- Plant-only basal resource ecology, clonal plants/spores, freshwater network, hydration, seasonal effects, reefs/shelter and conspecific predation.
- Variable-length NEAT-style node/connection genomes, historical innovations, structural mutation, recurrent execution, innovation-aligned crossover and separate learned-weight overlays.
- Compatibility-based species assignment, adaptive threshold, fitness sharing, age/stagnation tracking, species-specific integer quotas, configurable champion reproductive preservation, temporary structural-innovation grace windows, and same-species mate preference with fallback. Selection fitness incorporates survival duration, energy condition and lifetime offspring contribution. Per-species telemetry now includes member count, mean nodes/connections, enabled connections, unique innovation count, age, stagnation, champion fitness and offspring quota.
- Live inherited cis-regulatory modifiers and variable-length trans-regulatory networks with stable identities, maternal/paternal crossover, duplication/deletion/insertion/rearrangement, activation/repression, bounded iterative expression, environmental/life-stage inputs, persisted expression state and a bounded 5,000-event mutation history.
- Live multi-locus additive and epistatic phenotype equations, including five adjustable default interaction strengths and bounded one- to four-locus terms.
- Population telemetry for binned allele frequencies/richness, expected gene diversity, pedigree inbreeding, preliminary heritability using conception-time parental trait records with sample sizes and t-based slope intervals, bounded delayed-entry Kaplan–Meier all-cause survival plus birth-cohort-specific survival and lineage-depth summaries using persisted deterministic cohort IDs, recorded deaths and right-censored living/manual removals, with initial agents entering at their starting age, species entropy, separate neural/regulatory architecture diversity, regulatory activity, provisional additive-genetic/phenotypic variance and genotypic/phenotypic covariance summaries, and reproductive-skew-adjusted effective breeder size from realised parental contributions. The latter uses inverse-Simpson effective female/male contributor counts and their harmonic mean; it is not temporal/cohort Ne.
- Observatory population/genetics/species/neural, architecture-diversity and birth-cohort survival/turnover views, plus run-analysis export.
- Worker snapshot schema 22 with legacy migration and a distinct IndexedDB `storageSchemaVersion: 2` envelope, full variable genomes, innovation/species state, cis-regulatory modifiers and variable-length trans-regulatory networks, learned weights, recurrent state, pedigree, bounded survival-event history/truncation metadata, persisted birth-cohort IDs/lineage events and stable-ID delayed-entry ages, regulatory expression state/mutation history, lifetime reproductive-success records and parent-sex identity state, per-agent variable-length plasticity traces, structural-innovation protection ages, and RNG/ecology state.

## Additional tested analysis primitives

- Replicate summaries, bootstrap intervals, permutation comparisons and effect sizes.
- Regression/correlation, deterministic replicate seed derivation and parameter-sweep generation.
- Kaplan-Meier survival summaries and multiple-comparison p-value correction.
- Immutable experiment manifest creation.

Per-trait phenotypic and preliminary additive variance, plus genotype/phenotype covariance matrices, are also computed in the live worker and exposed in the Observatory. Additive variance inherits the sampling and model assumptions of the preliminary heritability estimate. These utilities are not equivalent to an isolated experiment runner. The live worker/UI does not yet orchestrate independent experiment worlds with pause/resume/cancellation and full replay.

## Still incomplete

1. Stronger population-genetic estimation: temporal/cohort effective population size, uncertainty for additive-variance/covariance estimates, pedigree-truncation uncertainty, controlled environmental decomposition and survivorship-bias-resistant heritability.
2. Broader spatial habitat/resource gradients, temperature/nutrients, fragmentation, refugia, carrying capacity and controlled disturbances.
3. Isolated multi-replicate experiment execution, factorial/Latin-hypercube orchestration, progress/cancellation, comparison UI and replayable archives.
4. Deeper regulatory-network/expression inspection, pedigree and inbreeding visualisation, and ecological-field views.
5. Android and cross-browser interaction/performance profiling, long-duration memory checks and deployed Pages smoke tests.

## Validation note

The evolutionary model test suite previously had a deterministic fixture bug: a test intended to isolate split mutation used an RNG that also triggered the default recurrent-mutation probability. The fixture now explicitly sets unrelated mutation rates to zero. This preserves the assertion and makes the test test the intended mechanism.

A feature is complete only when it is integrated where intended, covered by tests, persisted/migrated where stateful, observable where user-facing, documented with assumptions, and benchmarked where it adds recurring cost.


Snapshot version domains and legacy restore behaviour are inventoried in [SNAPSHOT-MIGRATION.md](SNAPSHOT-MIGRATION.md).

The current sampled Observatory metrics and JSON analysis-bundle contract are inventoried in [TELEMETRY-EXPORTS.md](TELEMETRY-EXPORTS.md).
