# Run 16 remediation and follow-up experiments

## What the uploaded run actually showed

Run 16 ended with 13 organisms after starting with 200. It recorded 240 births and 103 biological deaths. Those counters alone cannot reconcile the final population. The previous worker also allowed the population-size control to remove organisms without recording those removals as deaths. That is a strong candidate explanation for the discrepancy, but Run 16 predates the new resize ledger, so the exact number of manually removed organisms cannot be recovered from that export.

The run recorded 12 spore releases and 23 germinations. Spore reproduction was present, but its throughput was low relative to the number of mature plants and the late decline in plant biomass. The export did not record why individual spores failed, so the new counters separate dry-site, crowding, and expiry losses. Code inspection found a likely cause of the low release count: plants stopped reproducing as soon as they transitioned from mature to grandmother or great-grandmother stages, because the reproduction gate accepted only the exact mature stage. Those older reproductive stages are now kept fertile until senescence or the reproductive-age limit.

The worker also reduced bond strength whenever linked organisms were separated. That made ordinary movement a bond-breaking mechanism. This is removed: agent bonds now persist through separation and are pruned when an endpoint organism dies. Colony members remain separate organisms with independent identity and life history.

## Changes in this branch

- **Population accounting:** initial population, births, deaths, and population-control additions/removals now reconcile explicitly. A bounded event log records initialization, resize events, births, deaths, colony bond creation/breakage, and severe collisions.
- **Bond persistence and mechanics:** newborns receive four temporary bonding sites, while adults gradually develop one or two permanent sites. Temporary-site expiry does not sever an established bond. Distance no longer weakens bonds; agent bonds are removed when a member dies. Each agent-agent bond carries a rest length, stiffness, and damping term and is solved as a mass-weighted physical spring. Colony members remain distinct organisms.
- **Plant recruitment:** spore release begins earlier, runs more frequently, and permits a larger airborne/settling spore pool. The interval is exposed as a Plant spore release interval control. Colony bond formation rate is also exposed so the early bonding hypothesis can be tested without changing bond persistence or newborn bonding-site rules. Telemetry distinguishes release, germination, crowding failure, dry-site failure, expiry, and plant death.
- **Neural interface evolution:** four additional sensory channels are available: water proximity, thirst, bond tension, and contact pressure. Four corresponding behavior outputs are available: forage drive, water drive, colony cohesion, and exploration drive. New input/output neurons are rare structural mutations, inherit through crossover, retain named channel identities, and persist those identities as typed hexadecimal chromosome genes.
- **Collision response:** positional correction and normal impulses are mass-weighted. Contacts now include tangential friction, contact-pressure feedback, and aggregate penetration/impulse telemetry.
- **Mate choice and genetic resilience:** kinship is a soft penalty rather than an absolute prohibition, and already overrepresented parents receive a small contribution penalty. If unrelated or underrepresented mates are unavailable, the existing fallback still permits reproduction.
- **Run observability:** exports now include the bounded event history, an explicit population balance, and time-varying watershed metrics for soil moisture, groundwater, surface water, rainfall, salinity, flooding, tide phase, and storm phase. This distinguishes changing hydrology from the static habitat averages in the old export.

## Validation gates

A run is invalid for ecological interpretation if populationAccountingError is non-zero. Investigate that before tuning energy, predation, or reproduction.

For bonding, verify that separation alone never removes an agent-agent link. The only normal removal path should be endpoint death. Confirm that the remaining endpoint's other bonds survive.

For plants, compare releases, germinations, and failure causes. A higher release count is not automatically success: seedling recruitment and mature biomass must remain healthy without saturating the world.

For neural evolution, inspect named input/output channel counts and behavioral effects. Structural novelty is not evidence of useful behavior unless the channels are active and change survival or reproduction.

For collisions, monitor contact count, mean/max penetration, impulse, and contact-pressure sensing. The solver should reduce overlap without producing explosive velocities or jitter.

## Paired experiment plan

The research/run16-followup.js script generates six conditions with ten paired seeds each. The seed list is identical across conditions, so differences are not confounded by a different random seed set.

1. Fixed baseline
2. Faster plant spore interval
3. New default plant spore interval
4. Stronger mate-diversity preference
5. Lower colony bond formation rate
6. Greater mate-distance priority under kinship avoidance

Run the same batch on the previous main revision and this remediation branch where possible. Then compare the corrected branch against itself one factor at a time. Do not combine all parameter changes until each subsystem has a stable isolated result.

Primary acceptance criteria:
- population accounting error remains exactly zero;
- agent bonds persist under separation and break on endpoint death;
- plant recruitment replaces senescent/dead plants over long runs;
- effective breeder count and heterozygosity do not collapse immediately;
- new neural channels appear gradually and produce measurable behavioral effects;
- collision penetration remains bounded without destabilizing the simulation.

Ten seeds are an initial screening batch, not a claim of statistical certainty. Expand the sample if confidence intervals overlap or effects vary substantially by seed.
