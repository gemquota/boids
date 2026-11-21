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

The ten-locus model now supports explicit per-trait multi-locus equations. Each equation combines an intercept with one- to four-locus terms over centred normalized locus values; pairwise and higher-order products provide epistatic effects. Outputs are clamped to a declared per-equation magnitude before they enter the expressed phenotype, and inherited gene values remain unchanged. Five live, adjustable interaction controls currently model risk/aggression, body-size/speed trade-off, body-size/bite scaling, speed/agility/acceleration synergy, and risk/perception/exploration coupling. The generic equation API supports additional interactions; these five defaults are modelling hypotheses, not universal biological laws.

## Regulatory inheritance

The live worker carries inherited cis-regulatory modifiers and variable-length trans-regulatory networks. Network nodes and edges have stable identities; offspring inherit networks by identity-aligned crossover and mutate gene copies, signed regulatory edges, thresholds, biases and effects. The bounded network expression receives environmental and life-stage inputs and contributes to the live phenotype modifier separately from the underlying quantitative trait loci and lifetime neural learning.

The same variable-length regulatory-genome operators are used by the live worker: offspring receive identity-aligned maternal/paternal crossover, stable gene-copy and edge IDs, and mutation of copy number, edges, weights, thresholds, biases and effects. The worker persists per-agent networks, paternal state, identity allocator, derived expression arrays and a bounded 5,000-event mutation history in snapshots. It evaluates networks with bounded iterative activation/repression, supplies environmental and life-stage inputs, and applies per-locus expression modifiers in the live phenotype path. `evolution.js` also exposes the operators as standalone testable primitives. The separate multi-locus equation engine is likewise integrated into live phenotype refresh.

## Typed gene-record semantics

The v3 hexadecimal chromosome projection uses one uppercase hexadecimal string per typed record. Record tags distinguish:

- **Quantitative trait loci:** stable trait ID plus a float32 inherited value. These are ten haploid quantitative values in the current model, not paired diploid alleles.
- **Neural node genes:** 32-bit stable node ID, input/hidden/output type, activation enum and float32 bias.
- **Neural structural genes:** historical innovation ID, 32-bit integer source/destination node IDs, enabled flag and recurrent flag. Endpoints are integers, never float-encoded indices.
- **Neural connection genes:** historical innovation ID plus float32 weight, joined to structural topology by innovation ID.
- **Regulatory node genes:** stable copy ID, quantitative-locus ID, environmental-input ID, activation, enabled state, bias, threshold, effect and environmental sensitivity.
- **Regulatory edge genes:** stable edge ID, integer source/target copy IDs, signed float32 weight and enabled state.
- **Modifier genes:** stable modifier ID, target trait, one to four source-locus indices, coefficient and mode. Mode zero represents inherited cis modifiers; other modes support multi-locus/epistatic modifiers.

Legacy trait/connection records remain decodable. The compact v3 projection avoids duplicating legacy connection records: compatibility arrays are reconstructed from typed structural and neural-weight records. Full variable-length object genomes remain authoritative when present in snapshots.

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
- separate neural and regulatory architecture summaries: unique architecture frequency/diversity, innovation richness, mean node/edge counts, recurrent-edge fraction, and positive/negative regulatory edge composition;
- delayed-entry Kaplan–Meier all-cause survival and birth-cohort-specific survival/turnover summaries, including persisted cohort IDs, right-censoring, history truncation, and cohort mean/maximum lineage depth. Cohorts are deterministic 24-simulation-time-unit birth windows; only the latest 16 are displayed;
- a reproductive-skew-adjusted effective-breeder index: inverse-Simpson parental contribution counts within each sex combined by their harmonic mean; provisional additive-genetic and phenotypic variance/covariance summaries are also exposed with explicit assumptions.

Important caveats:
- Hₑ is not observed diploid heterozygosity because paired diploid alleles are not represented.
- Heritability estimates are preliminary and use parental trait values captured at conception, so they do not require parents to remain alive at measurement time. Offspring sampling, pedigree truncation and selection can still introduce bias.
- The effective-breeder estimate uses realised recorded offspring contributions among identified parents, calculates an inverse-Simpson effective number of breeders separately for each sex, then combines the two sex-specific effective counts using their harmonic mean. This is an effective-breeder index, not the classical sex-ratio Ne equation. It still omits non-breeders from the contribution sample and is not a temporal/cohort effective-population-size estimator for an overlapping-generation population.
- Pedigree estimates are bounded by retained pedigree depth and truncation policy.

## Selection and fitness

Fitness is a model-specific proxy based on simulated state and reproductive outcomes. It is not a calibrated biological fitness function. Interpret selection differentials and lineage contribution as descriptive outputs, not proof of causal genetic effects.
