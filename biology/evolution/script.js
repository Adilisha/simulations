(() => {
      const canvas = document.querySelector("#simulation");
      const context = canvas.getContext("2d");
      const chartCanvas = document.querySelector("#chart");
      const chartContext = chartCanvas.getContext("2d");
      const hawkSpeedInput = document.querySelector("#hawk-speed");
      const hawkCountInput = document.querySelector("#hawk-count");
      const mutationInput = document.querySelector("#mutation");
      const foodInput = document.querySelector("#food");
      const hawkSpeedOutput = document.querySelector("#hawk-speed-value");
      const hawkCountOutput = document.querySelector("#hawk-count-value");
      const mutationOutput = document.querySelector("#mutation-value");
      const foodOutput = document.querySelector("#food-value");
      const pauseButton = document.querySelector("#pause");
      const resetButton = document.querySelector("#reset");
      const themeToggleButton = document.querySelector("#theme-toggle");
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      const extinctOverlay = document.querySelector("#extinct-overlay");
      const statPop = document.querySelector("#stat-pop");
      const statSpeed = document.querySelector("#stat-speed");
      const statGen = document.querySelector("#stat-gen");

      const initialSettings = { hawkSpeed: 110, hawkCount: 3, mutation: 25, food: 90 };
      let theme = localStorage.getItem("natural-selection-theme") === "dark" ? "dark" : "light";
      let hawkSpeed = initialSettings.hawkSpeed;
      let hawkCount = initialSettings.hawkCount;
      let mutation = initialSettings.mutation;
      let foodTarget = initialSettings.food;
      let running = true;
      let width = 0;
      let height = 0;
      let critters = [];
      let hawks = [];
      let pellets = [];
      let history = [];
      let generation = 0;
      let extinct = false;
      let lastTime = 0;
      let chartTimer = 0;

      const rand = (min, max) => min + Math.random() * (max - min);
      const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
      const gauss = () => (Math.random() + Math.random() + Math.random()) / 1.5 - 1;

      function critterSpeed(critter) {
        return 30 + critter.trait * 110;
      }

      function traitColor(trait) {
        return `hsl(${215 - trait * 195} 78% 55%)`;
      }

      function spawnCritter(trait, gen, x, y) {
        return {
          x: x ?? rand(20, Math.max(40, width - 20)),
          y: y ?? rand(20, Math.max(40, height - 20)),
          heading: rand(0, Math.PI * 2),
          trait: clamp(trait, 0, 1),
          gen,
          energy: rand(55, 80),
          age: 0,
          lifespan: rand(35, 70)
        };
      }

      function spawnHawk() {
        const side = Math.floor(rand(0, 4));
        const edge = 20;
        return {
          x: side === 0 ? -edge : side === 1 ? width + edge : rand(edge, width - edge),
          y: side === 2 ? -edge : side === 3 ? height + edge : rand(edge, height - edge),
          vx: 0,
          vy: 0,
          wobble: rand(0, Math.PI * 2)
        };
      }

      function spawnPellet() {
        return { x: rand(12, width - 12), y: rand(12, height - 12) };
      }

      function reset() {
        critters = [];
        for (let i = 0; i < 60; i++) {
          critters.push(spawnCritter(clamp(gauss() * 0.18 + 0.5, 0, 1), 0));
        }
        hawks = [];
        for (let i = 0; i < hawkCount; i++) hawks.push(spawnHawk());
        pellets = [];
        for (let i = 0; i < foodTarget; i++) pellets.push(spawnPellet());
        history = [];
        generation = 0;
        extinct = false;
        extinctOverlay.hidden = true;
        updateControls();
        drawChart();
      }

      function applyTheme() {
        document.documentElement.dataset.theme = theme;
        themeToggleButton.textContent = theme === "dark" ? "Use light theme" : "Use dark theme";
        themeToggleButton.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
        themeToggleButton.setAttribute("aria-pressed", String(theme === "dark"));
        themeColorMeta.content = theme === "dark" ? "#111827" : "#f3f6fb";
        draw();
        drawChart();
      }

      function resize() {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const chartBounds = chartCanvas.getBoundingClientRect();
        chartCanvas.width = Math.round(chartBounds.width * pixelRatio);
        chartCanvas.height = Math.round(chartBounds.height * pixelRatio);
        chartContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        critters.forEach((c) => {
          c.x = clamp(c.x, 10, width - 10);
          c.y = clamp(c.y, 10, height - 10);
        });
        pellets.forEach((p) => {
          p.x = clamp(p.x, 10, width - 10);
          p.y = clamp(p.y, 10, height - 10);
        });
        draw();
        drawChart();
      }

      function updateCritters(dt) {
        const survivors = [];
        const mutationSigma = (mutation / 100) * 0.25;
        const popCap = 260;

        for (const c of critters) {
          c.age += dt;
          c.energy -= dt * 1.4;

          let fleeX = 0;
          let fleeY = 0;
          for (const h of hawks) {
            const dx = c.x - h.x;
            const dy = c.y - h.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 120 && dist > 0.001) {
              const weight = (1 - dist / 120) * 2.4;
              fleeX += (dx / dist) * weight;
              fleeY += (dy / dist) * weight;
            }
          }

          if (fleeX !== 0 || fleeY !== 0) {
            const desired = Math.atan2(fleeY, fleeX);
            let diff = desired - c.heading;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            c.heading += clamp(diff, -6 * dt, 6 * dt);
          } else {
            c.heading += (Math.random() - 0.5) * 3.2 * dt;
          }
          const speed = critterSpeed(c);
          c.x += Math.cos(c.heading) * speed * dt;
          c.y += Math.sin(c.heading) * speed * dt;

          if (c.x < 8) { c.x = 8; c.heading = Math.PI - c.heading; }
          if (c.x > width - 8) { c.x = width - 8; c.heading = Math.PI - c.heading; }
          if (c.y < 8) { c.y = 8; c.heading = -c.heading; }
          if (c.y > height - 8) { c.y = height - 8; c.heading = -c.heading; }

          for (let i = pellets.length - 1; i >= 0; i--) {
            const p = pellets[i];
            if (Math.hypot(c.x - p.x, c.y - p.y) < 9) {
              c.energy += 34;
              pellets.splice(i, 1);
              break;
            }
          }

          if (c.energy > 0 && c.age < c.lifespan) {
            if (c.energy > 120 && critters.length + survivors.length < popCap) {
              c.energy -= 85;
              const childTrait = clamp(c.trait + gauss() * mutationSigma, 0, 1);
              const child = spawnCritter(childTrait, c.gen + 1, c.x + rand(-8, 8), c.y + rand(-8, 8));
              child.energy = Math.min(60, c.energy * 0.5);
              survivors.push(child);
              generation = Math.max(generation, child.gen);
            }
            survivors.push(c);
          }
        }
        critters = survivors;
      }

      function updateHawks(dt) {
        const kept = hawks.filter((hawk) => hawk.x > -60 && hawk.x < width + 60 && hawk.y > -60 && hawk.y < height + 60);
        while (kept.length < hawkCount) kept.push(spawnHawk());
        hawks = kept.slice(0, hawkCount);

        for (const h of hawks) {
          h.wobble += dt * 2;
          let target = null;
          let best = Infinity;
          for (const c of critters) {
            const d = Math.hypot(c.x - h.x, c.y - h.y);
            if (d < best) { best = d; target = c; }
          }
          let dx;
          let dy;
          if (target) {
            dx = target.x - h.x;
            dy = target.y - h.y;
          } else {
            dx = Math.cos(h.wobble * 0.7) * 200;
            dy = Math.sin(h.wobble * 0.9) * 200;
          }
          const dist = Math.max(1, Math.hypot(dx, dy));
          h.vx = (dx / dist) * hawkSpeed;
          h.vy = (dy / dist) * hawkSpeed;
          h.x += h.vx * dt;
          h.y += h.vy * dt;
        }

        if (critters.length) {
          critters = critters.filter((c) => {
            return !hawks.some((h) => Math.hypot(c.x - h.x, c.y - h.y) < 10);
          });
        }
      }

      function update(dt) {
        while (pellets.length < foodTarget) pellets.push(spawnPellet());
        if (pellets.length > foodTarget) pellets.length = foodTarget;

        updateCritters(dt);
        updateHawks(dt);

        if (critters.length === 0 && !extinct) {
          extinct = true;
          extinctOverlay.hidden = false;
        }
      }

      function drawCritter(c) {
        const radius = 4 + c.trait * 2.5;
        context.beginPath();
        context.arc(c.x, c.y, radius, 0, Math.PI * 2);
        context.fillStyle = traitColor(c.trait);
        context.fill();
        context.beginPath();
        context.arc(c.x, c.y, radius * 0.45, 0, Math.PI * 2);
        context.fillStyle = "rgba(255,255,255,.35)";
        context.fill();
      }

      function drawHawk(h) {
        const angle = Math.atan2(h.vy, h.vx);
        const size = 9;
        context.save();
        context.translate(h.x, h.y);
        context.rotate(angle);
        context.beginPath();
        context.moveTo(size, 0);
        context.lineTo(-size * 0.7, -size * 0.75);
        context.lineTo(-size * 0.35, 0);
        context.lineTo(-size * 0.7, size * 0.75);
        context.closePath();
        context.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--predator-color").trim();
        context.fill();
        context.restore();
      }

      function draw() {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        const themeStyles = getComputedStyle(document.documentElement);
        context.fillStyle = themeStyles.getPropertyValue("--canvas-background").trim();
        context.fillRect(0, 0, width, height);

        for (const p of pellets) {
          context.beginPath();
          context.arc(p.x, p.y, 3, 0, Math.PI * 2);
          context.fillStyle = "#5aa85f";
          context.fill();
        }

        for (const c of critters) drawCritter(c);
        for (const h of hawks) drawHawk(h);
      }

      function updateStats() {
        statPop.textContent = String(critters.length);
        const mean = critters.length
          ? critters.reduce((sum, c) => sum + c.trait, 0) / critters.length
          : 0;
        statSpeed.textContent = `${Math.round(mean * 100)}%`;
        statGen.textContent = String(generation);
      }

      function recordHistory(dt) {
        chartTimer += dt;
        if (chartTimer < 0.25) return;
        chartTimer = 0;
        const mean = critters.length
          ? critters.reduce((sum, c) => sum + c.trait, 0) / critters.length
          : 0;
        history.push({ speed: mean, pop: critters.length });
        if (history.length > 480) history.shift();
        drawChart();
      }

      function drawChart() {
        const bounds = chartCanvas.getBoundingClientRect();
        const w = bounds.width;
        const h = bounds.height;
        if (!w || !h || !chartCanvas.width) return;
        chartContext.clearRect(0, 0, w, h);
        const themeStyles = getComputedStyle(document.documentElement);
        const gridColor = themeStyles.getPropertyValue("--chart-grid").trim();
        const textColor = themeStyles.getPropertyValue("--chart-text").trim();

        chartContext.strokeStyle = gridColor;
        chartContext.lineWidth = 1;
        for (let i = 1; i < 4; i++) {
          const y = (h / 4) * i;
          chartContext.beginPath();
          chartContext.moveTo(0, y);
          chartContext.lineTo(w, y);
          chartContext.stroke();
        }

        if (history.length < 2) {
          chartContext.fillStyle = textColor;
          chartContext.font = "11px system-ui, sans-serif";
          chartContext.textAlign = "center";
          chartContext.textBaseline = "middle";
          chartContext.fillText("Collecting data…", w / 2, h / 2);
          return;
        }

        const maxPop = Math.max(50, ...history.map((p) => p.pop));
        const plot = (key, color) => {
          chartContext.beginPath();
          history.forEach((point, i) => {
            const x = (i / (history.length - 1)) * w;
            const y = h - 4 - (key === "speed" ? point.speed : point.pop / maxPop) * (h - 10);
            if (i === 0) chartContext.moveTo(x, y);
            else chartContext.lineTo(x, y);
          });
          chartContext.strokeStyle = color;
          chartContext.lineWidth = 1.8;
          chartContext.stroke();
        };
        plot("pop", "#4774e8");
        plot("speed", "#f0952f");
      }

      function frame(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
        lastTime = timestamp;
        if (running && !extinct) {
          update(dt);
          recordHistory(dt);
        }
        updateStats();
        draw();
        requestAnimationFrame(frame);
      }

      function updateControls() {
        hawkSpeedInput.value = String(hawkSpeed);
        hawkSpeedOutput.value = `${hawkSpeed} px/s`;
        hawkSpeedOutput.textContent = `${hawkSpeed} px/s`;
        hawkCountInput.value = String(hawkCount);
        hawkCountOutput.value = String(hawkCount);
        hawkCountOutput.textContent = String(hawkCount);
        mutationInput.value = String(mutation);
        mutationOutput.value = `${mutation}%`;
        mutationOutput.textContent = `${mutation}%`;
        foodInput.value = String(foodTarget);
        foodOutput.value = `${foodTarget} pellets`;
        foodOutput.textContent = `${foodTarget} pellets`;
        pauseButton.textContent = running ? "Pause" : "Resume";
      }

      hawkSpeedInput.addEventListener("input", () => {
        hawkSpeed = Number(hawkSpeedInput.value);
        updateControls();
      });
      hawkCountInput.addEventListener("input", () => {
        hawkCount = Number(hawkCountInput.value);
        updateControls();
      });
      mutationInput.addEventListener("input", () => {
        mutation = Number(mutationInput.value);
        updateControls();
      });
      foodInput.addEventListener("input", () => {
        foodTarget = Number(foodInput.value);
        updateControls();
      });
      pauseButton.addEventListener("click", () => {
        running = !running;
        updateControls();
      });
      resetButton.addEventListener("click", () => {
        hawkSpeed = initialSettings.hawkSpeed;
        hawkCount = initialSettings.hawkCount;
        mutation = initialSettings.mutation;
        foodTarget = initialSettings.food;
        running = true;
        if (width && height) reset();
        updateControls();
      });
      themeToggleButton.addEventListener("click", () => {
        theme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("natural-selection-theme", theme);
        applyTheme();
      });

      new ResizeObserver(resize).observe(canvas);
      new ResizeObserver(() => drawChart()).observe(chartCanvas);
      applyTheme();
      resize();
      reset();
      updateControls();
      requestAnimationFrame(frame);
    })();
