
const canvas = document.getElementById("simulationCanvas");
const ctx = canvas.getContext("2d");

const particleSlider = document.getElementById("particleSlider");
const speedSlider = document.getElementById("speedSlider");
const chaosSlider = document.getElementById("chaosSlider");
const sizeSlider = document.getElementById("sizeSlider");
const colorSelect = document.getElementById("colorSelect");

const particleValue = document.getElementById("particleValue");
const speedValue = document.getElementById("speedValue");
const chaosValue = document.getElementById("chaosValue");
const sizeValue = document.getElementById("sizeValue");

const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const exportBtn = document.getElementById("exportBtn");

const modeSelect = document.getElementById("modeSelect");
const fractalControls = document.getElementById("fractalControls");

const fractalType = document.getElementById("fractalType");
const juliaControls = document.getElementById("juliaControls");

const zoomSlider = document.getElementById("zoomSlider");
const iterationSlider = document.getElementById("iterationSlider");

const zoomValue = document.getElementById("zoomValue");
const iterationValue = document.getElementById("iterationValue");

const juliaReal = document.getElementById("juliaReal");
const juliaImag = document.getElementById("juliaImag");

const juliaRealValue = document.getElementById("juliaRealValue");
const juliaImagValue = document.getElementById("juliaImagValue");

let particles = [];

let particleCount = Number(particleSlider.value);
let speed = Number(speedSlider.value);
let chaos = Number(chaosSlider.value);
let particleSize = Number(sizeSlider.value);

let running = true;
let animationId;

let currentMode = "particles";
let fractalZoom = 1;
let maxIterations = 100;

let juliaCReal = -0.7;
let juliaCImag = 0.27;

class Particle {

    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.clientWidth;
        this.y = Math.random() * canvas.clientHeight;
        this.angle = Math.random() * Math.PI * 2;
        this.life = 100 + Math.random() * 200;
        this.hue = Math.random() * 360;
    }

    update() {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        const nx = this.x / width;
        const ny = this.y / height;

        const wave =
            Math.sin(nx * 12 + ny * 8) +
            Math.cos(ny * 10 - nx * 6);

        const turbulence =
            Math.sin(this.x * 0.015 + this.y * 0.01) *
            Math.cos(this.y * 0.012 - this.x * 0.008);

        this.angle += (wave + turbulence * chaos) * 0.035 * chaos;

        this.x += Math.cos(this.angle) * speed;
        this.y += Math.sin(this.angle) * speed;

        this.life--;

        if (
            this.x < 0 ||
            this.x > width ||
            this.y < 0 ||
            this.y > height ||
            this.life <= 0
        ) {
            this.reset();
        }
    }

    draw() {
        let color;

        switch (colorSelect.value) {
            case "green":
                color = "#70D6A5";
                break;

            case "purple":
                color = "#D000FF";
                break;

            case "blue":
                color = "#79C8E8";
                break;

            default:
                color = `hsl(${this.hue}, 75%, 70%)`;
        }

        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;

        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            particleSize,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (currentMode === "fractal") {
        renderFractal();
    } else {
        resetParticles();
    }
}

function resetParticles() {
    particles = [];

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    ctx.clearRect(
        0,
        0,
        canvas.clientWidth,
        canvas.clientHeight
    );
}

function renderFractal() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (!width || !height) return;

    const renderWidth = Math.min(800, Math.floor(width));

    const renderHeight = Math.max(
        1,
        Math.floor(renderWidth * height / width)
    );

    const offscreen = document.createElement("canvas");

    offscreen.width = renderWidth;
    offscreen.height = renderHeight;

    const fractalCtx = offscreen.getContext("2d");

    const image = fractalCtx.createImageData(
        renderWidth,
        renderHeight
    );

    const data = image.data;

    const isJulia = fractalType.value === "julia";

    for (let py = 0; py < renderHeight; py++) {

        for (let px = 0; px < renderWidth; px++) {

            const x0 =
                (px - renderWidth / 2) /
                (0.28 * renderWidth * fractalZoom) - 0.5;

            const y0 =
                (py - renderHeight / 2) /
                (0.28 * renderWidth * fractalZoom);

            let x;
            let y;
            let cx;
            let cy;

            if (isJulia) {
                x = x0;
                y = y0;
                cx = juliaCReal;
                cy = juliaCImag;
            } else {
                x = 0;
                y = 0;
                cx = x0;
                cy = y0;
            }

            let iteration = 0;

            while (
                x * x + y * y <= 4 &&
                iteration < maxIterations
            ) {
                const xtemp = x * x - y * y + cx;

                y = 2 * x * y + cy;
                x = xtemp;

                iteration++;
            }

            const index = (py * renderWidth + px) * 4;

            if (iteration === maxIterations) {
                data[index] = 28;
                data[index + 1] = 51;
                data[index + 2] = 52;
            } else {
                const t = iteration / maxIterations;

                data[index] = Math.floor(218 * t + 47 * (1 - t));
                data[index + 1] = Math.floor(123 * t + 68 * (1 - t));
                data[index + 2] = Math.floor(147 * t + 84 * (1 - t));
            }

            data[index + 3] = 255;
        }
    }

    fractalCtx.putImageData(image, 0, 0);

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(offscreen, 0, 0, width, height);
}

function animate() {
    if (!running) return;

    if (currentMode === "particles") {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        ctx.fillStyle = "rgba(28, 51, 52, 0.13)";
        ctx.fillRect(0, 0, width, height);

        for (const particle of particles) {
            particle.update();
            particle.draw();
        }
    }

    animationId = requestAnimationFrame(animate);
}

function startSimulation() {
    if (running) return;

    running = true;
    startBtn.textContent = "PAUSE";
    animate();
}

function pauseSimulation() {
    running = false;
    cancelAnimationFrame(animationId);
    startBtn.textContent = "RESUME";
}

startBtn.addEventListener("click", () => {
    if (running) {
        pauseSimulation();
    } else {
        startSimulation();
    }
});

resetBtn.addEventListener("click", () => {
    if (currentMode === "fractal") {
        renderFractal();
    } else {
        resetParticles();
    }
});

particleSlider.addEventListener("input", () => {
    particleCount = Number(particleSlider.value);
    particleValue.textContent = particleCount;

    if (currentMode === "particles") {
        resetParticles();
    }
});

speedSlider.addEventListener("input", () => {
    speed = Number(speedSlider.value);
    speedValue.textContent = speed.toFixed(1);
});

chaosSlider.addEventListener("input", () => {
    chaos = Number(chaosSlider.value);
    chaosValue.textContent = chaos.toFixed(1);
});

sizeSlider.addEventListener("input", () => {
    particleSize = Number(sizeSlider.value);
    sizeValue.textContent = particleSize;
});

modeSelect.addEventListener("change", () => {
    currentMode = modeSelect.value;

    fractalControls.style.display =
        currentMode === "fractal" ? "block" : "none";

    if (currentMode === "fractal") {
        renderFractal();
    } else {
        resetParticles();
    }
});

fractalType.addEventListener("change", () => {
    juliaControls.style.display =
        fractalType.value === "julia" ? "block" : "none";

    renderFractal();
});

zoomSlider.addEventListener("input", () => {
    fractalZoom = Number(zoomSlider.value);
    zoomValue.textContent = fractalZoom;

    if (currentMode === "fractal") {
        renderFractal();
    }
});

iterationSlider.addEventListener("input", () => {
    maxIterations = Number(iterationSlider.value);
    iterationValue.textContent = maxIterations;

    if (currentMode === "fractal") {
        renderFractal();
    }
});

juliaReal.addEventListener("input", () => {
    juliaCReal = Number(juliaReal.value);
    juliaRealValue.textContent = juliaCReal.toFixed(2);

    if (currentMode === "fractal" && fractalType.value === "julia") {
        renderFractal();
    }
});

juliaImag.addEventListener("input", () => {
    juliaCImag = Number(juliaImag.value);
    juliaImagValue.textContent = juliaCImag.toFixed(2);

    if (currentMode === "fractal" && fractalType.value === "julia") {
        renderFractal();
    }
});

exportBtn.addEventListener("click", () => {
    const link = document.createElement("a");

    link.download = "moku-shu-simulation.png";
    link.href = canvas.toDataURL("image/png");

    link.click();
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
animate();
