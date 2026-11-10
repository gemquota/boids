# Configuration reference

## Source of truth

`config-schema.js` defines numeric controls, defaults, ranges, steps, grouping, field-guide text and dependency normalization. `config-registry.js` binds those definitions to the UI range inputs. Do not maintain a second manually counted list.

Current configuration inventory: **182 unique numeric controls**:
- 64 core controls;
- 28 advanced controls;
- 60 expression controls (10 loci × 6);
- 30 mutation/inheritance controls (10 loci × 3).

The total is verified by CI. If the schema changes, update the count assertion and this document in the same change.

## Main control groups

| Group | Purpose |
|---|---|
| Motion | Population, simulation time, steering, spacing, flow and movement noise |
| Neural brain | Network density/size, neural update interval, sensor/output masks and lifetime plasticity |
| Genetics | Connection mutation, mutation magnitude, crossover, learned-weight inheritance, speciation and regulatory mutation |
| Reproduction | Drive, mate search/preference, reproductive age, fertility, gestation and energetic thresholds |
| Selection | Predation, competition, survival, attack and energy trade-offs |
| Environment | World geometry, plant ecology, freshwater/hydration, shelter and seasonal effects |
| Dynamics | Fine-grained movement, current, neural, life-history, genetic-variation and phenotype parameters |
| Trait expression | Per-locus phenotype bounds, curve, curve strength/midpoint, bias and environmental sensitivity |
| Trait inheritance | Per-locus mutation rate, mutation magnitude and inheritance fidelity |

Exact IDs, ranges, increments, defaults and dependencies are defined in `config-schema.js`. The field guide in that module is the authoritative explanation for individual controls.

## Runtime rules

- UI controls must normalize to their declared min/max/step.
- Dependent ranges must be normalized after the parent control changes.
- Saved user overrides must not mutate schema defaults.
- Reset restores declared defaults and clears custom endpoint overrides.
- Settings persistence and world snapshot persistence are separate systems.
- Every exposed control must have a worker-side effect or be explicitly documented as a presentation/analysis-only setting.
- Adding/removing a control requires updating tests and the 182-control inventory assertion.

## Simulation and persistence versions

The worker world snapshot schema is **19**. The IndexedDB storage envelope uses a separate `storageSchemaVersion: 2`; the hexadecimal gene codec has its own version (1). Do not confuse either with the hexadecimal gene codec version (1).
