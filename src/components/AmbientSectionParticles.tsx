import { useEffect, useRef } from 'react';

export type ParticleCompletionMode = 'recycle' | 'exit' | 'settle' | 'static';

export interface AmbientParticlesConfig {
  count: number;
  gravity: number;
  wind: number;
  sway: number;
  speed: [number, number];
  size: [number, number];
  opacity: [number, number];
  rotation: [number, number];
  mode: ParticleCompletionMode;
  pointerRadius: number;
  maxDpr: number;
}

export interface QuietZoneRect {
  /** Normalized 0..1 coordinates relative to the bounded section */
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AmbientSectionParticlesProps {
  /** Bounded section element that owns pointer and intersection observation */
  sectionRef: React.RefObject<HTMLElement | null>;
  config?: Partial<AmbientParticlesConfig>;
  /** Pauses decorative motion while a modal or critical task is active */
  paused?: boolean;
  /** Lower-density calm zone behind long text or form controls */
  quietZone?: QuietZoneRect;
  className?: string;
}

type ParticleShape = 'dot' | 'diamond' | 'sliver' | 'ring';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeed: number;
  size: number;
  baseOpacity: number;
  angle: number;
  angularVelocity: number;
  swayPhase: number;
  swayFreq: number;
  swayAmp: number;
  shape: ParticleShape;
  color: string;
  settled: boolean;
}

export const DEFAULT_PARTICLES_CONFIG: AmbientParticlesConfig = {
  count: 54,
  gravity: 7,
  wind: -3,
  sway: 16,
  speed: [8, 18],
  size: [4, 12],
  opacity: [0.18, 0.62],
  rotation: [-0.8, 0.8],
  mode: 'recycle',
  pointerRadius: 110,
  maxDpr: 2,
};

const PALETTE = ['#A4CF63', '#A4CF63', '#bce085', '#87b849', '#d7efa9'];
const SHAPES: ParticleShape[] = ['dot', 'diamond', 'sliver', 'ring'];
const REFERENCE_AREA = 820 * 760;

/** Deterministic PRNG (Mulberry32) so static & reduced-motion layouts are consistent */
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randRange(rand: () => number, min: number, max: number): number {
  return min + rand() * (max - min);
}

/** Scales particle count from actual container area + mobile / low-power hardware budget */
function computeScaledCount(
  baseCount: number,
  width: number,
  height: number,
  reducedMotion: boolean,
): number {
  const areaRatio = Math.max(0.28, Math.min(1.35, (width * height) / REFERENCE_AREA));
  const isNarrow = width < 640;
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  const lowPowerFactor = cores <= 4 ? 0.78 : 1;
  const mobileFactor = isNarrow ? 0.62 : 1;
  const reducedFactor = reducedMotion ? 0.45 : 1;

  return Math.max(
    12,
    Math.round(baseCount * areaRatio * mobileFactor * lowPowerFactor * reducedFactor),
  );
}

/**
 * Bounded 2D Canvas ambient particle layer conforming to gh.md:
 * - Bounded inside a positioned section with overflow clipping.
 * - Area-scaled density, gravity, wind, phase sway, rotation, gentle pointer disturbance.
 * - Supports recycle, exit, settle, and static completion modes.
 * - Quiet zone attenuation behind form controls and long copy.
 * - Stops invisible work via IntersectionObserver, document.hidden, and modal pause.
 * - Deterministic static scatter under prefers-reduced-motion: reduce.
 */
export function AmbientSectionParticles({
  sectionRef,
  config,
  paused = false,
  quietZone,
  className = '',
}: AmbientSectionParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);

  const mergedConfig: AmbientParticlesConfig = {
    ...DEFAULT_PARTICLES_CONFIG,
    ...config,
  };

  // Keep latest values accessible inside the single rAF loop without restarting it
  const configRef = useRef(mergedConfig);
  configRef.current = mergedConfig;

  const quietZoneRef = useRef(quietZone);
  quietZoneRef.current = quietZone;

  const syncPlaybackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncPlaybackRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = motionQuery.matches;
    let isSectionVisible = true;
    let width = section.clientWidth || 820;
    let height = section.clientHeight || 600;
    let dpr = Math.min(window.devicePixelRatio || 1, configRef.current.maxDpr);

    let particles: Particle[] = [];
    let pileBins = new Float32Array(24);
    let elapsed = 0;
    let lastTime = 0;
    let rafId: number | null = null;

    const pointer = { x: 0, y: 0, active: false };

    function createParticle(
      rand: () => number,
      spawnAbove: boolean,
    ): Particle {
      const cfg = configRef.current;
      const size = randRange(rand, cfg.size[0], cfg.size[1]);
      const baseSpeed = randRange(rand, cfg.speed[0], cfg.speed[1]);
      const colorIndex = Math.floor(rand() * PALETTE.length);
      const shapeIndex = Math.floor(rand() * SHAPES.length);

      return {
        x: rand() * width,
        y: spawnAbove ? -size - rand() * 36 : rand() * height,
        vx: 0,
        vy: 0,
        baseSpeed,
        size,
        baseOpacity: randRange(rand, cfg.opacity[0], cfg.opacity[1]),
        angle: rand() * Math.PI * 2,
        angularVelocity: randRange(rand, cfg.rotation[0], cfg.rotation[1]),
        swayPhase: rand() * Math.PI * 2,
        swayFreq: 0.45 + rand() * 0.7,
        swayAmp: cfg.sway * (0.45 + rand() * 0.75),
        shape: SHAPES[shapeIndex],
        color: PALETTE[colorIndex],
        settled: false,
      };
    }

    function seedParticles() {
      const cfg = configRef.current;
      const staticMode = prefersReduced || cfg.mode === 'static';
      const rand = createSeededRandom(4219);
      const targetCount = computeScaledCount(
        cfg.count,
        width,
        height,
        staticMode,
      );

      particles = Array.from({ length: targetCount }, () =>
        createParticle(rand, false),
      );
      pileBins = new Float32Array(Math.max(12, Math.round(width / 36)));
    }

    function resizeCanvas() {
      if (!canvas || !section) return;
      width = Math.max(1, section.clientWidth);
      height = Math.max(1, section.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, configRef.current.maxDpr);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Re-scale particle population smoothly to the new container area
      const cfg = configRef.current;
      const staticMode = prefersReduced || cfg.mode === 'static';
      const desired = computeScaledCount(cfg.count, width, height, staticMode);

      if (staticMode || particles.length === 0) {
        seedParticles();
      } else if (particles.length < desired) {
        const rand = createSeededRandom(Math.round(width * 13 + height));
        while (particles.length < desired) {
          particles.push(createParticle(rand, false));
        }
      } else if (particles.length > desired) {
        particles.length = desired;
      }

      // Clamp particles into updated bounds
      for (const p of particles) {
        if (p.x > width + p.size) p.x = p.x % width;
        if (p.y > height + p.size) p.y = p.y % height;
      }

      renderFrame();
    }

    function quietZoneFactor(px: number, py: number): number {
      const qz = quietZoneRef.current;
      if (!qz) return 1;

      const left = qz.x * width;
      const top = qz.y * height;
      const right = left + qz.width * width;
      const bottom = top + qz.height * height;

      const margin = 52;
      if (
        px < left - margin ||
        px > right + margin ||
        py < top - margin ||
        py > bottom + margin
      ) {
        return 1;
      }

      const dx = Math.max(left - px, 0, px - right);
      const dy = Math.max(top - py, 0, py - bottom);
      const dist = Math.hypot(dx, dy);
      const t = Math.min(1, dist / margin);
      // Reduce density/visibility softly to 18% inside the calm form/copy safe zone
      return 0.18 + 0.82 * t;
    }

    function renderFrame() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        // Soft edge fade near top and bottom of section
        const edgeFadeTop = Math.min(1, Math.max(0, (p.y + p.size) / 44));
        const edgeFadeBottom = Math.min(
          1,
          Math.max(0, (height - p.y + p.size) / 54),
        );
        const calm = quietZoneFactor(p.x, p.y);
        const alpha = p.baseOpacity * edgeFadeTop * edgeFadeBottom * calm;

        if (alpha <= 0.01) continue;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        ctx.shadowColor = '#A4CF63';
        ctx.shadowBlur = p.size * 1.4;

        const r = p.size * 0.5;
        if (p.shape === 'dot') {
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 'ring') {
          ctx.lineWidth = Math.max(1, p.size * 0.14);
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
          ctx.stroke();
        } else if (p.shape === 'diamond') {
          ctx.beginPath();
          ctx.moveTo(0, -r * 0.85);
          ctx.lineTo(r * 0.65, 0);
          ctx.lineTo(0, r * 0.85);
          ctx.lineTo(-r * 0.65, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          // Brand fragment sliver
          const w = p.size * 0.9;
          const h = Math.max(1.8, p.size * 0.24);
          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    function stepSimulation(dt: number) {
      const cfg = configRef.current;
      elapsed += dt;

      const maxPileHeight = Math.min(34, height * 0.06);
      const binWidth = width / pileBins.length;
      const pointerR = cfg.pointerRadius;
      const pointerR2 = pointerR * pointerR;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.settled) continue;

        // Gentle distance-based pointer disturbance settling naturally
        if (pointer.active && pointerR > 0) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 > 1 && dist2 < pointerR2) {
            const dist = Math.sqrt(dist2);
            const strength = (1 - dist / pointerR) * 28;
            p.vx += (dx / dist) * strength * dt;
            p.vy += (dy / dist) * strength * dt;
          }
        }

        // Natural velocity damping back to ambient wind/gravity drift
        const damping = Math.exp(-2.8 * dt);
        p.vx *= damping;
        p.vy *= damping;

        const swayVelocity =
          Math.cos(elapsed * p.swayFreq + p.swayPhase) * p.swayAmp;

        p.x += (cfg.wind + swayVelocity + p.vx) * dt;
        p.y += (p.baseSpeed + cfg.gravity + p.vy) * dt;
        p.angle += p.angularVelocity * dt;

        // Horizontal wrap within bounded container
        if (p.x < -p.size * 2) p.x = width + p.size;
        if (p.x > width + p.size * 2) p.x = -p.size;

        // Explicit completion modes
        if (cfg.mode === 'settle') {
          const binIdx = Math.max(
            0,
            Math.min(pileBins.length - 1, Math.floor(p.x / binWidth)),
          );
          const floorY = height - p.size * 0.5 - pileBins[binIdx];
          if (p.y >= floorY) {
            p.y = floorY;
            p.settled = true;
            pileBins[binIdx] = Math.min(
              maxPileHeight,
              pileBins[binIdx] + p.size * 0.35,
            );
          }
        } else if (p.y > height + p.size * 2) {
          if (cfg.mode === 'exit') {
            particles.splice(i, 1);
          } else {
            // recycle mode: respawn cleanly just above section top
            p.y = -p.size - Math.random() * 24;
            p.x = Math.random() * width;
            p.vx = 0;
            p.vy = 0;
          }
        }
      }
    }

    function stopLoop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function shouldRun(): boolean {
      const cfg = configRef.current;
      if (prefersReduced || cfg.mode === 'static') return false;
      if (pausedRef.current || document.hidden || !isSectionVisible) {
        return false;
      }
      if (cfg.mode === 'exit' && particles.length === 0) return false;
      if (cfg.mode === 'settle' && particles.every((p) => p.settled)) {
        return false;
      }
      return true;
    }

    function tick(now: number) {
      if (!shouldRun()) {
        rafId = null;
        return;
      }

      // Clamp large time deltas after background tabs or stalled frames
      const dt = lastTime === 0 ? 0.016 : Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      stepSimulation(dt);
      renderFrame();

      if (shouldRun()) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = null;
      }
    }

    function syncPlayback() {
      if (shouldRun()) {
        // Never spawn a second loop
        if (rafId === null) {
          lastTime = 0;
          rafId = window.requestAnimationFrame(tick);
        }
      } else {
        stopLoop();
        if (prefersReduced || configRef.current.mode === 'static') {
          renderFrame();
        }
      }
    }

    syncPlaybackRef.current = syncPlayback;

    // Single section-level pointer listeners (never per-particle listeners)
    function handlePointerMove(e: PointerEvent) {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    function handleVisibilityChange() {
      syncPlayback();
    }

    function handleReducedMotionChange(e: MediaQueryListEvent) {
      prefersReduced = e.matches;
      seedParticles();
      renderFrame();
      syncPlayback();
    }

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });
    resizeObserver.observe(section);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isSectionVisible = entry ? entry.isIntersecting : true;
        syncPlayback();
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(section);

    section.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    section.addEventListener('pointerleave', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery.addEventListener('change', handleReducedMotionChange);

    resizeCanvas();
    syncPlayback();

    return () => {
      syncPlaybackRef.current = null;
      stopLoop();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      section.removeEventListener('pointermove', handlePointerMove);
      section.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleReducedMotionChange);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [sectionRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
    />
  );
}
