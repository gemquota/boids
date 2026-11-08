# BOIDS

A full-screen, high-density flocking simulation. The simulation is the interface; controls and telemetry live in swipe-revealed panels.

## Run locally

Open `index.html` in a modern browser. No build step, package installation, or external runtime dependency is required.

## Interaction

- Swipe inward from the left edge to reveal flock controls.
- Swipe inward from the right edge to reveal live telemetry.
- Tap or drag in the field to disturb nearby agents.
- Use the panel's Fullscreen action for immersive display.
- Press `Escape` to dismiss a panel; `H` and `I` open the left and right panels.

## Simulation

- Typed-array agent state and a uniform spatial hash for local-neighbour queries.
- Separation, alignment, cohesion, environmental flow, pointer repulsion, and configurable boundary wrapping.
- Up to 24,000 agents, with single-species, mixed, schooling, and turbulent modes.
- Canvas trails and optional velocity vectors.

## Deployment

The GitHub Actions workflow in `.github/workflows/pages.yml` publishes the repository root to GitHub Pages whenever changes land on `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions** once, then merge the deployment PR.
