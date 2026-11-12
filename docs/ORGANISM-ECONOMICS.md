# Organism economics and bonding

This model uses the simulation's normalized energy pool (0–1.2). Recurring costs are charged once per fixed worker update, not once per rendered frame. The current worker advances at 60 fixed updates per simulation second.

## Recurring energy costs

`organism-economics.js` is a pure calculation layer. The worker supplies each organism's current phenotype and genome measurements.

| Component | Basis |
|---|---|
| Basal | Existing background, starvation, competition, hydration and habitat-pressure costs |
| Tissue | Body mass raised to the 0.75 power |
| Brain | Node count plus enabled connection count, scaled by neural activity |
| Vision | Sensing range × field-of-view fraction × ray count × polling rate |
| Appendages | Limb length, thickness and joint complexity; specialized roles carry a modest maintenance premium |
| Bonding | Sum of active bond strengths |
| Aggression | Aggression phenotype and configured attack-cost coefficient |
| Reproduction | Additional load while pregnant |
| Locomotion | Speed squared and acceleration squared, scaled by body mass, speed ratio and appendage load |

Thermal/habitat stress and age-related maintenance scale recurring maintenance. Locomotion remains a separate expenditure so movement can be compared independently.

## One-time construction investment

Initial organisms pay from their starting energy reserve. Newborn anatomy is paid by the mother at delivery. The investment covers body tissue, appendage mass, neural nodes/connections, sensory investment and bonding sites. Forming an agent-agent or agent-plant bond also incurs a small one-time construction charge. Successful attacks incur an additional immediate effort cost on top of aggression-readiness maintenance. It is not a generic building/construction subsystem.

## Specialized appendages

Appendage roles are inherited and can mutate:

- **Locomotor:** contributes to propulsion.
- **Grasping:** contributes to propulsion and manipulation-like handling.
- **Striking:** improves attack effectiveness.
- **Defensive:** reduces incoming attack effectiveness.
- **Adhesive:** adds left/right attachment capacity for bonds.
- **Sensory:** extends effective vision range.

Every role contributes to appendage maintenance. Only locomotor and grasping roles contribute directly to propulsion.

## Bond network

Bonds are persistent graph edges between organisms or between an organism and a plant. An organism's left and right bonding sites limit its degree; adhesive appendages add capacity on their corresponding side. Multiple sites permit chains and hubs.

Bond records store endpoints, attachment sides, relationship kind, strength, age and creation time. Strength grows with proximity and decays when partners separate; weak links are pruned. Existing bonds attract partners and contribute a recurring maintenance cost.

Relationship effects are energy-accounted:

- **Mutualistic:** organisms share energy toward the lower-energy partner; plant bonds exchange biomass-derived energy and support additional plant growth.
- **Commensal:** the receiving partner gains a smaller transfer; plant commensalism has a reduced extraction rate.
- **Parasitic:** the receiving partner gains a larger transfer at the donor's expense.
- **Altruistic:** the bond initiator donates energy to its partner; plant-directed altruism invests energy into plant biomass.

Bonded plants are protected from grazing while the symbiosis remains active. Attachment-side use biases inherited site-count mutations toward the side that is repeatedly bonded. Bond opportunities use deterministic hashes rather than consuming the ecology RNG stream.

## Senescence

Age progression accelerates with sustained energy deficit, dehydration and high recurring expenditure. This preserves the existing baseline lifespan setting while allowing expensive or poorly nourished phenotypes to experience shorter effective lifespans.

## Calibration notes

The coefficients are intentionally small because they are applied per fixed simulation update. They are normalized simulation parameters, not claims about real-world joules or literal biological metabolic rates. Comparative runs should measure survival, reproductive output, energy reserve, bond persistence and population stability before coefficients are tuned.
