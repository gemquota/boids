# Boids

A small, independently runnable emergent-life simulation.

The repository is organised around three separate foci. They are deliberately not a dependency chain.

## Three foci

- **[Boids Core](core/README.md)** — movement, local interaction, reproduction-ready agent state, and a stable simulation loop. Core must run without any organism extension or laboratory.
- **[Organism Systems](organisms/README.md)** — optional, versioned organism definitions and extensions: genetics, neural traits, lineage, morphology, plant development, and ecology.
- **[Laboratories](labs/README.md)** — isolated experimental clients that work with imported/exported organism definitions and snapshots. Labs must not own or mutate the core runtime.

## Run

Open [index.html](index.html) in a modern browser. No build step, package manager, network request, or external dependency is required.

## Architecture rules

1. Core has no imports from `organisms/` or `labs/`.
2. Extensions communicate through versioned data contracts, never shared mutable runtime objects.
3. A missing or invalid extension degrades to baseline behaviour. It must never blank or freeze the world.
4. Every lab is independently runnable and may be discarded without affecting Core.
5. New complexity earns its place through tests and observable behaviour, not parameter count.

## Archive

The complete tracked repository tree at the reboot point is preserved under [`.old/`](.old/). Git history and existing branches are also retained. The archive is a snapshot, not an active source directory.
