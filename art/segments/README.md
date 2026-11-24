# Centipede segment art

The source artwork evolution sheets were processed into the runtime sprites below. The runtime is self-contained in this directory; it does not need the source sheets at startup.

The runtime uses 1,549 transparent WebP sprites:

- 1 shared base sprite
- 36 first-level sprites (6 branches × 6 forms)
- 216 second-level sprites (6 branches × 6 forms × 6 variants)
- 1,296 third-level sprites (6 branches × 6 forms × 6 variants × 6 terminal forms)

The third-level sprites are cropped from the 216 sheets in `art/new/03`; each sheet contributes six terminal forms. A centipede inherits four compact morphology genes: `branch`, `form`, `variant`, and `apex`. Every segment develops independently through the same four-stage path. Offspring recombine parental morphology and occasionally mutate one of those choices.

The crops are stored under `art/segments/` and loaded lazily by the renderer, so the simulation does not request all 1,549 images at startup.
