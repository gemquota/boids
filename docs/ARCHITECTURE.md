# Reboot Architecture

## Three independent foci

`core/`, `organisms/` and `labs/` are peers. Only data contracts connect them.

```text
              versioned definitions / snapshots
     +--------------------+ <--------------------+
     |                    |                      |
+----v-----+        +-----+----------+      +----+-----+
| Boids    |        | Organism       |      | Labs     |
| Core     |        | Systems        |      |          |
+----------+        +----------------+      +----------+
     |                    ^                      |
     +---- baseline ------+---- validated -------+
```

## Dependency direction

- Core depends only on platform primitives and its own code.
- Organism packages may define adapters for Core, but Core never imports them.
- Labs may use Core and Organism packages through public contracts.
- Core passes frozen, detached organism views to extension callbacks; adapters return plain inherited data. No extension receives a mutable live agent reference.
- Persistent definitions, snapshots and analysis exports are serialisable and versioned.

## Failure containment

Unknown schema version: reject the payload, preserve the running world.
Missing organism extension: use baseline agent.
Lab exception: terminate the experiment, not the simulator.
Renderer exception: report diagnostics and retain a recoverable simulation state.

## Reboot sequence

1. Establish Core behaviour and smoke tests.
2. Freeze the snapshot/definition contract.
3. Port organism systems one at a time behind adapters.
4. Rebuild labs as clients of those contracts.
5. Add integration only after standalone behaviour is proven.
