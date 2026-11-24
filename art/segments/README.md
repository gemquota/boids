# Centipede segment art

The source artwork evolution sheets were processed into the runtime sprites below. The runtime is self-contained in this directory; it does not need the source sheets at startup.

The runtime uses 253 transparent WebP crops generated from those sheets:

- 1 shared base sprite
- 36 first-level sprites (6 branches × 6 forms)
- 216 deeper sprites (6 branches × 6 forms × 6 variants)

A centipede inherits three compact morphology genes: `branch`, `form`, and `variant`. Every segment develops independently through the same path: base art, its inherited first-level form, then its inherited deeper variant. Offspring recombine parental morphology and occasionally mutate one of those choices.

The crops are stored under `art/segments/` and loaded lazily by the renderer, so the simulation does not request all 253 images at startup.
