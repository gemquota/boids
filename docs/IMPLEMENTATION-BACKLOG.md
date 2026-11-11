# Evolutionary ecology completion backlog

This is the master implementation checklist for BOIDS. A checkbox is complete only when the mechanism is implemented, automated tests pass, persistence/export is covered where relevant, and the UI accurately reports it. A design note or placeholder control does not count.

## Non-negotiable invariants

- [x] One evolving boid population; hunting and other strategies are behavioural differences, not a separate predator caste.
- [x] Persistent unique individual identity; generation counters are never used as kinship.
- [x] Deterministic fixed-step updates and serialisable random state.
- [x] Genotype, expressed phenotype, lifetime learning, and environment remain distinct.
- [x] Selection is based on realised survival and reproduction, not decorative fitness. Mortality removes individuals; selection fitness now incorporates survival duration, energy condition and lifetime offspring contribution, while mate choice and species quotas alter reproductive pressure. It remains a model-specific proxy, not a biological measurement.
- [x] UI, worker, model documentation, snapshots, and exports describe the same implemented mechanics; incomplete mechanisms remain explicitly labelled as outstanding.
- [ ] Existing plant-only ecology, terrain, drawers, controls, Observatory, presets, and saved worlds remain functional.

## A. Baseline, architecture, and compatibility

- [x] Record baseline deterministic runs at 100, 250, 500, and 1,000 agents. (GitHub Actions worker update baseline recorded in `docs/VALIDATION.md`; browser/device and render timing remain separate release gates.)
- [x] Record baseline memory, update, draw, backlog, snapshot-size, and restore timings. (CI records process heap delta, update/draw timings, frame backlog, serialized snapshot size and restore time at 100/250/500/1,000 agents; browser/device profiling remains open.)
- [x] Audit fixed-size neural arrays and connection-count assumptions; document legacy projections, runtime bounds and test coverage in [ARCHITECTURE.md](ARCHITECTURE.md).
- [x] Inventory worker, IndexedDB-envelope and chromosome-codec schemas plus field-presence migration behaviour in [SNAPSHOT-MIGRATION.md](SNAPSHOT-MIGRATION.md).
- [x] Inventory current Observatory telemetry and analysis-export fields in [TELEMETRY-EXPORTS.md](TELEMETRY-EXPORTS.md); isolated experiment execution and replayable archives remain outstanding.
- [ ] Define stable public interfaces for genetics, neuroevolution, ecology, metrics, and experiments.
- [ ] Keep worker as orchestration layer; extract model logic into testable modules.
- [x] Add round-trip snapshot fixtures for representative old and current worlds (including legacy fixed-slot and trait-layout migration).
- [x] Add deterministic replay tests including reproduction, mutation, death/removal, stable identity and snapshot restore.

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
- [x] Preserve species champions with configurable reproductive-pressure elitism (`speciesChampionBonus`); this overlapping sexual population protects champion contribution rather than copying a clone into a discrete next generation.
- [x] Protect newly introduced NEAT structural innovations with configurable grace duration/bonus, stable innovation IDs and schema-20 persistence; protection expires deterministically.
- [x] Protect new structural innovations with persisted introduction times and a configurable grace window/selection bonus; the bonus expires after the configured simulation-time window.
- [x] Reweight selection fitness using realised survival time and lifetime offspring contribution; deterministic tests compare matched worlds differing only in survival or reproduction records.
- [x] Implement species-aware parent selection and species-specific offspring allocation. (Integer quota targets are allocated from shared fitness and converted to reproductive pressure in the overlapping-generation model; same-species mating is preferred with fallback.)
- [x] Handle extinct species and representative replacement.
- [x] Persist species state across save/restore.
- [x] Expose species counts, sizes, age, innovation count, and topology complexity in Observatory. (Includes per-species member count, mean nodes/connections, enabled connections, innovation count, age, stagnation, champion fitness and quota allocation, plus population-level complexity trends.)
- [x] Test speciation under controlled synthetic genomes and selection pressure.

## D. Regulatory genetics and gene expression

- [x] Define typed hexadecimal structural, regulatory-node, regulatory-edge, modifier, neural-node and neural-connection gene records. The live chromosome projection serializes and restores these alongside quantitative trait and legacy connection records, with integer source/destination indices and typed round-trip/migration tests.
- [x] Give every regulatory gene copy a stable identity independent of chromosome position. (Live worker offspring inheritance, stable node/edge IDs and snapshot persistence are covered by worker tests.)
- [x] Implement gene duplication with independent copy identity. (The live worker mutation path calls the stable-ID regulatory mutation engine; standalone operator tests cover identity and incident-edge duplication.)
- [x] Implement gene deletion and regulatory-network length changes. (Live worker mutation uses the tested stable-ID regulatory mutation engine.)
- [x] Implement gene insertion/rearrangement without invalidating stable identities. (Stable IDs and registry state are inherited/persisted; insertion and rearrangement operators are tested.)
- [x] Implement regulatory edges with activation and repression. (Signed live trans-regulatory edges feed bounded iterative expression; operator tests cover activation and repression.)
- [x] Implement regulatory thresholds, strengths, and environmental input channels. (Live expression consumes energy, hydration, shelter, harshness, season and life-stage inputs.)
- [x] Implement bounded multi-locus phenotype equations in the live genotype-to-phenotype refresh path, with validated per-trait additive terms and reusable equation records.
- [x] Implement one- to four-locus interaction terms, including pairwise and higher-order epistasis, with centred inputs and per-equation output bounds.
- [x] Implement stage-dependent expression. (The live regulatory evaluator receives a juvenile/adult/senescent stage input; richer developmental schedules remain possible.)
- [x] Implement environment-dependent plasticity without rewriting inherited genotype.
- [x] Keep inherited genotype, expressed phenotype, and lifetime learning separate. (Trait loci and regulatory genomes are inherited; regulatory expression is recomputed into a phenotype modifier; learned neural weights remain a separate overlay.)
- [x] Cache expression safely and invalidate on relevant state changes. (Phenotype refresh recomputes the regulatory expression before the phenotype cache is marked ready; snapshot restore invalidates the cache.)
- [x] Persist per-agent regulatory gene networks, derived expression state, stable identity allocator, and a bounded 5,000-event regulatory mutation history in worker snapshots, with backward-compatible neutral migration.
- [x] Test duplicate identity/divergence operators, deletion, activation, repression, epistasis, bounded multi-locus expression, and environmental response.

## E. Population genetics and pedigree

- [ ] Define allele/locus semantics for every supported gene type.
- [x] Track per-locus allele frequencies and allele richness.
- [ ] Track observed and expected heterozygosity where diploid allele representation supports it.
- [x] Track genome-wide and locus-specific diversity using normalized inherited trait loci and 16-bin per-locus frequency summaries; colour is not used as the diversity estimator.
- [x] Track neural topology and regulatory architecture diversity separately, including unique architecture frequency, innovation richness, node/edge counts, recurrent-edge fraction and regulatory edge sign composition.
- [x] Calculate pedigree kinship with documented founder and missing-ancestor policy.
- [x] Calculate individual and population inbreeding coefficients.
- [x] Track pedigree truncation counts explicitly in worker telemetry and exports.\n- [ ] Quantify uncertainty introduced by pedigree truncation and missing ancestors.
- [ ] Estimate effective population size using temporal/cohort methods. (A preliminary lifetime, sex-structured realised-contribution estimate is implemented; temporal/cohort Ne remains outstanding.)
- [x] Estimate preliminary additive genetic variance and expressed phenotypic variance. (Additive variance uses h² × expressed phenotypic variance and is explicitly provisional.)
- [x] Estimate preliminary mid-parent/offspring regression from conception-time parental trait records (living-offspring sample).
- [x] Report per-trait heritability sample sizes and t-based 95% regression-slope intervals in worker telemetry/export.
- [ ] Report uncertainty and assumptions for every population-genetic estimate; variance-based Ne and additive-variance uncertainty remain outstanding. (The lifetime effective-breeder estimate is explicitly labelled as a realised-contribution approximation, not temporal Ne.)
- [x] Track phenotypic and genotypic trait covariance matrices. (Environmental decomposition and causal genetic/environmental covariance remain unidentified.)
- [x] Track realised lifetime reproductive success and lineage contribution.
- [x] Track all-cause age-at-death and right-censored living-agent observations with bounded, delayed-entry Kaplan–Meier telemetry.
- [x] Track cohort-specific survival and generational turnover using persisted birth-cohort IDs, delayed-entry/censoring-aware Kaplan–Meier summaries, and cohort lineage-depth summaries. Cohort IDs use deterministic 24-simulation-time-unit birth windows; only the most recent 16 cohorts are surfaced, and event-history truncation remains explicit.
- [x] Add synthetic known-pedigree and known-inheritance regression fixtures for parent/offspring and sibling relatedness plus conception-time mid-parent inheritance.
- [x] Persist and export bounded survival-event history and truncation metadata in worker snapshots/analysis bundles.
- [x] Persist and export sampled per-locus allele, heritability, variance and covariance metrics through snapshot telemetry history and analysis bundles.

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
- [x] Stream sampled telemetry with bounded rolling histories; survival events and all trend histories have explicit caps.
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

- [x] Add evolved-brain topology inspection and per-species topology/innovation summaries in the Observatory.
- [ ] Add innovation history and structural mutation rates.
- [ ] Add regulatory network and expression views.
- [x] Add allele richness/frequency, expected gene diversity, inbreeding, effective-breeder and sex-ratio Ne summaries plus sampled genetics trends; temporal/cohort Ne remains outstanding.
- [ ] Add pedigree and inbreeding views.
- [x] Add per-trait mid-parent heritability estimates, sample sizes and t-based 95% slope intervals.
- [ ] Add ecological gradient/resource field views.
- [ ] Add experiment design and parameter sweep controls.
- [ ] Add replicate comparison and statistical output views.
- [x] Ensure Observatory history charts consume sampled worker telemetry rather than render-loop state.
- [ ] Ensure every control is functional, persisted appropriately, and documented.
- [ ] Keep UI responsive while worker and experiment jobs are busy.

## I. Performance, platform, and release validation

- [ ] Benchmark neural evaluation separately from movement and ecology.
- [ ] Benchmark genetic mutation, crossover, and speciation separately.
- [ ] Benchmark regulatory expression and population-statistics aggregation.
- [x] Benchmark draw traversal, JSON snapshot serialization and restore separately in the seeded CI baseline.\n- [ ] Benchmark isolated experiment throughput once the experiment runner exists.
- [x] Profile seeded 100, 250, 500 and 1,000-agent workloads in CI.\n- [ ] Stress-test populations above 1,000 agents.
- [ ] Profile representative Android hardware and desktop browsers.
- [ ] Optimise allocation, sparse neural evaluation, spatial queries, and telemetry from measured bottlenecks.
- [ ] Test Android Chrome and Firefox.
- [ ] Test desktop Chrome, Firefox, and Safari.
- [ ] Test mobile Safari where available.
- [ ] Test drawers, sliders, long-press bounds, charts, touch gestures, world interaction, pause/resume, and backgrounding.
- [ ] Test long-running memory stability and large-world save/restore.
- [x] Run syntax, unit, integration, deterministic replay, migration, and performance regression tests in CI.
- [ ] Verify GitHub Pages deployment and production smoke tests.
- [x] Reconcile model documentation and release notes with implemented behaviour; incomplete mechanisms remain labelled as gaps.

## Completion policy

A task is not complete because a function exists. It must have:
1. Implementation in the live execution path (unless explicitly a standalone analysis tool).
2. Automated tests for its invariants and failure cases.
3. Snapshot migration/export coverage when state changes.
4. Observable telemetry or a user-facing result where relevant.
5. Documentation that states assumptions and limitations.
6. Performance evidence where it adds recurring computation.

## Work log

- [x] Added deterministic regulatory gene insertion and identity-preserving node/edge rearrangement mutations to the standalone regulatory-genome API, with tests proving existing gene and edge identities survive the operation. Live-worker integration remains open.



- [x] Replaced the live NEAT plasticity loop's fixed `cfg.connections` cap with per-agent variable-length eligibility traces aligned to the full evolved genome. Schema 19 persists them and migrates available legacy traces; regression tests prove connections beyond the legacy slot limit continue learning and restore correctly.



- [x] Recorded fixed-seed process-heap, update/draw, frame-backlog, snapshot-size and restore baselines at four population sizes; see `docs/PERFORMANCE-BASELINE.md`. Process heap delta is explicitly labelled as coarse, not isolated browser memory.



- [x] Recorded fixed-seed worker update baselines at 100/250/500/1,000 agents with initial, warm-up and final population counts plus mean/median/p95 timing. The run is a CI-hosted simulation-only reference, not an Android/browser-rendering benchmark.


- [x] Added and tested standalone variable-length regulatory genomes with stable gene-copy and edge identities, gene duplication/deletion, incident-edge duplication/removal, identity-aligned crossover, regulatory activation/repression, environmental inputs and bounded iterative expression. This is a tested foundation, not yet connected to live offspring inheritance, phenotype calculation or snapshots.

- [x] Added per-trait expressed phenotypic variance, preliminary additive variance (h² × Vp), residual variance, and 10×10 phenotypic/genotypic trait covariance matrices to live population telemetry. Exposed mean variance summaries in the Observatory and added regression tests; uncertainty and living-offspring sampling bias remain explicit limitations.

- [x] Added lifetime sex-specific reproductive contribution tracking and an inverse-Simpson effective breeder estimator, combining effective female and male contributions with a harmonic sex-structured estimate. Persisted parental sex identities through schema-21 snapshots and exposed the estimate in the Observatory. This is explicitly not presented as temporal/cohort Ne.

- [x] Added per-species topology summaries to live telemetry: member count, mean node/connection counts, enabled connections, unique innovation count, age, stagnation, champion fitness and offspring quota. Added Observatory summary cards and trend series with worker regression tests.

- [x] Added explicit recurrent-edge mutation to the live NEAT mutation path and exposed its rate as a control.
- [x] Added persistent species age, champion, best-fitness, stagnation, shared-fitness, and integer offspring-quota statistics; wired quota pressure into female reproductive drive and male mate selection, with a champion reproductive bonus.
- [x] Added Observatory cards/chart series for species age, stagnation, and champion fitness; added a configurable stagnation limit.
- [x] Added unit, worker, snapshot, UI, and CI coverage for species lifecycle and quota behaviour.
- [x] Added immutable experiment manifest validation, deterministic replicate seed derivation, Kaplan-Meier survival curves, and BH/Holm multiple-comparison correction with tests.

- [x] Inspected current model roadmap, chromosome format, genetics primitives, worker, and genetics tests.
- [x] Created an isolated implementation branch for the completion programme.
- [x] Implement and test first variable-genome / regulatory / population-metrics foundation.
