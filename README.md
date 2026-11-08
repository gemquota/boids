# BOIDS

A full-screen, agent-based flocking and evolutionary ecosystem simulation. The simulation is the interface: configuration slides down from the top, while population telemetry and genetic analysis slide up from the bottom.

## Live deployment

https://boids-gemquotas-projects.vercel.app

The repository is connected to Vercel. Merges or pushes to `main` trigger production deployment.

## Run locally

The project has no build step, package manager, or external runtime dependency. Serve the repository root over HTTP:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in a browser with **Web Workers** and **OffscreenCanvas** support. Do not rely on opening `index.html` through `file://`; browser worker security rules can block it.

## Interaction

- Swipe down from the top edge to open **Configuration**.
- Swipe up from the bottom edge to open the **Evolutionary Observatory**.
- Tap or drag in the field to repel or attract nearby boids. Switch the interaction mode in Configuration.
- Enable **Inspect brain**, close Configuration, open the Neural topology view, then tap a boid to inspect its inherited network.
- `H` opens Configuration, `I` opens the Observatory, `M` toggles repel/attract, `Space` pauses or resumes, and `Escape` closes a drawer.
- Click the small edge hint to open Configuration.
- Save, restore, or reset the control configuration from the Configuration drawer. Saved settings use browser-local storage.

## Simulation features

- Separation, alignment, cohesion, environmental currents, turbulence, obstacle avoidance, toroidal wrapping, and configurable behavioural profiles.
- Renewable food patches, food-seeking behaviour, energy budgets, metabolic costs, predators, juvenile vulnerability, and active predation.
- Configurable reproductive drive, mate search, genetic similarity/dissimilarity preference, reproductive age window, lifespan, fertility, gestation, and energy threshold.
- Per-agent sparse neural networks with eight sensory channels, configurable recurrent hidden neurons, eight behavioural outputs, and selectable input/output channels.
- Per-connection genome genes, crossover, mutation, lifetime reward-modulated plasticity, and lineage tracking.
- Genome-derived boid colours, gene-signature frequency history, connection-weight statistics, and neural topology analysis.
- Typed-array simulation state, a spatial hash for local-neighbour queries and predator targeting, cached genome colours, and worker-side Canvas2D rendering.
- Population controls up to 12,000 agents. Adaptive quality can lower the active population to protect frame rate while retaining the current population rather than reseeding it.

## Architecture and reference

- [Architecture and runtime model](docs/ARCHITECTURE.md)
- [Genetics, reproduction and neural networks](docs/GENETICS.md)
- [Configuration reference](docs/CONFIGURATION.md)
- [Validation, performance and known limitations](docs/VALIDATION.md)

## Important limitations

The simulation currently uses CPU computation in a Web Worker and Canvas2D rendering on an OffscreenCanvas. It is **not** a WebGPU/GPU-compute simulation. Performance depends heavily on device, browser, population, connection count, and environmental complexity.

Population history and evolutionary statistics are in-memory for the current run. Browser-local settings can be saved, but simulation state and historical samples are not persisted across reloads. A browser without OffscreenCanvas worker support receives an explanatory compatibility message; there is not yet a main-thread rendering fallback.
