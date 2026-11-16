# Emergent cosmology and stellar evolution

The unified Emergence Lab begins with independently distributed protons, neutrons and electrons. It does not seed pre-labelled carbon, oxygen or other later-generation elements.

## Accelerated progression

1. **Primordial plasma:** free subatomic particles undergo simplified stochastic encounters.
2. **Primordial nucleosynthesis:** proton-neutron capture creates deuterium-like nuclei; subsequent captures produce helium and trace light nuclei.
3. **Recombination:** electrons bind to nuclei to form neutral atoms.
4. **Gas-cloud formation:** nearby atoms aggregate into diffuse, composition-bearing gas parcels.
5. **Gravitational collapse:** an accelerated 2D N-body approximation gathers gas into collapsing cores and stars.
6. **Stellar nucleosynthesis:** stars accumulate helium-burning and later-stage element yields according to their mass and age.
7. **Stellar winds:** stars continuously return small composition-bearing parcels to their surroundings.
8. **Stellar death:** low-mass stars leave white dwarfs; intermediate/high-mass stars eject supernova clouds and leave neutron stars or black holes depending on initial mass. The highest-mass direct-collapse branch is represented with weaker ejecta.
9. **Enrichment:** ejected parcels retain their elemental composition and momentum and remain in the gravitational environment for later mixing and collapse.

## Model boundaries

This is an accelerated, two-dimensional, coarse-grained teaching model, not a calibrated Big Bang, quantum nuclear, stellar-structure or hydrodynamics solver. Nucleon capture is stochastic and simplified; nuclear binding energies and detailed reaction networks are not solved. Gas parcels are coarse-grained mass carriers. Gravity uses softened pairwise forces at the current population scale rather than a Barnes-Hut tree. Stellar yields are illustrative, not precision yield tables. The implementation keeps composition spatially attached to matter rather than adding elements to a global counter.

The prior molecular chemistry primitives remain available in abiogenesis.js; coupling stellar-enriched atoms into the molecular reaction engine is a subsequent integration boundary. Cosmology snapshots preserve bodies, composition, ages, stellar stages, counters and deterministic world state.
