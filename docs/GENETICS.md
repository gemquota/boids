# Genetics, reproduction and neural networks

## Neural architecture

Each boid currently has:

- **8 sensory input channels**
- **2–24 internal/hidden neurons** (configurable)
- **8 behavioural output channels**
- **4–64 connection genes** (configurable)

The eight sensory channels are:

| Index | Input |
|---:|---|
| 0 | Local neighbour density |
| 1 | Neighbour alignment |
| 2 | Separation pressure |
| 3 | Predator threat |
| 4 | Food proximity |
| 5 | Eligible mate proximity |
| 6 | Energy reserve |
| 7 | Age relative to lifespan |

The eight output channels are:

| Index | Output |
|---:|---|
| 0 | Turn |
| 1 | Acceleration/speed modulation |
| 2 | Alignment modulation |
| 3 | Cohesion modulation |
| 4 | Separation modulation |
| 5 | Predator evasion |
| 6 | Mate seeking |
| 7 | Reproductive drive modulation |

The UI allows individual sensory and output channels to be enabled or disabled. A disabled sensory channel is presented as zero input. A disabled output channel contributes zero neural output; the ordinary flocking controller remains available as the baseline movement system.

## Connection genes

Each connection gene stores exactly one directed connection:

`[source neuron, destination neuron, signed weight]`

The source is selected from the sensory or hidden layers. The destination is selected from the hidden or behavioural-output layers. Hidden-to-hidden connections are recurrent: they read the previous hidden-state activation. Input-to-hidden and input-to-output connections are also supported.

The number of connection loci is configurable. The initial genome of each boid is randomized, including endpoint arrangement and weight. The hidden-neuron count is a population-level configuration value; connection endpoints are remapped when it changes.

This is a sparse, fixed-locus network rather than a dense matrix. A gene mutation can alter the connection endpoints or perturb the connection weight.

## Brain evaluation and learning

Brain evaluation is staggered across frames using the neural update interval. This avoids evaluating every boid's network on every simulation frame.

Lifetime plasticity uses a reward-modulated Hebbian rule with a per-connection eligibility trace:

- the trace accumulates pre-/post-activation correlation;
- the trace decays according to the configured trace-decay value;
- the current reward signal gates weight updates;
- updated weights are clamped to a bounded range.

The reward signal is a small proxy derived from recent energy change, food intake and nearby threat. This is a simple reinforcement-like mechanism, not backpropagation, a critic network, or a formally optimized reinforcement-learning algorithm.

Plasticity changes the living agent's connection weights. The mother's current genome is used at birth, while the father's genome is snapshotted at conception. Thus maternal lifetime learning during gestation can affect offspring inheritance; paternal weights are fixed at conception for that pregnancy.

## Inheritance and mutation

At conception, the father's connection genome is copied into the pregnant parent's paternal snapshot. At delivery, each offspring receives a per-locus recombination:

- crossover chooses the maternal or paternal source gene;
- parental weight blending mixes the two parental weights by the configured amount;
- mutation is tested independently per gene;
- a mutated gene may change its source/destination endpoints or perturb its weight.

The mutation probability is per connection gene, not per genome. Mutation magnitude controls the maximum weight perturbation. Endpoint mutation uses the current hidden-neuron configuration.

## Reproduction

The current model uses two sex codes: 0 and 1. Sex-1 agents can carry pregnancies; they seek eligible sex-0 mates.

Conception requires:

- the carrying parent to be within its reproductive age window;
- sufficient energy;
- no existing pregnancy;
- a valid mate within mate radius;
- a successful reproductive-drive probability check.

Mate search begins with the nearest eligible local mate and evaluates a configurable number of additional population candidates. The mate preference control ranges from dissimilarity-seeking through neutral/proximity-biased to similarity-seeking. Similarity is calculated from connection endpoints and weights, not only from visible hue.

Gestation is a real delay. The father's genome snapshot is retained while the carrying parent counts down the configured gestation duration. Offspring are created at delivery. Fertility controls litter size. Births inherit lineage depth from the parents.

The earliest reproductive age, latest reproductive age and maximum lifespan are separate values. The interface constrains their ordering to prevent impossible age windows.

## Selection and ecological pressure

Fitness is a smoothed proxy based on energy reserve, age relative to lifespan and pregnancy state. Selection pressure increases mortality risk for lower-fitness agents. It is not a full ecological fitness landscape or a guarantee that a particular neural behaviour will be selected.

Other pressures include:

- starvation and metabolic costs;
- crowding/competition;
- environmental harshness;
- ageing;
- predator pursuit and attacks;
- increased vulnerability for juveniles.

Food patches have finite stock that regenerates. Boids can consume resources and use the food-preference setting to steer toward stocked patches. Predators pursue nearby prey and can kill agents within their strike range.

## Colour and genetic analysis

Boid hue is derived from a hash of all connection endpoints and weights. It is not a species label and does not represent a single gene. Similar-looking hues can still conceal meaningful genome differences; the colour space is a visualization, not a complete genotype encoding.

The observatory currently reports:

- distinct quantized genome signatures;
- a 16-bin population histogram of genome-derived colour signatures;
- a rolling history of those 16 bins (up to 600 samples);
- aggregate connection-weight mean and variance;
- per-locus connection-weight means and variances;
- aggregate output-neuron connection topology;
- population lineage/generation, conception, birth, death and mutation counts.

The observatory also retains up to 600 in-memory telemetry samples per run, including living population, cumulative births, deaths, conceptions, predator kills, mutations, mean diversity, age, energy, fitness, speed and genome-weight statistics. A separate 24-band history tracks the living population in genome-derived hue cohorts over time. These cohorts are visual phenotype groupings, not formal species labels or reproductively isolated taxa. The history is reset when a new randomized population is created and is not saved across page reloads. The historical heatmap is a genome-signature distribution, not a persistent per-locus allele-sequencing archive.


## v0.2.0 gene expression update

The canonical ten-locus schema is defined in genetics.js. The worker uses shared bounded expression helpers.

| Locus | Runtime expression in v0.2.0 |
|---:|---|
| 0 Aggression | Hunting eligibility, pursuit drive, attack probability and attack-related metabolic cost |
| 1 Body size | Rendered scale, size-relative hunting and metabolic demand |
| 2 Speed | Velocity cap and metabolic trade-off |
| 3 Bite strength | Attack probability and strike score |
| 4 Kin affinity | Continuous multiplier on pedigree-relatedness protection; zero means no kin avoidance |
| 5 Sensory range | Individual flock-perception radius, threat/prey detection radius and food detection range |
| 6 Acceleration | Steering-force limit and acceleration |
| 7 Agility | Neural turning authority |
| 8 Risk tolerance | Hunting probability and threat-response trade-off |
| 9 Exploration | Wandering-noise amplitude and food-attraction strength |

Kin protection is relatedness × kin affinity × global kin-protection strength. Personal perception radius is global perception × sensory range. Food detection uses the larger of minimum food range and personal perception × food-range scale. The spatial grid cell size covers the maximum supported sensory range. The neural connection genome remains fixed-slot in this release; structural neural evolution and population persistence are later phases.
