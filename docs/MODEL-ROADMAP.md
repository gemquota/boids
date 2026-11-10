# Model roadmap

This roadmap describes work remaining after the merged evolutionary-ecology foundation. Historical phase notes are retained in Git history; they are not current implementation status.

## Current model

- One evolving boid population; predation is conspecific.
- Plant biomass is the renewable basal food source. The ecology includes clonal plants/spores, freshwater proximity, thirst, seasonality, reefs and shelter.
- Ten quantitative trait loci feed configurable genotype-to-phenotype expression.
- Variable-length NEAT-style neural genomes have historical innovations, structural mutation, recurrent execution, innovation-aligned crossover and separate learned-weight overlays.
- Compatibility-based speciation includes adaptive thresholding, fitness sharing, stagnation tracking, integer offspring quotas and champion reproductive pressure.
- Inherited cis-regulatory modifiers affect expression bias and environmental responsiveness.
- Worker snapshot schema 13 preserves the current population/genetic/ecological state and deterministic RNG state.

## Remaining phases

### 1. Correctness and selection hardening
- Add explicit champion elitism and protection of newly introduced structural innovations.
- Expand adversarial tests for cycles, recurrent edges, mutation combinations, crossover and species extinction.
- Verify the overlapping-generation quota/reproductive-pressure interpretation against controlled synthetic populations.
- Remove transitional legacy genome projections once every consumer reads the variable-length representation.

### 2. Regulatory genome
- Give gene copies stable identities independent of array position.
- Implement duplication, deletion and rearrangement with mutation-history preservation.
- Integrate trans-regulatory activation/repression networks into the live phenotype pipeline.
- Add multi-locus and epistatic trait equations and stage-specific expression.
- Persist, migrate, inspect and test all regulatory state.

### 3. Population genetics
- Make allele/locus semantics explicit; add diploid pairs only if observed heterozygosity is a required model concept.
- Improve heritability sampling by recording both parental genotypes at conception.
- Report uncertainty and sample quality, including survivorship and pedigree-truncation limitations.
- Add variance-based/temporal effective population size, additive genetic variance, phenotypic variance and trait covariance.
- Validate estimators against synthetic populations with known pedigrees and inheritance parameters.

### 4. Ecological dynamics
- Add spatial temperature, moisture, nutrient, shelter and habitat-suitability fields with deterministic interpolation.
- Separate resource quality, productivity, local stock and regeneration.
- Add fragmentation, refugia, bottlenecks and controlled disturbance scenarios.
- Measure resource use, recovery, consumer pressure and niche persistence across independent seeds.

### 5. Experimental laboratory
- Execute isolated worlds from immutable manifests and independent seeds.
- Add bounded concurrency, progress, pause/resume and cancellation.
- Implement factorial and Latin-hypercube designs.
- Compare replicate trajectories and statistics without treating individuals in one run as independent replicates.
- Export replayable manifests, world snapshots, time series, pedigree and genome/species summaries.

### 6. Observatory
- Add detailed per-species innovation/topology inspection.
- Add regulatory network and expression views.
- Add uncertainty-aware population-genetic and cohort-survival views.
- Add habitat/resource field visualization.
- Add experiment orchestration, replicate comparisons and archive inspection.

### 7. Performance and release
- Benchmark movement, spatial queries, neural execution, mutation/crossover/speciation, regulation/statistics, rendering and snapshot I/O separately.
- Profile 100, 250, 500, 1,000 and stress-test populations.
- Validate Android Chrome/Firefox and desktop Chrome/Firefox/Safari; include mobile Safari where available.
- Test touch controls, drawers, backgrounding, long-running memory stability and large-world restore.
- Verify GitHub Pages deployment and production smoke tests.

## Completion gate

A task is complete only when its intended live path works, tests cover invariants and failure cases, persistent state migrates/restores correctly, user-facing results are observable, documentation matches the runtime, and recurring performance cost is measured.
