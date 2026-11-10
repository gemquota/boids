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

`evolution.js` also provides an independently tested variable-length regulatory-genome API with stable gene/edge identities, duplication, deletion, insertion, identity-preserving rearrangement, crossover, signed activation/repression, environmental inputs and bounded iterative expression. This remains a standalone model primitive: it is not yet connected to live offspring inheritance, worker snapshots, the phenotype cache or Observatory. A fully integrated live trans-regulatory network and stage-specific expression remain outstanding. Do not document the standalone API as fully integrated live biology.

## Neural genomes and NEAT

Each agent carries a variable-length neural genome:
- node genes: stable ID, input/hidden/output type, activation function and bias;
- connection genes: historical innovation ID, source, destination, weight, enabled flag and recurrent flag.

Structural mutation includes connection addition, connection splitting, connection/node deletion, enable/disable changes, recurrent-edge mutation and node activation/bias/weight changes. Crossover aligns genes by innovation and handles disjoint/excess genes according to parent fitness. Sparse compiled networks execute in the worker with per-agent recurrent state.

The live selection layer performs compatibility-based speciation, adaptive threshold control, fitness sharing, stagnation tracking, integer offspring quota allocation, configurable champion reproductive preservation, temporary structural-innovation grace windows and same-species mate preference with fallback. Selection fitness incorporates survival duration, energy condition and lifetime offspring contribution. This is NEAT-style selection in an overlapping-generation agent-based population, not a textbook generation-synchronous NEAT implementation.

## Lifetime learning

Reward-modulated plasticity and eligibility traces produce a learned-weight overlay separate from inherited connection weights. The overlay can be inherited according to the configured learned-weight blend. It must remain separate from the inherited genome.

## Population-genetic telemetry

Current worker metrics include:
- 16-bin per-trait allele-frequency summaries and allele richness;
- expected gene diversity (Hₑ) calculated from those bins;
- pedigree-derived individual/population inbreeding;
- preliminary mid-parent/offspring regression estimates using parental trait values recorded at conception, with sample sizes and t-based 95% slope intervals;
- species entropy and regulatory activity/variance;
- a reproductive-skew-adjusted effective-breeder index: inverse-Simpson parental contribution counts within each sex combined by their harmonic mean; provisional additive-genetic and phenotypic variance/covariance summaries are also exposed with explicit assumptions.

Important caveats:
- Hₑ is not observed diploid heterozygosity because paired diploid alleles are not represented.
- Heritability estimates are preliminary and use parental trait values captured at conception, so they do not require parents to remain alive at measurement time. Offspring sampling, pedigree truncation and selection can still introduce bias.
- The effective-breeder estimate uses realised recorded offspring contributions among identified parents, calculates an inverse-Simpson effective number of breeders separately for each sex, then combines the two sex-specific effective counts using their harmonic mean. This is an effective-breeder index, not the classical sex-ratio Ne equation. It still omits non-breeders from the contribution sample and is not a temporal/cohort effective-population-size estimator for an overlapping-generation population.
- Pedigree estimates are bounded by retained pedigree depth and truncation policy.

## Selection and fitness

Fitness is a model-specific proxy based on simulated state and reproductive outcomes. It is not a calibrated biological fitness function. Interpret selection differentials and lineage contribution as descriptive outputs, not proof of causal genetic effects.
