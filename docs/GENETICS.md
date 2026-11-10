# Genetics and inheritance

## Model scope

BOIDS is an exploratory quantitative-trait and neuroevolution model, not a diploid Mendelian simulator. It currently has one evolving boid population. Hunting is an inherited/learned behavioural strategy, not a separate predator species.

## Quantitative trait loci

The live trait schema defines ten loci:

1. Aggression
2. Body size
3. Speed
4. Bite strength
5. Kin affinity
6. Perception radius
7. Acceleration
8. Agility
9. Risk tolerance
10. Exploration

Each locus has stable index/bounds in `genetics.js`. Inheritance uses a maternal/paternal mid-parent value, a configurable inheritance-fidelity/noise term, and independent mutation rate/magnitude. These controls describe the simplified inheritance mechanism; the configured fidelity is not the same thing as an empirically measured heritability estimate.

## Genotype to phenotype

The expression pipeline normalizes inherited values, applies a selectable expression curve, applies expression bias and environmental sensitivity, then maps into phenotype bounds. Expression controls do not rewrite inherited allele values. The live worker uses the expressed phenotype for physical and behavioural decisions.

The ten-locus model is polygenic only in the broad sense that multiple loci contribute to population-level traits; it does not yet implement a general gene-copy regulatory architecture for every phenotype.

## Regulatory inheritance

The live worker carries inherited cis-regulatory modifiers that alter trait-expression bias and environmental responsiveness. These modifiers are distinct from the underlying trait loci.

`evolution.js` also provides general regulatory activation/repression and epistatic-expression primitives. Those functions are independently testable, but a full live trans-regulatory network with stable gene-copy identity, duplication/deletion/rearrangement and stage-specific expression remains outstanding. Do not document those primitives as fully integrated live biology.

## Neural genomes and NEAT

Each agent carries a variable-length neural genome:
- node genes: stable ID, input/hidden/output type, activation function and bias;
- connection genes: historical innovation ID, source, destination, weight, enabled flag and recurrent flag.

Structural mutation includes connection addition, connection splitting, connection/node deletion, enable/disable changes, recurrent-edge mutation and node activation/bias/weight changes. Crossover aligns genes by innovation and handles disjoint/excess genes according to parent fitness. Sparse compiled networks execute in the worker with per-agent recurrent state.

The live selection layer performs compatibility-based speciation, adaptive threshold control, fitness sharing, stagnation tracking, integer offspring quota allocation, champion reproductive pressure and same-species mate preference with fallback. This is NEAT-style selection in an overlapping-generation agent-based population, not a textbook generation-synchronous NEAT implementation.

## Lifetime learning

Reward-modulated plasticity and eligibility traces produce a learned-weight overlay separate from inherited connection weights. The overlay can be inherited according to the configured learned-weight blend. It must remain separate from the inherited genome.

## Population-genetic telemetry

Current worker metrics include:
- 16-bin per-trait allele-frequency summaries and allele richness;
- expected gene diversity (Hₑ) calculated from those bins;
- pedigree-derived individual/population inbreeding;
- preliminary mid-parent/offspring regression estimates using parental trait values recorded at conception, with sample sizes;
- species entropy and regulatory activity/variance;
- an idealised sex-ratio effective-size estimate.

Important caveats:
- Hₑ is not observed diploid heterozygosity because paired diploid alleles are not represented.
- Heritability estimates are preliminary and use offspring with available living-parent records. This introduces survivorship/sample-selection bias.
- The sex-ratio estimate assumes idealised reproductive success/random mating and is not a variance- or temporal-based effective population-size estimate for an overlapping-generation population.
- Pedigree estimates are bounded by retained pedigree depth and truncation policy.

## Selection and fitness

Fitness is a model-specific proxy based on simulated state and reproductive outcomes. It is not a calibrated biological fitness function. Interpret selection differentials and lineage contribution as descriptive outputs, not proof of causal genetic effects.
