# Design philosophy: an observable universe of emergence

## Purpose

BOIDS is an abstract, interactive philosophy of emergence. It uses a simulated universe to make difficult ideas about organisation, complexity, life, cognition and collective behaviour visible through experimentation.

It is an educational and exploratory instrument, not a scientific simulator whose primary goal is quantitative fidelity. Scientific concepts provide useful starting points and vocabulary, but the model may compress scale, distort time, exaggerate interactions, combine mechanisms or invent simplified rules when doing so makes a concept easier to observe and understand.

The standard is not "does this reproduce nature exactly?" The standard is "does this create a coherent, inspectable demonstration of the idea?"

## Player experience

The experience should reward both casual observation and deep investigation.

- **Casual observation:** compelling motion, readable visual distinctions, intuitive interactions, surprising outcomes and clear cause-and-effect. A player should be able to enjoy watching without reading a technical manual.
- **Investigation:** inspect entities, relationships, traits, histories, material flows, energy use, rules and parameters. Players who want to understand the machinery should be able to follow it.
- **Shared simulation:** these are two levels of access to the same world, not separate modes or parallel implementations.

The simulation should demonstrate processes rather than merely describe them. Players should be able to watch a pattern form, alter its conditions, compare outcomes and develop an intuition for why it happened.

## Core principles

1. **Intelligibility over fidelity.** Prefer a legible demonstration to an opaque but more realistic calculation.
2. **Continuity over disconnected stages.** Matter, energy, composition, relationships and consequences should persist as systems transform. A later phenomenon should have a traceable origin in earlier activity.
3. **Emergence over scripted spectacle.** Provide ingredients, constraints, opportunities and interaction rules. Avoid hard-coded outcomes masquerading as discovery.
4. **Interaction over isolated complexity.** Rich behaviour should arise from relationships among simple components, not from a growing pile of unrelated special cases.
5. **Accessibility without dilution.** The surface experience should be understandable while deeper state and mechanics remain available for inspection.
6. **Coherence over realism.** Fictional rules are acceptable when their consequences are consistent, discoverable and useful to the concept being demonstrated.
7. **Wonder with explanatory value.** Visual spectacle should reveal structure, feedback, transformation or behaviour rather than obscure it.

## One universe, many forms of organisation

Cosmology, chemistry, biology, cognition, construction and ecology are conceptual lenses on one connected world. They are not mandatory game levels or mutually exclusive simulation modes.

Useful domains include:

- **Fundamental organisation:** simple entities, fields, forces, attraction, repulsion and pattern formation.
- **Cosmological organisation:** aggregation, collapse, orbital relationships, energy concentration and transformation.
- **Chemical organisation:** binding, reaction, assembly, catalysis, compartments and material exchange.
- **Biological organisation:** persistence, self-maintenance, resource acquisition, replication, variation and selection.
- **Organismic organisation:** specialisation, coordination, cooperation, competition and nested structures.
- **Cognitive organisation:** sensing, signal propagation, memory, feedback, learning and decision-making.
- **Constructive organisation:** gathering components, assembling tools and structures, and extending an organism's capabilities beyond its body.
- **Ecological organisation:** dependencies, resource flows, niches, collective dynamics and environmental feedback.

These forms can overlap, recur and arise at different scales. Do not enforce a fixed ladder in which every system must pass through a predefined sequence.

## Deliberately distorted scale and time

The simulated universe may compress or warp spatial scale, mass relationships, distance and time so that otherwise incompatible phenomena can coexist and be observed.

This is a design feature, not a defect to apologise for. A star, planet, cell, neural network and constructed tool may be visually close enough to inspect together even though their real-world counterparts are separated by enormous scales.

Keep three concerns distinct:

- **Representation:** how large, close or fast something appears to the player.
- **Model state:** the quantities and relationships the simulation tracks.
- **Interaction rules:** how entities affect one another and what consequences follow.

These layers may be transformed independently. Visual compression must not silently imply that every physical law has been scaled consistently. Instead, define clear fictional interaction rules and preserve their internal consistency.

Use adaptive resolution where helpful: individual components when their interactions matter, coarse-grained populations when detail would add cost without insight, and aggregate objects for large-scale phenomena. Expose the level of abstraction to investigators when it affects interpretation.

## Continuity and shared foundations

Across all domains, prefer shared concepts for:

- entity identity and composition;
- parent/child organisation and explicit relationships;
- spatial position and neighbourhood;
- energy sources, transfer, conversion and dissipation;
- material inputs, outputs and transformation;
- time, rates and scheduling;
- environmental fields and constraints;
- deterministic state, history and inspectable events.

A system may use a specialised solver, but it should exchange state through explicit, documented boundaries. Do not create disconnected demonstrations that merely happen to share a screen.

Conservation can be conceptual rather than physically exact, but material and energy accounting should remain understandable. If a process creates, destroys, converts or abstracts something, make that rule explicit.

## Embodied cognition and construction

Neural systems should be part of the organism's organisation, not an unrelated floating overlay. Their connections and signals should influence sensing, memory, action and learning. Their activity may have resource costs and structural constraints where those details improve the demonstration.

Organisms may also gather simpler components from their surroundings and assemble external structures. Tools, shelters, sensory extensions, manipulators, signalling structures and shared infrastructure can expand what an organism or group can do. These constructions should have material origins, costs, persistence and consequences.

The important idea is that capability can emerge from the combination of an organism, its internal organisation, other organisms and the structures it creates in its environment.

## Presentation and investigation

The interface should support two complementary rhythms:

- **Watch:** minimal friction, clear visual hierarchy, meaningful phase/context labels, readable population and system summaries, and controls that invite experimentation.
- **Inspect:** select an entity or structure, reveal its composition and relationships, trace its history, inspect relevant parameters and follow the causes of an observed behaviour.

Technical detail should be available progressively. Avoid forcing every player to understand every counter before the world becomes interesting. Avoid hiding the machinery from players who actively seek it.

## Design test

Before adding a mechanic or subsystem, ask:

1. What concept does this help a player observe or investigate?
2. What visible behaviour will communicate that concept?
3. Which existing entities, materials, energy or relationships does it use?
4. What persists, changes or feeds back into the rest of the world?
5. Can a curious player inspect why the outcome occurred?
6. Does the added complexity create a new interaction, or merely another isolated feature?

A feature that is technically elaborate but visually and conceptually opaque is not automatically valuable.

## Relationship to scientific models

Scientific fidelity remains useful when it supports understanding, provides a meaningful constraint or offers an interesting comparison. It is not the governing objective. Label approximations honestly, distinguish illustrative mechanisms from established science, and never present invented rules or outcomes as scientific consensus.

The project's central question is:

**How does complexity arise from simplicity, and how does that complexity begin to shape the world that produced it?**
