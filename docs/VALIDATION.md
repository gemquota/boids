# Validation, performance and known limitations

## Automated CI

The repository has separate workflows for:
- project validation (syntax, configuration schema/registry, ecology and visual invariants, worker determinism, chromosome/genetics tests and benchmark guardrails);
- evolutionary model tests (`node --test tests/*.test.js`, plus worker/module syntax);
- genetics checks.

The evolutionary test suite includes genome validation/mutation/crossover, recurrent and split-edge semantics, speciation/selection, regulatory primitives, allele and pedigree metrics, experiment manifests/replicate analysis, Kaplan–Meier survival analysis and multiple-comparison correction. Worker integration also tests recorded all-cause deaths, right-censoring of living/manual removals, and schema-18 persistence.

A passing workflow validates only the assertions it executes. It does not prove biological validity, browser usability, deployment correctness or acceptable performance on every device.

## Manual release gate

1. Open the GitHub Pages deployment on desktop and mobile.
2. Confirm the worker starts and the field animates.
3. Exercise both drawers, every tab, nested accordions and Observatory charts.
4. Drag sliders; test editable min/max bounds, reset, presets and persistence.
5. Run at minimum, default and maximum population settings.
6. Inspect an agent's evolved brain and confirm node/connection details match its live genome.
7. Observe plant growth, spore drift/settling/germination, grazing, hydration and freshwater proximity.
8. Exercise reproduction, predation, ageing and mortality.
9. Save, reload and restore a world; verify the worker `schemaVersion` remains 18 while the IndexedDB envelope retains `storageSchemaVersion: 2`, then verify population, ecology, genome, pedigree, innovation, species and RNG state.
10. Export an analysis bundle and validate its metadata and payload.
11. Leave the simulation running for an extended period and inspect memory growth and UI responsiveness.
12. Verify the deployed Pages URL and browser console after the latest workflow completes.

## Performance

### Deterministic worker baseline

Recorded on 2026-11-10 in GitHub Actions commit `18f2035a02`, using fixed seed `20261110`, 12 warm-up ticks and 36 measured update/draw ticks per population. The worker runs in Node with a no-op Canvas context. These are reproducible CI reference measurements, not browser/device rendering guarantees.

| Requested | Initial | Post-warm-up | Final | Update mean | Update p95 | Draw mean | Draw p95 | Max backlog | Snapshot JSON | Restore | Heap delta |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 100 | 100 | 100 | 6.202 ms | 9.873 ms | 0.579 ms | 0.961 ms | 15 ms | 1,253,742 B | 35.847 ms | 12.05 MiB |
| 250 | 250 | 250 | 250 | 19.708 ms | 32.726 ms | 0.721 ms | 1.150 ms | 15 ms | 3,122,406 B | 66.507 ms | 19.67 MiB |
| 500 | 500 | 498 | 497 | 43.416 ms | 55.110 ms | 0.845 ms | 0.995 ms | 15 ms | 6,217,386 B | 107.203 ms | 25.74 MiB |
| 1,000 | 1,000 | 996 | 994 | 121.226 ms | 125.701 ms | 1.177 ms | 1.222 ms | 15 ms | 12,500,159 B | 213.757 ms | 45.59 MiB |

The benchmark records process heap delta, simulation update and draw timings, frame-step/backlog behaviour, serialized snapshot size and restore time. Heap delta is a coarse process-level measurement, not isolated worker memory or a browser heap profile. Population changes at 500/1,000 are observed mortality during the benchmark window. The existing update budgets remain 25/50/100/220 ms respectively.


## Known limitations

- The model is not calibrated to a real species or ecosystem.
- Trait loci are quantitative and not diploid allele pairs.
- Live regulatory inheritance is cis-regulatory; full trans-regulatory gene-copy networks and gene duplication/deletion are not integrated.
- Heritability, diversity and effective-size telemetry have explicit approximation and sampling limitations; see [GENETICS.md](GENETICS.md).
- Isolated multi-replicate experiment-world orchestration, pause/resume/cancellation, complete replay archives and a dedicated experiment UI remain outstanding.
- Spatial nutrient/temperature/habitat gradients, fragmentation, refugia and controlled disturbance scenarios are not yet comprehensive.
- Browser/device smoke tests, mobile profiling, long-duration memory testing and production Pages verification remain release gates unless a current run explicitly records them.


The independent version domains and field-presence migration defaults are documented in [SNAPSHOT-MIGRATION.md](SNAPSHOT-MIGRATION.md).

The seeded CI baseline and its Node/no-op-Canvas limitations are recorded in [PERFORMANCE-BASELINE.md](PERFORMANCE-BASELINE.md).

The sampled telemetry fields, history caps and analysis-bundle payload are inventoried in [TELEMETRY-EXPORTS.md](TELEMETRY-EXPORTS.md).
