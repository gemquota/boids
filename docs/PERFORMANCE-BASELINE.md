# Performance baseline

## Measurement environment

- GitHub-hosted Ubuntu runner, Node.js **22.23.4**
- Commit: `cd79b367396d9580a2c891659b38df619a85fc76`
- Workflow: [Validate Boids run 42797674185](https://github.com/gemquota/boids/actions/runs/42797674185)
- Seed: `20261110`
- Initial populations: 100, 250, 500 and 1,000
- Warm-up: 12 fixed updates with draw traversal
- Measurement: 36 fixed updates and 36 draw traversals per population
- Draw uses a no-op Canvas2D context. It measures JavaScript traversal and geometry submission calls, not browser rasterisation, GPU/compositor cost or device performance.
- Snapshot size is UTF-8 JSON byte length. Restore time is measured into a second initialized world.
- Heap delta is a coarse Node process heap delta across both worlds, snapshot serialization and restore; it is not an isolated per-agent memory measurement.

## Results

| Initial N | Final N | Update mean | Update p95 | Draw mean | Draw p95 | Max frame steps | Max residual backlog | Snapshot JSON | Restore | Heap delta |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 100 | 100 | 6.358 ms | 10.204 ms | 0.609 ms | 0.951 ms | 4 | 15 ms | 1,253,742 B | 32.861 ms | 12.24 MiB |
| 250 | 250 | 17.993 ms | 20.297 ms | 0.734 ms | 1.051 ms | 4 | 15 ms | 3,122,964 B | 67.109 ms | 13.71 MiB |
| 500 | 497 | 43.186 ms | 54.805 ms | 0.880 ms | 1.006 ms | 4 | 15 ms | 6,217,359 B | 118.020 ms | 33.94 MiB |
| 1,000 | 994 | 124.463 ms | 143.934 ms | 1.214 ms | 1.339 ms | 4 | 15 ms | 12,499,341 B | 236.080 ms | 45.57 MiB |

Population decreases after warm-up are model mortality, not benchmark truncation. Update mean budgets (25/50/100/220 ms for N=100/250/500/1000) passed.

## Interpretation and limits

- Simulation update cost rises sharply with population size. The 1,000-agent mean is about 124 ms per fixed update on this runner, so this workload is not a 60 Hz 1,000-agent performance claim.
- Snapshot JSON grows approximately linearly with population and is already about 12.5 MB at 1,000 initial agents. Snapshot compaction/encoding and restore allocation deserve separate profiling.
- The 15 ms residual accumulator and four-step catch-up ceiling are bounded by the frame scheduler; this is not a queued-job backlog.
- These results are a reproducible CI reference, not an Android or desktop-browser performance certification. Browser rasterisation, real Canvas calls, touch handling, compositor overhead, memory pressure and long-running stability still require device testing.
- Re-run on the same runner/runtime and compare commit, seed, population, warm-up and sample counts before interpreting changes as regressions or improvements.
