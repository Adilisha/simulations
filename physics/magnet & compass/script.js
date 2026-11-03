(() => {
      const canvas = document.querySelector("#simulation");
      const context = canvas.getContext("2d");
      const angleInput = document.querySelector("#angle");
      const strengthInput = document.querySelector("#strength");
      const angleOutput = document.querySelector("#angle-value");
      const strengthOutput = document.querySelector("#strength-value");
      const addCompassButton = document.querySelector("#add-compass");
      const resetButton = document.querySelector("#reset");
      const rotateButton = document.querySelector("#rotate-left");

      const initialState = { angle: 0, strength: 70, magnetX: 0.43, magnetY: 0.5 };
      let angle = initialState.angle;
      let strength = initialState.strength;
      let magnet = { x: 0, y: 0 };
      let magnetSize = { width: 180, height: 54 };
      let compasses = [];
      let activeDrag = null;
      let width = 0;
      let height = 0;

      const rotate = (point, radians) => ({
        x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
        y: point.x * Math.sin(radians) + point.y * Math.cos(radians)
      });

      function resize() {
        const bounds = canvas.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        width = bounds.width;
        height = bounds.height;
        canvas.width = Math.round(width * pixelRatio);
        canvas.height = Math.round(height * pixelRatio);
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        magnetSize = { width: Math.min(180, width * 0.36), height: 54 };
        magnet.x = Math.min(Math.max(magnet.x || width * initialState.magnetX, magnetSize.width / 2 + 12), width - magnetSize.width / 2 - 12);
        magnet.y = Math.min(Math.max(magnet.y || height * initialState.magnetY, magnetSize.height / 2 + 12), height - magnetSize.height / 2 - 12);
        if (compasses.length === 0) {
          compasses = [{ x: width * 0.77, y: height * 0.5 }];
        } else {
          compasses.forEach((compass) => {
            compass.x = Math.max(28, Math.min(width - 28, compass.x));
            compass.y = Math.max(28, Math.min(height - 28, compass.y));
          });
        }
        draw();
      }

      function fieldAt(x, y) {
        const radians = angle * Math.PI / 180;
        const poleOffset = magnetSize.width * 0.39;
        const north = rotate({ x: poleOffset, y: 0 }, radians);
        const south = rotate({ x: -poleOffset, y: 0 }, radians);
        const dxNorth = x - magnet.x - north.x;
        const dyNorth = y - magnet.y - north.y;
        const dxSouth = x - magnet.x - south.x;
        const dySouth = y - magnet.y - south.y;
        const northDistance = Math.max(18, Math.hypot(dxNorth, dyNorth));
        const southDistance = Math.max(18, Math.hypot(dxSouth, dySouth));
        const scale = strength / 70;
        return {
          x: scale * (dxNorth / northDistance ** 3 - dxSouth / southDistance ** 3),
          y: scale * (dyNorth / northDistance ** 3 - dySouth / southDistance ** 3)
        };
      }

      function drawArrow(x, y, vector, color, size) {
        const magnitude = Math.hypot(vector.x, vector.y);
        if (magnitude < 0.000001) return;
        const ux = vector.x / magnitude;
        const uy = vector.y / magnitude;
        const length = size * (0.55 + 0.45 * strength / 100);
        const head = Math.min(4, length * 0.34);
        context.beginPath();
        context.moveTo(x - ux * length / 2, y - uy * length / 2);
        context.lineTo(x + ux * length / 2, y + uy * length / 2);
        context.strokeStyle = color;
        context.lineWidth = 1.25;
        context.stroke();
        context.beginPath();
        context.moveTo(x + ux * length / 2, y + uy * length / 2);
        context.lineTo(x + ux * length / 2 - ux * head - uy * head * 0.7, y + uy * length / 2 - uy * head + ux * head * 0.7);
        context.lineTo(x + ux * length / 2 - ux * head + uy * head * 0.7, y + uy * length / 2 - uy * head - ux * head * 0.7);
        context.closePath();
        context.fillStyle = color;
        context.fill();
      }

      function drawMagnet() {
        const radians = angle * Math.PI / 180;
        context.save();
        context.translate(magnet.x, magnet.y);
        context.rotate(radians);
        const half = magnetSize.width / 2;
        const top = -magnetSize.height / 2;
        const gradient = context.createLinearGradient(-half, 0, half, 0);
        gradient.addColorStop(0, "#4774e8");
        gradient.addColorStop(0.5, "#4774e8");
        gradient.addColorStop(0.5, "#ef5968");
        gradient.addColorStop(1, "#ef5968");
        context.beginPath();
        context.roundRect(-half, top, magnetSize.width, magnetSize.height, 12);
        context.fillStyle = gradient;
        context.shadowColor = "rgba(36, 54, 91, .2)";
        context.shadowBlur = 12;
        context.shadowOffsetY = 4;
        context.fill();
        context.shadowColor = "transparent";
        context.fillStyle = "rgba(255,255,255,.95)";
        context.font = "700 17px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("S", -half / 2, 0);
        context.fillText("N", half / 2, 0);
        context.restore();
      }

      function drawCompass(compass) {
        const field = fieldAt(compass.x, compass.y);
        const angleRadians = Math.atan2(field.y, field.x);
        const radius = 23;
        context.save();
        context.translate(compass.x, compass.y);
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fillStyle = "#fff";
        context.shadowColor = "rgba(29, 49, 88, .16)";
        context.shadowBlur = 10;
        context.shadowOffsetY = 3;
        context.fill();
        context.shadowColor = "transparent";
        context.strokeStyle = "#dbe2ed";
        context.lineWidth = 1.5;
        context.stroke();
        context.fillStyle = "#8490a4";
        context.font = "700 7px system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("N", 0, -16);
        context.rotate(angleRadians);
        context.beginPath();
        context.moveTo(15, 0);
        context.lineTo(0, -5);
        context.lineTo(-2, 0);
        context.lineTo(0, 5);
        context.closePath();
        context.fillStyle = "#ef5968";
        context.fill();
        context.beginPath();
        context.moveTo(-15, 0);
        context.lineTo(0, -5);
        context.lineTo(2, 0);
        context.lineTo(0, 5);
        context.closePath();
        context.fillStyle = "#4774e8";
        context.fill();
        context.restore();
      }

      function draw() {
        if (!width || !height) return;
        context.clearRect(0, 0, width, height);
        context.fillStyle = "#fbfcff";
        context.fillRect(0, 0, width, height);

        const spacing = width < 500 ? 53 : 61;
        for (let x = spacing / 2; x < width; x += spacing) {
          for (let y = spacing / 2; y < height; y += spacing) {
            const local = rotate({ x: x - magnet.x, y: y - magnet.y }, -angle * Math.PI / 180);
            if (Math.abs(local.x) < magnetSize.width / 2 + 12 && Math.abs(local.y) < magnetSize.height / 2 + 12) continue;
            const coveredByCompass = compasses.some((compass) => Math.hypot(x - compass.x, y - compass.y) < 30);
            if (!coveredByCompass) drawArrow(x, y, fieldAt(x, y), "#c4cfe4", width < 500 ? 11 : 13);
          }
        }

        drawMagnet();
        compasses.forEach(drawCompass);
      }

      function updateControls() {
        angleInput.value = String(angle);
        angleOutput.value = `${angle}°`;
        angleOutput.textContent = `${angle}°`;
        strengthInput.value = String(strength);
        strengthOutput.value = `${strength}%`;
        strengthOutput.textContent = `${strength}%`;
        addCompassButton.disabled = compasses.length >= 5;
        draw();
      }

      function canvasPoint(event) {
        const bounds = canvas.getBoundingClientRect();
        return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
      }

      function magnetContains(point) {
        const local = rotate({ x: point.x - magnet.x, y: point.y - magnet.y }, -angle * Math.PI / 180);
        return Math.abs(local.x) <= magnetSize.width / 2 + 5 && Math.abs(local.y) <= magnetSize.height / 2 + 5;
      }

      canvas.addEventListener("pointerdown", (event) => {
        const point = canvasPoint(event);
        const compassIndex = compasses.findIndex((compass) => Math.hypot(point.x - compass.x, point.y - compass.y) <= 27);
        if (compassIndex >= 0) activeDrag = { type: "compass", index: compassIndex };
        else if (magnetContains(point)) activeDrag = { type: "magnet" };
        else return;
        canvas.setPointerCapture(event.pointerId);
      });

      canvas.addEventListener("pointermove", (event) => {
        if (!activeDrag) return;
        const point = canvasPoint(event);
        if (activeDrag.type === "magnet") {
          magnet.x = Math.max(magnetSize.width / 2 + 12, Math.min(width - magnetSize.width / 2 - 12, point.x));
          magnet.y = Math.max(magnetSize.height / 2 + 12, Math.min(height - magnetSize.height / 2 - 12, point.y));
        } else {
          const compass = compasses[activeDrag.index];
          compass.x = Math.max(27, Math.min(width - 27, point.x));
          compass.y = Math.max(27, Math.min(height - 27, point.y));
        }
        draw();
      });

      canvas.addEventListener("pointerup", () => { activeDrag = null; });
      canvas.addEventListener("pointercancel", () => { activeDrag = null; });
      angleInput.addEventListener("input", () => {
        angle = Number(angleInput.value);
        updateControls();
      });
      strengthInput.addEventListener("input", () => {
        strength = Number(strengthInput.value);
        updateControls();
      });
      addCompassButton.addEventListener("click", () => {
        if (compasses.length >= 5) return;
        const offset = compasses.length % 2 === 0 ? 1 : -1;
        compasses.push({
          x: Math.max(30, Math.min(width - 30, magnet.x + offset * Math.min(125, width * 0.31))),
          y: Math.max(30, Math.min(height - 30, magnet.y + (compasses.length % 3 - 1) * 90))
        });
        updateControls();
      });
      rotateButton.addEventListener("click", () => {
        angle = Math.max(-90, angle - 15);
        updateControls();
      });
      resetButton.addEventListener("click", () => {
        angle = initialState.angle;
        strength = initialState.strength;
        magnet = { x: width * initialState.magnetX, y: height * initialState.magnetY };
        compasses = [{ x: width * 0.77, y: height * 0.5 }];
        updateControls();
      });

      new ResizeObserver(resize).observe(canvas);
      resize();
      updateControls();
    })();
