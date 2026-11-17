(() => {
      const canvas = document.querySelector("#simulation");
      const context = canvas.getContext("2d");
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
      const addDropButton = document.querySelector("#add-drop");
      const resetButton = document.querySelector("#reset");
      const themeToggleButton = document.querySelector("#theme-toggle");
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      const statVolume = document.querySelector("#stat-volume");
      const statPh = document.querySelector("#stat-ph");
      const statEquiv = document.querySelector("#stat-equiv");
      const statusEl = document.querySelector("#status");

      const KW = 1e-14;
      const ACETIC_KA = 1.8e-5;
      const DROP_VOLUME = 0.05;

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
      let width = 0;
      let height = 0;
      let curve = [];
      let maxVolume = 50;
      let equivalenceVolume = 25;
      let dripTimer = 0;
      let droplets = [];
      let ripple = null;
      let flaskTilt = 0;
      let draggingFlask = false;
      let lastShakeX = 0;
      let lastTime = 0;

      const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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

        droplets = [];
        ripple = null;
        draw();
        drawChart();
      }

      function flaskGeometry() {
        const cx = width * 0.52;
        const topY = height * 0.44;
        const bottomY = height * 0.88;
        const topHalf = Math.min(70, width * 0.16);
        const bottomHalf = Math.min(120, width * 0.27);
        const neckHalf = 16;
        const neckTop = topY - 34;
        return { cx, topY, bottomY, topHalf, bottomHalf, neckHalf, neckTop };
      }

      function flaskPath(g) {
        context.beginPath();
        context.moveTo(g.cx - g.neckHalf, g.neckTop);
        context.lineTo(g.cx - g.neckHalf, g.topY - 5);
        context.quadraticCurveTo(g.cx - g.topHalf, g.topY - 2, g.cx - g.topHalf - 5, g.topY + 25);
        context.lineTo(g.cx - g.bottomHalf + 8, g.bottomY - 20);
        context.quadraticCurveTo(g.cx - g.bottomHalf, g.bottomY, g.cx - g.bottomHalf + 20, g.bottomY);
        context.lineTo(g.cx + g.bottomHalf - 20, g.bottomY);
        context.quadraticCurveTo(g.cx + g.bottomHalf, g.bottomY, g.cx + g.bottomHalf - 8, g.bottomY - 20);
        context.lineTo(g.cx + g.topHalf + 5, g.topY + 25);
        context.quadraticCurveTo(g.cx + g.topHalf, g.topY - 2, g.cx + g.neckHalf, g.topY - 5);
        context.lineTo(g.cx + g.neckHalf, g.neckTop);
        context.closePath();
      }

      function liquidSurfaceY(g, fraction) {
        const minY = g.topY + 26;
        const maxY = g.bottomY - 14;
        return maxY - (maxY - minY) * fraction;
      }

      function clipFlaskLiquid(g, fillColor, fraction) {
        const surfaceY = liquidSurfaceY(g, fraction);
        context.save();
        flaskPath(g);
        context.clip();
        context.fillStyle = fillColor;
        context.beginPath();
        context.moveTo(g.cx - g.bottomHalf - 4, surfaceY - 2);
        context.quadraticCurveTo(g.cx, surfaceY + 3, g.cx + g.bottomHalf + 4, surfaceY - 2);
        context.lineTo(g.cx + g.bottomHalf + 4, g.bottomY + 4);
        context.lineTo(g.cx - g.bottomHalf - 4, g.bottomY + 4);
        context.closePath();
        context.fill();
        context.strokeStyle = "rgba(255,255,255,.62)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(g.cx - g.topHalf + 8, surfaceY - 1);
        context.quadraticCurveTo(g.cx, surfaceY + 4, g.cx + g.topHalf - 8, surfaceY - 1);
        context.stroke();
        context.restore();
      }

      function drawStand() {
        const themeStyles = getComputedStyle(document.documentElement);
        const rodColor = themeStyles.getPropertyValue("--subtle-text").trim();
        const g = flaskGeometry();
        const rodX = Math.max(26, g.cx - Math.min(155, width * 0.28));
        const baseY = height * 0.9;
        const clampY = height * 0.2;
        context.strokeStyle = rodColor;
        context.fillStyle = rodColor;
        context.lineWidth = 6;
        context.lineCap = "round";
        context.beginPath();
        context.moveTo(rodX, height * 0.09);
        context.lineTo(rodX, baseY);
        context.stroke();
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(rodX - 38, baseY);
        context.lineTo(rodX + 38, baseY);
        context.stroke();
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(rodX, clampY);
        context.lineTo(g.cx - 18, clampY);
        context.stroke();
        context.beginPath();
        context.arc(rodX, clampY, 8, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.moveTo(g.cx - 18, clampY - 7);
        context.lineTo(g.cx - 18, clampY + 7);
        context.lineTo(g.cx - 8, clampY + 7);
        context.moveTo(g.cx - 18, clampY - 7);
        context.lineTo(g.cx - 8, clampY - 7);
        context.stroke();
      }

      function drawBurette(ph) {
        const themeStyles = getComputedStyle(document.documentElement);
        const glassColor = themeStyles.getPropertyValue("--glass").trim();
        const glassBorder = themeStyles.getPropertyValue("--glass-border").trim();
        const g = flaskGeometry();
        const bx = g.cx;
        const bw = 30;
        const topY = height * 0.07;
        const bottomY = g.neckTop - 6;
        const bh = bottomY - topY;
        const remaining = clamp(1 - addedVolume / maxVolume, 0, 1);
        const liquidTop = bottomY - bh * remaining;

        context.save();
        context.beginPath();
        context.roundRect(bx - bw / 2, topY, bw, bh, 7);
        context.fillStyle = glassColor;
        context.fill();
        context.strokeStyle = glassBorder;
        context.lineWidth = 2;
        context.stroke();

        context.save();
        context.beginPath();
        context.roundRect(bx - bw / 2 + 3, topY + 4, bw - 6, bh - 8, 6);
        context.clip();
        context.fillStyle = "rgba(91, 141, 217, .58)";
        context.fillRect(bx - bw / 2 + 3, liquidTop, bw - 6, bottomY - liquidTop);
        context.fillStyle = "rgba(255,255,255,.55)";
        context.fillRect(bx - bw / 2 + 5, Math.max(topY + 5, liquidTop - 2), bw - 10, 2);
        context.restore();

        context.strokeStyle = themeStyles.getPropertyValue("--subtle-text").trim();
        context.fillStyle = themeStyles.getPropertyValue("--muted-text").trim();
        context.lineWidth = 1;
        context.font = "600 9px system-ui, sans-serif";
        context.textAlign = "left";
        context.textBaseline = "middle";
        for (let i = 0; i <= 50; i++) {
          const y = topY + (bh * i) / 50;
          const major = i % 10 === 0;
          const medium = i % 5 === 0;
          const tickLength = major ? 10 : medium ? 7 : 4;
          context.beginPath();
          context.moveTo(bx + bw / 2 - tickLength, y);
          context.lineTo(bx + bw / 2 - 2, y);
          context.stroke();
          if (major) context.fillText(`${(maxVolume * i / 50).toFixed(0)}`, bx + bw / 2 + 8, y);
        }

        const tapY = bottomY + 5;
        context.fillStyle = glassBorder;
        context.fillRect(bx - 5, bottomY - 1, 10, 12);
        context.fillStyle = themeStyles.getPropertyValue("--label-text").trim();
        context.beginPath();
        context.roundRect(bx - 16, tapY - 3, 32, 6, 3);
        context.fill();
        context.fillStyle = "#5478e8";
        context.beginPath();
        context.arc(bx + 16, tapY, 3, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.moveTo(bx - 2.5, bottomY + 12);
        context.lineTo(bx + 2.5, bottomY + 12);
        context.lineTo(bx, bottomY + 24);
        context.closePath();
        context.fill();
        context.restore();
      }

      function pendingVolume() {
        return droplets.reduce((total, drop) => total + drop.volume, 0);
      }

      function createDrop() {
        const volume = Math.min(DROP_VOLUME, maxVolume - addedVolume - pendingVolume());
        if (volume <= 1e-9) return false;
        const g = flaskGeometry();
        droplets.push({ x: g.cx, y: g.neckTop + 18, vy: 24, r: 3.2, volume });
        return true;
      }

      function drawDrip(dt) {
        if (running && !finished) {
          dripTimer -= dt;
          if (dripTimer <= 0) {
            if (createDrop()) dripTimer += DROP_VOLUME / titrationSpeed;
            else running = false;
          }
        }
        const g = flaskGeometry();
        const surfaceY = liquidSurfaceY(g, currentFraction());
        for (let i = droplets.length - 1; i >= 0; i--) {
          const drop = droplets[i];
          drop.vy += 900 * dt;
          drop.y += drop.vy * dt;
          if (drop.y >= surfaceY) {
            addedVolume = Math.min(maxVolume, addedVolume + drop.volume);
            ripple = { y: surfaceY, age: 0 };
            droplets.splice(i, 1);
          }
        }
        if (ripple) {
          ripple.age += dt;
          if (ripple.age > 0.45) ripple = null;
        }
      }

      function rand(min, max) {
        return min + Math.random() * (max - min);
      }

      function currentFraction() {
        const total = analyteVolume + maxVolume;
        return clamp((analyteVolume + addedVolume) / total, 0, 0.92);
      }

      function drawFlask(ph) {
        const g = flaskGeometry();
        const themeStyles = getComputedStyle(document.documentElement);
        const glassBorder = themeStyles.getPropertyValue("--glass-border").trim();
        const fill = indicatorRGB(ph);
        const fraction = currentFraction();
        context.save();
        context.translate(g.cx, g.bottomY);
        context.rotate(flaskTilt);
        context.translate(-g.cx, -g.bottomY);
        clipFlaskLiquid(g, fill, fraction);

        context.save();
        flaskPath(g);
        context.fillStyle = "rgba(255,255,255,.06)";
        context.fill();
        context.strokeStyle = glassBorder;
        context.lineWidth = 2;
        context.stroke();
        context.restore();

        context.save();
        context.strokeStyle = "rgba(255,255,255,.68)";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(g.cx - g.neckHalf + 5, g.neckTop + 8);
        context.lineTo(g.cx - g.neckHalf + 5, g.topY - 12);
        context.quadraticCurveTo(g.cx - g.topHalf - 2, g.topY + 8, g.cx - g.bottomHalf + 15, g.bottomY - 23);
        context.stroke();
        context.beginPath();
        context.ellipse(g.cx, g.neckTop, g.neckHalf, 4, 0, 0, Math.PI * 2);
        context.stroke();
        context.restore();

        context.save();
        flaskPath(g);
        context.clip();
        const surfaceY = liquidSurfaceY(g, fraction);
        context.strokeStyle = "rgba(255,255,255,.45)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(g.cx - g.topHalf + 10, surfaceY);
        context.lineTo(g.cx + g.topHalf - 10, surfaceY);
        context.stroke();
        if (ripple) {
          const progress = ripple.age / 0.45;
          context.beginPath();
          context.ellipse(g.cx, ripple.y, 5 + progress * 19, 2 + progress * 5, 0, 0, Math.PI * 2);
          context.strokeStyle = `rgba(255,255,255,${(1 - progress) * 0.55})`;
          context.lineWidth = 1.5;
          context.stroke();
        }
        context.restore();
        context.restore();
      }

      function drawDroplets() {
        context.save();
        for (const drop of droplets) {
          context.beginPath();
          context.ellipse(drop.x, drop.y, drop.r * 0.72, drop.r * 1.35, 0, 0, Math.PI * 2);
          context.fillStyle = "rgba(91,141,217,.78)";
          context.fill();
          context.strokeStyle = "rgba(255,255,255,.72)";
          context.lineWidth = 1;
          context.stroke();
        }
        context.restore();
      }

      function drawBench() {
        const benchY = height * 0.9;
        const g = flaskGeometry();
        const tileWidth = Math.min(190, width * 0.48);
        const tileHeight = 12;
        context.fillStyle = "rgba(255,255,255,.82)";
        context.strokeStyle = "rgba(153,166,187,.5)";
        context.lineWidth = 1;
        context.beginPath();
        context.roundRect(g.cx - tileWidth / 2, benchY - tileHeight, tileWidth, tileHeight, 3);
        context.fill();
        context.stroke();
        context.fillStyle = "rgba(70,84,108,.12)";
        context.fillRect(0, benchY + 2, width, height - benchY);
        context.fillStyle = "rgba(255,255,255,.28)";
        context.fillRect(0, benchY + 3, width, 2);
      }

      function drawReadouts(ph) {
        const themeStyles = getComputedStyle(document.documentElement);
        context.fillStyle = themeStyles.getPropertyValue("--label-text").trim();
        context.font = "700 13px system-ui, sans-serif";
        context.textAlign = "right";
        context.textBaseline = "top";
        context.fillText(`Titrant added: ${addedVolume.toFixed(2)} mL`, width - 20, 16);
        context.fillText(`pH: ${ph.toFixed(2)}`, width - 20, 36);
        context.fillStyle = themeStyles.getPropertyValue("--subtle-text").trim();
        context.font = "600 11px system-ui, sans-serif";
        context.fillText(`Equivalence at ${equivalenceVolume.toFixed(1)} mL`, width - 20, 58);
      }

      function buretteTapBounds() {
        const g = flaskGeometry();
        const bottomY = g.neckTop - 6;
        return { left: g.cx - 20, right: g.cx + 20, top: bottomY - 5, bottom: bottomY + 17 };
      }

      function isOverTap(x, y) {
        const tap = buretteTapBounds();
        return x >= tap.left && x <= tap.right && y >= tap.top && y <= tap.bottom;
      }

      function isOverFlask(x, y) {
        flaskPath(flaskGeometry());
        return context.isPointInPath(x, y);
      }

      function canvasPoint(event) {
        const bounds = canvas.getBoundingClientRect();
        return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      }

      function dispenseOneDrop() {
        if (finished || addedVolume + pendingVolume() >= maxVolume - 1e-9) return;
        running = false;
        dripTimer = 0;
        createDrop();
        updateControls();
      }

      function draw() {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        const themeStyles = getComputedStyle(document.documentElement);
        context.fillStyle = themeStyles.getPropertyValue("--canvas-background").trim();
        context.fillRect(0, 0, width, height);

        const ph = solvePH(addedVolume);
        drawBench();
        drawStand();
        drawBurette(ph);
        drawDroplets();
        drawFlask(ph);
        drawReadouts(ph);
      }

      function updateStats(ph) {
        statVolume.textContent = `${addedVolume.toFixed(2)} mL`;
        statPh.textContent = ph.toFixed(2);
        statEquiv.textContent = `${equivalenceVolume.toFixed(1)} mL`;
      }

      function updateStatus(ph) {
        if (finished) {
          statusEl.textContent = "Titration complete — compare your endpoint volume with the calculated equivalence point.";
          statusEl.classList.remove("endpoint");
        } else if (!running && addedVolume === 0 && droplets.length === 0) {
          statusEl.textContent = "Ready — add one drop or start the titration";
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
          statusEl.textContent = droplets.length && addedVolume === 0
            ? "Drop dispensed — watch it fall, add another, or start the titration"
            : droplets.length
              ? "Paused — a drop is still falling; add a drop or resume"
              : "Paused — press Resume or add one drop";
          statusEl.classList.remove("endpoint");
        }
      }

      function drawChart() {
        const bounds = chartCanvas.getBoundingClientRect();
        const w = bounds.width;
        const h = bounds.height;
        if (!w || !h || !chartCanvas.width || !curve.length) return;
        chartContext.clearRect(0, 0, w, h);
        const themeStyles = getComputedStyle(document.documentElement);
        const gridColor = themeStyles.getPropertyValue("--chart-grid").trim();
        const textColor = themeStyles.getPropertyValue("--chart-text").trim();
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

        const trace = (upTo, color, widthPx, dashed) => {
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
          if (dashed) chartContext.setLineDash([5, 4]);
          chartContext.stroke();
          chartContext.setLineDash([]);
        };

        trace(maxVolume, themeStyles.getPropertyValue("--curve-color").trim(), 1.4, false);
        trace(addedVolume, "#5478e8", 2.2, false);

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

      function updateControls() {
        analyteMolarityOutput.value = `${analyteMolarity.toFixed(2)} M`;
        analyteMolarityOutput.textContent = `${analyteMolarity.toFixed(2)} M`;
        analyteVolumeOutput.value = `${analyteVolume.toFixed(1)} mL`;
        analyteVolumeOutput.textContent = `${analyteVolume.toFixed(1)} mL`;
        titrantMolarityOutput.value = `${titrantMolarity.toFixed(2)} M`;
        titrantMolarityOutput.textContent = `${titrantMolarity.toFixed(2)} M`;
        speedOutput.value = `${titrationSpeed.toFixed(1)} mL/s`;
        speedOutput.textContent = `${titrationSpeed.toFixed(1)} mL/s`;
        titrateButton.textContent = running ? "Pause" : (finished ? "Titration complete" : (addedVolume > 0 || droplets.length > 0 ? "Resume" : "Start titration"));
        titrateButton.disabled = finished;
        addDropButton.disabled = finished || addedVolume + pendingVolume() >= maxVolume - 1e-9;
        resetButton.disabled = false;
      }

      function reset() {
        addedVolume = 0;
        running = false;
        finished = false;
        droplets = [];
        ripple = null;
        flaskTilt = 0;
        buildCurve();
        updateControls();
        updateStatus(solvePH(0));
        updateStats(solvePH(0));
        draw();
      }

      function frame(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
        lastTime = timestamp;

        drawDrip(dt);
        if (!running && droplets.length === 0 && addedVolume >= maxVolume) finished = true;
        if (!draggingFlask) {
          flaskTilt *= Math.exp(-5 * dt);
          if (Math.abs(flaskTilt) < 0.001) flaskTilt = 0;
        }

        const ph = solvePH(addedVolume);
        updateStats(ph);
        updateStatus(ph);
        updateControls();
        draw();
        drawChart();
        requestAnimationFrame(frame);
      }

      analyteSelect.addEventListener("change", () => {
        analyteType = analyteSelect.value;
        addedVolume = 0;
        running = false;
        finished = false;
        droplets = [];
        ripple = null;
        flaskTilt = 0;
        buildCurve();
        updateControls();
      });
      indicatorSelect.addEventListener("change", () => {
        indicator = indicatorSelect.value;
        draw();
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
        if (!running && addedVolume + pendingVolume() >= maxVolume - 1e-9) return;
        running = !running;
        if (running) dripTimer = 0;
        updateControls();
      });
      addDropButton.addEventListener("click", dispenseOneDrop);
      resetButton.addEventListener("click", reset);
      canvas.addEventListener("click", (event) => {
        const point = canvasPoint(event);
        if (isOverTap(point.x, point.y)) dispenseOneDrop();
      });
      canvas.addEventListener("pointermove", (event) => {
        const point = canvasPoint(event);
        if (draggingFlask) {
          flaskTilt = clamp(flaskTilt + (point.x - lastShakeX) * 0.012, -0.3, 0.3);
          lastShakeX = point.x;
          canvas.classList.add("shaking-flask");
          return;
        }
        canvas.classList.toggle("over-tap", isOverTap(point.x, point.y));
        canvas.classList.toggle("over-flask", isOverFlask(point.x, point.y));
      });
      canvas.addEventListener("pointerdown", (event) => {
        if (event.button !== 0) return;
        const point = canvasPoint(event);
        if (!isOverFlask(point.x, point.y)) return;
        draggingFlask = true;
        lastShakeX = point.x;
        canvas.setPointerCapture(event.pointerId);
        canvas.classList.add("shaking-flask");
      });
      const releaseFlask = () => {
        draggingFlask = false;
        canvas.classList.remove("shaking-flask");
      };
      canvas.addEventListener("pointerup", releaseFlask);
      canvas.addEventListener("pointercancel", releaseFlask);
      canvas.addEventListener("pointerleave", () => {
        if (!draggingFlask) canvas.classList.remove("over-tap", "over-flask");
      });
      themeToggleButton.addEventListener("click", () => {
        theme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("titration-theme", theme);
        applyTheme();
      });

      new ResizeObserver(resize).observe(canvas);
      new ResizeObserver(() => drawChart()).observe(chartCanvas);
      applyTheme();
      resize();
      reset();
      requestAnimationFrame(frame);
    })();
