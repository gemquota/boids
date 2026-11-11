# Observatory telemetry and analysis exports

## Sampling and retention

The worker evaluates population metrics on its statistics cadence (not every render). The Observatory consumes sampled worker telemetry. Rolling telemetry, allele-distribution, cohort and neural-weight histories are bounded to 600 samples; the all-cause survival event history is separately bounded to 20,000 observations with an explicit truncation counter. The frame scheduler reports residual time accumulator/backlog and the number of fixed steps performed.

## Live Observatory telemetry

| Domain | Fields / measures | Interpretation |
|---|---|---|
| Population and motion | population count, generation, mean age, energy, speed, neighbour count, FPS, update/draw time, fixed steps and residual backlog | Operational state and performance, not biological calibration |
| Life history | births, deaths, conceptions, pregnancy count, mean fitness/reward, mean lifetime offspring, breeding individuals, maximum offspring, selected-parent events | Realised model events and reproductive contribution |
| Traits and selection | aggression, body size, speed, bite strength, kin affinity, sensory range, acceleration, agility, risk tolerance, exploration, trait selection differentials | Quantitative trait values and observed parent-selection differentials |
| NEAT and species | species count, largest species, entropy, adaptive compatibility threshold, quota pressure, species age/stagnation/viability, champion fitness, mean nodes/connections, innovation diversity, unique neural architecture frequency/diversity and per-species topology summaries | Compatibility clusters and evolving neural architecture; not biological species labels |
| Neural weights | mean weight, weight variance, per-locus weight means/variances, sampled weight history and brain-inspector nodes/edges | Inherited connection genes plus distinct lifetime learned-weight overlays |
| Regulatory genetics | mean activity/variance, node/edge counts, unique regulatory architecture frequency/diversity, innovation richness, positive/negative edge fractions, persisted expression and bounded mutation-event history | Live inherited cis modifiers and variable-length trans-regulatory networks; event history is bounded to the latest 5,000 changes |
| Population genetics | per-trait binned allele richness/frequencies, expected gene diversity, mid-parent heritability and raw slopes, per-trait sample sizes and 95% slope intervals, inbreeding, phenotypic/additive/residual variance and genotype/phenotype covariance matrices | Quantitative-locus approximations; not observed diploid heterozygosity or fully identified genetic/environmental covariance |
| Effective breeders | inverse-Simpson effective female and male contributor counts and their harmonic mean | Realised lifetime reproductive-contribution index; not temporal/cohort effective population size |
| Survival | all-cause delayed-entry Kaplan–Meier estimates, cohort-specific sample sizes/events/censoring/median age, birth-cohort count, latest cohort survival, cohort mean/max lineage depth and truncated-history count | Deterministic 24-time-unit birth cohorts; latest 16 cohorts are surfaced. Cohort estimates inherit the 20,000-event retention limit and are not cause-specific |
| Ecology | plant count/biomass/stage counts, spore count, bud/release/germination/death counters, seasonal resource factor and sheltered fraction | Plant-only basal resource ecology, freshwater/hydration and shelter indicators |

## Worker analysis bundle

The worker's `exportExperimentData()` returns `format: "boids-analysis-bundle-v2"` with:

- **metadata:** export timestamp, experiment/run serial, seed, mode, simulation time, population, generation, configuration, worker snapshot schema, telemetry sample count, genome record count and notes.
- **snapshot:** a JSON-safe worker world snapshot (schema 22), including current arrays, variable-length genomes, learned weights, recurrent state, cis modifiers and trans-regulatory networks/registry, derived regulatory expression and bounded mutation history, pedigree, innovation/species state, all-cause and birth-cohort survival history/IDs, per-agent variable-length plasticity traces, structural-innovation protection ages and RNG/ecology state.
- **telemetry:** sampled population records, including genetics, survival, species, ecology and performance fields.
- **geneDistributionHistory / cohortHistory / neuralWeightHistory:** bounded sampled histories.
- **selectionDifferentials:** per-trait selection differential summary.
- **reproductiveSuccess / parentTraitRecords / pedigree:** lifetime reproductive contribution and conception-time parent-trait/pedigree records.
- **counters:** births, deaths, conceptions, predation/attack, energy expenditure, mutations, selected-parent events, pedigree truncation and plant ecology counters.

Typed arrays in the snapshot are converted to ordinary arrays in the analysis bundle so the JSON export is portable. The worker snapshot itself remains the restorable representation.

## Statistical helper API versus experiment runner

`evolution.js` exposes deterministic replicate seed derivation, immutable manifests, parameter-sweep generation, replicate summaries, bootstrap intervals, permutation comparisons, effect sizes, regression/correlation, Kaplan–Meier estimates and multiple-comparison corrections. These helpers do not yet constitute isolated experiment-world orchestration, bounded concurrent runs, pause/resume/cancel, trajectory comparison UI or replayable experiment archives. Do not describe those as implemented until the worker/UI runs independent worlds from manifests.
