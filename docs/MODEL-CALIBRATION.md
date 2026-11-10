# Model assumptions and calibration status

## Scope

BOIDS is a deterministic, dimensionless artificial-ecology model. Its constants and relationships are exploratory choices, not measurements fitted to a real species, biome or physical water system.

## Interpretation rules

- Trait values and expression bounds are model parameters, not empirical biological ranges.
- Body-size maintenance and speed trade-offs are stylised energetic constraints.
- Plant biomass and freshwater proximity form the current basal resource/hydration model.
- Predation is conspecific and occurs within one evolving population.
- Neural controllers are evolved sparse networks with recurrent state and lifetime plasticity overlays.
- Species are compatibility clusters maintained by the evolutionary algorithm; they are not automatically equivalent to biological species or reproductively isolated populations.
- Expected gene diversity from binned quantitative values is not observed diploid heterozygosity.
- Heritability and effective-size telemetry are preliminary estimates with documented assumptions and sampling limits.
- Fitness and selection are operational model quantities, not validated biological measurements.

## Calibration work still required

1. Define target phenomena and measurable reference datasets before tuning parameters.
2. Separate numerical stability tests from biological/ecological validation.
3. Run independent seeded replicates and report uncertainty.
4. Test sensitivity to population size, time step, mutation, resource supply and habitat structure.
5. Validate energy conservation/accounting and plant resource balance.
6. Test whether observed strategies persist across independent initial conditions.
7. Avoid claiming calibration until parameters have been fitted and evaluated against external observations.

## Benchmark interpretation

Report the exact commit, browser/runtime, device, population, configuration, warm-up period, measured interval and summary statistic. Node worker benchmarks do not include browser rendering, compositor, touch or device-specific worker overhead.
