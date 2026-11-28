# Boids feature parity inventory

This inventory is the fixed denominator for parity reporting. Rows are not added or removed to improve a percentage. Statuses describe the reboot implementation, not the archived application.

Scoring: **0 absent**, **0.5 partial**, **1 implemented and verified**. Implementation and verification are recorded separately. A feature is not fully scored until its behaviour has automated or documented manual evidence.

| ID | Legacy capability | Area | Status | Evidence / remaining work |
|---|---|---|---:|---|
| C01 | Population simulation and local flocking | Core | 0.5 | Present in `core/simulation.js`; needs robust lifecycle and boundary tests |
| C02 | Deterministic seeds and reproducible runs | Core | 0.5 | Seeded RNG exists; complete snapshot/restore verification pending |
| C03 | Energy, hunger, ageing and mortality | Core | 0.5 | Energy/age mortality exists; hunger/needs model incomplete |
| C04 | Reproduction and inherited traits | Core | 0.5 | Selection-weighted parent choice is integrated; detailed survival/needs selection remains incomplete |
| C05 | Physical collisions and damped bounce | Behaviour | 0 | Not implemented |
| C06 | Predator/prey and trophic behaviour | Ecology | 0.5 | Grazing exists; predation/trophic dynamics incomplete |
| C07 | Temperature, moisture and nutrient gradients | Ecology | 0.5 | Seeded fields exist; ecological response is basic |
| C08 | Habitat suitability, refugia and fragmentation | Ecology | 0 | Not implemented |
| C09 | Resource depletion and regeneration | Ecology | 0.5 | Plant biomass regrows and is grazed; spatial resource model incomplete |
| C10 | Plant morphology and developmental growth | Organisms | 0 | Not implemented |
| C11 | Plant morph variants and branching inheritance | Organisms | 0 | Not implemented |
| G01 | Variable-length genetic representation | Genetics | 0.5 | Hex chromosomes encode typed trait, node and connection genes; general phenotype expression remains incomplete |
| G02 | Mutation and recombination | Genetics | 0.5 | Trait mutation, record-safe chromosome mutation and recombination are tested |
| G03 | Heritable traits and phenotype expression | Genetics | 0.5 | Trait inheritance exists; general expression pipeline pending |
| G04 | Neural network evolution | Genetics | 0.5 | Inherited neural networks influence steering; topology mutation, crossover and innovation homology are tested |
| G05 | Speciation and innovation protection | Genetics | 0.5 | Default phenotype-aware speciation and a species-adjusted fitness primitive exist; fitness sharing is not yet applied to parent selection |
| G06 | Regulatory inheritance and gene expression | Genetics | 0 | Not implemented |
| G07 | Pedigree, kinship and inbreeding | Genetics | 0 | Not implemented |
| G08 | Population allele/diversity telemetry | Analysis | 0.5 | Trait distributions/variance, neural complexity and lineage summaries; allele-frequency analysis pending |
| G09 | Selection models | Genetics | 0.5 | Natural, environmental and neutral models are selectable in Field controls and affect parent choice; other models remain experiment primitives |
| U01 | Field, DNA and Observatory panels | UI | 0.5 | Panels exist; deeper views pending |
| U02 | Live simulation controls and overlays | UI | 0.5 | Controls and overlays exist; verification pending |
| U03 | Camera pan, pinch zoom and organism inspection | UI | 0.5 | Implemented in current app; manual device verification pending |
| U04 | Population, needs, trophic and event telemetry | UI | 0.5 | Basic population/energy counters; broader telemetry pending |
| L01 | Snapshot export/import and replay | Labs | 0.5 | JSON export exists; validated import and replay pending |
| L02 | Independent experiments and replicates | Labs | 0 | Not implemented |
| L03 | Evolutionary Observatory visualisations | Labs | 0.5 | Basic metrics; historical charts/comparisons pending |
| L04 | Experiment comparison and research exports | Labs | 0.5 | Read-only population, lineage and snapshot comparison APIs; no experiment runner yet |
| L05 | Trait history and lineage exploration | Labs | 0 | Not implemented |

**Current weighted snapshot:** 21 partial rows at 0.5 credit, 8 absent rows, 29 total: `(21 × 0.5) / 29 = 36.2%`. This is implementation-credit arithmetic, not a claim that 36.2% of the old application has been visually reproduced. No row currently receives full 1.0 credit; manual UI verification and several deeper behaviours remain outstanding.

## Verification ledger

The status column is implementation credit, not a verification badge.

- A **partial** row earns 0.5 only for the meaningful subset described in its evidence cell.
- A **full** row earns 1.0 only after the complete capability is demonstrated and its evidence is recorded here.
- Automated test evidence must identify the test or command and the commit on which it passed.
- UI/rendering evidence must identify the browser/device and the inspected behaviour. A successful build or deployment is not visual verification.
- Deployment evidence must identify the exact deployed commit and URL.
- If evidence becomes invalid after a regression, downgrade the row until repaired.

No full-credit row is currently recorded. Do not infer that every partial row has passed an end-to-end test. The PR's reported regression-suite result is separate from manual UI verification.

## Inventory provenance and scope

The 29 capabilities are grouped comparisons against the archived application's actual systems, not a count of source files. The archive contains, among other components:

- Simulation and physical behaviour: `.old/boids-worker.js`, `.old/physics.js`, `.old/abiogenesis-worker.js`.
- Genetics and evolution: `.old/genetics.js`, `.old/chromosome.js`, `.old/evolution.js`, `.old/development.js`.
- Ecology and world systems: `.old/ecology.js`, `.old/hydrology.js`, `.old/cosmology.js`, `.old/organism-economics.js`.
- Plants: `.old/plant-structures.js`, `.old/plant-lab.html`, `.old/PLANT-LAB-ROADMAP.md`.
- User interface and experiments: `.old/index.html`, `.old/vision-lab.html`, `.old/vision-minimal.html`, `.old/emergence-lab.html`, `.old/emergence.js`, `.old/emergence-pipeline.js`, `.old/abiogenesis.js`.
- Configuration and regression coverage: `.old/config-schema.js`, `.old/config-registry.js`, `.old/tests/`.

The denominator is deliberately a set of broad capability groups rather than every individual control or parameter. The roadmap tracks finer-grained future work. Do not split a parity row mid-milestone to manufacture progress; a future versioned inventory can do so after the 50% milestone.

**Scoring policy:** report the sum of row scores divided by the fixed row count, alongside implementation/verification caveats. Do not translate source-code volume, planned work, or unverified UI claims into parity.
