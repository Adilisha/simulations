# Titration Lab

An interactive browser simulation of an acid–base titration. Add titrant drop by drop from a graduated burette into an Erlenmeyer flask, watch the indicator change color, and follow the pH curve to the equivalence point.

## Run the simulation

No installation or build step is required. Open `index.html` in a modern web browser.

Keep all three application files in the same folder:

- `index.html` — page structure and controls
- `styles.css` — layout, colors, and responsive styling
- `script.js` — titration chemistry, canvas rendering, and chart

## Use the controls

- **Analyte in flask** — strong acid (HCl), weak acid (CH₃COOH, Ka = 1.8×10⁻⁵), or strong base (NaOH). The titrant is automatically the opposite strong reagent.
- **Analyte concentration / volume** — how much and how concentrated the flask contents are.
- **Titrant concentration** — the standard solution in the burette.
- **Indicator** — phenolphthalein, methyl orange, or bromothymol blue. The flask liquid changes color across the indicator's transition range.
- **Add one drop** — dispense 0.05 mL manually, either with the button or by clicking the burette tap. The pH, liquid level, indicator color, and chart update as each drop lands.
- **Swirl the flask** — click and drag the flask left and right to mix the solution. Release it to let it settle back upright.
- **Titration speed** — how fast the automatic flow adds titrant.
- **Start / Pause / Resume / Reset** — control the automatic flow or clear the experiment.

## What to observe

- The pH readout and the flask color both respond to the added titrant volume.
- The burette tap releases drops into the flask, where each impact creates ripples. Shake the flask yourself by dragging it left and right.
- The chart shows the full theoretical pH curve (faint) with your progress traced in blue as drops land; the dashed red line marks the calculated equivalence point.
- The status line flags the endpoint region as you approach the equivalence point.
- Weak acids show a buffered region and a less steep pH jump — try each indicator to see which transitions near the endpoint.

## Model notes

This is a simplified educational model for monoprotic strong/weak acid–base systems at 25 °C (Kw = 10⁻¹⁴). pH is computed by solving the charge-balance equation numerically, so activity coefficients, dilution heat, and indicator error are ignored. The apparatus is drawn to resemble common laboratory glassware, but is schematic and not to scale.

## Technologies

HTML, CSS, and vanilla JavaScript using the browser's Canvas API. No external libraries or packages are required.
