# Work log and current implementation status

## Completed in this branch

- [x] Inspected the existing worker, chromosome format, genetics primitives, test harness, and roadmap.
- [x] Created isolated branch `feat/evolutionary-ecology-completion` and draft PR #44.
- [x] Added the comprehensive implementation checklist in [IMPLEMENTATION-BACKLOG.md](IMPLEMENTATION-BACKLOG.md).
- [x] Added `evolution.js` with variable-length genome validation, historical innovation/split registries, structural mutation, fitter-parent innovation-aligned crossover, compatibility distance, species assignment, compiled neural execution, regulatory expression, epistatic phenotypes, allele statistics, parent-offspring regression, and pedigree inbreeding calculations.
- [x] Integrated variable-length genomes into the live worker. Initial legacy brains are migrated into node/connection genomes; the worker evaluates compiled variable topologies; offspring inherit through innovation-aligned crossover and structural mutation; fitter-parent selection uses parental fitness.
- [x] Added per-agent recurrent neural state and reusable worker activation buffers to avoid allocating a new neural workspace for every boid on every tick.
- [x] Persisted variable-length genomes, innovation registry state, parental genome/fitness state, and neural topology through schema-10 snapshots. Legacy snapshots still load through the fixed-slot migration path.
- [x] Added tests for genome validation, structural mutation, crossover, compiled activation, species assignment, regulatory expression, population genetics, and pedigree calculations.
- [x] Added a GitHub Actions workflow for evolutionary tests and syntax checks.
- [x] Remote evolutionary test workflow passed on commit `593d12b`; the genetics regression workflow also passed on that commit. The full existing validation workflow is still running at the time of this update.

## Still incomplete

- Species assignment exists and is tested, but species membership is not yet integrated into live worker telemetry or species-aware selection/offspring allocation.
- Regulatory expression and epistatic phenotype functions exist, but regulatory loci are not yet inherited and expressed through the live ten-trait pipeline.
- Population statistics helpers are tested, but allele-frequency, heritability, and inbreeding outputs are not yet wired into the Observatory and experiment exports.
- Ecological extensions, controlled experiment runner, parameter sweeps, platform profiling, and mobile/browser interaction tests remain outstanding.
- This branch has not been merged or deployed. The PR remains draft until the remaining runtime integration and validation are complete.

## Next implementation sequence

1. Run the new CI workflow and fix any failures.
2. Integrate variable-length node/connection genes into worker birth, brain evaluation, mutation, crossover, and serialization.
3. Add schema migration from legacy fixed-slot genomes and persist innovation/species registries.
4. Wire species-aware reproduction and expose species telemetry.
5. Integrate regulatory gene copies and multi-locus phenotype expression into the existing ten-trait expression pipeline.
6. Wire allele, pedigree, inbreeding, diversity, and heritability metrics into telemetry and exports.
7. Add habitat fields and resource-competition mechanics incrementally.
8. Build isolated experiment execution, replicate management, sweeps, and statistical comparisons.
9. Complete Observatory controls, device profiling, browser/touch tests, and Pages smoke testing.

A task is complete only when it is in the live execution path and has tests, persistence coverage, observable output, and documentation appropriate to the change.
