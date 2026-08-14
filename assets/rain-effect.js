/**
 * Sophisticated Rain Effect Engine
 * Ported from busdriver.wtf implementation
 * Features: Multiple rain layers, physics-based drops, splash effects, lightning flashes, performance optimizations
 */

(function() {
    'use strict';

    // Rain layer configurations - 4 layers with different characteristics
    // behind: true = draws behind road (background), false = draws in front (foreground)
    // lands: true = drops hit ground and create splashes
    const RAIN_LAYERS = [
        {
            density: 8,           // drops per unit area
            length: [9, 17],      // drop length range (pixels)
            speed: [380, 560],    // fall speed range (px/s)
            width: [0.5, 0.9],    // line width range
            alpha: [0.05, 0.1],   // opacity range
            tint: '196,212,232',  // RGB color (cool blue-white for distant rain)
            behind: true,         // draws behind road
            lands: false          // no splashes
        },
        {
            density: 5,
            length: [15, 26],
            speed: [560, 780],
            width: [0.7, 1.1],
            alpha: [0.07, 0.13],
            tint: '208,220,236',
            behind: true,
            lands: false
        },
        {
            density: 3.6,
            length: [26, 46],
            speed: [950, 1300],
            width: [1, 1.5],
            alpha: [0.13, 0.22],
            tint: '228,231,238',
            behind: false,
            lands: true          // creates splash effects on ground
        },
        {
            density: 1,
            length: [62, 112],
            speed: [1700, 2300],
            width: [1.8, 3],
            alpha: [0.06, 0.12],
            tint: '255,214,172',  // warm amber for foreground heavy drops
            behind: false,
            lands: false
        }
    ];

    // Lightning flash keyframes (opacity over time)
    const LIGHTNING_KEYFRAMES = [
        [0, 0],
        [0.09, 1],
        [0.76, 1],
        [1, 0]
    ];

    // Lightning timing intervals (seconds between potential flashes)
    const LIGHTNING_INTERVALS = [0, 0.95, 0.28, 0.68, 0.14, 0.04, 0];

    // Utility: random float between min and max
    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    // Utility: clamp value
    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    class RainEngine {
        constructor() {
            this.canvas = null;
            this.ctx = null;
            this.roadMarker = null;
            this.drops = [];           // Array of drop arrays per layer
            this.splashes = [];        // Ground splash effects
            this.lightningPhase = -1;  // -1 = waiting, >=0 = animating
            this.lightningTimer = 0;
            this.lightningNext = rand(9, 26);

            this.width = 0;
            this.height = 0;
            this.pixelRatio = 1;
            this.performanceScale = 1;

            this.roadTop = 0;
            this.roadBottom = 0;
            this.splashLine = 0;

            this.lastFrameTime = 0;
            this.animationId = 0;
            this.isRunning = false;
            this.reducedMotion = false;

            this.resizeHandler = this.handleResize.bind(this);
            this.visibilityHandler = this.handleVisibilityChange.bind(this);
        }

        init(canvasId, roadMarkerId) {
            this.canvas = document.getElementById(canvasId);
            this.roadMarker = document.getElementById(roadMarkerId);

            if (!this.canvas) {
                console.warn('RainEngine: Canvas not found');
                return false;
            }

            this.ctx = this.canvas.getContext('2d');

            // Check for reduced motion preference
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            this.reducedMotion = mediaQuery.matches;
            mediaQuery.addEventListener('change', (e) => {
                this.reducedMotion = e.matches;
                if (this.reducedMotion) this.stop();
                else if (this.isRunning) this.start();
            });

            if (this.reducedMotion) {
                return false;
            }

            this.setupCanvas();
            this.bindEvents();
            return true;
        }

        setupCanvas() {
            this.updateDimensions();
            window.addEventListener('resize', this.resizeHandler);
            document.addEventListener('visibilitychange', this.visibilityHandler);
        }

        updateDimensions() {
            const w = window.innerWidth;
            const h = window.innerHeight;

            // Limit pixel ratio for performance (max 1.5x)
            this.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

            // Reduce quality on low-end devices
            const cores = navigator.hardwareConcurrency || 8;
            this.performanceScale = cores <= 4 ? 0.7 : 1;

            this.canvas.width = Math.round(w * this.pixelRatio);
            this.canvas.height = Math.round(h * this.pixelRatio);
            this.canvas.style.width = w + 'px';
            this.canvas.style.height = h + 'px';

            this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

            this.width = w;
            this.height = h;

            // Calculate road position from CSS variables
            const roadLift = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--road-lift')) || 0;
            const roadH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--road-h')) || (h * 0.4);

            this.roadTop = h - roadLift - roadH;
            this.roadBottom = h - roadLift;
            this.splashLine = this.roadBottom - 0.14 * roadH;

            // Initialize drop arrays for each layer
            const baseCount = Math.max(w * h / 100000, 5.5);

            this.drops = RAIN_LAYERS.map((layer, i) => {
                const count = Math.round(layer.density * baseCount * this.performanceScale);
                const arr = [];
                for (let j = 0; j < count; j++) {
                    arr.push(this.createDrop(layer, rand(0, h)));
                }
                return arr;
            });

            // Find first non-behind layer index (for draw order)
            this.firstForegroundLayer = RAIN_LAYERS.findIndex(l => !l.behind);
            if (this.firstForegroundLayer === -1) this.firstForegroundLayer = RAIN_LAYERS.length;
        }

        createDrop(layer, y) {
            const alpha = rand(layer.alpha[0], layer.alpha[1]);
            return {
                x: rand(-0.25 * this.width, 1.25 * this.width),
                y: y,
                length: rand(layer.length[0], layer.length[1]),
                speed: rand(layer.speed[0], layer.speed[1]),
                width: rand(layer.width[0], layer.width[1]),
                stroke: `rgba(${layer.tint},${alpha.toFixed(3)})`,
                layer: layer
            };
        }

        resetDrop(drop, layer) {
            const alpha = rand(layer.alpha[0], layer.alpha[1]);
            drop.x = rand(-0.25 * this.width, 1.25 * this.width);
            drop.y = rand(-140, -10);
            drop.length = rand(layer.length[0], layer.length[1]);
            drop.speed = rand(layer.speed[0], layer.speed[1]);
            drop.width = rand(layer.width[0], layer.width[1]);
            drop.stroke = `rgba(${layer.tint},${alpha.toFixed(3)})`;
            drop.layer = layer;
        }

        bindEvents() {
            window.addEventListener('resize', this.resizeHandler);
            document.addEventListener('visibilitychange', this.visibilityHandler);
        }

        handleResize() {
            // Debounce resize
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.updateDimensions();
            }, 100);
        }

        handleVisibilityChange() {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        }

        start() {
            if (this.isRunning || this.reducedMotion) return;
            this.isRunning = true;
            this.lastFrameTime = performance.now();
            this.animationId = requestAnimationFrame(this.animate.bind(this));
        }

        stop() {
            this.isRunning = false;
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = 0;
            }
        }

        pause() {
            if (this.animationId) {
                cancelAnimationFrame(this.animationId);
                this.animationId = 0;
            }
        }

        resume() {
            if (this.isRunning && !this.animationId) {
                this.lastFrameTime = performance.now();
                this.animationId = requestAnimationFrame(this.animate.bind(this));
            }
        }

        animate(timestamp) {
            if (!this.isRunning) return;

            // Calculate delta time (capped at 50ms for stability)
            const dt = this.lastFrameTime ? Math.min((timestamp - this.lastFrameTime) / 1000, 0.05) : 0.016;
            this.lastFrameTime = timestamp;

            // Wind sway factor (subtle horizontal drift)
            const wind = 0.16 + 0.1 * Math.sin(37e-5 * timestamp) + 0.06 * Math.sin(11e-5 * timestamp);

            // Clear canvas
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.ctx.lineCap = 'round';

            // Draw behind-road layers
            for (let i = 0; i < this.firstForegroundLayer; i++) {
                this.drawLayer(i, dt, wind);
            }

            // Draw road mask (fade out rain above road)
            if (this.roadMarker) {
                const rect = this.roadMarker.getBoundingClientRect();
                if (rect.height > 48) {
                    const gradient = this.ctx.createLinearGradient(0, rect.top, 0, rect.bottom);
                    for (const [pos, opacity] of LIGHTNING_KEYFRAMES) {
                        gradient.addColorStop(pos, `rgba(0,0,0,${opacity})`);
                    }
                    this.ctx.globalCompositeOperation = 'destination-out';
                    this.ctx.fillStyle = gradient;
                    this.ctx.fillRect(0, rect.top, this.width, rect.bottom - rect.top);
                    this.ctx.globalCompositeOperation = 'source-over';
                }
            }

            // Draw foreground layers
            for (let i = this.firstForegroundLayer; i < RAIN_LAYERS.length; i++) {
                this.drawLayer(i, dt, wind);
            }

            // Draw splashes
            this.drawSplashes(dt);

            // Handle lightning
            this.updateLightning(dt);
            this.drawLightning();

            this.animationId = requestAnimationFrame(this.animate.bind(this));
        }

        drawLayer(layerIndex, dt, wind) {
            const layer = RAIN_LAYERS[layerIndex];
            const drops = this.drops[layerIndex];
            const splashLine = layer.lands && this.splashLine ? this.splashLine : this.height + 80;

            for (const drop of drops) {
                // Update position
                drop.y += drop.speed * dt;
                drop.x += drop.speed * wind * dt;

                // Check if drop hit ground
                if (drop.y > splashLine) {
                    // Create splash if this layer lands
                    if (layer.lands && this.splashes.length < 90 && Math.random() < 0.45) {
                        this.splashes.push({
                            x: drop.x,
                            y: this.splashLine,
                            age: 0
                        });
                    }
                    // Recycle drop
                    this.resetDrop(drop, layer);
                    continue;
                }

                // Wrap horizontally
                if (drop.x > 1.3 * this.width) {
                    drop.x -= 1.55 * this.width;
                }

                // Draw drop
                this.ctx.strokeStyle = drop.stroke;
                this.ctx.lineWidth = drop.width;
                this.ctx.beginPath();
                this.ctx.moveTo(drop.x, drop.y);
                this.ctx.lineTo(drop.x - drop.length * wind, drop.y - drop.length);
                this.ctx.stroke();
            }
        }

        drawSplashes(dt) {
            if (this.splashes.length === 0) return;

            for (let i = this.splashes.length - 1; i >= 0; i--) {
                const splash = this.splashes[i];
                splash.age += dt;

                if (splash.age >= 0.42) {
                    this.splashes.splice(i, 1);
                    continue;
                }

                const progress = splash.age / 0.42;
                const radius = 15 * (1 - (1 - progress) ** 2);
                const opacity = (1 - progress) ** 2 * 0.24;

                this.ctx.strokeStyle = `rgba(246,226,200,${opacity.toFixed(3)})`;
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.ellipse(splash.x, splash.y, radius, 0.26 * radius, 0, 0, 2 * Math.PI);
                this.ctx.stroke();
            }
        }

        updateLightning(dt) {
            if (this.lightningPhase < 0) {
                // Waiting for next lightning
                this.lightningTimer -= dt;
                if (this.lightningTimer <= 0) {
                    this.lightningPhase = 0;
                    this.lightningTimer = 0;
                }
            } else {
                // Animating lightning
                this.lightningTimer += dt;
                const progress = this.lightningTimer / 0.08; // 80ms flash duration
                const frame = Math.floor(progress);

                if (frame >= LIGHTNING_INTERVALS.length - 1) {
                    // Flash complete
                    this.lightningPhase = -1;
                    this.lightningNext = rand(14, 42);
                    this.lightningTimer = this.lightningNext;
                } else {
                    this.lightningPhase = frame;
                }
            }
        }

        drawLightning() {
            if (this.lightningPhase < 0) return;

            const frame = this.lightningPhase;
            const nextFrame = frame + 1;
            const progress = this.lightningTimer / 0.08 - frame;

            const opacity1 = LIGHTNING_INTERVALS[frame] + (LIGHTNING_INTERVALS[nextFrame] - LIGHTNING_INTERVALS[frame]) * progress;
            const opacity = opacity1 * 0.085;

            if (opacity > 0) {
                this.ctx.fillStyle = `rgba(228,234,248,${opacity.toFixed(3)})`;
                this.ctx.fillRect(0, 0, this.width, this.height);
            }
        }

        destroy() {
            this.stop();
            window.removeEventListener('resize', this.resizeHandler);
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.canvas = null;
            this.ctx = null;
            this.roadMarker = null;
        }
    }

    // Export for use
    window.RainEngine = RainEngine;
    window.RAIN_LAYERS = RAIN_LAYERS;
})();