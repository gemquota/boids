# Snapshot schemas and migration contract

## Independent version domains

| Layer | Current version | Meaning |
|---|---:|---|
| Worker world snapshot | `schemaVersion: 21` | Simulation state and deterministic continuation |
| Browser IndexedDB envelope | `storageSchemaVersion: 2` | Browser storage wrapper and latest/previous snapshot slots |
| Hexadecimal chromosome codec | `boids-hex-gene-v1` | Compact typed chromosome projection; not a complete NEAT genome |

These versions are independent. Never overwrite the worker's `schemaVersion` with the IndexedDB envelope version, and do not treat the chromosome codec version as a world snapshot version.

## Restore policy

The worker accepts snapshots with no version marker or a `schemaVersion` no newer than 21. It rejects snapshots newer than the runtime. Migration is primarily field-presence-based rather than a chain of one function per historical schema: older records are hydrated with explicit defaults where safe, and unavailable historical information is not fabricated.

| Missing or legacy state | Restore behaviour |
| Variable-length per-agent eligibility traces (schema 19) | Persist traces aligned to each agent's innovation-identified connections; older snapshots reconstruct available trace slots from the legacy fixed-size eligibility array and initialize remaining entries to zero |
| Structural-innovation protection ages (schema 20) | Persist the introduction time of new NEAT innovations so temporary reproductive preservation windows continue correctly after restore; older snapshots start with no active protection windows |
| Variable-length trans-regulatory genomes (schema 21) | Persist per-agent regulatory nodes/edges, stable copy/edge IDs, paternal network state and the global innovation registry. Older worlds receive a neutral ten-node network with zero effect and no edges, avoiding invented historical regulatory activity |
|---|---|
| Legacy `foodPreference`, `foodRangeScale`, `foodMinRange`, `foodSteering` config | Map to the corresponding plant-resource controls when the new plant field is absent |
| Legacy compact chromosome / fixed-slot genome data | Decode the typed chromosome projection and rebuild the runtime connection representation; full modern NEAT objects remain the authoritative representation when present |
| Six-locus trait arrays | Expand to the ten-locus layout; new acceleration, agility, risk and exploration loci receive documented neutral defaults |
| Missing trait arrays | Seed trait values; this does not recreate historical genotypes |
| Missing regulatory arrays | Fill cis-regulatory modifiers with neutral 0.5 values; pregnant paternal modifiers are copied from the available maternal state |
| Missing thirst array | Initialize thirst to 0.35 |
| Missing individual IDs | Allocate new unique IDs and clear unavailable parent identities; historical kinship cannot be reconstructed |
| Missing innovation registry / neural runtime state | Rebuild available genome structures and use neutral registry, learned-weight and recurrent-state defaults |
| Missing pedigree map | Reconstruct available parent links from the saved `parentA` / `parentB` arrays |
| Missing parental sex map | Infer sex only for currently living individuals; historical parent-sex records remain unavailable |
| Missing variable-length plasticity trace arrays | Initialize per-agent traces to genome length and migrate available legacy fixed-slot traces into matching leading connection positions |
| Missing lifetime reproductive-success map | Initialize current individuals with zero recorded reproductive success |
| Missing survival history | Record known prior death count as truncated history when available |
| Missing stable-ID survival entry ages | Initialize current agents' entry ages to their restored ages, discard incompatible historical survival rows, and increment the truncation count; this avoids inventing delayed-entry times |
| Missing conception-time parental trait records | Leave unavailable heritability samples absent rather than fabricate parental genotypes |

## Validation coverage

The worker tests exercise current snapshot round trips, legacy fixed-slot/trait migration, pedigree reconstruction, recurrent, learned-weight and variable-length plasticity-trace persistence, species/innovation state, delayed-entry survival history, and lifetime reproductive records. The full validation workflows additionally run syntax, configuration, ecology, genetics, deterministic replay and benchmark guardrails.

A passing migration test proves only the exercised fixtures. It does not prove that every historical user-created snapshot has been observed. Keep representative fixtures for each materially distinct legacy shape and add a fixture whenever a new persisted field is introduced.
