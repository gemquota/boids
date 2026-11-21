# Boids Core

The core is the product, not a host for every experiment.

## Responsibilities

- Agent position, velocity, and bounded local perception.
- Separation, alignment, cohesion, and world-boundary behaviour.
- A deterministic simulation lifecycle where practical.
- Basic agent creation and removal.
- Rendering and user controls that remain responsive under load.

## Non-responsibilities

No genome interpretation, neural-network construction, lineage graph, plant growth, hydrology, trophic ecology, laboratory UI, or experimental parameter registry belongs in the core runtime.

## Stability contract

- Runs standalone with no optional modules present.
- A baseline agent always exists and can move.
- Optional systems are accessed only through explicit adapters.
- Extension errors are contained and reported; they cannot stop the simulation loop.
- Keep the public core API small and versioned.

The root `index.html` is the current minimal browser implementation. It intentionally has no build chain or external dependencies.
