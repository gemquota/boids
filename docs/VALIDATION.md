# Validation, performance and known limitations

## Automated CI

The repository has separate workflows for:
- project validation (syntax, configuration schema/registry, ecology and visual invariants, worker determinism, chromosome/genetics tests and benchmark guardrails);
- evolutionary model tests (`node --test tests/*.test.js`, plus worker/module syntax);
- genetics checks.

The evolutionary test suite includes genome validation/mutation/crossover, recurrent and split-edge semantics, speciation/selection, regulatory primitives, allele and pedigree metrics, experiment manifests/replicate analysis, Kaplan–Meier survival analysis and multiple-comparison correction. Worker integration also tests recorded all-cause deaths, right-censoring of living/manual removals, and schema-17 persistence.

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
9. Save, reload and restore a world; verify the worker `schemaVersion` remains 17 while the IndexedDB envelope retains `storageSchemaVersion: 2`, then verify population, ecology, genome, pedigree, innovation, species and RNG state.
10. Export an analysis bundle and validate its metadata and payload.
11. Leave the simulation running for an extended period and inspect memory growth and UI responsiveness.
12. Verify the deployed Pages URL and browser console after the latest workflow completes.

## Performance

Measure movement/spatial queries, neural evaluation, mutation/crossover/speciation, regulation/statistics, rendering, telemetry, snapshot serialization/restore and experiment analysis separately. Profile representative population sizes (100, 250, 500, 1,000) and the intended Android device as well as desktop browsers. Avoid per-agent/per-tick allocations in hot paths.

## Known limitations

- The model is not calibrated to a real species or ecosystem.
- Trait loci are quantitative and not diploid allele pairs.
- Live regulatory inheritance is cis-regulatory; full trans-regulatory gene-copy networks and gene duplication/deletion are not integrated.
- Heritability, diversity and effective-size telemetry have explicit approximation and sampling limitations; see [GENETICS.md](GENETICS.md).
- Isolated multi-replicate experiment-world orchestration, pause/resume/cancellation, complete replay archives and a dedicated experiment UI remain outstanding.
- Spatial nutrient/temperature/habitat gradients, fragmentation, refugia and controlled disturbance scenarios are not yet comprehensive.
- Browser/device smoke tests, mobile profiling, long-duration memory testing and production Pages verification remain release gates unless a current run explicitly records them.
