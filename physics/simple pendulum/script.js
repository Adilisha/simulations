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

const state = {
  length: Number(lengthInput.value),
  amplitudeDeg: Number(amplitudeInput.value),
  gravity: Number(gravityInput.value),
  amplitude: 0,
  elapsed: 0,
  running: true,
  lastTimestamp: performance.now()
};

function toRadians(deg) {
  return (deg * Math.PI) / 180;
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

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f9fbff";
  context.fillRect(0, 0, width, height);

  const pivotX = width / 2;
  const pivotY = 44;
  const scale = Math.min(width, height) * 0.33;
  const bobLengthPx = scale * (state.length / 2.5);

  const angle = state.running ? state.amplitude * Math.sin(Math.sqrt(state.gravity / state.length) * state.elapsed) : state.amplitude;
  const bobX = pivotX + Math.sin(angle) * bobLengthPx;
  const bobY = pivotY + Math.cos(angle) * bobLengthPx;

  context.strokeStyle = "#5c789d";
  context.lineWidth = 2.5;
  context.beginPath();
  context.moveTo(pivotX, pivotY);
  context.lineTo(bobX, bobY);
  context.stroke();

  context.beginPath();
  context.arc(pivotX, pivotY, 7, 0, Math.PI * 2);
  context.fillStyle = "#516d98";
  context.fill();

  const bobRadius = 22;
  const bobGradient = context.createRadialGradient(bobX - 8, bobY - 8, 5, bobX, bobY, bobRadius + 8);
  bobGradient.addColorStop(0, "#9bc3ff");
  bobGradient.addColorStop(0.5, "#4175ff");
  bobGradient.addColorStop(1, "#2d5ecf");

  context.beginPath();
  context.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
  context.fillStyle = bobGradient;
  context.shadowColor = "rgba(63, 106, 245, 0.2)";
  context.shadowBlur = 14;
  context.fill();
  context.shadowBlur = 0;

  context.strokeStyle = "#d65a63";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(pivotX, pivotY + 26);
  context.lineTo(bobX, bobY);
  context.stroke();

  const labelY = height - 26;
  context.fillStyle = "#4967b1";
  context.font = "600 12px Inter, sans-serif";
  context.textAlign = "left";
  context.fillText(`T = ${((2 * Math.PI * Math.sqrt(state.length / state.gravity))).toFixed(2)} s`, 18, labelY);

  const angleText = `${Math.abs((angle * 180) / Math.PI).toFixed(0)}°`;
  context.fillStyle = "#d65a63";
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

window.addEventListener("resize", resizeCanvas);

syncAmplitude();
resizeCanvas();
requestAnimationFrame(animate);
