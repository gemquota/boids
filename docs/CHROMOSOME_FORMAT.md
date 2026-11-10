# Hexadecimal chromosome format

**Format identifier:** `boids-hex-gene-v1`  
**Chromosome representation:** ordered array of uppercase hexadecimal strings, one independently decodable gene per string.

The chromosome is the persistent genetic representation. The worker decodes it into typed runtime arrays for simulation. JSON snapshots preserve the hex strings as the canonical representation; typed arrays are also included as derived execution-state data and are reconstructed with their declared constructors on restore.

## Gene records

All multi-byte integers and IEEE-754 values use little-endian byte order.

| Gene | Byte layout | Length |
|---|---|---:|
| Trait | type:u8, stableTraitId:u8, value:f32 | 6 bytes |
| Neural connection | type:u8, innovation:u32, source:u16, destination:u16, weight:f32 | 13 bytes |

Gene type values:

- `01`: trait gene
- `02`: neural connection gene

Trait identifiers are stable semantic codes, not array offsets. The initial codes map to aggression `11`, body size `23`, speed `37`, bite strength `41`, kin affinity `52`, sensory range `68`, acceleration `73`, agility `84`, risk tolerance `96`, and exploration `A7` (hex). The decoder maps these identifiers into runtime loci; chromosome order does not carry trait meaning. The neural connection source and destination are unsigned 16-bit integers. They are not floating-point values. Weights and trait values are IEEE-754 binary32 values.

## Example

A connection gene with innovation 42, source neuron 3, destination neuron 12 and weight -0.742 has this conceptual byte layout:

```text
02 | 2A 00 00 00 | 03 00 | 0C 00 | [4-byte little-endian float32]
```

The encoder emits the bytes as one uppercase hexadecimal string. The actual final four bytes are generated from the exact float32 representation, not from a decimal text conversion.

## Evolution and runtime

- Chromosomes are sequences, not fixed three-number records.
- Gene order does not determine trait identity or neural endpoints.
- Each gene is independently typed and length-validated.
- The decoder returns `Uint16Array` source and destination arrays, `Uint32Array` innovation identifiers, and `Float32Array` weights and trait values.
- Runtime arrays are derived working data. The worker refreshes the chromosome after reproduction and neural plasticity changes, and serializes a current chromosome for each creature when exporting a snapshot.
- Schema-v8 snapshots remain loadable. Schema-v9 snapshots include `chromosomeFormat`, `chromosomes`, and `paternalChromosomes`.

This is the first stable byte-level chromosome format. Future gene types must use new type identifiers and explicit payload layouts; existing type layouts must not be silently reinterpreted.
