# Laboratories

Laboratories are separate experimental applications, not privileged parts of the simulation runtime.

## Responsibilities

- Import and export versioned organism definitions.
- Run experiments in isolated state.
- Visualise development, morphology, genetics and ecological outcomes.
- Provide diagnostics and reproducible experiment snapshots.
- Validate outputs before offering them to the main simulation.

## Isolation rules

- A lab may consume Core snapshots but cannot mutate the live simulation.
- A lab may propose organism definitions; Core decides whether and how to load them.
- Lab crashes, rendering failures and invalid experiments must not affect Core.
- Each lab can be developed, tested, deployed and retired independently.

Plant Lab belongs here. It should become a client of the organism contracts, not a second owner of the world's runtime.
