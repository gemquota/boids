# BOIDS // evolutionary field

**A full-screen, browser-based artificial ecology with evolving neural controllers and heritable traits.**

**Live simulation:** https://gemquota.github.io/boids/  
**Repository:** https://github.com/gemquota/boids

BOIDS is a deterministic, worker-driven ecosystem experiment. A single population of boids moves, forages on plant biomass, competes, chooses mates, reproduces, and experiences conspecific predation. Hunting is a behavioural strategy within the population, not a separate predator caste.

## Current runtime

- Full-screen Canvas2D simulation in an OffscreenCanvas-capable Web Worker.
- Fixed-step updates, seeded randomness, double-buffered movement state, spatial indexing, and deterministic snapshot continuation.
- **185 configurable numeric controls**, generated from the shared configuration schema.
- Ten inherited quantitative trait loci with configurable genotype-to-phenotype expression, environmental sensitivity, and mutation.
- Variable-length NEAT-style node and connection genomes with historical innovations, add/split/delete mutations, enabled and recurrent edges, activation/bias mutation, homologous crossover, and separate lifetime learned-weight overlays and variable-length plasticity traces.
- Live compatibility-based speciation, adaptive thresholding, fitness sharing, species age/stagnation statistics, integer offspring quotas, champion reproductive pressure, and same-species mate preference with fallback.
- Inherited cis-regulatory modifiers that affect trait-expression bias and environmental responsiveness.
- Population telemetry for binned trait-allele frequencies/richness, expected gene diversity, pedigree inbreeding, preliminary mid-parent heritability based on parental traits recorded at conception with sample sizes and t-based regression-slope intervals, delayed-entry Kaplan–Meier all-cause survival, species entropy, and a reproductive-skew-adjusted effective-breeder index from inverse-Simpson parental contributions by sex, with persisted lifetime contribution and parent-sex state.
- Plant-only basal renewable resources, clonal plant growth/spores, freshwater networks, thirst, seasonal variation, reefs/shelter, and conspecific predation.
- Observatory panels for population, reproduction, genetics, species, neural topology, and run history.
- Browser-local IndexedDB world snapshots. Worker snapshot schema is **20**; the browser storage envelope has its own schema version.

## Configuration

All controls are declared in `config-schema.js` and registered by `config-registry.js`. The current count is derived from:
- 64 core controls;
- 31 advanced controls;
- 10 trait loci × 6 expression controls;
- 10 trait loci × 3 mutation controls.

That is 185 unique numeric controls. Do not hand-maintain a separate count in UI documentation.

## Architecture

| File | Responsibility |
|---|---|
| `index.html` | UI, drawers, Observatory, browser persistence, worker messaging |
| `boids-worker.js` | Simulation orchestration, ecology, reproduction, live telemetry, snapshot export/restore |
| `evolution.js` | Pure variable-genome, NEAT, regulatory/statistical and experiment-analysis primitives |
| `genetics.js` | Ten-locus trait schema, expression curves, inheritance and trait helpers |
| `chromosome.js` | Typed hexadecimal gene-record codec |
| `config-schema.js` | Shared control definitions, field guide and dependency normalization |
| `config-registry.js` | Runtime binding, normalization, reading and application of UI controls |

## Important scientific limitations

This is an exploratory agent-based artificial ecology, **not a biologically calibrated model**.

- Trait alleles are quantitative loci, not paired diploid Mendelian chromosomes.
- The live worker's regulatory inheritance is currently cis-regulatory. The more general trans-regulatory and epistatic functions in `evolution.js` are analysis/model primitives, not a fully integrated gene-copy regulatory network.
- Expected gene diversity from binned trait values is not observed diploid heterozygosity.
- The current heritability estimate is preliminary and uses conception-time parental trait records; sample-size, pedigree-truncation and selection-related limitations still apply.
- The effective-breeder index uses realised lifetime parental offspring contributions, inverse-Simpson effective counts within each sex and their harmonic mean. It is not classical or temporal/cohort Ne for this overlapping-generation population.
- Fitness remains a model-specific proxy, not a calibrated biological objective.
- Experiment statistics and deterministic sweep helpers exist, but isolated multi-replicate experiment-world orchestration, full replay archives, and experiment UI are not complete.
- Habitat gradients, nutrients, fragmentation, and controlled disturbance scenarios remain limited compared with the plant/freshwater baseline.

See [implementation status](docs/IMPLEMENTATION-STATUS.md), [master backlog](docs/IMPLEMENTATION-BACKLOG.md), [architecture](docs/ARCHITECTURE.md), [snapshot migration contract](docs/SNAPSHOT-MIGRATION.md), [telemetry and exports](docs/TELEMETRY-EXPORTS.md), [performance baseline](docs/PERFORMANCE-BASELINE.md), [genetics](docs/GENETICS.md), [configuration](docs/CONFIGURATION.md), and [validation](docs/VALIDATION.md).

## Development and validation

No package install or bundler is required. GitHub Actions run:
- project syntax, control-schema, ecology, determinism, migration and benchmark checks;
- genetics tests;
- evolutionary model tests.

A passing Node test suite does not replace browser/device smoke tests. Before release, verify the live GitHub Pages build, mobile drawer/touch behaviour, long-running memory use, save/restore, and performance on representative hardware.

## Deployment

GitHub Pages serves the static application from the repository. The deployment workflow is `.github/workflows/pages.yml`. The published URL is https://gemquota.github.io/boids/.
