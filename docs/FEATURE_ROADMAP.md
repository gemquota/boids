# Boids Feature Roadmap

Strategic sequencing lives here. The fixed legacy comparison lives in [FEATURE_PARITY.md](./FEATURE_PARITY.md). The roadmap may evolve; the parity denominator must not change during a milestone.

## Architecture

- **Boids Core:** small, stable, independently runnable simulation runtime. Owns time-stepping, spatial interactions, world state, population lifecycle and serialisable snapshots.
- **Organism Systems:** optional, versioned genetics, morphology, neural control, lineage, plant and ecology systems. Core must remain usable when these systems are absent or fail.
- **Laboratories:** isolated experimental clients consuming versioned organism definitions and snapshots. They must not mutate the live Core runtime or introduce reverse dependencies into Core.

The broader Organoids direction is a research trajectory, not a reason to overcomplicate the current simulator.

## Delivery rules

1. Preserve a stable, independently runnable Core.
2. Connect optional systems through explicit serialisable contracts/adapters.
3. Keep seeded experiments reproducible.
4. Require behavioural tests for simulation features and visual inspection for UI/rendering features.
5. Report implementation, automated verification, visual verification and deployment separately.
6. Never count planned work, source-code volume or a successful deployment as proof that a feature works.
7. Keep `.old/` immutable; new implementation belongs in the rebooted source tree.

## Roadmap

### R0 — Reboot foundation
- [x] Archive the legacy repository under `.old/`.
- [x] Establish Core / Organism Systems / Labs boundaries.
- [x] Create a standalone browser simulation.
- [x] Establish deterministic seeding and serialisable snapshots.
- [x] Add a regression suite and preview deployment.

### R1 — Stable functional ecosystem
- [ ] Establish reliable start, pause, resume, reset and reseed lifecycle.
- [ ] Validate population bounds, births, deaths and resource feedback over long runs.
- [ ] Verify every live parameter control changes the intended simulation state.
- [ ] Verify pan, zoom, selection and overlays on desktop and touch devices.
- [ ] Improve organism inspection and population/ecosystem telemetry.
- [ ] Add snapshot import, schema validation and round-trip tests.
- [ ] Establish performance baselines at representative population sizes.
- [ ] Visually inspect the deployed application.

### R2 — 50% legacy parity
- [ ] Reach at least 50% weighted implementation credit in `FEATURE_PARITY.md`.
- [ ] Restore high-value organism, ecology, plant and interaction capabilities.
- [ ] Attach evidence to every full-credit row.
- [ ] Require automated or reproducible behavioural tests; visual inspection for UI claims.
- [ ] Keep the 29-row denominator fixed until this milestone is completed.

### R3 — Organism individuality and evolution
- [ ] Expand inherited phenotype: size, speed, turning, perception, metabolism and morphology.
- [ ] Implement robust mutation, recombination and expression.
- [ ] Track lineage, pedigree, relatedness, inbreeding and genetic diversity.
- [ ] Implement selection, fitness evaluation and population-level evolutionary telemetry.
- [ ] Add regulatory inheritance and gene expression.
- [ ] Extend NEAT-style variable topology, recurrent networks and structural mutation.
- [ ] Complete innovation tracking, speciation, fitness sharing, champion preservation and elitism.
- [ ] Keep genetic and neural systems optional and independently testable.

### R4 — Ecology and landscape
- [ ] Develop coherent temperature, moisture, nutrient and habitat fields.
- [ ] Implement depletion, regeneration, carrying capacity and environmental stress.
- [ ] Add fragmentation, refugia, disturbance and succession.
- [ ] Develop elevation, rainfall, watersheds, groundwater and floodplains.
- [ ] Generate river networks, tributaries, seasonal waterways and coastal/tidal zones.
- [ ] Model salinity, latitude and environmental effects on organisms and plants.
- [ ] Add ecosystem-level population and resource telemetry.

### R5 — Plant systems
- [ ] Implement spore/seed, seedling, growth, reproduction and senescence lifecycle.
- [ ] Support inherited morphology and environmental plasticity.
- [ ] Implement riparian, standard and long-connector forms.
- [ ] Model node size, branching, growth rate, resource uptake and consumption damage.
- [ ] Add salt-related defences, coastal adaptations and mangrove forms.
- [ ] Deliver a stable Plant Lab backed by versioned plant definitions and snapshots.

### R6 — Laboratories
- [ ] Evolution Lab: genetics, selection, mutation and speciation experiments.
- [ ] Neural Lab: topology, activation, sensory input and behaviour inspection.
- [ ] Vision Lab: raycasting, field of view, sensory costs and perception experiments.
- [ ] Plant Lab: morphogenesis, growth, inheritance and environmental response.
- [ ] Ecology Lab: habitat, resource, disturbance and population experiments.
- [ ] Observatory: population history, diversity, lineage, traits and ecosystem trends.
- [ ] Enforce snapshot/definition contracts; labs cannot mutate a running Core instance.

### R7 — Experimental infrastructure
- [ ] Independent simulation instances and reproducible replicates.
- [ ] Experiment manifests with seeds, parameters and versioned definitions.
- [ ] Checkpointing, replay and time-series recording.
- [ ] Side-by-side experiment comparison and statistical summaries.
- [ ] Batch/headless execution and machine-readable export.
- [ ] Persistent experiment catalogue and explicit schema migrations.

### R8 — Organoids research direction
Research direction, not a prerequisite for the preceding milestones:

- [ ] Particle-level interactions and physical properties.
- [ ] Charge, thermal behaviour and molecular interaction rules.
- [ ] Bond formation, bond breaking and molecular assembly.
- [ ] Macromolecules and autocatalytic reaction networks.
- [ ] Membranes, compartments and protocell-like structures.
- [ ] Metabolic networks, reproduction and heredity.
- [ ] Emergent cellular, colonial and multicellular organisation.
- [ ] Multiple competing pathways to persistent self-organisation.

The objective is emergence from local rules, not a hard-coded generator that labels prebuilt structures as life.

## Milestone acceptance

A milestone is complete only when its capabilities are implemented in the intended architectural layer, relevant tests pass, user-facing behaviour is inspected, and the deployed build is tied to the claimed commit. Record limitations explicitly.

The parity ledger is authoritative for legacy parity. This document is authoritative for sequencing and future direction.
