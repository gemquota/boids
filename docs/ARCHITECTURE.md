# Architecture and runtime data flow

## Runtime boundaries

BOIDS is a static browser application. `index.html` owns presentation, browser storage, user interaction, and worker messaging. `boids-worker.js` owns the live simulation and is the authority for population state. The worker imports the shared model modules; it does not ask the DOM to run simulation logic.

| Module | Contract |
|---|---|
| `index.html` | Drawers, controls, charts, browser lifecycle, IndexedDB persistence, export downloads |
| `boids-worker.js` | Fixed-step orchestration, movement, spatial queries, plant/freshwater ecology, reproduction, selection, live telemetry, snapshot migration |
| `evolution.js` | Pure genome validation/mutation/crossover/compilation, speciation, regulation/statistics, experiment-analysis primitives |
| `genetics.js` | Ten quantitative loci, expression curves, environmental modulation, inheritance helpers |
| `chromosome.js` | Typed hexadecimal gene-record encoding/decoding |
| `config-schema.js` | Authoritative control schema, field-guide content and dependency rules |
| `config-registry.js` | DOM range-control registry and value normalization |

## Simulation step

1. The worker advances a fixed simulation clock with bounded catch-up.
2. It snapshots the movement state used by neighbourhood queries.
3. A seeded RNG and shuffled update order remove fixed array-index priority.
4. The spatial index supplies local neighbours and environmental queries.
5. Each agent evaluates its expressed traits and inherited neural controller.
6. Movement, feeding, attack proposals, hydration and energetic costs are evaluated.
7. Resource claims and attacks are resolved consistently after proposal collection.
8. Reproduction and inheritance update population state.
9. Sampled telemetry is posted to the UI; history is throttled rather than rebuilt every render frame.

## Genome and phenotype layers

Keep these layers distinct:

- **Inherited genotype:** ten quantitative trait loci, regulatory modifiers, and variable-length neural node/connection genes.
- **Expressed phenotype:** bounded trait values derived from genotype, expression settings and environmental signals.
- **Lifetime learning:** per-agent learned-weight overlays and recurrent activation state. Learning must not silently rewrite inherited connection genes.
- **Environment:** plant biomass, water/moisture proximity, season, shelter, currents, and world geometry.

The current worker uses variable-length genomes as the neural source of truth while retaining compatibility/projection arrays for legacy runtime consumers. Those projections are transitional and must not become a second independently mutable genome.

## Neural storage bounds and legacy projections

The variable-length `agentGenomes`, compiled networks and per-agent recurrent state are authoritative. The fixed-size typed arrays (`genome`, `connectionSource`, `connectionDestination`, `innovation`, `brainState` and `eligibility`) remain bounded legacy projections for compatibility, snapshots and older execution paths; they must not be treated as the evolved genome's maximum topology.

Current bounds are aligned:
- UI/configuration legacy connection slots: 4–64.
- Legacy hidden-neuron count: 2–24; the legacy scratch buffer has 40 entries for the 8 inputs, up to 24 hidden neurons and 8 outputs.
- Live NEAT mutation limits: 128 nodes and 512 connections.
- Compiled neural workspace: 128 values/state slots, matching the live node ceiling.
- The live per-agent genome, innovation map and recurrent state are variable-length structures.

Configuration schema tests enforce the legacy control bounds; evolution tests cover variable-length genes, graph validation, recurrent execution and structural mutation. Any increase to the node ceiling must update the compiled workspace and its tests in the same change.

## NEAT execution

Node genes have stable IDs, type, activation and bias. Connection genes have historical innovation IDs, source/destination IDs, weights, enabled state and recurrent metadata. The worker compiles sparse networks and retains recurrent state per agent. Mutation and crossover are delegated to `evolution.js`.

Speciation uses compatibility distance and representatives. The live selection layer tracks species age, best fitness, stagnation, shared fitness, integer offspring quotas and reproductive pressure. Mating prefers compatible members of the same species, with a fallback when no eligible mate is available.

## Ecology

There is one boid population. Predation is conspecific. Plants are the basal renewable resource; there are no active food-patch or separate predator populations. Plant spores, clonal growth, freshwater proximity, thirst, seasonality, reefs and shelter are worker-owned state.

## Persistence

The worker's world snapshot schema is **19**. It includes configuration, agent and ecological state, variable-length genomes, learned-weight overlays, recurrent state, regulatory loci, pedigree, innovation/species state, delayed-entry survival history, stable-ID entry ages, lifetime reproductive-success and parent-sex identity state, RNG and sampled histories where supported. The browser stores the worker snapshot with a separate `storageSchemaVersion: 2` field. The worker's `schemaVersion: 19` is never overwritten by the IndexedDB envelope version. Legacy records whose worker version was previously overwritten to 2 remain readable through worker migration defaults.

When adding persistent state:
1. add it to snapshot export;
2. restore it with safe defaults;
3. migrate older schemas without fabricating historical information;
4. add round-trip and deterministic-continuation tests;
5. document whether the state is inherited, transient, derived, or environmental.

## Performance constraints

The hot path must avoid per-agent/per-tick object allocation where practical. Use typed arrays, sparse compiled edges, reusable activation workspaces, throttled telemetry and spatial indexing. Benchmark changes at several population sizes. A passing syntax test says nothing about runtime cost.


See [snapshot schemas and migration behaviour](SNAPSHOT-MIGRATION.md) for the field-presence migration contract and the independent worker, IndexedDB and chromosome version domains.

See [Observatory telemetry and analysis exports](TELEMETRY-EXPORTS.md) for sampled metrics, retention limits and bundle contents.
