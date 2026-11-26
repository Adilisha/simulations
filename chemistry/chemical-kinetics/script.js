(() => {
  const canvas = document.querySelector("#simulation");
  const ctx = canvas.getContext("2d");
  const chartCanvas = document.querySelector("#chart");
  const chartCtx = chartCanvas.getContext("2d");

  const concentrationAInput = document.querySelector("#concentration-a");
  const concentrationBInput = document.querySelector("#concentration-b");
  const temperatureInput = document.querySelector("#temperature");
  const catalystInput = document.querySelector("#catalyst");
  const concentrationAOutput = document.querySelector("#concentration-a-value");
  const concentrationBOutput = document.querySelector("#concentration-b-value");
  const temperatureOutput = document.querySelector("#temperature-value");
  const catalystOutput = document.querySelector("#catalyst-value");
  const runButton = document.querySelector("#run");
  const pauseButton = document.querySelector("#pause");
  const resetButton = document.querySelector("#reset");
  const themeButton = document.querySelector("#theme-toggle");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const statTime = document.querySelector("#stat-time");
  const statA = document.querySelector("#stat-a");
  const statRate = document.querySelector("#stat-rate");
  const statInitialRate = document.querySelector("#stat-initial-rate");
  const status = document.querySelector("#status");
  const saveTrialButton = document.querySelector("#save-trial");
  const clearTrialsButton = document.querySelector("#clear-trials");
  const trialsBody = document.querySelector("#trials-body");

  let theme = localStorage.getItem("kinetics-theme") === "dark" ? "dark" : "light";
  let initialA = 0.10;
  let initialB = 0.10;
  let temperature = 298;
  let catalyst = false;
  let a = initialA;
  let b = initialB;
  let product = 0;
  let elapsed = 0;
  let running = false;
  let finished = false;
  let lastTimestamp = 0;
  let samples = [];
  let particles = [];
  let width = 0;
  let height = 0;
  let chartWidth = 0;
  let chartHeight = 0;
  let trials = [];
  let trialConditions = null;

  function rateConstant() {
    const base = 0.018;
    const arrhenius = Math.exp((4000 / 8.314) * ((1 / 298) - (1 / temperature)));
    return base * arrhenius * (catalyst ? 2.8 : 1);
  }

  function makeParticles() {
    particles = [];
    const count = 42;
    for (let i = 0; i < count; i++) {
      const fraction = i / (count - 1);
      particles.push({
        kind: fraction < 0.5 ? "a" : "b",
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 34,
        vy: (Math.random() - 0.5) * 34,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function syncParticles() {
    const reactantFraction = Math.max(0, 1 - product / Math.max(initialA, initialB, 0.001));
    const aCount = Math.round(particles.length * (a / initialA) * 0.5);
    const bCount = Math.round(particles.length * (b / initialB) * 0.5);
    let assignedA = 0;
    let assignedB = 0;
    particles.forEach((particle) => {
      if (assignedA < aCount) {
        particle.kind = "a";
        assignedA++;
      } else if (assignedB < bCount) {
        particle.kind = "b";
        assignedB++;
      } else {
        particle.kind = "c";
      }
      particle.vx += (Math.random() - 0.5) * (reactantFraction + temperature / 400);
      particle.vy += (Math.random() - 0.5) * (reactantFraction + temperature / 400);
    });
  }

  function resetExperiment(recordStatus = true) {
    initialA = Number(concentrationAInput.value);
    initialB = Number(concentrationBInput.value);
    temperature = Number(temperatureInput.value);
    catalyst = catalystInput.checked;
    a = initialA;
    b = initialB;
    product = 0;
    elapsed = 0;
    running = false;
    finished = false;
    lastTimestamp = 0;
    samples = [{ time: 0, a, b }];
    makeParticles();
    runButton.textContent = "Start reaction";
    runButton.disabled = false;
    pauseButton.disabled = true;
    pauseButton.textContent = "Pause";
    statTime.textContent = "0.0 s";
    statA.textContent = `${a.toFixed(3)} M`;
    statRate.textContent = "—";
    statInitialRate.textContent = "—";
    trialConditions = null;
    saveTrialButton.disabled = true;
    if (recordStatus) status.textContent = "Ready — adjust the conditions and start the reaction";
    draw();
    drawChart();
  }

  function updateControls() {
    concentrationAOutput.textContent = `${Number(concentrationAInput.value).toFixed(3)} mol/L`;
    concentrationBOutput.textContent = `${Number(concentrationBInput.value).toFixed(3)} mol/L`;
    temperatureOutput.textContent = `${temperatureInput.value} K`;
    catalystOutput.textContent = catalystInput.checked ? "Yes" : "No";
  }

  function initialRate() {
    return rateConstant() * initialA * initialB;
  }

  function renderTrials() {
    trialsBody.replaceChildren();
    if (trials.length === 0) {
      const row = document.createElement("tr");
      row.className = "empty-row";
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.textContent = "No trials saved";
      row.appendChild(cell);
      trialsBody.appendChild(row);
      clearTrialsButton.disabled = true;
      return;
    }

    trials.forEach((trial, index) => {
      const row = document.createElement("tr");
      const values = [
        index + 1,
        `${trial.initialA.toFixed(3)} M`,
        `${trial.initialB.toFixed(3)} M`,
        `${trial.temperature} K`,
        trial.catalyst ? "Yes" : "No",
        `${trial.initialRate.toFixed(5)} M/s`
      ];
      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      trialsBody.appendChild(row);
    });
    clearTrialsButton.disabled = false;
  }

  function saveCurrentTrial() {
    if (!trialConditions) return;
    trials.push({ ...trialConditions });
    renderTrials();
    saveTrialButton.disabled = true;
    status.textContent = `Trial ${trials.length} saved — change one condition to compare a new run`;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    themeButton.textContent = theme === "dark" ? "Use light theme" : "Use dark theme";
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    themeMeta.content = theme === "dark" ? "#111827" : "#f3f6fb";
    draw();
    drawChart();
  }

  function resize() {
    const pixelRatio = window.devicePixelRatio || 1;
    const bounds = canvas.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const chartBounds = chartCanvas.getBoundingClientRect();
    chartWidth = chartBounds.width;
    chartHeight = chartBounds.height;
    chartCanvas.width = Math.round(chartWidth * pixelRatio);
    chartCanvas.height = Math.round(chartHeight * pixelRatio);
    chartCtx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    draw();
    drawChart();
  }

  function vesselGeometry() {
    const cx = width * 0.5;
    const bottom = height * 0.86;
    const top = height * 0.24;
    const halfWidth = Math.min(width * 0.34, 175);
    return { cx, bottom, top, halfWidth };
  }

  function vesselPath(g) {
    ctx.beginPath();
    ctx.moveTo(g.cx - 24, g.top - 25);
    ctx.lineTo(g.cx - 24, g.top);
    ctx.quadraticCurveTo(g.cx - g.halfWidth, g.top + 28, g.cx - g.halfWidth + 10, g.bottom - 12);
    ctx.quadraticCurveTo(g.cx - g.halfWidth + 14, g.bottom, g.cx - g.halfWidth + 34, g.bottom);
    ctx.lineTo(g.cx + g.halfWidth - 34, g.bottom);
    ctx.quadraticCurveTo(g.cx + g.halfWidth - 14, g.bottom, g.cx + g.halfWidth - 10, g.bottom - 12);
    ctx.quadraticCurveTo(g.cx + g.halfWidth, g.top + 28, g.cx + 24, g.top);
    ctx.lineTo(g.cx + 24, g.top - 25);
    ctx.closePath();
  }

  function draw() {
    const dark = theme === "dark";
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = dark ? "#172235" : "#fbfcff";
    ctx.fillRect(0, 0, width, height);

    const g = vesselGeometry();
    ctx.save();
    vesselPath(g);
    ctx.clip();
    const completion = product / Math.max(initialA, initialB, 0.001);
    const liquidTop = g.bottom - (g.bottom - g.top) * 0.62;
    ctx.fillStyle = dark ? "rgba(84,120,232,.10)" : "rgba(84,120,232,.07)";
    ctx.beginPath();
    ctx.moveTo(g.cx - g.halfWidth - 5, liquidTop);
    ctx.quadraticCurveTo(g.cx, liquidTop - 5, g.cx + g.halfWidth + 5, liquidTop);
    ctx.lineTo(g.cx + g.halfWidth + 5, g.bottom + 5);
    ctx.lineTo(g.cx - g.halfWidth - 5, g.bottom + 5);
    ctx.closePath();
    ctx.fill();

    const speedScale = 0.55 + temperature / 180;
    particles.forEach((particle) => {
      particle.x += particle.vx * 0.002 * speedScale;
      particle.y += particle.vy * 0.002 * speedScale;
      if (particle.x < 0.12 || particle.x > 0.88) particle.vx *= -1;
      if (particle.y < 0.30 || particle.y > 0.83) particle.vy *= -1;
      particle.x = Math.max(0.12, Math.min(0.88, particle.x));
      particle.y = Math.max(0.30, Math.min(0.83, particle.y));
      const px = g.cx - g.halfWidth * 0.78 + particle.x * g.halfWidth * 1.56;
      const py = g.top + 20 + particle.y * (g.bottom - g.top - 30);
      ctx.beginPath();
      ctx.arc(px, py, particle.kind === "c" ? 5.2 : 5.6, 0, Math.PI * 2);
      ctx.fillStyle = particle.kind === "a" ? "#4a78df" : particle.kind === "b" ? "#df9a42" : "#9a67d5";
      ctx.fill();
    });
    ctx.restore();

    vesselPath(g);
    ctx.strokeStyle = dark ? "#52617a" : "#b9c4d6";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = dark ? "#d0d9e8" : "#35435d";
    ctx.font = "600 12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(catalyst ? "Catalyst present" : "No catalyst", g.cx, g.top - 43);
    ctx.fillText(`${temperature} K`, g.cx, g.bottom + 34);

    const k = rateConstant();
    ctx.textAlign = "left";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillStyle = dark ? "#a7b3c8" : "#65728a";
    ctx.fillText(`k = ${k.toFixed(4)} L mol⁻¹ s⁻¹`, 16, 24);
  }

  function drawChart() {
    chartCtx.clearRect(0, 0, chartWidth, chartHeight);
    const dark = theme === "dark";
    const pad = { left: 38, right: 12, top: 10, bottom: 24 };
    const plotW = chartWidth - pad.left - pad.right;
    const plotH = chartHeight - pad.top - pad.bottom;
    const maxTime = Math.max(30, elapsed);
    const maxConc = Math.max(initialA, initialB, 0.02) * 1.08;

    chartCtx.strokeStyle = dark ? "#2b394f" : "#e8edf5";
    chartCtx.lineWidth = 1;
    chartCtx.font = "10px Inter, sans-serif";
    chartCtx.fillStyle = dark ? "#8fa0b8" : "#8490a4";
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + plotH * i / 4;
      chartCtx.beginPath();
      chartCtx.moveTo(pad.left, y);
      chartCtx.lineTo(pad.left + plotW, y);
      chartCtx.stroke();
      chartCtx.textAlign = "right";
      chartCtx.fillText((maxConc * (1 - i / 4)).toFixed(2), pad.left - 6, y + 3);
    }
    chartCtx.textAlign = "center";
    chartCtx.fillText("0", pad.left, chartHeight - 5);
    chartCtx.fillText(`${maxTime.toFixed(0)} s`, pad.left + plotW, chartHeight - 5);

    function plotSeries(key, color) {
      if (samples.length < 1) return;
      chartCtx.beginPath();
      chartCtx.strokeStyle = color;
      chartCtx.lineWidth = 2;
      chartCtx.setLineDash(key === "b" ? [4, 3] : []);
      samples.forEach((point, i) => {
        const x = pad.left + point.time / maxTime * plotW;
        const y = pad.top + plotH * (1 - point[key] / maxConc);
        if (i === 0) chartCtx.moveTo(x, y);
        else chartCtx.lineTo(x, y);
      });
      chartCtx.stroke();
      chartCtx.setLineDash([]);
    }
    plotSeries("a", "#5478e8");
    plotSeries("b", "#e09a43");
  }

  function step(timestamp) {
    if (!running) return;
    if (!lastTimestamp) lastTimestamp = timestamp;
    const realDelta = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    const virtualDelta = realDelta * 2;

    const k = rateConstant();
    const rate = k * a * b;
    const consumed = Math.min(a, b, rate * virtualDelta);
    a = Math.max(0, a - consumed);
    b = Math.max(0, b - consumed);
    product += consumed;
    elapsed += virtualDelta;

    if (elapsed % 0.25 < virtualDelta || elapsed >= 60) {
      samples.push({ time: elapsed, a, b });
      if (samples.length > 240) samples.shift();
      syncParticles();
    }

    statTime.textContent = `${elapsed.toFixed(1)} s`;
    statA.textContent = `${a.toFixed(3)} M`;
    statRate.textContent = `${rate.toFixed(4)} M/s`;
    if (a < 0.0005 || b < 0.0005 || elapsed >= 60) {
      running = false;
      finished = true;
      pauseButton.disabled = true;
      runButton.textContent = "Run again";
      status.textContent = `Complete — limiting reactant consumed after ${elapsed.toFixed(1)} s`;
    }
    draw();
    drawChart();
    if (running) requestAnimationFrame(step);
  }

  concentrationAInput.addEventListener("input", () => { updateControls(); resetExperiment(false); });
  concentrationBInput.addEventListener("input", () => { updateControls(); resetExperiment(false); });
  temperatureInput.addEventListener("input", () => { updateControls(); resetExperiment(false); });
  catalystInput.addEventListener("change", () => { updateControls(); resetExperiment(false); });

  runButton.addEventListener("click", () => {
    if (finished) resetExperiment(false);
    running = true;
    lastTimestamp = 0;
    trialConditions = {
      initialA,
      initialB,
      temperature,
      catalyst,
      initialRate: initialRate()
    };
    runButton.textContent = "Reaction running";
    runButton.disabled = true;
    pauseButton.disabled = false;
    saveTrialButton.disabled = false;
    statInitialRate.textContent = `${trialConditions.initialRate.toFixed(5)} M/s`;
    status.textContent = "Running — particles collide and the concentrations decrease";
    syncParticles();
    requestAnimationFrame(step);
  });

  pauseButton.addEventListener("click", () => {
    if (running) {
      running = false;
      pauseButton.textContent = "Resume";
      runButton.disabled = false;
      runButton.textContent = "Continue reaction";
      status.textContent = "Paused — inspect the readings and concentration-time graph";
    } else {
      running = true;
      lastTimestamp = 0;
      pauseButton.textContent = "Pause";
      runButton.disabled = true;
      runButton.textContent = "Reaction running";
      status.textContent = "Running — particles collide and the concentrations decrease";
      requestAnimationFrame(step);
    }
  });

  resetButton.addEventListener("click", () => resetExperiment());
  saveTrialButton.addEventListener("click", saveCurrentTrial);
  clearTrialsButton.addEventListener("click", () => {
    trials = [];
    renderTrials();
    status.textContent = "Trial list cleared — run a new experiment";
  });
  themeButton.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem("kinetics-theme", theme);
    applyTheme();
  });

  window.addEventListener("resize", resize);
  updateControls();
  renderTrials();
  resetExperiment();
  applyTheme();
  resize();
})();
