# Organism Systems

Optional domain modules for richer simulated life. This directory is not imported by Boids Core.

## Planned modules

- **Genome / chromosome**: versioned sequence representation, mutation and recombination.
- **Phenotype**: explicit mapping from inherited data to expressed traits.
- **Neural systems**: bounded network structures and integer-indexed connections.
- **Lineage**: ancestry, descent, population histories and provenance.
- **Plant morphology**: growth stages, branching, modular structures and developmental rules.
- **Ecology**: resource exchange, competition, predation, reproduction and environmental response.

## Contract

Organism packages exchange serialisable, versioned definitions and snapshots. They do not retain references to live core agents. Core can ignore an unknown extension and continue with baseline agent behaviour.

Each subsystem needs its own tests, schema version, migration policy and a small adapter surface before integration.
