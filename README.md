# BOIDS // evolutionary field

**A full-screen, browser-based evolutionary ecosystem.** Boids move through a changing environment, forage, compete for resources, choose mates, reproduce, and pass inherited neural and ecological traits to the next generation. Predation is an evolved strategy inside the single boid population, not a separate predator species.

The project combines classic boids-style local steering with an experimental evolutionary simulation: each agent carries its own inherited neural controller, internal state, energy budget, age, reproductive state, and lineage.

**Live simulation:** [gemquota.github.io/boids](https://gemquota.github.io/boids/)  
**Repository:** [github.com/gemquota/boids](https://github.com/gemquota/boids)

No framework, bundler, package installation, or build step is required. The site is served as static files.

---

## At a glance

- Full-screen, responsive simulation with touch and pointer interaction.
- Dedicated simulation worker using typed arrays, spatial indexing, and OffscreenCanvas.
- **181 adjustable sliders** across movement, neural, genetic, reproductive, ecological, and advanced dynamics settings.
- Collapsible control groups, contextual field-guide descriptions, editable slider limits, and named presets.
- Randomised ecological configurations and a tuned baseline reset.
- Evolving sparse neural brains with recurrent hidden state, inherited connection genes, mutation, crossover, and reward-modulated plasticity.
- Food patches with finite renewable stock, reef obstacles, currents, ageing, starvation, density pressure, and conspecific predation driven by inherited aggression, body mass, speed, bite strength, perception radius, kin affinity, acceleration, agility, risk tolerance, and exploration.
- Hunting traits are inherited and mutated independently from neural connection genes; successful predation, energy costs, size trade-offs, and kin protection create selection pressure within one shared population.
- Observatory panels can be opened together; charts support pinch zoom, double-tap reset, numeric axes and increments, and optional grid lines.
- Evolutionary Observatory with live population, reproduction, mortality, fitness, diversity, gene-distribution, and neural inspection views.
- Browser-local persistence for settings, presets, world snapshots, and Observatory history.

## Control taxonomy

All 182 numeric sliders are registered, persisted, and assigned to a tab and collapsible category.

| Tab | Categories |
|---|---|
| Motion | Population & timing; locomotion; schooling & spacing; environmental flow |
| Neural brain | Network architecture; learning & plasticity; neural behaviour |
| Genetics | Neural mutation & topology; inheritance; ten-locus gene expression |
| Reproduction | Mate choice; reproductive strategy; maturation & lifespan |
| Selection | Ecological selection; predation phenotype selection; energy economics |
| Environment | World geometry; food web; habitat & presentation |
| Dynamics | Spatial interaction; food sensing & foraging; predation & social response; survival mechanics; advanced movement, current, neural, life-history, genetic-variation and phenotype controls |

The Genetics tab contains ten collapsible locus editors, each with phenotype bounds, curve selection, curve controls, environmental sensitivity, mutation rate, mutation magnitude and inheritance fidelity. The advanced dynamics tab contains its own nested accordions so specialist controls stay grouped without turning the main tabs into a scrollable junk drawer.

## Simulation correctness overhaul

The current development branch begins an eight-phase model overhaul. The first foundational slice adds:

- A fixed 1/60-second simulation clock with bounded catch-up.
- Double-buffered positions and velocities, so neighbour sensing reads a consistent pre-update movement state.
- Seeded xorshift randomness, with the generator state persisted in world snapshots.
- Randomised agent evaluation order to remove fixed low-index priority from sequential resource claims.
- Persistent 32-bit individual IDs and actual parent IDs. Generation depth is retained separately and is no longer used as an identity surrogate for kin checks.
- Ten inherited quantitative traits: aggression, body mass, speed, bite strength, kin affinity, perception radius, acceleration, agility, risk tolerance, and exploration. The new traits influence acceleration, turning, attack commitment, escape response, food attraction, and exploratory noise.
- Persistent pedigree records and depth-limited relatedness estimates. Kin affinity now reduces attack probability against relatives, rather than relying on generation numbers as a crude proxy.
- Innovation-aligned neural connection genes. Crossover and mate-preference distance now match homologous connections by stable endpoint-derived innovation IDs instead of assuming that matching array positions represent the same gene.
- Seasonal food patches with varying quality/productivity, obstacle-associated shelter cover, spatial thermal stress, and explicit movement energy costs.
- Lifetime reproductive success, per-trait selection differentials with dedicated Observatory charts, attack/feeding/energy-flow counters, and a working JSON experiment export from the Observatory.
- Live worker update/draw/backlog timings, inline UI syntax checks, and a CPU benchmark at 100, 250, 500, and 1,000 agents.
- Body mass now has a nonlinear maintenance cost and a speed trade-off, rather than being only a visual and attack-size multiplier.
- Schema-v8 world snapshots with migration of older snapshots. Legacy generation-based parent fields are cleared rather than misrepresented as real pedigree data.

This is a **foundational Phase 1 implementation plus the first Phase 2 interaction slice**. Movement reads a shared position/velocity snapshot, while food claims and conspecific attacks are resolved in batches. Energy accounting, richer trade-offs, runtime reproducibility tests, and full pedigree analysis remain in progress. The full eight-phase plan, status, design invariants, and validation gates are in [docs/MODEL-ROADMAP.md](docs/MODEL-ROADMAP.md).

## Getting started

### Run locally

From the repository root:

~~~sh
python3 -m http.server 8000
~~~

Open [http://localhost:8000](http://localhost:8000) in a modern browser with support for Web Workers and OffscreenCanvas.

The application is static:
- **index.html** contains the interface, canvas, drawers, controls, settings and Observatory UI.
- **boids-worker.js** contains the simulation, ecology, neural evaluation, genetics, snapshot serialization, and worker-side rendering.
- **docs/** contains supporting configuration and model references.
- **.github/workflows/validate.yml** runs the repository's automated structural and JavaScript checks.

The worker is loaded relative to the page as ./boids-worker.js. Keep the two application files together when hosting the project.

### GitHub Pages

The repository is configured for static hosting. The published version is available at:

[https://gemquota.github.io/boids/](https://gemquota.github.io/boids/)

No server-side database or API is required. Each browser profile maintains its own local settings and simulation save data.

---

## Interface and interaction

The simulation occupies the full screen. Its controls are deliberately tucked into drawers so the world remains the main event.

| Interaction | Action |
|---|---|
| Swipe down from the top edge | Open the configuration drawer |
| Swipe up from the bottom edge | Open the Evolutionary Observatory |
| Tap or drag in the world | Apply the current pointer influence |
| H | Toggle configuration |
| I | Toggle Observatory |
| M | Toggle attract/repel interaction mode |
| Space | Pause or resume |
| Escape | Close open drawers |

The configuration drawer is organised into tabs and collapsible accordion groups. Slider tracks use the available width, with enlarged MIN/MAX touch targets for mobile use.

### Slider limits and help

- Tap a slider's name to open its contextual explanation.
- Tap elsewhere to dismiss the help overlay.
- Press and hold a **MIN** or **MAX** endpoint to edit that slider's allowed range.
- Original limits and user overrides are retained locally.
- **Reset slider limits** restores the original range boundaries.
- **Reset defaults** restores the tuned ecological baseline and original slider limits.

The 182-slider set is intended to expose meaningful interacting parameters without making every control a separate screen. The detailed field guide explains each dynamics and gene-expression parameter, including what the worker currently does with it.

### Presets and randomisation

- **Save preset** stores a named configuration.
- **Apply preset** restores the selected configuration.
- **Randomise ecology** generates bounded variations around the current settings, with constraints on key population, food, predator, and reproduction values.
- **Reset defaults** returns to the shipped ecological baseline.

Presets include the slider configuration, behaviour mode, channel masks, and world toggles. Presets are stored in browser local storage and are not shared between devices.

---

## Genotype and gene expression

Each of the ten inherited quantitative loci is stored as a bounded genotype value. The worker normalizes that allele through a configurable expression function before using it as a physical or behavioural phenotype. The Genetics tab exposes **nine numeric expression/inheritance controls plus one curve selector per locus**:

- Phenotype minimum and maximum.
- Linear, exponential, logarithmic, sigmoid, threshold, plateau or inverse curve.
- Curve strength, midpoint and expression bias.
- Environmental sensitivity.
- Locus-specific mutation rate and magnitude.
- Heritability / inheritance fidelity.

The ten loci share the same expression architecture but retain independent settings. Changing expression settings changes how existing genomes manifest; it does not rewrite their inherited alleles. The former global Cruising speed slider is replaced by the Speed locus's phenotype range. The default speed phenotype range is deliberately conservative (0.75–2.25 world units) to produce slower, more readable movement. Global mutation probability and magnitude now describe neural connection genes only.

## The simulation model

### Agents and flock movement

Each boid maintains position, velocity, age, energy, sex, reproductive state, fitness estimate, lineage metadata, neural hidden state, and a sparse connection genome.

Local neighbour queries use a spatial hash rebuilt during simulation updates. Steering combines:

- Separation from nearby agents.
- Alignment with local headings.
- Cohesion toward the local group.
- Obstacle avoidance.
- Environmental current and turbulence.
- Food seeking.
- Predator avoidance.
- Pointer-driven attraction or repulsion.

World boundaries can wrap or reflect. Behaviour profiles change the balance between schooling, dispersal, predator evasion, and turbulent exploration.

### Evolving neural controllers

Each agent has a compact neural controller with **eight sensory channels**, a configurable hidden/recurrent layer, and **eight behavioural output channels**.

| Sensory input | Information |
|---|---|
| Neighbour density | Local crowding |
| Neighbour alignment | Average nearby heading |
| Separation pressure | Close-range personal-space pressure |
| Predator threat | Nearby danger |
| Food proximity | Access to nearby food |
| Mate proximity | Potential reproductive partner |
| Energy reserve | Current energy state |
| Age | Normalised life stage |

The outputs influence turning, acceleration, alignment, cohesion, separation, fleeing, mate seeking, and reproductive drive. Input and output channel masks can disable individual channels.

Each connection gene stores a directed source neuron, destination neuron, and signed weight. Hidden-to-hidden connections can use recurrent state carried between neural evaluations. Connection and hidden-neuron counts are configurable; when topology settings change, overlapping genome and brain-state data is retained where possible and new connections are initialised.

Plasticity uses reward-modulated eligibility traces to update connection weights. The reward signal is a local heuristic based on recent energy change, feeding, and threat. It is an experimental learning mechanism, not a validated reinforcement-learning objective.

### Genetics, mate choice, and reproduction

Initial connection genomes are randomised. During reproduction, offspring inherit connection genes through parental crossover and optional weight blending. Mutation can alter connection weights and endpoints, allowing both parameter changes and topology rewiring. Lineage metadata tracks ancestry.

Mate choice combines spatial proximity with genetic preference. Preference can favour similar or dissimilar genomes, while candidate sampling and proximity weighting influence which eligible partner is selected.

The reproductive system includes configurable:
- Reproductive drive and eligibility ages.
- Mate search radius and candidate sampling.
- Energy threshold for conception.
- Fertility / offspring count.
- Gestation duration.
- Maximum lifespan.

This is a simplified two-sex mating and gestation model, not a complete biological developmental or population-genetics simulation.

### Food, predators, and selection

Food patches contain finite stock and regenerate over time. Boids brake to a stop while feeding. A procedural fractal plant ecology has a complete clonal life cycle: dispersed asexual spores drift, germinate into seedling colonies, grow through juvenile nodes, and mature into reproductive nodes. Mature nodes produce attached clonal buds; a sufficiently large mother becomes a grandmother and produces two fully grown adult daughter nodes that can branch immediately. Recursive budding builds the fractal colony. Mature nodes also release asexual spores that establish independent daughter colonies. Old nodes enter senescence, reduce growth and biomass, then die; surviving attached daughters detach and continue as independent clonal colonies when a parent dies. Grazing removes biomass and can delay maturation, suppress budding and prevent spore production. The Observatory records plant stage counts, total biomass, spore counts, budding, germination and deaths. Food attraction, consumption, energy yield, and regeneration can be adjusted independently.

Predation is conspecific: agents within the same evolving population can hunt smaller agents when inherited aggression, relative body size, perception radius, bite strength, and kin-protection traits make an attack viable. There is no separate predator caste or independently spawned predator species. Juvenile vulnerability modifies the risk faced by younger agents. Attack proposals are resolved after the agent decision pass so one prey target cannot generate multiple kill rewards in the same tick.

Survival and population dynamics also respond to:
- Metabolic and adult maintenance costs.
- Starvation pressure.
- Local crowding and competition.
- Environmental harshness.
- Ageing and lifespan.
- Fitness-weighted selection.

The model is intentionally qualitative. Parameter values are simulation controls, not calibrated biological or physical units.

---

## The 182-slider configuration

The controls are distributed across the main simulation tabs and the advanced Dynamics tab. Accordion groups keep related parameters together.

| Area | What it controls |
|---|---|
| **Motion** | Population target, world dimensions, visual scale, speed, perception, separation, alignment, cohesion, steering authority, behaviour profile, time scale, and turbulence. |
| **Neural brain** | Connection genes, hidden neurons, update interval, learning rate, eligibility decay, reward sensitivity, sensory channels, and output channels. |
| **Genetics** | Mutation probability and magnitude, crossover, parental weight blending, mutation drift, rewiring, and lineage variation. |
| **Reproduction** | Reproductive drive, age windows, lifespan, mate preference, fertility, gestation, energy threshold, mate radius, candidate sampling, and mate-drive variation. |
| **Selection** | Predation, starvation, competition, environmental harshness, ageing, and selection intensity. |
| **Environment** | Predator population, reefs, food patches, food regeneration, food attraction, metabolic rate, juvenile vulnerability, currents. |
| **Dynamics** | Flocking noise, alignment persistence, cohesion bias, separation falloff, density sensitivity, current drift, eddy frequency, food depletion and yield, neural output dynamics, sensory noise, life-history costs, and predator ecology. |

The Dynamics controls are grouped into Movement, Water dynamics, Reproduction, Genetic variation, Neural dynamics, Life history, and Predator ecology.

Some controls intentionally scale a specific part of an existing mechanic rather than introducing an entirely new subsystem. For example:
- **Neural turn damping** attenuates the evolved turn output; it is not general velocity memory.
- **Plasticity multiplier** scales the learning update; it does not maintain a separate momentum accumulator.
- **Juvenile ageing multiplier** changes progression through the juvenile age threshold; it does not change body size.
- **Food energy yield multiplier** changes the energy received per bite; it is not a separate contest-competition mechanic.
- **Mate proximity weighting** adjusts the proximity term relative to genetic preference during mate ranking.

See the [configuration reference](docs/CONFIGURATION.md) for the control ranges and initial values.

---

## Evolutionary Observatory

The bottom drawer provides live views into the current population and its evolution. Depending on the active panel, it exposes:

- Population size and population history.
- Births, conceptions, deaths, predator kills, and gestation.
- Mean age, energy, fitness, and reward.
- Genetic diversity and gene-distribution history.
- Connection-weight summaries and neural topology.
- Individual brain inspection and connection graph.

The Observatory is intended to make changes in population and inherited variation observable over time, rather than reducing the simulation to a moving wallpaper with a suspiciously large number of sliders.

Historical samples are retained in the browser's local world data and restored alongside the saved ecosystem where available.

---

## Persistence and local data

The simulation stores data locally in the browser. Nothing is synchronised to a remote account or shared automatically between devices.

| Data | Storage | Behaviour |
|---|---|---|
| Slider values and UI settings | Local storage | Restored on later visits |
| Named presets | Local storage | Available in the same browser profile |
| World snapshot | IndexedDB | Periodically saved and restored |
| Observatory history | Browser-local storage | Restored with available historical samples |

World snapshots include the simulation configuration and live state needed to resume the ecosystem, including agent positions and velocities, age, energy, pregnancy, genomes, neural state, food, predators, obstacles, counters, and historical samples.

Snapshots are refreshed periodically and flushed when the page becomes hidden or is being unloaded. The save path waits for the worker's snapshot response and the IndexedDB transaction. A previous known-good snapshot is retained as a rollback copy, and invalid or unsupported newer snapshots can fall back to that copy.

**Persistence is best-effort, not a server backup.** A browser or operating-system shutdown can interrupt asynchronous work. Clearing site data, using private browsing, changing browser profiles, or switching devices can remove access to the saved world.

---

## Performance and compatibility

The simulation is designed to keep the main interface responsive while the worker handles the computational work.

Current implementation choices include:
- Worker-based simulation and Canvas2D rendering through OffscreenCanvas.
- Spatial hashing for neighbour and predator searches.
- Typed arrays for agent state and genome data.
- Reused neural scratch storage and rendering caches.
- Batched rendering by hue bins.
- Adaptive quality controls that can reduce the active population when measured frame rate drops and restore it as performance recovers.

This is CPU simulation, not GPU compute. There is no WebGPU implementation at present. Actual population and frame rate depend on the device, browser, screen resolution, world size, and selected parameters. A configuration that runs comfortably on a desktop may be excessive on a phone.

The application requires browser support for Web Workers and OffscreenCanvas. Browsers without the required support may display a compatibility message instead of running the simulation.

---

## Known limitations

- The ecological and selection models are simplified and are not calibrated to a real species or environment.
- The reward signal for neural plasticity is heuristic.
- Neural controllers are compact sparse networks, not general-purpose neural simulators.
- Genome-derived colour is a visual signature, not a reliable measure of genetic distance. Use genome distance and mate-preference metrics for genetic comparisons.
- Gene-distribution plots are population-level summaries, not a complete persistent record of every allele at every locus.
- World persistence is browser-local and can be interrupted by browser or operating-system shutdown.
- Performance is device-dependent; high population counts and complex settings can overwhelm mobile hardware.
- No GPU/WebGPU simulation path or main-thread fallback is currently provided.

---

## Development and validation

The application is plain HTML and JavaScript. There is no compile step.

At minimum, check the inline page script and worker syntax, then exercise the application in a real browser. The repository's GitHub Actions workflow also checks structural wiring and selected regression-sensitive features, including the 182-slider inventory, worker parameter references, slider quantisation, steering symmetry, help descriptions, and snapshot safeguards.

A useful manual test pass includes:

1. Load the page and verify the worker starts without errors.
2. Resize the viewport and check the canvas/world mapping.
3. Open and close both drawers with touch gestures and keyboard shortcuts.
4. Pause, resume, change population, and interact with the world.
5. Change connection and hidden-neuron counts while the simulation is running.
6. Randomise settings, apply a saved preset, and reset the ecological baseline.
7. Verify integer sliders remain on valid step values after randomisation and restore.
8. Observe feeding, food regeneration, predator pursuit, deaths, conception, gestation, birth, and mutation.
9. Inspect an individual brain and confirm the Observatory updates.
10. Reload the page and verify the world and historical data restore from the local snapshot.
11. Run a sustained mobile performance test at several population levels.

Passing syntax and structural checks is not proof of complete runtime correctness. Test the deployed build on the target browsers and devices before treating it as release-ready.

---

## Project layout

~~~text
boids/
├── index.html                  # Full-screen UI, controls, drawers, charts
├── boids-worker.js             # Simulation, ecology, genetics, neural brains
├── docs/
│   ├── CONFIGURATION.md        # Slider ranges, defaults, and effects
│   └── ...                     # Additional project references
└── .github/
    └── workflows/
        └── validate.yml        # Automated validation workflow
~~~

## Contributing

Changes to simulation mechanics should keep the UI control, worker implementation, help text, and configuration documentation in sync.

For new controls:
1. Define a clear unit or qualitative range and a useful default.
2. Wire the setting through the UI and worker configuration path.
3. Make the control's actual effect match its label and help description.
4. Check symmetry for vector forces so horizontal and vertical movement behave consistently.
5. Include the parameter in preset, reset, and persistence paths.
6. Add regression checks for integer constraints, topology changes, and snapshot compatibility where relevant.

Keep performance in mind: per-agent work runs every simulation update, so small inefficiencies multiply quickly as the population grows.


## DNA Update roadmap

The checkpointed genetics roadmap is in [docs/GENETICS_ROADMAP.md](docs/GENETICS_ROADMAP.md). v0.2.0 establishes explicit expression for all ten trait loci; subsequent releases cover regulatory genetics, evolving neural topology, persistent genomes, ecological adaptation and evolutionary analytics.


The runtime already supports versioned population snapshots and restoration, including genome arrays, individual identities, pedigree, innovation identifiers and RNG state. The future persistence phase hardens and extends this existing foundation rather than introducing it from scratch.
