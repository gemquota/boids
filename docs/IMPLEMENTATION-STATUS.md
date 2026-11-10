# Work log and current implementation status

## Completed in this branch

- [x] Inspected the existing worker, chromosome format, genetics primitives, test harness, and roadmap.
- [x] Created isolated branch `feat/evolutionary-ecology-completion` and draft PR #44.
- [x] Added the comprehensive implementation checklist in [IMPLEMENTATION-BACKLOG.md](IMPLEMENTATION-BACKLOG.md).
- [x] Added `evolution.js`: variable-length genome validation; historical innovation/split registries; connection and split mutation; connection and hidden-node deletion; enable/disable mutation; weight, bias, and node-activation mutation; multiple activation functions; fitter-parent innovation-aligned crossover; compatibility distance; species assignment; sparse compiled neural execution; regulatory expression; epistatic phenotype primitives; allele statistics; parent-offspring regression; pedigree kinship/inbreeding; deterministic replicate summaries; permutation comparisons; and Cartesian parameter sweeps.
- [x] Integrated variable-length genomes into the live worker. Legacy brains migrate into node/connection genomes; the worker evaluates compiled variable topologies; offspring inherit through innovation-aligned crossover and structural mutation; fitter-parent selection uses parental fitness.
- [x] Added per-agent recurrent neural state and reusable activation buffers to avoid allocating a new neural workspace for every boid on every tick. Lifetime plasticity is stored in a separate per-connection learned-weight overlay, blended at reproduction by the existing inheritance control, and never writes back into inherited connection genes.
- [x] Added live NEAT species assignment, an adaptive compatibility threshold, species-diversity telemetry, configurable species target/threshold controls, activation/deletion mutation controls, same-species mate preference, and soft species-size balancing with fallback when a species has no available mate, plus bounded species-size reproductive pressure that nudges small species upward and large species downward.
- [x] Added inherited cis-regulatory loci. Regulatory alleles alter expression bias and environmental responsiveness without overwriting the underlying trait genotype.
- [x] Added live population metrics: per-trait binned allele richness/frequencies, expected gene diversity (Hₑ), mid-parent heritability estimates with sample sizes, pedigree inbreeding, idealised sex-ratio effective size, species entropy, and regulatory activity/variance.
- [x] Persisted variable-length genomes, innovation registry, species representatives, parental genome/fitness state, regulatory loci, and neural topology through schema-12 snapshots, including adaptive species threshold state, inherited genotype, lifetime learned-weight overlays, and recurrent neural activation state. Legacy snapshots migrate with neutral regulatory defaults.
- [x] Added deterministic tests for genome validation, mutation, crossover, activation, speciation, regulatory expression, population metrics, snapshot round-trips, replicate summaries, permutation tests, and parameter sweeps.
- [x] Added GitHub Actions coverage for evolutionary tests, existing genetics checks, worker determinism, and project validation. All three workflows passed on the current branch head `a56dc7c`: full project validation, evolutionary model tests, and genetics checks. Full validation includes worker determinism, snapshot migration, learned-weight/recurrent-state persistence, brain-inspector payloads, 180 configuration controls, browser-script syntax, and the worker benchmark.

## Still incomplete

- Species-aware mating and adaptive compatibility thresholds are live, but full NEAT fitness sharing, champion preservation, stagnation handling, and species-specific offspring quotas are not implemented.
- Regulatory loci are inherited and expressed, but stable copy identities, gene duplication/deletion/rearrangement, trans-regulatory networks, and live epistatic multi-locus trait equations remain incomplete.
- Population metrics are in worker telemetry, Observatory cards/charts, and experiment JSON exports. Allele frequencies are binned into 16 classes per trait; Hₑ is expected gene diversity, not observed diploid heterozygosity. Mid-parent h² only uses offspring whose two parents are still alive. The sex-ratio Ne estimate is explicitly idealised for equal reproductive success/random mating in an overlapping-generation population; variance-based genetic Ne, additive genetic variance, and uncertainty for every estimate remain outstanding.
- The existing plant-only ecosystem already has plant biomass, spores, freshwater/moisture proximity, seasonal variation, shelter, and consumer energy feedback. The broader habitat-gradient, nutrient, fragmentation, disturbance, and niche-validation backlog remains.
- Reproducible replicate/statistics and parameter-sweep primitives exist, but isolated experiment worlds, immutable manifests, pause/resume/cancellation, factorial/Latin-hypercube orchestration, and UI controls remain incomplete.
- Android/browser profiling, performance baselines, mobile interaction tests, Pages smoke tests, and deployment verification remain outstanding.
- This branch has not been merged or deployed. PR #44 remains draft until remaining integration and validation are complete.

## Next implementation sequence

1. Complete CI and benchmark the live worker paths, especially species assignment and per-agent neural workspaces.
2. Finish NEAT selection pressure: fitness sharing, champion preservation, stagnation, and species-specific offspring quotas.
3. Expand regulatory genetics with stable gene-copy identity, trans-regulatory edges, duplication/deletion, and epistatic trait equations.
4. Add effective population size, genetic/phenotypic variance, uncertainty, and cohort survival estimates.
5. Extend habitat/resource dynamics and controlled ecological disturbances without introducing artificial food patches.
6. Build isolated experiment worlds, manifests, multi-seed execution, and pause/resume/cancellation.
7. Complete Observatory views for species distribution/age, regulatory-network structure, and experiment comparisons.
8. Benchmark worker, neural evaluation, statistics, snapshots, and rendering; run mobile/browser and Pages smoke tests.
9. Update documentation and release notes, then merge and deploy only after the validation gate is green.

A task is complete only when it is in the live execution path and has tests, persistence coverage, observable output, and documentation appropriate to the change.
