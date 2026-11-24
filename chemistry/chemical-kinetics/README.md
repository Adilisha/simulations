# Chemical Kinetics Lab

An interactive browser practical for investigating factors that affect reaction rate.

## Run

Open `index.html` directly in a modern browser, or serve this folder with a static server.

## Controls

- Change the initial concentration of A or B.
- Change the temperature from 273 to 353 K.
- Add a catalyst.
- Start, pause or reset the virtual reaction.
- Save multiple trials and compare their concentrations, temperature, catalyst status and initial rates.

The vessel shows A particles in blue, B particles in amber and product C particles in purple. The graph records [A] and [B] against virtual time.

## Model

The experiment uses a simplified second-order model:

`A + B -> C`

`rate = k[A][B]`

The rate constant is temperature dependent through an Arrhenius-like relationship. A catalyst increases the effective rate constant. Values are educational estimates and are not measured laboratory data.
