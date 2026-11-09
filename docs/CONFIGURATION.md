# Configuration reference

Values below describe the current slider ranges and initial UI values. Some controls are grouped into presets or toggles rather than numeric sliders.

## Motion

| Control | Range | Initial value | Effect |
|---|---:|---:|---|
| Population | 300–12,000 | 2,000 | Desired active population. Resizing preserves surviving agents; the explicit reset action reseeds. |
| Simulation speed | 0.25–3 | 1 | Scales the simulation timestep and therefore all simulated processes. |
| Current turbulence | 0–2 | 0.35 | Adds local variation to the environmental flow field. |
| Cruising speed | 0.5–5 | 2.5 | Base velocity limit. |
| Perception radius | 18–90 | 42 | Flocking-neighbour distance. |
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
| Mutation probability per gene | 0–0.5 | 0.025 | Probability that each inherited connection gene mutates. |
| Mutation magnitude | 0.01–1.5 | 0.25 | Weight perturbation magnitude. Endpoint mutations can rewire a connection. |
| Genome crossover mixing | 0–1 | 0.5 | Probability of selecting the maternal rather than paternal source gene at a locus. |
| Parental weight blending | 0–1 | 0.15 | Blends the selected inherited weight toward the parental mean. |

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
| Predator count | 0–18 | 5 | Number of active predators. |
| Reef structures | 0–18 | 7 | Number of circular obstacles. |
| Renewable food patches | 0–40 | 14 | Number of finite, regenerating food sources. |
| Food preference | 0–2 | 0.75 | Strength of steering toward stocked food patches. |
| Metabolic rate | 0.25–3 | 1 | Scales energy expenditure. |
| Juvenile age | 0–40 | 8 | Age below which predators receive a vulnerability multiplier. |
| Juvenile vulnerability | 0–4 | 1.5 | Multiplier on predator attack probability for juveniles. |
| Food regeneration | 0–1 | 0.12 | Rate at which food-patch stock recovers. |
| Predator hunting drive | 0–1 | 0.45 | Scales pursuit/attack behaviour. |
| Predator strike range | 4–32 | 12 | Distance within which an attack can occur. |
| Current strength | 0–1.8 | 0.45 | Base environmental flow strength. |
| Trail persistence | 0.04–0.5 | 0.14 | Canvas trail fade amount; lower values retain trails longer. |

### Toggles

- **Wrap world boundaries:** boids and predators cross the field edges.
- **Adaptive performance quality:** automatically adjusts active population toward the selected target based on recent FPS.

## Settings persistence

The Save settings action stores the current UI configuration in browser-local storage. Load settings restores it in that browser profile. Defaults restores the shipped initial settings. This saves configuration only; it does not serialize the live population, genomes, environment state or history.
