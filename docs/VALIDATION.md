# Validation, performance and known limitations

## Lightweight validation

The repository is a static browser project with no package install or build pipeline. Before submitting a change:

1. Parse the worker JavaScript.
2. Extract and parse the inline UI script from `index.html`.
3. Confirm every ID in the slider registry exists in the document.
4. Confirm each slider key is present in the worker configuration and is consumed by simulation logic.
5. Open the page in a browser with OffscreenCanvas worker support.
6. Confirm the field animates and the worker posts periodic stats.
7. Open both drawers and exercise each tab.
8. Change connection count and hidden-neuron count separately and together.
9. Change the population slider in both directions and confirm surviving agents are not reseeded.
10. Save and reload settings; test the defaults action.
11. Enable brain inspection, tap a boid and confirm its network graph renders.
12. Let the simulation run long enough to observe food consumption, conception, gestation, birth, predation and mortality.

A JavaScript parser check proves syntax only. It does not prove simulation correctness or acceptable performance on a target device.

## Performance model

The simulation runs on the CPU in a Web Worker. The primary performance costs are:

- rebuilding the spatial grid;
- local-neighbour scans;
- evaluating sparse neural connections;
- per-agent food-patch scans;
- predator target searches;
- genome analysis and rendering.

The implementation uses typed arrays, a linked-cell spatial hash, staggered neural updates, cached genome-derived hue, and batched hue-bucket drawing to reduce overhead.

Population, connection count, hidden-neuron count, predator count, food-patch count and device/browser implementation all affect frame rate. The adaptive-quality controller adjusts population only; it does not change neural topology or silently simplify the genome.

## Known limitations

- Rendering uses Canvas2D on OffscreenCanvas. There is no WebGPU compute/render path.
- Browsers without OffscreenCanvas worker support receive a compatibility message; there is no main-thread fallback.
- The population history is held in memory and resets with a new randomized population or page reload.
- Saved settings persist in browser-local storage, but population state, genomes, pregnancies, environment state and historical samples are not serialized.
- Fitness is a heuristic proxy based on energy, age and pregnancy. It is not a formal evolutionary objective or a calibrated biological model.
- Food, energy, predation, reproduction and neural learning are intentionally simplified agent-based mechanics. They should not be interpreted as biologically validated ecological models.
- The genetic history heatmap tracks genome-signature bins over time. It is not yet a persistent per-locus allele-frequency archive.
- The current neural learner is reward-modulated Hebbian plasticity with eligibility traces, not backpropagation or a general-purpose reinforcement-learning algorithm.
- Performance figures from one browser/device are not portable benchmarks. Validate on the target mobile device and population settings.

## Suggested adversarial test matrix

| Area | Stress case | Expected invariant |
|---|---|---|
| Population | Reduce to minimum, then increase to maximum | Surviving agents retain state; only added agents are initialized. |
| Genome stride | Change connections and hidden neurons in the same settings load | All source/destination indices remain within the active neuron layers. |
| Reproduction | High drive, high fertility, short gestation | Population never exceeds allocated capacity; pregnancy and births remain consistent. |
| Mate selection | Mate preference at -1, 0 and +1 | Dissimilar, proximity-neutral and similar preference modes differ as intended. |
| Environment | Zero food patches and zero predators | No NaN values or invalid array access. |
| Boundaries | Toggle wrapping while resizing the viewport | Agents remain within valid coordinates and neighbour queries remain bounded. |
| Learning | Plasticity off, then high plasticity and reward sensitivity | Weights remain bounded and disabled learning does not drift. |
| UI | Drag sliders while a drawer is open | Slider interaction does not accidentally dismiss the drawer. |
| Persistence | Save, reload, load, defaults | Configuration restores; live simulation state is not falsely implied to restore. |
| Performance | Maximum population, connections and predators | No runaway allocations or unbounded loops; FPS telemetry remains live. |
