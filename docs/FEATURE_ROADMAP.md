# Boids Feature Roadmap

This document is the strategic plan for the reboot. It is intentionally separate from [FEATURE_PARITY.md](./FEATURE_PARITY.md), which is the fixed, evidence-based inventory of capabilities from the archived application.

## Product architecture

Boids is organised around three independently useful areas:

1. **Boids Core** — deterministic, independently runnable simulation runtime. It owns time-stepping, spatial interactions, world state, population lifecycle and serialisable snapshots.
2. **Organism Systems** — optional, versioned systems for genetics, morphology, neural control, lineage, plants and ecology. Core must remain usable if these systems are absent or fail.
3. **Laboratories** — isolated experimental clients that consume versioned organism definitions and snapshots. Labs must not mutate the live core runtime or introduce dependencies from Core back into optional systems.

The longer-term Organoids direction explores increasingly fundamental emergent organisation. It is not a reason to prematurely complicate the current simulator.

## Delivery principles

- Preserve a small, stable, independently runnable Core.
- Use explicit serialisable contracts between Core, Organism Systems and Labs.
- Treat optional systems as adapters or consumers, never hidden prerequisites.
- Keep deterministic seeds and reproducible experiment inputs.
- Every capability needs behavioural tests; visual capabilities also need visual inspection.
- Distinguish implemented, tested, visually inspected and deployed states.
- Avoid replacing working behaviour with speculative architecture.
- Keep the legacy archive immutable; new work belongs in the rebooted source tree.

## Roadmap

### R0 — Reboot foundation
- [x] Archive the legacy repository under `.old/`.
- [x] Establish Core / Organism Systems / Labs boundaries.
- [x] Create a standalone browser simulation.
- [x] Establish deterministic seeding and serialisable world snapshots.
- [x] Add a basic regression suite and preview deployment.

### R1 — Stable functional ecosystem
- [ ] Establish reliable simulation lifecycle: start, pause, resume, reset and reseed.
- [ ] Validate population bounds, births, deaths and resource feedback over long runs.
- [ ] Validate every live parameter control and its effect on simulation state.
- [ ] Validate pan, zoom, selection and overlays on desktop and touch screens.
- [ ] Add robust organism inspection and useful telemetry.
- [ ] Establish reproducible snapshot import/export and compatibility checks.
- [ ] Add performance baselines at representative population sizes.
- [ ] Obtain visual verification of the deployed application.

### R2 — Legacy parity milestone: 50%
- [ ] Complete the fixed parity inventory in `FEATURE_PARITY.md` to at least 50% weighted completion.
- [ ] Restore the most important organism, ecology, plant and interaction capabilities.
- [ ] Add evidence for every item counted as implemented.
- [ ] Require tests for simulation behaviour and visual inspection for UI/rendering behaviour.
- [ ] Do not change the inventory denominator during the milestone.

### R3 — Organism individuality and evolution
- [ ] Expand inherited phenotype: size, speed, turning, perception, metabolism and morphology.
- [ ] Implement robust mutation and recombination with bounded, testable inheritance.
- [ ] Track lineage, pedigree, relatedness and population genetic diversity.
- [ ] Implement selection, fitness evaluation and population-level evolutionary telemetry.
- [ ] Add regulatory genetics and gene expression.
- [ ] Add NEAT-style variable topology, recurrent networks, innovation tracking and structural mutation.
- [ ] Add speciation, fitness sharing, champion preservation and elitism.
- [ ] Make neural and genetic systems independently testable and optional.

### R4 — Ecology and landscape
- [ ] Build coherent temperature, moisture, nutrient and habitat fields.
- [ ] Implement resource depletion, regeneration, carrying capacity and environmental stress.
- [ ] Add fragmentation, refugia, disturbance and habitat succession.
- [ ] Develop terrain elevation, rainfall, watersheds, groundwater and floodplains.
- [ ] Generate river networks, tributaries, seasonal waterways and coastal/tidal zones.
- [ ] Model salinity, latitude and other environmental influences on organisms and plants.
- [ ] Add ecosystem-level population and resource telemetry.

### R5 — Plant systems
- [ ] Establish spore, seedling, growth, reproduction and senescence lifecycle.
- [ ] Support inherited plant morphology and environmental plasticity.
- [ ] Implement riparian, standard and long-connector growth strategies.
- [ ] Model node size, branching, growth rate, resource uptake and consumption damage.
- [ ] Add salt-related defences, coastal adaptations and mangrove forms.
- [ ] Provide a stable Plant Lab backed by versioned plant definitions and snapshots.

### R6 — Laboratories
- [ ] Evolution Lab: controlled genetics, selection, mutation and speciation experiments.
- [ ] Neural Lab: network topology, activation, sensory input and behaviour inspection.
- [ ] Vision Lab: raycasting, field of view, sensory costs and perception experiments.
- [ ] Plant Lab: morphogenesis, growth, inheritance and environmental response.
- [ ] Ecology Lab: habitat, resource, disturbance and population experiments.
- [ ] Observatory: population history, diversity, lineage, traits and ecosystem trends.
- [ ] Labs exchange versioned data and cannot directly mutate a running Core instance.

### R7 — Experimental infrastructure
- [ ] Independent simulation instances and reproducible replicates.
- [ ] Experiment manifests with seeds, parameters and versioned definitions.
- [ ] Checkpointing, replay and time-series recording.
- [ ] Side-by-side experiment comparison and statistical summaries.
- [ ] Batch/headless execution and machine-readable export.
- [ ] Persistent experiment catalogue with explicit schema migrations.

### R8 — Organoids research direction
This is a research direction, not a prerequisite for the preceding milestones.

- [ ] Particle-level interactions and physical properties.
- [ ] Charge, thermal behaviour and molecular interaction rules.
- [ ] Bond formation, bond breaking and molecular assembly.
- [ ] Macromolecules and autocatalytic reaction networks.
- [ ] Membranes, compartments and protocell-like structures.
- [ ] Metabolic networks, reproduction and heredity.
- [ ] Emergent cellular, colonial and multicellular organisation.
- [ ] Multiple competing pathways to persistent self-organisation.

The objective is emergent organisation from local rules, not a hard-coded generator that labels prebuilt structures as life.

## Milestone acceptance

A milestone is complete only when:
1. Its capabilities are implemented in the intended architectural layer.
2. Automated tests cover relevant deterministic and state-transition behaviour.
3. User-facing controls and displays are manually inspected where applicable.
4. The deployed build corresponds to the claimed commit.
5. Known limitations are recorded rather than hidden behind a percentage.

The parity ledger is authoritative for legacy parity. This roadmap is authoritative for sequencing and future direction.
