import * as THREE from "three";
import { OrbitControls } from "./lib/OrbitControls.js";

const viewport = document.querySelector("#viewport");
const chartCanvas = document.querySelector("#chart");
const chartContext = chartCanvas.getContext("2d");
const analyteSelect = document.querySelector("#analyte");
const indicatorSelect = document.querySelector("#indicator");
const analyteMolarityInput = document.querySelector("#analyte-molarity");
const analyteVolumeInput = document.querySelector("#analyte-volume");
const titrantMolarityInput = document.querySelector("#titrant-molarity");
const speedInput = document.querySelector("#speed");
const analyteMolarityOutput = document.querySelector("#analyte-molarity-value");
const analyteVolumeOutput = document.querySelector("#analyte-volume-value");
const titrantMolarityOutput = document.querySelector("#titrant-molarity-value");
const speedOutput = document.querySelector("#speed-value");
const titrateButton = document.querySelector("#titrate");
const resetButton = document.querySelector("#reset");
const addDropButton = document.querySelector("#add-drop");
const addMlButton = document.querySelector("#add-ml");
const themeToggleButton = document.querySelector("#theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const statVolume = document.querySelector("#stat-volume");
const statPh = document.querySelector("#stat-ph");
const statEquiv = document.querySelector("#stat-equiv");
const statusEl = document.querySelector("#status");

const KW = 1e-14;
const ACETIC_KA = 1.8e-5;

let theme = localStorage.getItem("titration-theme") === "dark" ? "dark" : "light";
let analyteType = "strong-acid";
let analyteMolarity = 0.10;
let analyteVolume = 25;
let titrantMolarity = 0.10;
let titrationSpeed = 1.0;
let indicator = "phenolphthalein";
let addedVolume = 0;
let running = false;
let finished = false;
let curve = [];
let maxVolume = 50;
let equivalenceVolume = 25;
let dripTimer = 0;
let lastTime = 0;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const rand = (min, max) => min + Math.random() * (max - min);

function equivalence() {
  return (analyteMolarity * analyteVolume) / titrantMolarity;
}

function computeMaxVolume() {
  return Math.max(10, equivalence() * 1.6 + 2);
}

function solvePH(vb) {
  const vt = analyteVolume + vb;
  const strongBase = analyteType === "strong-base"
    ? (analyteMolarity * analyteVolume) / vt
    : (titrantMolarity * vb) / vt;
  const strongAcid = analyteType === "strong-base"
    ? (titrantMolarity * vb) / vt
    : (analyteType === "strong-acid" ? (analyteMolarity * analyteVolume) / vt : 0);
  const weakAcidTotal = analyteType === "weak-acid" ? (analyteMolarity * analyteVolume) / vt : 0;

  const f = (h) => {
    const aMinus = weakAcidTotal * ACETIC_KA / (ACETIC_KA + h);
    return h + strongBase - KW / h - strongAcid - aMinus;
  };

  let lo = 1e-14;
  let hi = 1;
  for (let i = 0; i < 80; i++) {
    const mid = Math.sqrt(lo * hi);
    if (f(mid) > 0) hi = mid;
    else lo = mid;
  }
  return -Math.log10(Math.sqrt(lo * hi));
}

function buildCurve() {
  equivalenceVolume = equivalence();
  maxVolume = computeMaxVolume();
  curve = [];
  const samples = 160;
  for (let i = 0; i <= samples; i++) {
    const vb = (maxVolume * i) / samples;
    curve.push({ vb, ph: solvePH(vb) });
  }
  addedVolume = Math.min(addedVolume, maxVolume);
  drawChart();
}

function indicatorRGB(ph) {
  let t;
  let c1;
  let c2;
  if (indicator === "phenolphthalein") {
    t = clamp((ph - 8.2) / 1.8, 0, 1);
    c1 = [245, 240, 234];
    c2 = [214, 48, 116];
  } else if (indicator === "methyl-orange") {
    t = clamp((ph - 3.1) / 1.3, 0, 1);
    c1 = [214, 69, 65];
    c2 = [244, 211, 94];
  } else {
    t = clamp((ph - 6.0) / 1.6, 0, 1);
    c1 = [232, 201, 60];
    c2 = [46, 134, 193];
  }
  const mix = (a, b) => Math.round(a + (b - a) * t);
  return `rgb(${mix(c1[0], c2[0])}, ${mix(c1[1], c2[1])}, ${mix(c1[2], c2[2])})`;
}

// ---------- 3D scene ----------

const FLASK_BOTTOM = 0.16;
const FLASK_TOP = 2.32;

const INNER_PROFILE = [
  [0.12, 0.04], [0.18, 0.52], [0.45, 0.74], [0.85, 0.79],
  [1.2, 0.76], [1.55, 0.5], [1.85, 0.26], [2.05, 0.21], [2.45, 0.21]
];

function flaskRadiusAt(y) {
  if (y <= INNER_PROFILE[0][0]) return INNER_PROFILE[0][1];
  for (let i = 1; i < INNER_PROFILE.length; i++) {
    const [y1, r1] = INNER_PROFILE[i - 1];
    const [y2, r2] = INNER_PROFILE[i];
    if (y <= y2) return r1 + (r2 - r1) * ((y - y1) / (y2 - y1));
  }
  return INNER_PROFILE[INNER_PROFILE.length - 1][1];
}

function liquidFraction() {
  const total = analyteVolume + maxVolume;
  return clamp((analyteVolume + addedVolume) / total, 0, 1);
}

function surfaceY() {
  return FLASK_BOTTOM + liquidFraction() * (FLASK_TOP - FLASK_BOTTOM);
}

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.domElement.style.display = "block";
renderer.domElement.style.width = "100%";
renderer.domElement.style.height = "100%";
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(cssVar("--canvas-background"));

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(2.5, 2.3, 3.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.55, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 1.4;
controls.maxDistance = 14;
controls.maxPolarAngle = 1.45;
controls.update();

scene.add(new THREE.HemisphereLight(0xffffff, 0x8a94a8, 0.9));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(3.5, 6, 2.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.left = -5;
keyLight.shadow.camera.right = 5;
keyLight.shadow.camera.top = 6;
keyLight.shadow.camera.bottom = -2;
keyLight.shadow.camera.far = 20;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xbdd0ff, 0.5);
fillLight.position.set(-3, 3, -2);
scene.add(fillLight);

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xdfeaf5,
  metalness: 0,
  roughness: 0.06,
  transmission: 0.92,
  thickness: 0.35,
  ior: 1.45,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false
});

const benchMaterial = new THREE.MeshStandardMaterial({ color: cssVar("--button-border"), roughness: 0.85 });
const metalMaterial = new THREE.MeshStandardMaterial({ color: cssVar("--muted-text"), roughness: 0.4, metalness: 0.6 });
const darkMetalMaterial = new THREE.MeshStandardMaterial({ color: cssVar("--subtle-text"), roughness: 0.5, metalness: 0.4 });

const bench = new THREE.Mesh(new THREE.BoxGeometry(9, 0.35, 6), benchMaterial);
bench.position.y = -0.175;
bench.receiveShadow = true;
scene.add(bench);

const OUTER_PROFILE = [
  [0.02, 0.06], [0.56, 0.06], [0.8, 0.42], [0.9, 0.82], [0.88, 1.12],
  [0.6, 1.52], [0.32, 1.82], [0.26, 1.98], [0.26, 2.5]
];

const flaskGeometry = new THREE.LatheGeometry(
  OUTER_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)), 56
);
const flask = new THREE.Mesh(flaskGeometry, glassMaterial);
flask.renderOrder = 2;
scene.add(flask);

const liquidGeometry = new THREE.LatheGeometry(
  INNER_PROFILE.map(([r, y]) => new THREE.Vector2(r * 0.97, y)), 48
);
const liquidMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#f5f0ea"),
  roughness: 0.18,
  transmission: 0.55,
  thickness: 0.6,
  transparent: true,
  opacity: 0.92,
  side: THREE.DoubleSide
});
const liquidClipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), FLASK_BOTTOM);
liquidMaterial.clippingPlanes = [liquidClipPlane];
const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
liquid.renderOrder = 1;
scene.add(liquid);

const meniscusMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color("#f5f0ea"), transparent: true, opacity: 0.65 });
const meniscus = new THREE.Mesh(new THREE.CircleGeometry(0.7, 40), meniscusMaterial);
meniscus.rotation.x = -Math.PI / 2;
scene.add(meniscus);

// Burette
const buretteGroup = new THREE.Group();
scene.add(buretteGroup);

const tubeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.85, 32, 1, true);
tubeGeometry.translate(0, 3.05, 0);
const buretteTube = new THREE.Mesh(tubeGeometry, glassMaterial);
buretteTube.renderOrder = 2;
buretteGroup.add(buretteTube);

const tipGeometry = new THREE.CylinderGeometry(0.15, 0.035, 0.22, 32);
tipGeometry.translate(0, 2.6, 0);
const buretteTip = new THREE.Mesh(tipGeometry, glassMaterial);
buretteTip.renderOrder = 2;
buretteGroup.add(buretteTip);

const buretteLiquidGeometry = new THREE.CylinderGeometry(0.115, 0.115, 1, 24);
buretteLiquidGeometry.translate(0, 0.5, 0);
const buretteLiquidMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#5b8dd9"),
  roughness: 0.2,
  transparent: true,
  opacity: 0.65
});
const buretteLiquid = new THREE.Mesh(buretteLiquidGeometry, buretteLiquidMaterial);
buretteGroup.add(buretteLiquid);

for (let i = 0; i < 5; i++) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.006, 8, 32), darkMetalMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 3.35 - i * 0.14;
  buretteGroup.add(ring);
}

const stopcock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.22), darkMetalMaterial);
stopcock.position.set(0.19, 2.98, 0);
buretteGroup.add(stopcock);

// Retort stand
const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 4.1, 16), metalMaterial);
rod.position.set(1.35, 2.05, 0);
rod.castShadow = true;
scene.add(rod);

const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.6), darkMetalMaterial);
standBase.position.set(1.35, 0.04, 0);
standBase.castShadow = true;
scene.add(standBase);

const clampArm = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.07, 0.07), metalMaterial);
clampArm.position.set(0.72, 2.98, 0);
clampArm.castShadow = true;
scene.add(clampArm);

const clampBoss = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 20), darkMetalMaterial);
clampBoss.rotation.z = Math.PI / 2;
clampBoss.position.set(0.14, 2.98, 0);
scene.add(clampBoss);

// Drips and bubbles
const dripMaterial = new THREE.MeshPhysicalMaterial({
  color: new THREE.Color("#5b8dd9"),
  roughness: 0.1,
  transparent: true,
  opacity: 0.8
});
const drips = [];
for (let i = 0; i < 6; i++) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), dripMaterial);
  mesh.visible = false;
  mesh.position.set(0, -10, 0);
  scene.add(mesh);
  drips.push({ mesh, t: 1, active: false });
}

const bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
const bubbles = [];
for (let i = 0; i < 14; i++) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(rand(0.018, 0.035), 8, 8), bubbleMaterial);
  mesh.visible = false;
  scene.add(mesh);
  bubbles.push({
    mesh,
    x: rand(-0.4, 0.4),
    z: rand(-0.4, 0.4),
    y: rand(FLASK_BOTTOM, FLASK_TOP),
    speed: rand(0.15, 0.4)
  });
}

function spawnDrip() {
  const free = drips.find((d) => !d.active);
  if (!free) return;
  free.active = true;
  free.t = 0;
  free.mesh.visible = true;
}

function updateDrips(dt) {
  const top = 2.52;
  const bottom = surfaceY() + 0.02;
  for (const d of drips) {
    if (!d.active) continue;
    d.t += dt / 0.55;
    if (d.t >= 1) {
      d.active = false;
      d.mesh.visible = false;
      continue;
    }
    const e = d.t * d.t;
    d.mesh.position.set(0, top + (bottom - top) * e, 0);
  }
}

function updateBubbles(dt) {
  for (const b of bubbles) {
    if (!running || finished) {
      b.mesh.visible = false;
      continue;
    }
    b.mesh.visible = true;
    b.y += b.speed * dt;
    const r = Math.max(0.06, flaskRadiusAt(b.y) - 0.07);
    const radial = Math.hypot(b.x, b.z);
    if (radial > r) {
      b.x *= r / radial;
      b.z *= r / radial;
    }
    if (b.y > surfaceY() - 0.05) {
      b.y = FLASK_BOTTOM + rand(0.02, 0.3);
      b.x = rand(-0.5, 0.5);
      b.z = rand(-0.5, 0.5);
    }
    b.mesh.position.set(b.x, b.y, b.z);
  }
}

function updateLiquid(ph) {
  const y = surfaceY();
  liquidClipPlane.constant = y;
  liquidMaterial.color.set(indicatorRGB(ph));
  meniscusMaterial.color.copy(liquidMaterial.color);
  const r = Math.max(0.05, flaskRadiusAt(y) - 0.03);
  meniscus.scale.set(r / 0.7, r / 0.7, 1);
  meniscus.position.set(0, y + 0.005, 0);

  const remaining = clamp(1 - addedVolume / maxVolume, 0, 1);
  const liquidHeight = Math.max(0.001, 0.72 * remaining);
  buretteLiquid.scale.y = liquidHeight;
  buretteLiquid.position.y = 2.6;
}

// ---------- 2D pH chart ----------

function drawChart() {
  const bounds = chartCanvas.getBoundingClientRect();
  const w = bounds.width;
  const h = bounds.height;
  const dpr = window.devicePixelRatio || 1;
  if (!w || !h) return;
  if (chartCanvas.width !== Math.round(w * dpr)) {
    chartCanvas.width = Math.round(w * dpr);
    chartCanvas.height = Math.round(h * dpr);
  }
  chartContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  chartContext.clearRect(0, 0, w, h);
  if (!curve.length) return;

  const gridColor = cssVar("--chart-grid");
  const textColor = cssVar("--chart-text");
  const padL = 30;
  const padR = 10;
  const padT = 8;
  const padB = 18;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const xFor = (vb) => padL + (vb / maxVolume) * plotW;
  const yFor = (ph) => padT + (1 - ph / 14) * plotH;

  chartContext.strokeStyle = gridColor;
  chartContext.fillStyle = textColor;
  chartContext.lineWidth = 1;
  chartContext.font = "10px system-ui, sans-serif";
  chartContext.textAlign = "right";
  chartContext.textBaseline = "middle";
  for (let ph = 0; ph <= 14; ph += 2) {
    const y = yFor(ph);
    chartContext.beginPath();
    chartContext.moveTo(padL, y);
    chartContext.lineTo(w - padR, y);
    chartContext.stroke();
    chartContext.fillText(String(ph), padL - 5, y);
  }
  chartContext.textAlign = "center";
  chartContext.textBaseline = "top";
  for (let i = 0; i <= 4; i++) {
    const vb = (maxVolume * i) / 4;
    chartContext.fillText(`${vb.toFixed(0)}`, xFor(vb), h - padB + 4);
  }

  const trace = (upTo, color, widthPx) => {
    chartContext.beginPath();
    let started = false;
    for (const point of curve) {
      if (point.vb > upTo) break;
      const x = xFor(point.vb);
      const y = yFor(clamp(point.ph, 0, 14));
      if (!started) { chartContext.moveTo(x, y); started = true; }
      else chartContext.lineTo(x, y);
    }
    chartContext.strokeStyle = color;
    chartContext.lineWidth = widthPx;
    chartContext.stroke();
  };

  trace(maxVolume, cssVar("--curve-color"), 1.4);
  trace(addedVolume, "#5478e8", 2.2);

  const eqX = xFor(equivalenceVolume);
  chartContext.strokeStyle = "#ef5968";
  chartContext.lineWidth = 1.4;
  chartContext.setLineDash([5, 4]);
  chartContext.beginPath();
  chartContext.moveTo(eqX, padT);
  chartContext.lineTo(eqX, padT + plotH);
  chartContext.stroke();
  chartContext.setLineDash([]);

  const current = curve.reduce((best, point) =>
    Math.abs(point.vb - addedVolume) < Math.abs(best.vb - addedVolume) ? point : best, curve[0]);
  chartContext.beginPath();
  chartContext.arc(xFor(current.vb), yFor(clamp(current.ph, 0, 14)), 4, 0, Math.PI * 2);
  chartContext.fillStyle = "#5478e8";
  chartContext.fill();
  chartContext.strokeStyle = "#fff";
  chartContext.lineWidth = 1.5;
  chartContext.stroke();
}

// ---------- UI / loop ----------

function updateStats(ph) {
  statVolume.textContent = `${addedVolume.toFixed(1)} mL`;
  statPh.textContent = ph.toFixed(2);
  statEquiv.textContent = `${equivalenceVolume.toFixed(1)} mL`;
}

function updateStatus(ph) {
  if (finished) {
    statusEl.textContent = "Titration complete — compare your endpoint volume with the calculated equivalence point.";
    statusEl.classList.remove("endpoint");
  } else if (!running && addedVolume === 0) {
    statusEl.textContent = "Ready — press Start titration";
    statusEl.classList.remove("endpoint");
  } else if (running) {
    if (addedVolume >= equivalenceVolume * 0.97) {
      statusEl.textContent = "Endpoint region — watch the indicator change color.";
      statusEl.classList.add("endpoint");
    } else {
      statusEl.textContent = "Titrating…";
      statusEl.classList.remove("endpoint");
    }
  } else {
    statusEl.textContent = "Paused — press Resume to continue";
    statusEl.classList.remove("endpoint");
  }
}

function updateControls() {
  analyteMolarityOutput.value = `${analyteMolarity.toFixed(2)} M`;
  analyteMolarityOutput.textContent = `${analyteMolarity.toFixed(2)} M`;
  analyteVolumeOutput.value = `${analyteVolume.toFixed(1)} mL`;
  analyteVolumeOutput.textContent = `${analyteVolume.toFixed(1)} mL`;
  titrantMolarityOutput.value = `${titrantMolarity.toFixed(2)} M`;
  titrantMolarityOutput.textContent = `${titrantMolarity.toFixed(2)} M`;
  speedOutput.value = `${titrationSpeed.toFixed(1)} mL/s`;
  speedOutput.textContent = `${titrationSpeed.toFixed(1)} mL/s`;
  titrateButton.textContent = running ? "Pause" : (finished ? "Titration complete" : (addedVolume > 0 ? "Resume" : "Start titration"));
  titrateButton.disabled = finished;
}

function reset() {
  addedVolume = 0;
  running = false;
  finished = false;
  buildCurve();
  updateControls();
  const ph = solvePH(0);
  updateStatus(ph);
  updateStats(ph);
}

function applyTheme() {
  document.documentElement.dataset.theme = theme;
  themeToggleButton.textContent = theme === "dark" ? "Use light theme" : "Use dark theme";
  themeToggleButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
  themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
  themeColorMeta.content = theme === "dark" ? "#111827" : "#f3f6fb";
  scene.background.set(cssVar("--canvas-background"));
  benchMaterial.color.set(cssVar("--button-border"));
  metalMaterial.color.set(cssVar("--muted-text"));
  darkMetalMaterial.color.set(cssVar("--subtle-text"));
  drawChart();
}

function resize() {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  drawChart();
}

function frame(timestamp) {
  requestAnimationFrame(frame);
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
  lastTime = timestamp;

  if (running && !finished) {
    addedVolume += titrationSpeed * dt;
    if (addedVolume >= maxVolume) {
      addedVolume = maxVolume;
      running = false;
      finished = true;
    }
    dripTimer -= dt;
    if (dripTimer <= 0 && addedVolume < maxVolume) {
      dripTimer = 0.45;
      spawnDrip();
    }
  }

  const ph = solvePH(addedVolume);
  updateLiquid(ph);
  updateDrips(dt);
  updateBubbles(dt);
  updateStats(ph);
  updateStatus(ph);
  updateControls();
  controls.update();
  renderer.render(scene, camera);
}

analyteSelect.addEventListener("change", () => {
  analyteType = analyteSelect.value;
  addedVolume = 0;
  running = false;
  finished = false;
  buildCurve();
  updateControls();
});
indicatorSelect.addEventListener("change", () => {
  indicator = indicatorSelect.value;
});
analyteMolarityInput.addEventListener("input", () => {
  analyteMolarity = Number(analyteMolarityInput.value);
  buildCurve();
  updateControls();
});
analyteVolumeInput.addEventListener("input", () => {
  analyteVolume = Number(analyteVolumeInput.value);
  buildCurve();
  updateControls();
});
titrantMolarityInput.addEventListener("input", () => {
  titrantMolarity = Number(titrantMolarityInput.value);
  buildCurve();
  updateControls();
});
speedInput.addEventListener("input", () => {
  titrationSpeed = Number(speedInput.value);
  updateControls();
});
titrateButton.addEventListener("click", () => {
  if (finished) return;
  if (!running && addedVolume >= maxVolume) addedVolume = 0;
  running = !running;
  updateControls();
});
resetButton.addEventListener("click", reset);

function addTitrant(amount) {
  if (finished) return;
  running = false;
  addedVolume = clamp(addedVolume + amount, 0, maxVolume);
  if (addedVolume >= maxVolume) finished = true;
  updateControls();
}
addDropButton.addEventListener("click", () => addTitrant(0.05));
addMlButton.addEventListener("click", () => addTitrant(1));
themeToggleButton.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  localStorage.setItem("titration-theme", theme);
  applyTheme();
});

new ResizeObserver(resize).observe(viewport);
new ResizeObserver(() => drawChart()).observe(chartCanvas);
applyTheme();
resize();
reset();
requestAnimationFrame(frame);
