# Natural Selection Lab

An interactive browser simulation that demonstrates evolution by natural selection. A population of critters with an inherited speed trait faces hawk predators; over many generations, faster critters survive and the population's mean speed shifts.

## Run the simulation

No installation or build step is required. Open `index.html` in a modern web browser.

Keep all three application files in the same folder:

- `index.html` — page structure and controls
- `styles.css` — layout, colors, and responsive styling
- `script.js` — simulation loop, population genetics, and rendering

## Use the controls

- **Hawk speed** — how fast predators fly. Faster hawks catch more critters, increasing selection pressure on speed.
- **Hawk count** — number of predators (0–8). Set to 0 to remove selection entirely.
- **Mutation rate** — how much the speed trait varies between parent and offspring.
- **Food supply** — how many food pellets are available; more food supports a larger population.
- **Pause / Resume** and **Reset** — control the simulation and restore the initial setup.

## What to observe

- Critters are colored by speed: blue is slow, orange is fast.
- The stats panel shows population, mean speed (as a percentage of maximum), and the highest generation reached.
- The chart plots mean speed (orange) and population (blue) over time.
- With predators present, mean speed should climb as slow critters are caught. With hawk count at 0, the trait drifts randomly instead of being selected.

## Model notes

This is a simplified educational model, not a precise ecological simulation. Critters reproduce asexually when well fed, lose energy over time, and die of old age, starvation, or predation. Each offspring inherits its parent's speed trait plus a small random mutation. There is no genetic recombination, dominance, or linkage — just one trait under directional selection.

## Technologies

HTML, CSS, and vanilla JavaScript using the browser's Canvas API. No external libraries or packages are required.
