# Abiogenesis and hierarchical biological organisation

## Purpose

This model extends BOIDS downward from organismal evolution into physical and chemical organisation. It must preserve continuity: molecules, compartments, cells, colonies and organisms are assemblies of persistent constituents, not unrelated entity types that replace one another.

The implementation is deliberately split between **physical mechanisms** and **emergent capabilities**. A stage label never grants a bundle of biological functions.

## Conceptual progression

Aggregation → Bonding → Molecular Formation → Chemical Reactions → Polymerisation → Autocatalytic Networks → Lipid Assembly → Protocells → Molecular Replication → Cellular Reproduction → Fusion and Adhesion → Colonial Organisation → Differentiation → Anatomical Development → Multicellular Evolution.

This is a conceptual map, not a rigid execution pipeline. Chemical reactions, lipid assembly, replication and compartment formation can develop along different paths. Capabilities can be partial, independent, lost, or emerge in alternative orders.

## Capability graph

The code represents prerequisites as a dependency graph. Observed capabilities are explicit facts; the graph only enables an observed capability when its prerequisites are satisfied. Prerequisites never manufacture downstream capabilities by themselves. The graph is intentionally conservative and is not a claim that abiogenesis followed one known historical sequence. In particular, protocellular compartments do not imply metabolism or replication, and fusion is independent of adhesion.

## Physical and chemical primitives

- Particles retain stable IDs, elemental identity, mass, radius, charge, valence, thermal energy, position and velocity.
- Bonds are explicit dynamic connections with type, strength, elasticity, damping, rest length and energy. Valence and duplicate constraints are checked when forming bonds.
- Molecules retain constituent particles and explicit bond topology. Composition is derived from atoms, never separately asserted.
- Reactions consume and produce typed quantities according to stoichiometry, can require catalysts and account for energy availability.
- Polymers retain ordered monomer identity and explicit links.
- Autocatalytic closure reports reachable products and whether the reaction set contains a regenerative loop. Reachability alone is not proof of a self-sustaining metabolism.
- Lipid compartments retain their contents and membrane properties. Metabolism and replication remain independent capabilities.

## Current implementation boundary

`abiogenesis.js` is a pure, testable model layer. It does not yet replace the existing worker's organism update loop or claim to simulate atomistic chemistry at a calibrated physical scale. The next integration work must add spatially indexed collision candidates, thermal motion, force/energy accounting, bond kinetics, reaction scheduling, persistence and diagnostics before enabling these mechanisms in the live world.

## Non-negotiable invariants

1. Constituents retain identity when grouped into higher-order structures.
2. Bonds can form, deform, break and transfer forces; they are not decorative lines.
3. Molecular composition and connectivity are derived from constituents.
4. Compartments do not automatically possess metabolism, replication or reproduction.
5. Fusion, adhesion and horizontal transfer remain distinct processes.
6. Higher-level anatomy is physically instantiated and developmentally constructed.
7. Capability prerequisites form a graph, not a single hard-coded stage counter.
8. Every stateful addition requires snapshot migration, deterministic replay tests and observable telemetry.

## Worker interface

The existing worker exposes an isolated abiogenesis channel alongside the organism simulation:

- `{type:'abiogenesis:init', seed, particles, bonds}` creates the particle world.
- `{type:'abiogenesis:step', steps, dt, options, includeWorld}` advances up to 240 fixed substeps (each (0 < dt \le 0.05)) and returns telemetry; set `includeWorld:true` to include a full state snapshot.
- `{type:'abiogenesis:snapshot', requestId}` returns serialisable particle/bond state plus the deterministic random-generator state.
- `{type:'abiogenesis:restore', world, randomState}` restores both simulation state and random stream.

This is an opt-in worker API. The standalone [Abiogenesis Lab](../abiogenesis-lab.html) provides a visual test surface. It intentionally does not apply atom-scale forces to existing organism boids.
