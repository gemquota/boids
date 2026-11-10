# Work log and current implementation status

## Completed in this branch

- [x] Inspected the existing worker, chromosome format, genetics primitives, test harness, and roadmap.
- [x] Created isolated branch `feat/evolutionary-ecology-completion` and draft PR #44.
- [x] Added the comprehensive implementation checklist in [IMPLEMENTATION-BACKLOG.md](IMPLEMENTATION-BACKLOG.md).
- [x] Added `evolution.js`: variable-length genome validation; historical innovation/split registries; connection and split mutation; connection and hidden-node deletion; enable/disable mutation; weight, bias, node-activation, and recurrent-edge mutation; multiple activation functions; fitter-parent innovation-aligned crossover; compatibility distance; species assignment; sparse compiled neural execution; regulatory expression; epistatic phenotype primitives; allele statistics; parent-offspring regression; pedigree kinship/inbreeding; deterministic replicate summaries; permutation comparisons; and Cartesian parameter sweeps.
- [x] Integrated variable-length genomes into the live worker. Legacy brains migrate into node/connection genomes; the worker evaluates compiled variable topologies; offspring inherit through innovation-aligned crossover and structural mutation; fitter-parent selection uses parental fitness.
- [x] Added per-agent recurrent neural state and reusable activation buffers to avoid allocating a new neural workspace for every boid on every tick. Lifetime plasticity is stored in a separate per-connection learned-weight overlay, blended at reproduction by the existing inheritance control, and never writes back into inherited connection genes.
- [x] Added live NEAT species assignment, an adaptive compatibility threshold, species-diversity telemetry, configurable species target/threshold/stagnation controls, activation/deletion/recurrent mutation controls, same-species mate preference, fitness sharing, persistent species age/champion/stagnation statistics, integer quota allocation, and champion reproductive pressure with fallback when a species has no available mate, plus bounded species-size reproductive pressure that nudges small species upward and large species downward.
- [x] Added inherited cis-regulatory loci. Regulatory alleles alter expression bias and environmental responsiveness without overwriting the underlying trait genotype.
- [x] Added live population metrics: per-trait binned allele richness/frequencies, expected gene diversity (Hₑ), mid-parent heritability estimates with sample sizes, pedigree inbreeding, idealised sex-ratio effective size, species entropy, and regulatory activity/variance.
- [x] Persisted variable-length genomes, innovation registry, species representatives, parental genome/fitness state, regulatory loci, and neural topology through schema-12 snapshots, including adaptive species threshold state, inherited genotype, lifetime learned-weight overlays, and recurrent neural activation state. Legacy snapshots migrate with neutral regulatory defaults.
- [x] Added deterministic tests for genome validation, mutation, crossover, activation, speciation, regulatory expression, population metrics, snapshot round-trips, replicate summaries, permutation tests, and parameter sweeps.
- [x] Added GitHub Actions coverage for evolutionary tests, existing genetics checks, worker determinism, and project validation. All three workflows passed on the current branch head `a56dc7c`: full project validation, evolutionary model tests, and genetics checks. Full validation includes worker determinism, snapshot migration, learned-weight/recurrent-state persistence, brain-inspector payloads, 180 configuration controls, browser-script syntax, and the worker benchmark.

## Still incomplete

- Species-aware mating and adaptive compatibility thresholds are live, but full NEAT fitness sharing, champion preservation, stagnation handling, and species-specific offspring quotas are not implemented.
- Regulatory gene-copy identities, duplication/deletion/rewiring, trans-regulatory activation/repression and environmental inputs are live and persisted. Direct multi-structural-locus trait equations and mutation-history records remain incomplete; developmental expression is now available through evolved regulatory input channels.
- Population metrics are in worker telemetry, Observatory cards/charts, and experiment JSON exports. Allele frequencies are binned into 16 classes per trait; Hₑ is expected gene diversity, not observed diploid heterozygosity. Mid-parent h² only uses offspring whose two parents are still alive. The sex-ratio Ne estimate is explicitly idealised for equal reproductive success/random mating in an overlapping-generation population; variance-based genetic Ne, additive genetic variance, and uncertainty for every estimate remain outstanding.
- The plant-only ecosystem now has continuous spatial temperature, moisture, nutrient, current and suitability fields, plus obstacle-derived shelter. Moisture/nutrient productivity modulates plant biomass growth, suitability affects spore establishment, and thermal anomalies affect consumer maintenance costs. These are analytic deterministic fields rather than a grid-backed nutrient stock: local nutrient depletion/regeneration, explicit plant resource quality, competition feedback, movement/survival/reproduction responses, fragmentation, controlled disturbances, and multi-seed niche validation remain incomplete.
- Reproducible replicate/statistics and parameter-sweep primitives exist, but isolated experiment worlds, immutable manifests, pause/resume/cancellation, factorial/Latin-hypercube orchestration, and UI controls remain incomplete.
- Android/browser profiling, performance baselines, mobile interaction tests, Pages smoke tests, and deployment verification remain outstanding.
- This branch has not been merged or deployed. PR #44 remains draft until remaining integration and validation are complete.

## Next implementation sequence

1. Extend NEAT protection from champion reproductive preference to explicit elitist inheritance, protect newly introduced structural innovations, and expose per-species innovation/topology detail.
2. Build isolated experiment-world orchestration around immutable manifests and deterministic replicate seeds; add factorial / Latin-hypercube designs, progress/cancellation, and export/replay.
2. Finish NEAT selection pressure: fitness sharing, champion preservation, stagnation, and species-specific offspring quotas.
3. Expand regulatory genetics with stable gene-copy identity, trans-regulatory edges, duplication/deletion, and epistatic trait equations.
4. Add effective population size, genetic/phenotypic variance, uncertainty, and cohort survival estimates.
5. Extend habitat/resource dynamics and controlled ecological disturbances without introducing artificial food patches.
6. Build isolated experiment worlds, manifests, multi-seed execution, and pause/resume/cancellation.
7. Complete Observatory views for species distribution/age, regulatory-network structure, and experiment comparisons.
8. Benchmark worker, neural evaluation, statistics, snapshots, and rendering; run mobile/browser and Pages smoke tests.
9. Update documentation and release notes, then merge and deploy only after the validation gate is green.

A task is complete only when it is in the live execution path and has tests, persistence coverage, observable output, and documentation appropriate to the change.
