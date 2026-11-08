# BOIDS

A full-screen, worker-driven flocking and evolutionary ecology simulation. The field is the interface: configuration is revealed from the top edge and population analysis from the bottom edge.

## Live deployment

https://boids-gemquotas-projects.vercel.app

## Run locally

Open `index.html` in a modern browser with OffscreenCanvas and Worker support. There is no package installation or build step. `boids-worker.js` must be served from the same origin as the page; for local development, use any static HTTP server rather than opening the page from a restrictive `file://` context.

## Interaction

- Swipe down from the top edge to open configuration.
- Swipe up from the bottom edge to open the evolutionary observatory.
- Tap or drag on the simulation field to apply the current repel/attract interaction.
- Use the interaction toggle to switch between repulsion and attraction.
- Tap a boid to inspect its age, energy, fitness, lineage, parent lineages and current neural connections.
- Keyboard: `H` opens configuration, `I` opens the observatory, `M` toggles repel/attract, `Space` pauses/resumes, `Escape` closes drawers.
- Save, restore or reset the configuration from the top drawer. Settings are stored in local browser storage.

## Configuration areas

### Motion and field

Population, cruising speed, perception radius, separation, alignment, cohesion, steering authority, behavioral profile, time scale, turbulence, current strength, trail persistence and boundary wrapping.

### Environment

Predator population and hunting drive, strike range, reef structures, renewable food patch count and regeneration, food preference, metabolic rate, juvenile age and juvenile predation vulnerability.

### Neural architecture

Each boid has eight sensory channels, a configurable hidden layer and eight behavioral outputs. The sensor and output masks select which channels are active. Neural update interval controls how often the controller is evaluated. Sparse directed connection genes store source neuron, destination neuron and signed weight. Internal-to-internal connections can form recurrent stateful networks.

The brain has lifetime plasticity using eligibility traces and a reward signal derived from energy change, foraging and predator threat. This is a compact evolutionary controller, not a gradient-trained neural network or a full differentiable learning system.

### Genetics

The genome is an ordered array of connection genes. Each gene stores three values: source index, destination index and weight. Initial genomes are randomized. Mutation can alter topology or weights. Offspring inherit maternal and stored paternal genomes through per-gene crossover and optional weight blending.

Hue is a hash-derived phenotype signature of the complete genome. It is a visualization key, not a biological locus or a claim that every possible genotype will have a perceptually unique colour.

### Reproduction and selection

Boids have a sex role, energy, age, reproductive window, maximum lifespan and a gestation timer. Mate preference ranges from favouring similar genomes to favouring dissimilar genomes, measured over connection loci. Conception stores the second parent's genome; gestation elapses before offspring are delivered. Fertility controls the number of offspring per delivery.

Selection settings include predation, starvation, competition, environmental harshness, ageing and selection intensity. Food patches replenish over time and can be depleted by foraging.

### Observability

The bottom drawer exposes living population, FPS, generation, births, deaths, conceptions, predator kills, mutation events, gestating individuals, food reserves, mean age, energy and genetic diversity. Gene views include phenotype-signature frequencies, rolling frequency history, connection-weight means and variances, and network topology diagnostics.

The rolling histories are session-local. They are not persisted to disk or synchronized across devices. Genetic diversity currently describes coarse phenotype-signature bins, not a full locus-by-locus population-genetics analysis.

## Architecture and performance

- `index.html` owns UI, gesture handling, settings storage and visualizations.
- `boids-worker.js` owns world state, simulation, reproduction, neural evaluation and rendering.
- The simulation runs in a dedicated Worker and renders through OffscreenCanvas.
- Agent position and velocity use typed arrays. Local neighbour lookup uses a uniform spatial hash.
- Boid trails are batched into hue buckets to reduce per-agent Canvas state changes.
- Neural scratch storage and analysis arrays are reused; topology analysis samples a capped subset of the population.
- Adaptive quality reduces population when measured frame rate falls and gradually restores it when headroom returns.

The engine is CPU-based. The worker keeps simulation work off the UI thread, but it is not GPU-compute accelerated. Performance varies by browser, display resolution, device thermals and population settings.

## Current model boundaries

This is an exploratory artificial-life model, not a validated ecological or genetic model. Predators, food, energy, ageing, mate preference, mutation and selection are stylized mechanisms. Neural plasticity is local reward-modulated eligibility-trace adaptation. Reproduction uses a two-parent genome snapshot and a single gestation carrier; it does not model detailed gamete production, dominance, sex-linked chromosomes, or an explicit population of infants with developmental stages.

Use the controls to explore how local rules, inheritance and environmental pressures interact. For scientific experiments, calibrate rates and units, define reproducible random seeds, and validate the results against a specified biological model.

## Development workflow

The twelve-pass overhaul is being developed in small checkpoints on `boids-12-pass-overhaul`:

1. General simulation features, pass one.
2. General simulation features, pass two.
3. Interface and interaction QOL, pass one.
4. Interface and interaction QOL, pass two.
5. Genetics and reproduction, pass one.
6. Genetics and evolution analysis, pass two.
7. Neural architecture and sensory/motor integration, pass one.
8. Neural plasticity and reward response, pass two.
9. Adversarial review and corrections.
10. Performance and memory pass.
11. Final QOL pass.
12. Documentation and configuration reference.

JavaScript syntax checks are useful but do not replace browser runtime tests. Use the live Vercel preview to verify worker behavior and performance on target devices.
