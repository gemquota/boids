# Boids Core

The core is the product, not a host for every experiment.

## Responsibilities

- Agent position, velocity, local perception and flocking.
- Deterministic simulation lifecycle, resource-independent energy and ageing.
- Agent creation, movement, mortality and bounded reproduction.
- Narrow optional callbacks for behavioural steering, parent selection and inherited data.
- Serialisable snapshots and a stable standalone browser entry point.

## Non-responsibilities

Core does not import or interpret genomes, neural networks, species, selection models, lineage graphs, plant growth, hydrology or laboratory analysis. It only accepts plain callback results at explicit boundaries.

## Stability contract

- Runs without any organism module or laboratory.
- A baseline agent always exists and can move.
- Extension callbacks are optional; absent callbacks retain baseline behaviour.
- Extension failures must be contained by the host adapter and cannot become Core imports.
- Keep the public API small, deterministic where practical and versioned.
