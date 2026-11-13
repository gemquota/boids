# Emergence and developmental continuity

BOIDS now has an explicit lower-level origin pathway rather than treating the first visible boid as the beginning of the world.

## Developmental sequence

1. **Pre-chemistry:** thermal motion, diffusion fields, mineral/catalyst surfaces, adsorption/desorption, adhesion and aggregate formation. Adhesions are not treated as covalent chemistry.
2. **Chemistry:** exported constituents enter the dedicated abiogenesis worker, where elemental identity, valence, molecular bonds, reactions, energy and resource clouds are represented.
3. **Protocell:** amphiphilic lipid molecules form a compartment around carried molecular contents. This remains a mechanistic abstraction; it is not yet spontaneous bilayer self-assembly.
4. **Pre-boid:** a persistent compartment is assigned an internal state and primitive environmental sensitivity.
5. **Proto-boid:** motility, sensory range and heritable founding traits are introduced. The resulting trait vector seeds the live Boids population.
6. **Boids:** the existing organism worker takes over. Its macroscopic physics remains separate from microscopic particle mechanics.

## Integration

- `emergence-pipeline.js` implements the deterministic primordial substrate.
- `emergence-lab.html` exposes the pre-chemical stage and exports persistent constituents and valid adhesion topology.
- `abiogenesis-lab.html` imports that export, then exposes collection, crafting, metabolism, resource exchange, lipid assembly, protocell formation and proto-boid graduation.
- `boids-worker.js` accepts a proto-boid founding seed and applies its ten founding trait loci to the initial population.
- The main simulation links to the origins pathway through the **Origins** tab.

## Boundaries

The pre-chemical layer is a coarse-grained exploratory model, not a simulation of a known historical abiogenesis pathway. Adhesion, adsorption and catalysis are simplified. The lipid membrane is still an abstract compartment, and pre-boid sensing is represented as a capability/trait transition rather than a detailed cell signalling network. The existing Boids ecology and organism physics are not replaced by atom-scale mechanics.
