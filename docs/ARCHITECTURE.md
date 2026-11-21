# Reboot Architecture

## Three independent foci

`core/`, `organisms/` and `labs/` are peers. Only data contracts connect them.

```text
              versioned definitions / snapshots
     +--------------------+ <--------------------+
     |                    |                      |
+----v-----+        +-----+----------+      +----+-----+
| Boids    |        | Organism       |      | Labs     |
| Core     |        | Systems        |      |          |
+----------+        +----------------+      +----------+
     |                    ^                      |
     +---- baseline ------+---- validated -------+
```

## Dependency direction

- Core depends only on platform primitives and its own code.
- Organism packages may define adapters for Core, but Core never imports them.
- Labs may use Core and Organism packages through public contracts.
- Core passes frozen, detached organism views to extension callbacks, including position, velocity, energy, age, traits, genome and neural state. Adapters return plain inherited data. No extension receives a mutable live agent reference.
- Persistent definitions, snapshots and analysis exports are serialisable and versioned.

## Organism and environment systems

- `organisms/senses.js` performs spatially indexed raycasts and maintains per-organism, confidence-weighted motion estimates for targets that leave view. Neural controllers receive only these sensory channels, not the population array.
- `organisms/predation.js` resolves physical overlap, damped collision impulses, contact attacks, injury, escape, head-on defensive exchanges and carcass consumption after Core movement.
- `organisms/genetics.js` expresses combat, sensory, reproductive and body-plan traits into morphology and metabolic costs. Fast phenotypes trend smaller/lighter; attack increases anterior point length; defence increases body width.
- `organisms/plant_genetics.js` gives plants their own hexadecimal trait/regulatory chromosomes, expressed growth responses, branching structures and spore inheritance.
- `organisms/environment.js` supplies biome presets, a coastline, main watershed, tributaries, billabongs, latitude fields, seasonal temperature/rainfall and diurnal light.
- `labs/history.js` records bounded fauna/flora/climate telemetry for trend lines and periodic averages. Observatory history is read-only and cannot mutate the simulation.

## Failure containment

Unknown schema version: reject the payload, preserve the running world.
Missing organism extension: use baseline agent.
Lab exception: terminate the experiment, not the simulator.
Renderer exception: report diagnostics and retain a recoverable simulation state.

## Reboot sequence

1. Establish Core behaviour and smoke tests.
2. Freeze the snapshot/definition contract.
3. Port organism systems one at a time behind adapters.
4. Rebuild labs as clients of those contracts.
5. Add integration only after standalone behaviour is proven.
