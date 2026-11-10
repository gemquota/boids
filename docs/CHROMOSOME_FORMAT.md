# Chromosome and genome persistence

## Two related representations

The project has a typed hexadecimal gene-record codec in `chromosome.js` and a richer live NEAT genome object.

Do not conflate them:

- The hexadecimal codec encodes ten stable trait-locus records and compact connection records.
- The full variable-length NEAT genome stores node type, activation, bias, connection innovation, endpoints, weight, enabled state and recurrent state.
- Schema-18 world snapshots preserve full NEAT genome objects and the additional learned-weight/recurrent state required to resume execution. Hexadecimal chromosome arrays are a compact typed representation/projection, not a lossless substitute for every NEAT field.

## Hexadecimal codec v1

Each gene is an independently typed byte record encoded as uppercase hexadecimal.

### Trait record

| Field | Bytes | Encoding |
|---|---:|---|
| Type | 1 | `0x01` |
| Stable locus ID | 1 | unsigned byte |
| Value | 4 | little-endian Float32 |

Trait record length: 6 bytes.

Stable trait IDs are declared in `chromosome.js`; they are not array offsets.

### Connection record

| Field | Bytes | Encoding |
|---|---:|---|
| Type | 1 | `0x02` |
| Innovation | 4 | little-endian uint32 |
| Source node | 2 | little-endian uint16 |
| Destination node | 2 | little-endian uint16 |
| Weight | 4 | little-endian Float32 |

Connection record length: 13 bytes.

The compact connection record does not encode enabled state, recurrent state, node activation, or node bias. Those fields must be retained in the full NEAT genome snapshot.

## Validation

The codec rejects malformed hexadecimal, odd-length byte strings, unknown record types, invalid record lengths, duplicate trait IDs, invalid innovation IDs, out-of-range node IDs and non-finite values.

## World snapshot schema

The worker snapshot schema is **19**. It persists full variable-length genomes, innovation registry and species state, inherited regulatory loci, learned-weight overlays, recurrent activations, pedigree, delayed-entry survival history, stable-ID entry ages, lifetime reproductive-success and parent-sex identity state, per-agent variable-length plasticity traces, and relevant ecological/RNG state. Restore supports older schema versions through explicit migration/defaulting logic.

The browser IndexedDB envelope uses `storageSchemaVersion: 2`; the worker's `schemaVersion: 19` remains intact. The two fields are distinct and must never overwrite one another.

## Compatibility rules

- Stable IDs must not be reassigned to unrelated genes.
- Do not infer missing historical genes from phenotype colour.
- Do not fabricate parental or pedigree records during migration.
- When a new gene field is added, define its neutral legacy default and test it.
- Round-trip tests must verify deterministic continuation, not only object equality.
