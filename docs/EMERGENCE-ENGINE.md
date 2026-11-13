# Unified emergence engine

`emergence.js` is the shared, dependency-free computational substrate for moving the existing Boids ecology toward recursive composition. It is imported by the simulation worker as `BoidsEmergence`; it does not create a second simulation or replace the current population/ecology implementation.

## Runtime API

`BoidsEmergence.createRuntime(options)` returns a composed runtime containing:

- `EntityStore`: stable IDs, typed properties, state, energy, parent/child composition, arbitrary links, and snapshot/restore.
- `SpatialIndex`: uniform-grid neighbourhood queries over any positioned entity.
- `FieldGrid`: named scalar fields with sampling, deposits and conservative diffusion.
- `InteractionEngine`: declarative type-pair attraction/repulsion laws.
- `ConstraintEngine`: reusable distance constraints for bonds and structural mechanics.
- `EnergyEngine`: explicit source, transfer, conversion and dissipation ledger.
- `GraphEngine`: relationship neighbourhoods, connected components and cycle detection.
- `RuleEngine`: declarative material transformations by type/property selectors, catalysts, conditions, rates and energy costs.
- `TopologyEngine`: recursive assembly, division and closed-structure queries.
- `Scheduler`: deterministic priority-ordered update phases.

## Declarative examples

```js
runtime.interactions.register({
  id:'binding', a:'particle', b:'particle',
  radius:18, strength:0.4, mode:'attract'
});

runtime.rules.register({
  id:'polymerise',
  inputs:['monomer','monomer'],
  outputs:[{type:'dimer'}],
  catalysts:['catalyst'],
  rate:0.08,
  energyCost:0.01
});
```

Entities can be nested without changing their underlying representation: particles compose into molecules, molecules into membranes and compartments, and compartments into larger organisms. Relationships remain explicit graph edges; composition is a separate parent/child relation.

## Migration boundary

The existing Boids worker remains authoritative for its current population, ecology, genetics, and persistence. The new substrate is loaded in that worker and tested independently. Subsequent migrations should move one mechanic at a time onto these shared engines, preserve deterministic seeded execution, and add snapshot migration tests whenever authoritative state changes. Do not mirror the live population into a second mutable entity store.

## Validation

Run:

```sh
node --check emergence.js
node --test tests/emergence.test.cjs
```

This first slice establishes executable shared infrastructure. It does not claim that the existing ecological hot path has already been fully migrated.
