const canvas = document.getElementById("simulation");
const context = canvas.getContext("2d");
const lengthInput = document.getElementById("length");
const amplitudeInput = document.getElementById("amplitude");
const gravityInput = document.getElementById("gravity");
const lengthValue = document.getElementById("length-value");
const amplitudeValue = document.getElementById("amplitude-value");
const gravityValue = document.getElementById("gravity-value");
const periodValue = document.getElementById("period");
const angleReadout = document.getElementById("angle-readout");
const toggleButton = document.getElementById("toggle");
const resetButton = document.getElementById("reset");
const themeToggleButton = document.getElementById("theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const state = {
  length: Number(lengthInput.value),
  amplitudeDeg: Number(amplitudeInput.value),
  gravity: Number(gravityInput.value),
  amplitude: 0,
  elapsed: 0,
  running: true,
  lastTimestamp: performance.now()
};

let theme = localStorage.getItem("pendulum-theme") === "dark" ? "dark" : "light";

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  themeToggleButton.textContent = theme === "dark" ? "Use light theme" : "Use dark theme";
  themeToggleButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
  themeColorMeta.content = theme === "dark" ? "#111827" : "#eef4ff";
  draw();
}

function updateOutputs() {
  const period = 2 * Math.PI * Math.sqrt(state.length / state.gravity);
  const currentAngleDeg = Math.abs((state.amplitude * 180) / Math.PI);

  lengthValue.textContent = `${state.length.toFixed(1)} m`;
  amplitudeValue.textContent = `${state.amplitudeDeg.toFixed(0)}°`;
  gravityValue.textContent = `${state.gravity.toFixed(1)} m/s²`;
  periodValue.textContent = `${period.toFixed(2)} s`;
  angleReadout.textContent = `${currentAngleDeg.toFixed(0)}°`;
}

function syncAmplitude() {
  state.amplitude = toRadians(state.amplitudeDeg);
  state.elapsed = 0;
  updateOutputs();
  draw();
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(bounds.width * pixelRatio);
  canvas.height = Math.round(bounds.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  draw();
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const canvasBackground = getComputedStyle(document.documentElement).getPropertyValue("--canvas-background").trim();
  const stringColor = getComputedStyle(document.documentElement).getPropertyValue("--string-color").trim();
  const bobA = getComputedStyle(document.documentElement).getPropertyValue("--bob-color-1").trim();
  const bobB = getComputedStyle(document.documentElement).getPropertyValue("--bob-color-2").trim();
  const angleColor = getComputedStyle(document.documentElement).getPropertyValue("--angle-color").trim();
  const labelColor = getComputedStyle(document.documentElement).getPropertyValue("--output-text").trim();

  context.clearRect(0, 0, width, height);
  context.fillStyle = canvasBackground;
  context.fillRect(0, 0, width, height);

  const pivotX = width / 2;
  const pivotY = 44;
  const scale = Math.min(width, height) * 0.33;
  const bobLengthPx = scale * (state.length / 2.5);

  const angle = state.running ? state.amplitude * Math.sin(Math.sqrt(state.gravity / state.length) * state.elapsed) : state.amplitude;
  const bobX = pivotX + Math.sin(angle) * bobLengthPx;
  const bobY = pivotY + Math.cos(angle) * bobLengthPx;

  context.strokeStyle = stringColor;
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(pivotX, pivotY);
  context.lineTo(bobX, bobY);
  context.stroke();

  context.beginPath();
  context.arc(pivotX, pivotY, 7, 0, Math.PI * 2);
  context.fillStyle = stringColor;
  context.fill();

  const bobRadius = 22;
  const bobGradient = context.createRadialGradient(bobX - 8, bobY - 8, 5, bobX, bobY, bobRadius + 8);
  bobGradient.addColorStop(0, "#ffffff");
  bobGradient.addColorStop(0.2, bobA);
  bobGradient.addColorStop(0.7, bobB);
  bobGradient.addColorStop(1, bobA);

  context.beginPath();
  context.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
  context.fillStyle = bobGradient;
  context.shadowColor = "rgba(63, 106, 245, 0.2)";
  context.shadowBlur = 14;
  context.fill();
  context.shadowBlur = 0;

  context.strokeStyle = angleColor;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(pivotX, pivotY + 26);
  context.lineTo(bobX, bobY);
  context.stroke();

  const labelY = height - 26;
  context.fillStyle = labelColor;
  context.font = "600 12px Inter, sans-serif";
  context.textAlign = "left";
  context.fillText(`T = ${(2 * Math.PI * Math.sqrt(state.length / state.gravity)).toFixed(2)} s`, 18, labelY);

  const angleText = `${Math.abs((angle * 180) / Math.PI).toFixed(0)}°`;
  context.fillStyle = angleColor;
  context.fillText(`θ = ${angleText}`, width - 96, labelY);
}

function animate(timestamp) {
  const deltaSeconds = (timestamp - state.lastTimestamp) / 1000;
  state.lastTimestamp = timestamp;

  if (state.running) {
    state.elapsed += deltaSeconds;
  }

  updateOutputs();
  draw();
  requestAnimationFrame(animate);
}

lengthInput.addEventListener("input", (event) => {
  state.length = Number(event.target.value);
  updateOutputs();
  draw();
});

amplitudeInput.addEventListener("input", (event) => {
  state.amplitudeDeg = Number(event.target.value);
  syncAmplitude();
});

gravityInput.addEventListener("input", (event) => {
  state.gravity = Number(event.target.value);
  updateOutputs();
  draw();
});

toggleButton.addEventListener("click", () => {
  state.running = !state.running;
  toggleButton.textContent = state.running ? "Pause" : "Play";
  state.lastTimestamp = performance.now();
});

resetButton.addEventListener("click", () => {
  state.elapsed = 0;
  state.amplitude = toRadians(state.amplitudeDeg);
  updateOutputs();
  draw();
});

themeToggleButton.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("pendulum-theme", theme);
  applyTheme();
});

window.addEventListener("resize", resizeCanvas);

applyTheme();
syncAmplitude();
resizeCanvas();
requestAnimationFrame(animate);
