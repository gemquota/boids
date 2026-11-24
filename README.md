# Boids

A small, independently runnable emergent-life simulation.

The repository is organised around three separate foci. They are deliberately not a dependency chain.

## Three foci

- **[Boids Core](core/README.md)** — movement, local interaction, reproduction-ready agent state, and a stable simulation loop. Core must run without any organism extension or laboratory.
- **[Organism Systems](organisms/README.md)** — optional, versioned organism definitions and extensions: genetics, neural traits, lineage, morphology, plant development, and ecology.
- **[Laboratories](labs/README.md)** — isolated experimental clients that work with imported/exported organism definitions and snapshots. Labs must not own or mutate the core runtime.

## Run

Open [index.html](index.html) in a modern browser. No build step, package manager, network request, or external dependency is required.

## Current reboot feature set

- 500-agent seeded starting field, adjustable population and live flocking parameters
- 64-segment centipede growth governed by nutrition, physical condition, inherited growth efficiency, metabolism and developmental age
- Three-stage inherited morphology trees with 216 evolved branch/form combinations and lazy-loaded segment artwork
- separation, alignment, cohesion, toroidal movement, energy use, ageing, and bounded population growth
- two-parent trait inheritance with mutation and selection-weighted parent choice
- 36-input evolved neural networks driven by ray-cast vision, private target memory and predicted unsensed positions
- collision-based predation, injury, flight, defensive clashes, carcass attachment, dissolution and mass growth
- expanded combat and reproductive genes with phenotype-linked size, speed, attack, defence and metabolic trade-offs
- independently inherited plant chromosomes with regulatory genes, branching morphogenesis and drifting spores
- five selectable biome presets with coastline, winding river, tributaries, billabongs, latitude, seasonal climate and day/night lighting
- trophic plant foraging and spatially indexed sensory perception
- historical Observatory trend lines, periodic averages, combat telemetry and flora/fauna phenotype history
- species clustering with persistent representatives
- hexadecimal typed chromosome encoding and neural innovation tracking
- configurable natural, environmental and neutral selection models
- read-only population, trait-variance and lineage analysis
- seeded temperature/moisture/nutrient habitat fields and renewable plant biomass
- grazing energy transfer and habitat stress
- live Field, DNA, and Observatory panels
- vegetation, habitat, and movement-vector overlays
- drag pan, pinch/wheel zoom, organism inspection, pause/reset, and JSON world export

The reboot is being rebuilt in visible, independently testable increments. The legacy archive remains untouched. The current preview exposes live field controls, camera gestures, overlays, individual organism inspection, and portable world snapshots.

## Architecture rules

1. Core has no imports from `organisms/` or `labs/`.
2. Extensions communicate through versioned data contracts, never shared mutable runtime objects.
3. A missing or invalid extension degrades to baseline behaviour. It must never blank or freeze the world.
4. Every lab is independently runnable and may be discarded without affecting Core.
5. New complexity earns its place through tests and observable behaviour, not parameter count.

## Archive

The complete tracked repository tree at the reboot point is preserved under [`.old/`](.old/). Git history and existing branches are also retained. The archive is a snapshot, not an active source directory.
