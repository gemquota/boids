# Boids feature parity inventory

This is the fixed denominator for parity reporting against the archived implementation in `.old/`. Rows are broad capability groups. Do not add, remove, split, merge or reweight rows during a milestone.

## Scoring

- **0 absent:** no meaningful implementation.
- **0.5 partial:** a meaningful subset exists, but the archived capability is materially incomplete.
- **1 implemented and verified:** the complete capability is implemented and supported by behavioural evidence.

Implementation and verification are separate. Source code, a passing build, a visible control or a READY deployment is not by itself proof of behaviour. Simulation features need automated/reproducible tests; UI/rendering features also need visual inspection. Deployment evidence must identify the deployed commit.

| ID | Legacy capability | Area | Status | Evidence / remaining work |
|---|---|---|---:|---|
| C01 | Population simulation and local flocking | Core | 0.5 | Present in `core/simulation.js`; needs robust lifecycle and boundary tests |
| C02 | Deterministic seeds and reproducible runs | Core | 0.5 | Seeded RNG exists; complete snapshot/restore verification pending |
| C03 | Energy, hunger, ageing and mortality | Core | 0.5 | Energy/age mortality exists; hunger/needs model incomplete |
| C04 | Reproduction and inherited traits | Core | 0.5 | Two-parent inheritance and selection exist; full reproductive ecology remains incomplete |
| C05 | Physical collisions and damped bounce | Behaviour | 0.5 | Collision solver exists in the evolutionary implementation; long-run stability and interaction coverage need verification |
| C06 | Predator/prey and trophic behaviour | Ecology | 0.5 | Grazing exists; predation/trophic dynamics incomplete |
| C07 | Temperature, moisture and nutrient gradients | Ecology | 0.5 | Seeded fields exist; ecological response is basic |
| C08 | Habitat suitability, refugia and fragmentation | Ecology | 0 | Not implemented |
| C09 | Resource depletion and regeneration | Ecology | 0.5 | Plant biomass regrows and is grazed; spatial resource model incomplete |
| C10 | Plant morphology and developmental growth | Organisms | 0.5 | Centipede growth and morphology systems exist; full legacy plant morphogenesis is separate and incomplete |
| C11 | Plant morph variants and branching inheritance | Organisms | 0.5 | Plant/organism morphology inheritance exists in part; full legacy plant morph variants need audit |
| G01 | Variable-length genetic representation | Genetics | 0.5 | Hex chromosomes encode typed trait, node and connection genes; general phenotype expression remains incomplete |
| G02 | Mutation and recombination | Genetics | 0.5 | Trait mutation, chromosome mutation and recombination are tested |
| G03 | Heritable traits and phenotype expression | Genetics | 0.5 | Trait and morphology inheritance exist; general expression pipeline remains incomplete |
| G04 | Neural network evolution | Genetics | 0.5 | Inherited variable-topology networks influence steering; broader behaviour and sensory integration remain |
| G05 | Speciation and innovation protection | Genetics | 0.5 | Phenotype-aware speciation and innovation ledger exist; complete fitness sharing/elitism remains |
| G06 | Regulatory inheritance and gene expression | Genetics | 0 | Not implemented |
| G07 | Pedigree, kinship and inbreeding | Genetics | 0 | Not implemented |
| G08 | Population allele/diversity telemetry | Analysis | 0.5 | Trait distributions/variance, neural complexity and lineage summaries; allele-frequency analysis pending |
| G09 | Selection models | Genetics | 0.5 | Natural, environmental and neutral models selectable; other models remain experiment primitives |
| U01 | Field, DNA and Observatory panels | UI | 0.5 | Panels exist; deeper views and visual verification pending |
| U02 | Live simulation controls and overlays | UI | 0.5 | Controls and overlays exist; full interaction audit pending |
| U03 | Camera pan, pinch zoom and organism inspection | UI | 0.5 | Implemented in app; manual desktop/touch verification pending |
| U04 | Population, needs, trophic and event telemetry | UI | 0.5 | Basic metrics exist; broader needs, trophic and event telemetry pending |
| L01 | Snapshot export/import and replay | Labs | 0.5 | JSON export exists; validated import and replay pending |
| L02 | Independent experiments and replicates | Labs | 0 | Not implemented |
| L03 | Evolutionary Observatory visualisations | Labs | 0.5 | Basic metrics; historical charts/comparisons pending |
| L04 | Experiment comparison and research exports | Labs | 0.5 | Read-only population, lineage and snapshot comparison APIs; experiment runner remains |
| L05 | Trait history and lineage exploration | Labs | 0.5 | Trait history and lineage summaries exist; interactive lineage exploration remains |

**Fixed denominator: 29 capabilities.** Score = sum of row points / 29. Partial rows contribute 0.5. Full rows contribute 1 only when verified. The 50% milestone requires at least 14.5 points and evidence for every full-credit row. Report the category breakdown alongside the total.

## Verification record

No row is awarded full credit in this baseline. Existing tests cover portions of Core, genetics, neural evolution, speciation, selection and analysis. They do not establish full legacy parity or visual correctness. For each future status change, record:
- test name/command and passing commit;
- manual reproduction steps for non-automatable behaviour;
- browser/device and observed result for UI/rendering;
- deployment URL and exact deployed commit when applicable.

Downgrade a row if a regression invalidates its evidence.

## Inventory provenance

The inventory is based on the archived systems, including `.old/boids-worker.js`, `.old/physics.js`, `.old/genetics.js`, `.old/chromosome.js`, `.old/evolution.js`, `.old/development.js`, `.old/ecology.js`, `.old/hydrology.js`, `.old/cosmology.js`, `.old/organism-economics.js`, `.old/plant-structures.js`, `.old/config-schema.js`, `.old/config-registry.js`, `.old/index.html`, `.old/plant-lab.html`, `.old/vision-lab.html`, `.old/emergence-lab.html`, `.old/abiogenesis.js` and `.old/emergence-pipeline.js`.

The denominator intentionally groups related controls and behaviours into meaningful capability areas. The roadmap may contain finer-grained tasks, but those tasks do not independently inflate parity.
