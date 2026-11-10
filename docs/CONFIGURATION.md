# Configuration reference

Values below describe the current slider ranges and initial UI values. Some controls are grouped into presets or toggles rather than numeric sliders.

## Motion

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Population | 10–1,000 | 500 | Desired active population. Resizing preserves surviving agents; the explicit reset action reseeds. |
| Simulation speed | 0.25–3 | 1 | Scales the simulation timestep and therefore all simulated processes. |
| Current turbulence | 0–2 | 0.35 | Adds local variation to the environmental flow field. |

| Personal space | 0–3.5 | 1.8 | Separation steering weight. |
| School alignment | 0–3 | 1.15 | Alignment steering weight. |
| Group cohesion | 0–3 | 1.05 | Cohesion steering weight. |
| Steering authority | 0.02–0.3 | 0.09 | Limits combined steering acceleration. |

### Behaviour profiles

- **Balanced ecosystem:** default steering multipliers.
- **Dense schooling:** stronger alignment and cohesion.
- **Loose dispersal:** stronger separation and weaker alignment/cohesion.
- **Predator evasive:** stronger separation and threat response.
- **Turbulent exploration:** looser schooling with stronger flow variation.

## Neural brain

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Connection genes per brain | 4–64 | 18 | Number of directed connection genes per agent. |
| Internal neuron count | 2–24 | 8 | Hidden/recurrent neuron count. |
| Neural update interval | 1–12 | 3 | Staggers brain evaluation across frames. |
| Reward-modulated learning rate | 0–0.5 | 0.08 | Lifetime plasticity strength. |
| Eligibility trace decay | 0.5–0.999 | 0.92 | Persistence of pre-/post-activation traces. |
| Reward sensitivity | 0–4 | 1 | Scales reward-gated weight updates. |

The sensory and behavioural-output checkboxes enable or disable individual channels. See [GENETICS.md](GENETICS.md) for the channel index table.

## Genetics

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Neural connection mutation probability | 0–0.5 | 0.025 | Probability that each inherited neural connection gene mutates. Trait loci have independent mutation-rate controls below. |
| Neural connection mutation magnitude | 0.01–1.5 | 0.25 | Neural connection weight perturbation magnitude. Endpoint mutations can rewire a connection. Trait loci have independent mutation-magnitude controls below. |
| Genome crossover mixing | 0–1 | 0.5 | Probability of selecting the maternal rather than paternal source gene at a locus. |
| Parental weight blending | 0–1 | 0.15 | Blends the selected inherited weight toward the parental mean. |

## Ten-locus gene expression

The global Cruising speed and Perception radius controls have been removed. Both are now expressed phenotypes derived from each agent's inherited loci. Perception radius is measured in world units and directly sets that agent's flocking, threat/prey and food-sensing neighbourhood. All ten loci use the same expression architecture, with independent settings per locus.

| Locus | Default phenotype minimum | Default phenotype maximum |
|---|---:|---:|
| Aggression | 0 | 1 |
| Body size | 0.55 | 1.65 |
| Speed | 1.375 | 4.125 |
| Bite strength | 0.55 | 1.65 |
| Kin affinity | 0 | 1 |
| Perception radius | 18 | 90 |
| Acceleration | 0.55 | 1.65 |
| Agility | 0.55 | 1.65 |
| Risk tolerance | 0 | 1 |
| Exploration | 0.55 | 1.65 |

Each locus exposes these controls:

| Control | Initial value | Effect |
|---|---:|---|
| Phenotype minimum / maximum | Locus defaults above | Physical or behavioural output bounds. These do not alter the inherited allele bounds. |
| Expression curve | Linear | Selects Linear, Exponential, Logarithmic, Sigmoid, Threshold, Plateau or Inverse mapping. |
| Curve strength | 2 | Controls curvature for exponential, logarithmic, sigmoid and plateau profiles. |
| Curve midpoint | 0.5 | Sets the transition point for sigmoid and threshold profiles. |
| Expression bias | 0 | Shifts the normalized gene input before curve evaluation. |
| Environmental sensitivity | 0 | Modulates normalized expression using the worker's environmental signal (global harshness plus local shelter contribution). |
| Mutation rate | 0.016 | Per-locus probability of mutation at offspring inheritance. |
| Mutation magnitude | 0.075 | Maximum normalized perturbation when the locus mutates. |
| Heritability / inheritance fidelity | 0.98 | Controls non-mutational deviation around the mid-parent allele in this simplified quantitative-trait model. It is not an empirically estimated heritability statistic. |

Expression curves map the normalized inherited allele to a normalized output before applying phenotype bounds. Linear is proportional; Exponential delays most effect until high gene values; Logarithmic produces stronger early effects and diminishing returns; Sigmoid and Threshold create a transition around the midpoint; Plateau saturates progressively; Inverse reverses the direction.

Changing these controls never rewrites an existing genome. It changes the mapping from genotype to phenotype. Global neural connection mutation probability and magnitude remain separate from the ten locus-specific mutation settings.

## Reproduction

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Reproductive drive | 0–1 | 0.55 | Base probability of attempting conception when eligible. |
| Mate search effort | 1–40 | 10 | Additional population candidates sampled during mate selection. |
| Earliest reproductive age | 2–100 | 18 | Minimum age for conception. |
| Latest reproductive age | 30–400 | 160 | Maximum age for conception. |
| Maximum lifespan | 80–1,000 | 420 | Age-based mortality limit; kept above latest reproductive age. |
| Mate preference | -1–1 | 0 | Negative prefers dissimilar genomes, zero favours proximity, positive prefers similar genomes. |
| Fertility / offspring | 1–6 | 2 | Offspring per successful gestation. |
| Gestation duration | 2–120 | 24 | Delay between conception and delivery. |
| Reproductive energy threshold | 0.1–1 | 0.68 | Minimum energy reserve for conception. |
| Mate search radius | 15–180 | 70 | Maximum spatial distance for eligible mates. |

## Selection and survival

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Predation pressure | 0–1 | 0.45 | Scales prey threat response. |
| Starvation pressure | 0–1 | 0.2 | Scales metabolic energy cost. |
| Competition pressure | 0–1 | 0.25 | Adds density-dependent energy cost and mortality risk. |
| Environmental harshness | 0–1 | 0.25 | Adds baseline energy cost. |
| Ageing rate | 0–1 | 0.25 | Scales the rate at which age advances. |
| Selection intensity | 0–1 | 0.5 | Scales fitness-dependent mortality risk. |

## Environment

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Reef structures | 0–18 | 7 | Number of circular obstacles. |
| Renewable food patches | 0–40 | 14 | Number of finite, regenerating food sources. |
| Food preference | 0–2 | 0.75 | Strength of steering toward stocked food patches. |
| Metabolic rate | 0.25–3 | 1 | Scales energy expenditure. |
| Juvenile age | 0–40 | 8 | Age below which agents are more vulnerable to conspecific attacks. |
| Juvenile vulnerability | 0–4 | 1.5 | Multiplier on conspecific attack probability for juveniles. |
| Food regeneration | 0–1 | 0.12 | Rate at which food-patch stock recovers. |
| Current strength | 0–1.8 | 0.45 | Base environmental flow strength. |
| Trail persistence | 0.04–0.5 | 0.14 | Canvas trail fade amount; lower values retain trails longer. |

### Toggles

- **Wrap world boundaries:** boids cross the field edges.
- **Adaptive performance quality:** automatically adjusts active population toward the selected target based on recent FPS.

## Advanced dynamics

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Obstacle clearance distance | 0–100 | 28 | Extra distance around reefs that triggers avoidance. |
| Obstacle avoidance strength | 0–4 | 1.5 | Repulsion strength near reef structures. |
| Pointer influence radius | 40–400 | 167 | Radius of touch/mouse steering influence. |
| Pointer interaction force | 0–8 | 2.8 | Maximum push/pull steering force from pointer interaction. |
| Personal-space radius factor | 0.1–1 | 0.43 | Multiplier on perception radius for separation. |
| Primary current wave strength | 0–1 | 0.34 | Amplitude of the broad current wave. |
| Secondary current wave strength | 0–0.5 | 0.12 | Amplitude of the finer current wave. |
| Turbulence force gain | 0–1 | 0.24 | Scales irregular per-agent current perturbation. |
| Food attraction range scale | 0.5–5 | 2 | Multiplier on perception radius for food attraction. |
| Minimum food attraction range | 20–200 | 60 | Minimum distance at which food influences steering. |
| Food-seeking steering gain | 0–1 | 0.22 | Direct steering force toward the nearest stocked patch. |
| Food consumed per contact | 0.00001–0.0002 | 0.00004 | Stock removed by one successful food contact. |
| Energy yield from food | 1–10 | 4 | Converts consumed food stock into energy. |
| Threat-avoidance steering gain | 0–6 | 2.4 | Scales steering away from nearby aggressive conspecifics. |
| Neural turning output gain | 0–2 | 0.5 | Scales the evolved turn-neuron output. |
| Neural acceleration output gain | 0–2 | 0.35 | Scales the evolved acceleration-neuron output. |
| Neural flee output gain | 0–3 | 1 | Scales the evolved flee-neuron output. |
| Neural mate-seeking output gain | 0–2 | 0.3 | Scales the evolved mate-seeking output. |
| Crowding mortality coefficient | 0–0.0000005 | 0.00000008 | Density-dependent mortality above the neighbour threshold. |
| Baseline metabolic cost | 0.00001–0.0001 | 0.00004 | Constant component of each agent's energy expenditure. |
| Food patch storage capacity | 0.25–3 | 1 | Maximum renewable stock held by each food patch. |

## Settings persistence

The Save settings action stores the current UI configuration in browser-local storage. Load settings restores it in that browser profile. Defaults restores the shipped initial settings. This saves configuration only; it does not serialize the live population, genomes, environment state or history.

## Additional ecology controls (183-slider configuration)

The Dynamics tab adds 22 independently adjustable controls, grouped into collapsible accordions:

| Group | Controls |
|---|---|
| Movement | Flocking noise, alignment persistence, cohesion bias, separation falloff, neighbour-density sensitivity |
| Water dynamics | Current drift, eddy frequency, food regrowth, food depletion, food competition |
| Reproduction | Mate-drive variation, mate-distance bias |
| Genetic variation | Mutation drift, connection rewiring chance, lineage variation |
| Neural dynamics | Neural output noise, response inertia, learning momentum, sensory noise |
| Life history | Juvenile growth rate, adult maintenance cost |
| Conspecific hunting | Aggression selection, size selection, kin protection, attack cost, attack range, juvenile vulnerability |

These controls are wired into steering, sensory inputs, resource cycling, neural plasticity, inheritance and conspecific threat response. Neural turn damping attenuates only the evolved turn output; the plasticity multiplier scales the learning update rather than maintaining a momentum buffer; juvenile ageing multiplier changes age progression rather than body growth; food energy yield multiplier changes energy received per bite rather than implementing contest competition; and mate proximity weighting is a score weight relative to genetic preference. The initial ecosystem configuration is tuned toward a moderately dense population, renewable food patches, varied currents, moderate predation and non-zero genetic variation. It is intended as a starting point for long-running dynamics, not a guarantee against extinction.

## Presets, randomisation and persistent worlds

- **Save preset** stores the complete slider values, behaviour mode, channel masks and world toggles under a user-defined name in browser-local storage.
- **Apply preset** restores a saved configuration.
- **Randomise ecology** makes bounded variations around the current configuration while constraining population, food, predator and reproduction settings to a plausible starting range.
- **Reset defaults** restores the tuned ecological baseline and original slider limits.
- **World persistence** stores a structured snapshot in IndexedDB, including agent positions and velocities, energy, age, pregnancy, genomes, neural state, food, predators, reefs, simulation counters and historical observatory samples. Snapshots are refreshed every 20 seconds and flushed when the page becomes hidden or is being unloaded. Each snapshot carries a schema version. The page waits for the worker response and IndexedDB transaction, keeps the previous known-good snapshot as a rollback copy, and falls back to that copy if the latest record is invalid or from a newer schema. Browser shutdown can still interrupt asynchronous work. Data remains local to the browser profile and device.
- **Observatory history** is also cached locally so charts can repopulate between visits.

The simulation state is browser-local. Clearing site data or using another browser/device removes access to that local snapshot.

## Inherited phenotype

Each agent inherits ten quantitative trait loci. The allele values are sampled at population creation and recombined/mutated during reproduction; separate per-locus UI controls define how each allele is expressed as a phenotype.

| Locus | Meaning | Current model effect |
|---|---|---|
| Aggression | Attack propensity | Conspecific hunting eligibility and attack commitment |
| Body mass | Relative physical size | Attack size advantage, nonlinear maintenance cost, modest speed trade-off, and visual scale |
| Speed | Velocity-cap potential | Sets the individual velocity cap through its configured expression function and phenotype bounds |
| Bite strength | Capture capability | Attack success probability and attack ranking |
| Kin affinity | Relative protection of relatives | Reduces willingness to attack close kin |
| Perception radius | 18–90 world units | Sets each agent's flocking, threat/prey and food-sensing neighbourhood |
| Acceleration | Burst response | Scales movement acceleration and force authority |
| Agility | Manoeuvrability | Scales evolved neural turning response |
| Risk tolerance | Risk acceptance | Increases attack commitment and reduces threat-flee response |
| Exploration | Exploratory tendency | Increases stochastic steering and reduces direct food attraction |

The four newer loci use bounded quantitative inheritance and mutation. Older six-locus snapshots migrate to ten loci by preserving their original six values and initialising acceleration, agility, risk tolerance, and exploration to neutral values. This is a compatibility migration, not an inferred reconstruction of missing historical genes.

### Runtime performance

The Observatory reports worker update milliseconds, draw milliseconds, and accumulated fixed-step backlog milliseconds. Update time is the combined simulation cost for the most recent rendered frame and can include multiple fixed steps. A growing backlog means the simulation is falling behind wall-clock time; the worker preserves accumulated simulation time rather than silently skipping steps.

CI runs a Node VM benchmark at 100, 250, 500, and 1,000 agents. This excludes browser rendering and mobile-device overhead. See docs/MODEL-CALIBRATION.md for assumptions, calibration targets, and release gates.

### Experimental measurements and export

The Observatory's Export experiment data action requests a structured JSON bundle from the worker. It includes run seed/serial, mode, configuration, telemetry time series, gene/cohort histories, neural-weight history, pedigree, per-individual reproductive-success counts, selection differentials, and interaction/energy counters.

Selection differentials are the mean trait values of parents that have produced offspring minus the current population mean. They are descriptive selection differentials, not regression-based selection gradients. Lifetime reproductive success is counted per parent for each delivered offspring. Current exports contain one run; parameter sweeps, replicate aggregation, confidence intervals, and formal experiment manifests are still future work.

### Habitat, resources, and energetic costs

Food patches carry three additional state variables: quality, productivity, and seasonal phase. Quality scales energy gained from feeding; productivity scales patch stock capacity and renewal; phase offsets a smooth seasonal regeneration cycle. Old snapshots without these fields are migrated to neutral values.

Reef obstacles also provide local cover. Cover reduces perceived threat and lowers the probability that an agent is successfully attacked. It is derived from current agent/obstacle positions and is not stored in snapshots.

Maintenance now includes a simple spatial/temporal thermal-stress multiplier. Movement speed and acceleration also incur energetic costs. These are dimensionless phenomenological rules, not calibrated metabolic or temperature equations.

### Neural genome homology

Each connection has a stable innovation ID derived from its directed source and destination nodes. Parent genomes are aligned by innovation during crossover; disjoint genes are considered independently rather than assuming that the same array position represents the same connection. Mate-preference genome distance uses innovation matches and homologous weight differences. The registry is persisted in schema-v8 snapshots, and older saved genomes reconstruct IDs from their stored endpoints.

This is an innovation-aligned fixed-size genome, not a complete NEAT implementation: historical split/add-node events, enabled/disabled genes, bias genes, speciation, and fitness-sharing are not implemented yet.

### Pedigree and kinship

Every individual has a unique 32-bit ID. Offspring records store the actual maternal and paternal IDs, while generation depth remains a separate field. The worker retains a pedigree map independently of the live population, so an individual's parents can remain known after they die.

Kinship is estimated recursively from the pedigree to a maximum depth of eight generations. The resulting relatedness estimate reduces attack probability according to the attacker's inherited kin-affinity trait and the kin-protection setting. The pedigree store is bounded at 100,000 records to prevent indefinite memory growth; when old records are pruned, a truncation counter is included in telemetry and kinship estimates can understate distant relationships.

World snapshots use schema version 8 and persist the pedigree map. Older snapshots reconstruct only the pedigree information still recoverable from currently living agents' parent IDs.

## Model integrity update

The active worker does not spawn a separate predator population. Predation is conspecific: members of the single evolving boid population may attack smaller agents based on inherited aggression, relative body size, sensory range, bite strength, and kin protection. Older references to predator counts, autonomous predator hunger, or predator-only movement controls do not describe the current implementation and should not be used to configure experiments.

The phase-one worker update now uses a fixed 1/60-second simulation step, a seeded random generator, double-buffered movement state, unique individual IDs, and schema-v8 snapshots. Food claims are collected from the same pre-movement state and proportionally allocated when patches are oversubscribed. Conspecific attacks are queued and resolved after agent decisions, with at most one rewarded kill per target.
