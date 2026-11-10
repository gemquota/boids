# Evolutionary ecology completion backlog

This is the master implementation checklist for BOIDS. A checkbox is complete only when the mechanism is implemented, automated tests pass, persistence/export is covered where relevant, and the UI accurately reports it. A design note or placeholder control does not count.

## Non-negotiable invariants

- [ ] One evolving boid population; hunting and other strategies are behavioural differences, not a separate predator caste.
- [ ] Persistent unique individual identity; generation counters are never used as kinship.
- [x] Deterministic fixed-step updates and serialisable random state.
- [ ] Genotype, expressed phenotype, lifetime learning, and environment remain distinct.
- [ ] Selection is based on realised survival and reproduction, not decorative fitness.
- [ ] UI, worker, model documentation, snapshots, and exports describe the same mechanics.
- [ ] Existing plant-only ecology, terrain, drawers, controls, Observatory, presets, and saved worlds remain functional.

## A. Baseline, architecture, and compatibility

- [ ] Record baseline deterministic runs at 100, 250, 500, and 1,000 agents.
- [ ] Record baseline memory, update, draw, backlog, snapshot-size, and restore timings.
- [ ] Audit every fixed-size neural array and connection-count assumption.
- [ ] Inventory all snapshot schemas and migration paths.
- [ ] Inventory current Observatory telemetry and experiment export fields.
- [ ] Define stable public interfaces for genetics, neuroevolution, ecology, metrics, and experiments.
- [ ] Keep worker as orchestration layer; extract model logic into testable modules.
- [ ] Add round-trip snapshot fixtures for representative old and current worlds.
- [ ] Add deterministic replay tests including reproduction, mutations, death compaction, and restore.

## B. Variable-length NEAT genome

- [x] Replace fixed-slot connection genomes with variable-length connection genes.
- [x] Add explicit node genes with stable IDs, node type, activation, and bias.
- [x] Add connection enabled state and recurrent state metadata.
- [x] Persist historical innovation registry and next innovation counter.
- [x] Allocate connection innovations by historical mutation event, not only endpoint hash.
- [x] Allocate split-node innovations consistently for homologous connection splits.
- [x] Implement add-connection mutation with cycle/recurrent policy and duplicate prevention.
- [x] Implement split-connection mutation.
- [x] Implement connection deletion.
- [x] Implement node deletion with incident-edge handling.
- [x] Implement enable/disable mutation.
- [x] Implement weight, bias, and activation mutations.
- [x] Implement recurrent connection mutation.
- [x] Implement innovation-aligned crossover.
- [x] Inherit disjoint/excess genes according to parent fitness.
- [x] Implement disabled-gene inheritance probability.
- [x] Validate graph references, node limits, and malformed genome rejection.
- [x] Implement sparse graph evaluation with deterministic topological/recurrent semantics.
- [x] Separate inherited starting weights from lifetime plasticity.
- [x] Migrate legacy fixed-slot genomes without silently changing their behaviour.
- [x] Add variable-length genome round-trip serialization tests.

## C. NEAT speciation and selection

- [x] Calculate compatibility distance from excess, disjoint, and matching genes.
- [x] Assign individuals to species using representatives and compatibility threshold.
- [x] Adapt compatibility threshold toward a configurable target species count.
- [x] Track species identity, age, size, representative, best fitness, and stagnation.
- [x] Apply fitness sharing within species.
- [ ] Preserve champions / configurable elitism.
- [ ] Protect new structural innovations from immediate elimination.
- [x] Implement species-aware parent selection and species-specific offspring allocation. (Integer quota targets are allocated from shared fitness and converted to reproductive pressure in the overlapping-generation model; same-species mating is preferred with fallback.)
- [x] Handle extinct species and representative replacement.
- [x] Persist species state across save/restore.
- [x] Expose species counts, sizes, age, innovation count, and topology complexity in Observatory. (Includes per-species member count, mean nodes/connections, enabled connections, innovation count, age, stagnation, champion fitness and quota allocation, plus population-level complexity trends.)
- [x] Test speciation under controlled synthetic genomes and selection pressure.

## D. Regulatory genetics and gene expression

- [ ] Define typed structural, regulatory, modifier, and neural gene records.
- [ ] Give every gene copy a stable identity independent of chromosome position.
- [ ] Implement gene duplication with independent copy identity.
- [ ] Implement gene deletion and chromosome-length changes.
- [ ] Implement gene insertion/rearrangement without invalidating stable identities.
- [ ] Implement regulatory edges with activation and repression.
- [ ] Implement regulatory thresholds, strengths, and environmental input channels.
- [ ] Implement multi-locus phenotype equations.
- [ ] Implement epistatic interaction terms and bounded expression.
- [ ] Implement stage-dependent expression.
- [x] Implement environment-dependent plasticity without rewriting inherited genotype.
- [ ] Keep inherited genotype, expressed phenotype, and lifetime learning separate.
- [ ] Cache expression safely and invalidate on relevant state changes.
- [ ] Persist regulatory genes, expression state, and mutation history.
- [ ] Test duplicate divergence, deletion, activation, repression, epistasis, and environmental response.

## E. Population genetics and pedigree

- [ ] Define allele/locus semantics for every supported gene type.
- [x] Track per-locus allele frequencies and allele richness.
- [ ] Track observed and expected heterozygosity where diploid allele representation supports it.
- [ ] Track genome-wide and locus-specific diversity without using colour as a proxy.
- [ ] Track neural topology and regulatory architecture diversity separately.
- [x] Calculate pedigree kinship with documented founder and missing-ancestor policy.
- [x] Calculate individual and population inbreeding coefficients.
- [ ] Track pedigree truncation and uncertainty explicitly.
- [ ] Estimate effective population size using temporal/cohort methods. (A preliminary lifetime, sex-structured realised-contribution estimate is implemented; temporal/cohort Ne remains outstanding.)
- [x] Estimate preliminary additive genetic variance and expressed phenotypic variance. (Additive variance uses h² × expressed phenotypic variance and is explicitly provisional.)
- [x] Estimate preliminary mid-parent/offspring regression from conception-time parental trait records (living-offspring sample).
- [x] Report per-trait heritability sample sizes and t-based 95% regression-slope intervals in worker telemetry/export.
- [ ] Report uncertainty and assumptions for every population-genetic estimate; variance-based Ne and additive-variance uncertainty remain outstanding. (The lifetime effective-breeder estimate is explicitly labelled as a realised-contribution approximation, not temporal Ne.)
- [x] Track phenotypic and genotypic trait covariance matrices. (Environmental decomposition and causal genetic/environmental covariance remain unidentified.)
- [x] Track realised lifetime reproductive success and lineage contribution.
- [x] Track all-cause age-at-death and right-censored living-agent observations with bounded, delayed-entry Kaplan–Meier telemetry.
- [ ] Track cohort-specific survival and generational turnover across independently identified birth cohorts.
- [ ] Add synthetic known-pedigree and known-inheritance validation datasets.
- [x] Persist and export bounded survival-event history and truncation metadata in worker snapshots/analysis bundles.
- [ ] Persist and export complete per-locus population-genetic histories.

## F. Ecological dynamics

- [ ] Define spatial and temporal scales for habitat fields.
- [ ] Implement smooth temperature, moisture, nutrient, current, shelter, and suitability gradients.
- [ ] Implement field sampling with stable interpolation and deterministic boundaries.
- [ ] Model plant biomass, local depletion, regeneration, and carrying stock.
- [ ] Model resource quality and productivity as distinct properties.
- [ ] Model density-dependent plant growth and competition.
- [ ] Connect habitat conditions to maintenance, movement, survival, and reproduction.
- [ ] Add habitat-specific energetic trade-offs and niche opportunities.
- [ ] Add refugia, bottlenecks, territories, and fragmented habitats.
- [ ] Add controlled disturbances: resource collapse, seasonal shifts, fragmentation, shelter loss, and bottlenecks.
- [ ] Measure resource use, recovery, consumer pressure, and ecological feedback.
- [ ] Validate that no artificial food patches are reintroduced; plants remain the basal renewable resource.
- [ ] Test whether distinct niches support persistent strategies across independent seeds.

## G. Experimental laboratory and statistics

- [x] Define immutable experiment manifests with model version, config, seed, and scenario.
- [ ] Implement isolated experiment worlds that cannot mutate the user's live world.
- [x] Implement deterministic independent replicate-seed derivation. (Execution in isolated worlds remains outstanding.)
- [x] Implement one- and multi-parameter sweeps.
- [ ] Implement factorial and Latin-hypercube designs for larger parameter spaces.
- [ ] Implement bounded concurrency, pause/resume, cancellation, and progress reporting.
- [ ] Stream telemetry rather than retaining unbounded per-tick history.
- [x] Calculate mean, SD, median, IQR, and confidence intervals across replicate outcomes.
- [x] Implement effect sizes and bootstrap comparisons.
- [x] Implement regression and correlation analysis with documented assumptions.
- [x] Implement appropriate parametric/non-parametric group comparisons.
- [x] Implement Kaplan-Meier survival estimates and Benjamini-Hochberg / Holm multiple-comparison corrections.
- [x] Treat independent runs as replicates, not individual boids in the statistical helper API.
- [ ] Compare experiment configurations and overlay replicate trajectories.
- [ ] Export JSON archives, CSV time series, population statistics, pedigree, genome/species summaries.
- [ ] Verify archived experiments can be replayed from their manifest.

## H. Observatory and controls

- [ ] Add neural topology/species views.
- [ ] Add innovation history and structural mutation rates.
- [ ] Add regulatory network and expression views.
- [ ] Add allele frequency, heterozygosity, diversity, and effective population size views.
- [ ] Add pedigree and inbreeding views.
- [ ] Add heritability estimates with sample size and uncertainty.
- [ ] Add ecological gradient/resource field views.
- [ ] Add experiment design and parameter sweep controls.
- [ ] Add replicate comparison and statistical output views.
- [ ] Ensure charts consume sampled telemetry, not render-loop internals.
- [ ] Ensure every control is functional, persisted appropriately, and documented.
- [ ] Keep UI responsive while worker and experiment jobs are busy.

## I. Performance, platform, and release validation

- [ ] Benchmark neural evaluation separately from movement and ecology.
- [ ] Benchmark genetic mutation, crossover, and speciation separately.
- [ ] Benchmark regulatory expression and population-statistics aggregation.
- [ ] Benchmark rendering, snapshot serialization, restore, and experiment throughput.
- [ ] Profile 100, 250, 500, 1,000, and stress-test populations.
- [ ] Profile representative Android hardware and desktop browsers.
- [ ] Optimise allocation, sparse neural evaluation, spatial queries, and telemetry from measured bottlenecks.
- [ ] Test Android Chrome and Firefox.
- [ ] Test desktop Chrome, Firefox, and Safari.
- [ ] Test mobile Safari where available.
- [ ] Test drawers, sliders, long-press bounds, charts, touch gestures, world interaction, pause/resume, and backgrounding.
- [ ] Test long-running memory stability and large-world save/restore.
- [x] Run syntax, unit, integration, deterministic replay, migration, and performance regression tests in CI.
- [ ] Verify GitHub Pages deployment and production smoke tests.
- [ ] Update model documentation and release notes only for implemented behaviour.

## Completion policy

A task is not complete because a function exists. It must have:
1. Implementation in the live execution path (unless explicitly a standalone analysis tool).
2. Automated tests for its invariants and failure cases.
3. Snapshot migration/export coverage when state changes.
4. Observable telemetry or a user-facing result where relevant.
5. Documentation that states assumptions and limitations.
6. Performance evidence where it adds recurring computation.

## Work log

- [x] Added per-trait expressed phenotypic variance, preliminary additive variance (h² × Vp), residual variance, and 10×10 phenotypic/genotypic trait covariance matrices to live population telemetry. Exposed mean variance summaries in the Observatory and added regression tests; uncertainty and living-offspring sampling bias remain explicit limitations.

- [x] Added lifetime sex-specific reproductive contribution tracking and an inverse-Simpson effective breeder estimator, combining effective female and male contributions with a harmonic sex-structured estimate. Persisted parental sex identities through schema-18 snapshots and exposed the estimate in the Observatory. This is explicitly not presented as temporal/cohort Ne.

- [x] Added per-species topology summaries to live telemetry: member count, mean node/connection counts, enabled connections, unique innovation count, age, stagnation, champion fitness and offspring quota. Added Observatory summary cards and trend series with worker regression tests.

- [x] Added explicit recurrent-edge mutation to the live NEAT mutation path and exposed its rate as a control.
- [x] Added persistent species age, champion, best-fitness, stagnation, shared-fitness, and integer offspring-quota statistics; wired quota pressure into female reproductive drive and male mate selection, with a champion reproductive bonus.
- [x] Added Observatory cards/chart series for species age, stagnation, and champion fitness; added a configurable stagnation limit.
- [x] Added unit, worker, snapshot, UI, and CI coverage for species lifecycle and quota behaviour.
- [x] Added immutable experiment manifest validation, deterministic replicate seed derivation, Kaplan-Meier survival curves, and BH/Holm multiple-comparison correction with tests.

- [x] Inspected current model roadmap, chromosome format, genetics primitives, worker, and genetics tests.
- [x] Created an isolated implementation branch for the completion programme.
- [x] Implement and test first variable-genome / regulatory / population-metrics foundation.
