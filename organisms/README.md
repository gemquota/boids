# Organism Systems

Independent, versioned modules. The normal field runtime enables hereditary genetics, neural evolution and speciation by default; individual modules can be disabled or replaced through adapters.

## Modules

- **Genome**: typed genes encoded in hexadecimal chromosome sequences; mutation and recombination preserve record boundaries.
- **Neural evolution**: variable-topology networks, integer node/innovation identifiers, weighted connections, structural mutation, crossover and recurrent-capable evaluation.
- **Speciation**: compatibility-distance clustering with persistent representatives and extinction reporting.
- **Selection**: composable natural, environmental, sexual, frequency-dependent, kin, group, artificial and neutral model primitives.
- **Evolution adapter**: connects parent selection, chromosome inheritance and neural evolution to Core callbacks.
- **Genetics**: expressed organism traits and bounded trait inheritance, including inherited segment-growth efficiency.
- **Centipede morphology**: six foundational segment families arranged as a cyclic hexagonal species ring. Organisms can breed within their own lineage or with either adjacent lineage; distant lineages are reproductively isolated. Adjacent crosses produce fractional intermediary species positions and visually blended parental segment families, with backcrossing and inherited morphology variation. The four-stage art tree retains the original family assets and develops each segment according to age.
- **Ecology**: habitat gradients, renewable resources, grazing and environmental stress.
- **Future extensions**: regulation, epigenetics, developmental morphology, advanced kinship and inbreeding models.

## Contracts

Organism packages exchange serialisable definitions and snapshots. They do not retain live Core objects. Core accepts narrow callbacks for parent choice, inherited organism data and behavioural control; it does not import these modules or know their algorithms.

Missing modules fall back to baseline movement, local mate selection and trait inheritance. Extension errors must not prevent the world from running.
