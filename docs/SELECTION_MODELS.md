# Selection models

Selection is a separate organism-system service. The simulator reports observable outcomes; selection evaluates candidates and returns scores; reproduction consumes those scores. Selection modules never mutate organisms.

## Composition

A run may combine weighted models. Each model returns a normalised score in [0,1]. The combined score is the weighted mean. Models can be swapped per experiment without changing Core.

## Included model primitives

- Natural: observed fitness, performance or survival.
- Environmental: distance between expressed traits and configured local optima.
- Sexual: configurable mate-preference callback or attractiveness.
- Frequency-dependent: rewards a configured strategy frequency.
- Kin: direct fitness plus a related-success benefit.
- Group: group-level fitness.
- Artificial: experiment-defined trait or scoring callback.
- Neutral: equal weight, allowing drift through stochastic reproduction.

These are composable primitives, not claims that every model is a complete biological theory. In particular, kin and group selection require carefully defined causal and accounting assumptions before scientific interpretation.

## Reproduction integration

Use `createEvolutionAdapter` to select parents and inherit chromosome/neural material. Core should call the adapter through a narrow callback and remain ignorant of model names, fitness equations and research telemetry.

## Reproducibility

Pass the simulator's seeded random function into the adapter. Record model names, weights, configuration and random seed in each experiment snapshot.
