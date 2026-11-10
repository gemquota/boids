# Evolutionary genetics roadmap

## Current baseline

The live runtime now includes ten quantitative trait loci, variable-length NEAT-style neural genomes, compatibility-based species selection, cis-regulatory modifiers, pedigree metrics and schema-20 snapshots. The project is an exploratory artificial ecology, not a calibrated biological model.

| Area | Current status | Remaining work |
|---|---|---|
| Trait expression | Live and configurable | Validate selection/heritability under controlled experiments |
| Neural topology | Variable-length, recurrent, innovation-tracked | Explicit elitism and innovation protection; further adversarial tests |
| Speciation | Adaptive threshold, fitness sharing, stagnation and quotas | Stronger generation/overlapping-population validation and richer species telemetry |
| Regulation | Inherited cis-regulatory modifiers; standalone trans/epistasis primitives | Stable gene-copy identity, duplication/deletion, live trans-regulatory networks and stage-specific expression |
| Population genetics | Allele bins, Hₑ, pedigree inbreeding, preliminary h² and realised-contribution effective-breeder index (not temporal/cohort Ne) | Diploid representation for observed heterozygosity; temporal/cohort Ne, stronger uncertainty for provisional additive/phenotypic variance and covariance, and environmental covariance decomposition |
| Persistence | Worker schema 20 and migration tests | User-facing import/export and broader corruption/large-world testing |
| Experiments | Manifests, seed derivation, sweeps and statistical helpers | Isolated replicate worlds, orchestration, pause/resume/cancel, comparison UI and replay archives |

## Completion criteria

A roadmap phase is complete only when:
1. the mechanism is used in the live execution path or explicitly labelled a standalone analysis utility;
2. tests cover normal, boundary and failure cases;
3. persistent state has migration and deterministic restore coverage;
4. user-facing functionality has observable telemetry/UI;
5. documentation states assumptions and scientific limitations;
6. recurring computational costs have benchmark evidence.

## Next releases

1. Harden NEAT elitism and protect structural innovations.
2. Finish stable gene-copy identities and integrate regulatory networks into the live phenotype pipeline.
3. Improve population-genetic estimators and uncertainty reporting.
4. Extend habitat/resource dynamics and validate niche persistence across independent seeds.
5. Build isolated experiment execution and replayable archives.
6. Complete mobile/browser profiling and production release checks.
