# BOIDS evolutionary genetics roadmap

Checkpointed release plan. A phase is complete only when runtime behaviour and tests demonstrate its acceptance criteria.

| Release | Phase | Scope | Exit checkpoint |
|---|---|---|---|
| v0.2.0 | 1. Gene expression | Complete the ten existing trait loci and genotype-to-phenotype mappings | Every locus has a tested behavioural or physiological effect |
| v0.3.0 | 2. Regulatory genetics | Regulatory loci, interactions, thresholds, dominance-like effects, polygenic traits and environmental modulation | Different genetic contexts produce different expressed phenotypes |
| v0.4.0 | 3. Evolving neural architecture | Stable neuron/connection identities; structural addition, deletion, duplication and safe crossover | Topology evolves across generations without invalid networks |
| v0.5.0 | 4. Genetic persistence hardening | Extend the existing versioned snapshots, local persistence and legacy migrations with explicit export/import, restore guarantees and deterministic continuation | Reload/import preserves genomes, identities, lineage, innovation registry, environment and reproducible continuation |
| v0.6.0 | 5. Ecological adaptation | Heritable morphology, predation, foraging, social strategies and resource specialisation | Multiple viable strategies emerge within the same boid species |
| v0.7.0 | 6. Evolutionary analytics | Allele frequencies, genotype diversity, expression profiles, selection differentials, mutation and lineage histories | Observatory explains why populations changed, not just that averages changed |

## Phase 1 — v0.2.0: The DNA Update

### Scope
- Preserve the existing ten-locus trait genome and sparse neural connection genome.
- Define a canonical trait schema with stable indices and bounds.
- Make kin affinity a continuous expression multiplier rather than a binary gate.
- Apply individual sensory range to flock perception, threat/prey detection and food detection.
- Keep exploration expressed through wandering-noise amplitude and food-attraction trade-off.
- Keep expression bounded and deterministic for a given genome and simulation random stream.
- Add automated tests for schema, bounds and expression functions.

### Acceptance checklist
- [x] Ten trait loci have stable names, indices and bounds.
- [x] Kin affinity continuously scales pedigree-relatedness protection.
- [x] Sensory range scales local flock perception and food detection.
- [x] Exploration affects wandering noise and food attraction.
- [x] Spatial grid covers the maximum supported sensory radius.
- [x] Expression helpers have automated boundary tests.
- [ ] Browser smoke test at 10, 200, 500 and 1,000 agents.
- [ ] Benchmark confirms no material regression at 1,000 agents.

The existing snapshot/restore system is already covered by worker determinism tests; Phase 4 is therefore a hardening and user-facing portability phase, not a ground-up persistence implementation.

Checkpoint tag target: v0.2.0-phase-1-gene-expression

## Phase 2 — v0.3.0: Regulatory genetics
- Add regulatory loci and expression graphs.
- Support additive and multiplicative gene interactions.
- Add thresholded expression and dominance-like inheritance; do not imply diploid Mendelian genetics until allele pairs exist.
- Test epistasis and environmental modulation independently.

## Phase 3 — v0.4.0: Evolving neural architecture
- Replace fixed connection-slot assumptions with stable node and connection records.
- Add structural mutation: add/delete node, add/delete connection, duplicate subnetwork and alter activation.
- Preserve innovation identity and homologous crossover.
- Validate endpoint integrity, reachability and execution budgets.
- Add complexity pressure to prevent unbounded network growth.

## Phase 4 — v0.5.0: Genetic persistence hardening
The current runtime already has versioned population snapshots (schema version 8), exportSnapshot/restoreSnapshot, genetic arrays, individual and parent IDs, pedigree, innovation registry, RNG state, and legacy schema-v3 migration coverage. This is existing functionality, not a future promise.
- Audit and document the complete snapshot contract, including environment state and all genetic arrays.
- Add user-facing genome and ecosystem export/import with integrity checks.
- Test deterministic continuation after restoration, not merely equality of the restored arrays.
- Define which transient neural activations and eligibility traces are restored versus reset.
- Expand schema migration tests and corruption handling.
- Distinguish configuration presets from complete ecosystem saves.

## Phase 5 — v0.6.0: Ecological adaptation
- Build heritable morphology from gene combinations.
- Add strategy trade-offs for predation, foraging, sociality, risk and resource use.
- Keep predators as behaviours within the single boid population, never a separate predator species.
- Measure strategy fitness across environmental conditions.
- Derive ecological clusters from phenotype/genotype rather than hard-coded species labels.

## Phase 6 — v0.7.0: Evolutionary analytics
- Track per-locus distributions and allele-frequency analogues.
- Track genotype distance, topology diversity and expressed phenotype distributions.
- Attribute selection differentials to survival and reproductive success.
- Record mutation and inheritance events with lineage references.
- Add cohort comparisons and explainable Observatory drill-downs.

## Engineering rules
1. Each phase starts from the last accepted checkpoint.
2. Preserve existing simulation behaviour unless a phase explicitly changes it.
3. Benchmark before and after performance-sensitive changes.
4. Keep genetic data separate from transient neural activations and UI settings.
5. Never claim persistence, speciation, architectural evolution or selection mechanisms that runtime code does not implement.
6. Do not merge release branches into production without explicit user approval.
