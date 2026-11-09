# Titration Lab — 3D

An interactive 3D browser simulation of an acid–base titration, built with Three.js. Orbit around the lab bench, watch titrant drip from the burette into the flask, and follow the pH curve to the equivalence point.

## Run the simulation

No installation or build step is required, but you need a modern browser with WebGL. Open `index.html` in a browser — or serve the folder with any static file server.

Keep all files in the same folder:

- `index.html` — page structure, import map, and controls
- `styles.css` — layout, colors, and responsive styling
- `script.js` — 3D scene, titration chemistry, and pH chart
- `lib/three.module.js` — Three.js r160 (vendored, MIT license)
- `lib/OrbitControls.js` — camera orbit controls addon

## Controls

- **Drag** to orbit the camera, **scroll** (or pinch) to zoom. Right-drag pans.
- The same experiment controls as the 2D version: analyte type, concentrations, volumes, indicator, and titration speed.
- The flask liquid rises as titrant is added and shifts color across the indicator's transition range. The burette level drains as titration proceeds.

## What to observe

- The pH readout, flask color, and chart all respond to the added titrant volume.
- The chart shows the full theoretical pH curve with your progress traced in blue and a dashed red line at the calculated equivalence point.
- Orbit underneath the flask to see the liquid surface from below, or zoom in to watch drips fall from the burette tip.

## Model notes

Same simplified educational model as the 2D titration lab: monoprotic strong/weak acid–base systems at 25 °C (Kw = 10⁻¹⁴), with pH solved numerically from the charge-balance equation. The 3D apparatus is schematic, not to scale.

## Technologies

HTML, CSS, and vanilla JavaScript with [Three.js](https://threejs.org) r160 (vendored locally in `lib/`, so the simulation works offline). No build step or external packages required.
