# Architecture and runtime model

## Runtime overview

BOIDS is a dependency-free browser application split into two execution contexts:

1. `index.html` owns the interface, configuration controls, input handling, telemetry and analysis canvases.
2. `boids-worker.js` owns the simulation state, agent updates, environment, neural evaluation, evolutionary events and the main simulation canvas.

The UI transfers the visible canvas to the worker with `transferControlToOffscreen()`. The worker obtains a 2D context with `desynchronized: true` and draws the field. This keeps the simulation loop off the UI thread, but it does not move the computation onto the GPU.

The app currently requires Web Workers and OffscreenCanvas. If OffscreenCanvas is unavailable, the page displays a compatibility message. There is no main-thread rendering fallback yet.

## Frame pipeline

A worker frame follows this broad order:

1. Resize/rebuild the spatial grid if its cell dimensions changed.
2. Insert each living boid into the uniform grid.
3. Regenerate available food-patch stock.
4. For each boid:
   - collect local neighbours;
   - accumulate separation, alignment and cohesion data;
   - identify a nearby eligible mate;
   - sense nearby predator threat and available food;
   - evaluate the neural network when that boid's staggered brain-update slot is due;
   - combine flocking, neural outputs, currents, turbulence, obstacle avoidance, pointer forces and food attraction;
   - integrate velocity and position;
   - update food intake, energy, age, fitness, reward and gestation;
   - conceive or deliver offspring when the relevant conditions are met.
5. Move predators using nearby grid cells and apply attacks.
6. compact dead agents out of the active arrays.
7. Draw obstacles, food patches, genome-coloured agents and predators.
8. Periodically calculate population and genetic telemetry and post it to the UI.

The worker uses a timer-based scheduler at approximately 16 ms intervals. Actual frame cadence is device- and workload-dependent.

## Data layout

Agent state is stored in typed arrays rather than one object per boid. Position, velocity, age, energy, pregnancy, sex, fitness, lineage, neural state, learning traces and genome data are held in parallel arrays indexed by agent ID.

A connection gene occupies three numeric values:

- source neuron index;
- destination neuron index;
- signed connection weight.

The genome array is laid out by agent, then connection locus, then the three gene values. The paternal genome array stores a conception-time snapshot for pregnant agents. Neural hidden state and eligibility traces are also stored in flat arrays.

This layout reduces object allocation and makes compaction, copying and indexed iteration predictable. It does mean that any change to the number of connection genes must migrate every per-agent genome and learning array together.

## Spatial partitioning

A uniform linked-cell spatial hash stores boids using `cellHead` and per-agent `link` arrays.

- Cell size is at least the larger of the configured perception radius and mate-search radius (with a small lower bound).
- Flocking still filters candidates against the actual perception radius.
- Mate search filters against its own radius.
- Predator targeting examines a local window of grid cells instead of scanning the full population for every predator.

The grid is rebuilt from the positions at the start of each frame. Predator queries therefore use the current frame's grid snapshot, while boid positions are updated sequentially during the frame.

## Rendering

Boid hue is derived from a hash of every connection's endpoints and weight. A per-agent hue cache avoids hashing the entire genome on every render frame. Genome mutations, plasticity updates and topology changes invalidate the relevant cache entries.

Agents are grouped into 24 hue buckets and drawn as batched line paths. The field uses Canvas2D trails, not GPU instancing or a shader pipeline.

## Population resizing and adaptive quality

The population slider and adaptive-quality controller resize the active population without resetting surviving agents:

- decreasing the population truncates the active tail;
- increasing it initializes only the additional agents;
- a deliberate **New randomized population** action resets the population and run-level history.

The UI starts with a smaller population on narrow/mobile screens than on desktop. Adaptive quality reacts to reported FPS: it reduces population after repeated low-FPS samples and gradually restores population toward the user's desired count after sustained high-FPS samples. The controller has a lower population floor to avoid reducing the simulation to a trivial handful of agents.

## Configuration changes

Changing the number of hidden neurons remaps existing hidden/output neuron indices and resizes recurrent state. Changing connection count migrates the shared loci and their eligibility traces, then initializes any additional connection genes. When both values change together (for example, loading a saved preset), migration uses the old and new strides explicitly so the genome layout remains valid.

Reproductive age settings are normalized so the latest reproductive age remains above the earliest age, and maximum lifespan remains above the latest reproductive age.

## Extension guidelines

When adding per-agent state:

1. Allocate it in `allocArrays()`.
2. Initialize it for new and reset agents.
3. Copy it during offspring creation where inheritance is intended.
4. Copy it during swap-compaction when the final active agent is moved into a removed slot.
5. Resize/migrate it when its stride depends on a configurable genome dimension.
6. Include it in the per-agent inspection or telemetry path only when useful.

Missing one of these steps creates subtle state leakage between unrelated agents after population compaction or configuration changes.
