# BOIDS // evolutionary field

A full-screen, browser-based flock and ecosystem simulation with inherited sparse neural brains, mutation, mate choice, gestation, resource pressure, predation, and live population analysis.

The simulation is deliberately split into a small UI shell and a dedicated worker:
- `index.html` owns the canvas element, vertically revealed configuration and observatory drawers, user interaction, saved settings, and telemetry charts.
- `boids-worker.js` owns simulation state, spatial indexing, neural evaluation, genetic inheritance, ecology, and Canvas2D rendering through an `OffscreenCanvas`.

No build step or package installation is required. Serve the repository root as static files. The population slider starts at 500, with a default configurable range of 10 to 1,000. World width and height are independently configurable relative to the viewport; the world is mapped back onto the visible canvas while retaining its larger or smaller logical simulation area. The worker is loaded relative to the page as `./boids-worker.js`.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000` in a modern browser that supports OffscreenCanvas and workers.

The simulation canvas is full-screen. Swipe down from the top edge to open configuration and swipe up from the bottom edge to open the Evolutionary Observatory. Keyboard shortcuts:
- `H`: configuration drawer
- `I`: observatory drawer
- `M`: toggle attract/repel interaction mode
- `Space`: pause/resume
- `Escape`: close drawers

Tap/drag the world to influence agents. Enable **Inspect brain** to select an agent and view its current connection graph.

## Simulation model

### Agents and local movement

Each boid has position, velocity, age, energy, sex, reproductive state, fitness estimate, lineage metadata, a neural hidden-state vector, and a sparse connection genome. Neighbour queries use a uniform spatial hash rebuilt per simulation step. Boids apply separation, alignment, cohesion, obstacle avoidance, environmental flow, food seeking, predator avoidance, and user interaction forces.

World boundaries can wrap or reflect. Behaviour profiles adjust the relative weights of schooling, dispersal, predator avoidance, or turbulent exploration.

### Neural architecture

The controller has eight sensory channels, a configurable hidden layer, and eight behavioral output channels. The sensory channels are:
1. local neighbour density
2. neighbour alignment
3. close-range separation pressure
4. predator threat
5. nearest-food proximity
6. mate proximity
7. current energy reserve
8. normalized age

The output channels control turn, acceleration, alignment, cohesion, separation, fleeing, mate seeking, and reproductive drive. Channel masks can disable inputs or outputs.

Each connection gene stores a directed source neuron, destination neuron, and signed weight. Hidden-to-hidden connections use recurrent state carried between neural evaluations. The connection count and hidden-neuron count are configurable. Changing hidden/connection counts remaps and preserves the overlapping portion of existing genomes and brain state; newly added connections are randomized.

Plasticity uses a reward-modulated eligibility trace on connection weights. Reward is currently a local heuristic derived from recent energy change, feeding, and threat, not an externally validated reinforcement-learning objective. Plasticity is bounded and should be treated as an experimental learning rule.

### Genetics and reproduction

Initial connection genomes are randomized. A successful conception stores the prospective father's connection genome and lineage on the gestating mother. At delivery, each offspring receives per-gene parental crossover, optional parental weight blending, mutation of connection endpoints or weights, randomized sex, and a new lineage depth.

Mutation controls configure per-gene mutation probability and magnitude. Mate preference ranges from preference for similar genomes to preference for dissimilar genomes. Mate candidate sampling is configurable.

Reproductive drive, earliest/latest reproductive ages, maximum lifespan, gestation duration, energy threshold, and offspring count are independently configurable. The simulation uses a simplified two-sex mating/reproduction model. It is not a full biological gamete, developmental, population-genetics, or ecological model.

### Ecology and selection

Food patches have finite stock and gradual regeneration. Agents consume food when inside patch range; food attraction biases movement toward the nearest patch. Energy changes with feeding, metabolic cost, starvation pressure, environmental harshness, and local crowding.

Predators search nearby spatial cells for prey and can cause mortality within strike range. Juvenile vulnerability is configurable. Survival pressure also includes age-related mortality and a fitness-weighted stochastic component.

These are intentionally simplified ecological mechanics. Parameters are qualitative controls, not calibrated physical or biological units.

## Controls

The top configuration drawer groups controls into Motion, Neural brain, Genetics, Reproduction, Selection, and Environment. Every range slider has editable MIN and MAX endpoint labels: press and hold an endpoint for about 550 ms to edit that limit. The original bounds and customized bounds are saved in browser local storage and restored automatically on later visits. Use **Reset slider limits** to restore the original range for every slider. **Defaults** also restores the original slider bounds. Committed slider values are saved locally as well.

| Area | Controls |
|---|---|
| Motion | Population (default range 10–1,000), world width and height (viewport multipliers), boid visual size, speed, perception, separation, alignment, cohesion, steering force, behavioural profile, time scale, turbulence |
| Neural brain | Connection genes, hidden neurons, update interval, reward-modulated plasticity, eligibility decay, reward sensitivity, sensory/output masks |
| Genetics | Mutation probability, mutation magnitude, crossover mixing, parental weight blending |
| Reproduction | Drive, minimum/maximum reproductive age, maximum lifespan, mate similarity preference, fertility, gestation, energy threshold, search radius, mate-candidate count |
| Selection | Predation, starvation, competition, harshness, ageing and selection intensity |
| Environment | Predators, reef structures, food patches, food regeneration, food attraction, metabolic rate, juvenile vulnerability, currents and trail persistence |

The bottom Evolutionary Observatory reports live population, births, conceptions, deaths, predator kills, mutations, gestation count, mean age/energy, mean fitness, mean reward, genetic diversity, gene-frequency history, connection-weight summaries, and neural topology/inspection.

Configuration can be saved and restored in the browser's local storage. Settings are local to the browser profile and are not synchronized across devices.

## Performance notes

- CPU simulation and Canvas2D rendering run in a worker; this is not GPU compute.
- Neighbour and predator searches use a spatial hash.
- Per-boid food sensing/feeding is consolidated into one food-patch pass.
- Agent state and genomes use typed arrays.
- Neural scratch storage and hue caches are reused.
- Rendering batches streaks by hue bin rather than changing Canvas2D state per agent.
- Adaptive quality can lower the active population when measured FPS falls below its threshold and gradually restore it when performance recovers.

Actual population/FPS limits depend on device, browser, screen resolution, and active configuration. The worker is designed for a practical interactive population, not a claim of hundreds of thousands of agents on all devices.

## Known limitations

- Simulation state and historical gene-frequency samples are in-memory only and reset on reload.
- Gene-history plots are rolling population-level histograms, not persistent per-locus allele records.
- Colour is a hash of the connection genome. It provides a visually distributed phenotype signature, but nearby colours do not imply close genetic relatedness; use genome distance for mate selection.
- The fitness/reward and selection models are heuristic and not calibrated to a real species.
- The neural architecture is a compact sparse network, not a general-purpose neural simulator.
- There is no GPU/WebGPU implementation at present.
- The application requires OffscreenCanvas support. Older browsers that lack it show a compatibility message rather than running a main-thread fallback.

## Development checks

The project is static HTML plus a JavaScript worker. At minimum, validate both the worker and inline page script with a JavaScript parser, then run in a real browser and exercise:
- initial load, resize, pause/resume, reset and population changes
- top/bottom drawer gestures and keyboard controls
- changing connection count and hidden-neuron count while the simulation is running
- conception, delayed birth, mutation and lineage
- food depletion/regrowth and predator mortality
- saved settings round-trip
- a sustained performance run on mobile and desktop devices

Do not treat syntax validation alone as proof of correct runtime behavior.