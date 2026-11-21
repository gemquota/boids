# Plant Laboratory Development Checklist

## Pass 1: Parameter controls and recovery
- [x] Reset current parameter values with inline confirm/cancel controls.
- [x] Reset slider minimum/maximum bounds independently.
- [x] Persist parameter values, slider bounds, and lock states in local storage.
- [x] Randomize unlocked parameters only.
- [x] Long-press parameter names for multi-section help.
- [x] Dismiss parameter help by tapping the overlay.
- [x] Long-press slider endpoints to edit minimum and maximum.
- [x] Add germination rejection and failure diagnostics.
- [x] Preserve native collapsible parameter groups.

## Pass 2: Environmental simulation and plant resource budgets
- [x] Expose terrain relief, coast depression, river incision, elevation noise, rainfall, infiltration, drainage, and stream sensitivity.
- [x] Add equatorial, temperate, and polar temperature bands.
- [x] Add configurable band widths, transition smoothness, and hemispheric seasonal temperature variation.
- [x] Add solar energy and photosynthetic efficiency to plant growth.
- [x] Add local water and nutrient uptake with depletion and competition.
- [x] Add biomass allocation controls for nodes, branches, fronds, flowers, and outer node layers.
- [x] Blend inherited plant tolerances with global environmental preferences.

## Pass 3: Environmental overlays and organism inspection
- [x] Add toggleable elevation, elevation variation, hydration, soil, nutrients, temperature, solar, salinity, flood, and watershed overlays.
- [x] Make world taps open a habitat/soil inspection panel.
- [x] Make plant taps show developmental state, biomass, morphology, habitat, lineage, and history.
- [x] Add heritable plant traits with small mutations and parent-to-offspring inheritance.
- [x] Show plant genetic traits in the inspection panel.
- [x] Preserve a manual spore-seeding action inside the inspection panel.

## Verification and remaining work
- [x] Parse-check the inline lab script and both simulation modules.
- [x] Exercise hydrology creation, stepping, sampling, and water uptake.
- [x] Exercise climate field generation, solar sampling, and nutrient uptake.
- [x] Check that all parameter controls have help text and that HTML IDs are unique.
- [ ] Verify the deployed GitHub Pages build in a real browser, including touch interactions and canvas rendering.
- [ ] Tune ecological rates against observed long-running plant growth and resource depletion.

## Pass 4: Parameter hierarchy and fractal colony growth
- [x] Add a Basic / Advanced / Expert three-way selector at the top-right of the parameter section.
- [x] Basic shows only essential controls; Advanced includes Basic plus intermediate controls; Expert exposes the full parameter set.
- [x] Tier the current 68 sliders: 8 Basic (11.8%), 22 Advanced (32.4%), and 38 Expert (55.9%).
- [x] Add nested subcategory accordions within the existing parameter groups.
- [x] Add a fractal node maturity control: daughter nodes must reach the core-size benchmark before producing their own daughter nodes; the core remains able to initiate the first generation.
- [ ] Verify visual layout and long-running fractal growth in the deployed browser.


## Pass 5: Recursive roots and staged fusion
- [x] Add recursive primary, lateral and deeper root segments attached to individual plant nodes.
- [x] Steer root tips toward moisture and nutrient gradients while preserving downward growth bias.
- [x] Charge root maintenance biomass and deplete local water/nutrient fields through root-tip uptake.
- [x] Add explicit root graft connections with strength, health, age and resource transport metadata.
- [x] Add surface-node fusion with gradual positional alignment before junction completion.
- [x] Preserve plant node IDs, parentage and root genealogy; connections do not merge node objects.
- [x] Add Expert controls for root architecture, root fusion and surface fusion.
- [x] Updated tier totals after root controls: 9 Basic (10.8%), 21 Advanced (25.3%), and 53 Expert (63.9%) across 83 sliders.
- [x] Run module-level simulation tests for recursive branching, resource depletion, bounded root connection degree, surface alignment and fusion, and syntax-check the integrated lab.
- [ ] Verify long-running growth and mobile rendering in the deployed browser.


## Pass 6: Environmental overlays, solar cycle and watershed resolution
- [x] Repair and harden overlay rendering so a failed layer is isolated instead of stopping the world render.
- [x] Increase overlay sampling to a high-resolution square-cell grid and support up to three simultaneous visual channels: colour, contours and detail marks.
- [x] Add a moving day/night cycle, seasonal solar declination, changing sunrise/sunset and real-time solar availability used by plant growth and the solar overlay.
- [x] Increase watershed grid resolution to 144 × 96 and replace sink-prone local drainage with priority-flood depression filling and directed catchments.
- [x] Add flow accumulation, floodplain tendency and richer tributary/feeder networks with floodplain rendering.
- [x] Add world, latitude-band and local-10%-neighbourhood reference averages for environmental and plant measurements.
- [x] Divide inspection into Terrain, Climate, Benchmarks, Population, Plant, Roots and History tabs, with field tooltips.
- [x] Keep one fixed drawer handle at the left edge, one-third down the screen; world taps dismiss open interfaces.
- [x] Run script syntax checks, exercise all overlay modes across the three visual channels, test hydrology stepping/serialization and recursive root integration, and verify seasonal daylight variation (15.42 h summer vs 8.58 h winter at 45°N).
- [ ] Verify live browser performance and visual layout on mobile and desktop.


## Pass 7: Overlay channel controls and drawer ergonomics
- [x] Replace three independent dropdowns with an 8-item, four-column-by-two-row overlay grid.
- [x] Make each overlay cycle through Off, Colours, Contours and Details; each display channel is globally exclusive and occupied channels are skipped while cycling other overlays.
- [x] Remove the per-sample contour rectangles that created a persistent visible grid over the world.
- [x] Replace tiled day/night shading with continuous vertical gradients driven by local solar position.
- [x] Remove borders from overlay tiles and keep the channel legend separate from the grid.
- [x] Condense the upper drawer actions into Simulation, World view, and Parameters & recovery meta-groups.
- [x] Move the drawer handle to the drawer's right edge and animate it with the drawer open/closed transition.
- [x] Parse-check the integrated inline script; verify eight overlay controls, unique HTML IDs, removed grid strokes, smooth day/night gradients, and drawer-handle placement.
- [ ] Verify the deployed layout and touch behaviour in a real mobile and desktop browser.
