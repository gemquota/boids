# Observatory telemetry and analysis exports

## Sampling and retention

The worker evaluates population metrics on its statistics cadence (not every render). The Observatory consumes sampled worker telemetry. Rolling telemetry, allele-distribution, cohort and neural-weight histories are bounded to 600 samples; the all-cause survival event history is separately bounded to 20,000 observations with an explicit truncation counter. The frame scheduler reports residual time accumulator/backlog and the number of fixed steps performed.

## Live Observatory telemetry

| Domain | Fields / measures | Interpretation |
|---|---|---|
| Population and motion | population count, generation, mean age, energy, speed, neighbour count, FPS, update/draw time, fixed steps and residual backlog | Operational state and performance, not biological calibration |
| Life history | births, deaths, conceptions, pregnancy count, mean fitness/reward, mean lifetime offspring, breeding individuals, maximum offspring, selected-parent events | Realised model events and reproductive contribution |
| Traits and selection | aggression, body size, speed, bite strength, kin affinity, sensory range, acceleration, agility, risk tolerance, exploration, trait selection differentials | Quantitative trait values and observed parent-selection differentials |
| NEAT and species | species count, largest species, entropy, adaptive compatibility threshold, quota pressure, species age/stagnation/viability, champion fitness, mean nodes/connections, innovation diversity and per-species topology summaries | Compatibility clusters and evolving neural architecture; not biological species labels |
| Neural weights | mean weight, weight variance, per-locus weight means/variances, sampled weight history and brain-inspector nodes/edges | Inherited connection genes plus distinct lifetime learned-weight overlays |
| Regulatory genetics | mean regulatory activity and variance, plus inherited cis-regulatory modifier state | Current live cis modifiers; full variable trans-regulatory network remains a separate model primitive |
| Population genetics | per-trait binned allele richness/frequencies, expected gene diversity, mid-parent heritability and raw slopes, per-trait sample sizes and 95% slope intervals, inbreeding, phenotypic/additive/residual variance and genotype/phenotype covariance matrices | Quantitative-locus approximations; not observed diploid heterozygosity or fully identified genetic/environmental covariance |
| Effective breeders | inverse-Simpson effective female and male contributor counts and their harmonic mean | Realised lifetime reproductive-contribution index; not temporal/cohort effective population size |
| Survival | median observed age, sample size, deaths/events, censored living/manual removals, delayed-entry count and truncated-history count | All-cause Kaplan–Meier age analysis; not cause-specific or birth-cohort survival |
| Ecology | plant count/biomass/stage counts, spore count, bud/release/germination/death counters, seasonal resource factor and sheltered fraction | Plant-only basal resource ecology, freshwater/hydration and shelter indicators |

## Worker analysis bundle

The worker's `exportExperimentData()` returns `format: "boids-analysis-bundle-v2"` with:

- **metadata:** export timestamp, experiment/run serial, seed, mode, simulation time, population, generation, configuration, worker snapshot schema, telemetry sample count, genome record count and notes.
- **snapshot:** a JSON-safe worker world snapshot (schema 19), including current arrays, variable-length genomes, learned weights, recurrent state, regulatory modifiers, pedigree, innovation/species state, survival history, per-agent variable-length plasticity traces and RNG/ecology state.
- **telemetry:** sampled population records, including genetics, survival, species, ecology and performance fields.
- **geneDistributionHistory / cohortHistory / neuralWeightHistory:** bounded sampled histories.
- **selectionDifferentials:** per-trait selection differential summary.
- **reproductiveSuccess / parentTraitRecords / pedigree:** lifetime reproductive contribution and conception-time parent-trait/pedigree records.
- **counters:** births, deaths, conceptions, predation/attack, energy expenditure, mutations, selected-parent events, pedigree truncation and plant ecology counters.

Typed arrays in the snapshot are converted to ordinary arrays in the analysis bundle so the JSON export is portable. The worker snapshot itself remains the restorable representation.

## Statistical helper API versus experiment runner

`evolution.js` exposes deterministic replicate seed derivation, immutable manifests, parameter-sweep generation, replicate summaries, bootstrap intervals, permutation comparisons, effect sizes, regression/correlation, Kaplan–Meier estimates and multiple-comparison corrections. These helpers do not yet constitute isolated experiment-world orchestration, bounded concurrent runs, pause/resume/cancel, trajectory comparison UI or replayable experiment archives. Do not describe those as implemented until the worker/UI runs independent worlds from manifests.
