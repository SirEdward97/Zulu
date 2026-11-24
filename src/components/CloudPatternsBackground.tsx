import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const COLS = 124;
const ROWS = 76;
const POINT_COUNT = COLS * ROWS;
const RIBBON_COUNT = 26;
const RIBBON_SEGMENTS = 140;

const WAVE_HEIGHT_GLSL = /* glsl */ `
  float computeWave(vec2 xz, float t, vec2 mouseWorld) {
    float w1 = sin(xz.x * 0.14 + t * 0.58) * cos(xz.y * 0.12 - t * 0.36) * 1.55;
    float w2 = sin((xz.x * 0.24 - xz.y * 0.19) + t * 0.72) * 0.72;
    float w3 = cos(xz.x * 0.42 + xz.y * 0.34 - t * 0.95) * 0.28;
    float w4 = sin(length(xz * 0.16) - t * 0.65) * 0.42;

    float dMouse = length(xz - mouseWorld);
    float ripple = exp(-dMouse * 0.14) * sin(dMouse * 0.65 - t * 2.4) * 0.85;
    float lift = exp(-dMouse * 0.11) * 0.95;

    return w1 + w2 + w3 + w4 + ripple + lift;
  }
`;

const POINTS_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uMouseWorld;
  attribute float aAccent;
  varying float vElevation;
  varying float vDepthFade;
  varying float vAccent;

  ${WAVE_HEIGHT_GLSL}

  void main() {
    vec3 pos = position;
    float elevation = computeWave(pos.xz, uTime, uMouseWorld);
    pos.y += elevation;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(-mvPosition.z, 1.0);
    vElevation = clamp((elevation + 2.4) / 4.8, 0.0, 1.0);
    vDepthFade = smoothstep(58.0, 14.0, dist);
    vAccent = aAccent;

    float baseSize = mix(2.4, 4.4, vElevation);
    gl_PointSize = baseSize * uPixelRatio * (27.0 / dist);
  }
`;

const POINTS_FRAGMENT_SHADER = /* glsl */ `
  varying float vElevation;
  varying float vDepthFade;
  varying float vAccent;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float dist = length(centered);
    if (dist > 0.5) discard;

    float outerHalo = pow(smoothstep(0.5, 0.0, dist), 2.1);
    float innerCore = smoothstep(0.28, 0.04, dist);

    // #A4CF63 luminous node glow over #014446 background
    vec3 nodeDim = vec3(0.38, 0.56, 0.24);
    vec3 nodeGlow = vec3(0.6431, 0.8118, 0.3882);
    vec3 nodePeak = vec3(0.84, 0.96, 0.64);

    vec3 col = mix(nodeDim, nodeGlow, smoothstep(0.08, 0.72, vElevation));
    col = mix(col, nodeGlow, 0.52);

    float glowBoost = max(
      vAccent * smoothstep(0.32, 0.92, vElevation),
      innerCore * smoothstep(0.52, 1.0, vElevation)
    );
    col = mix(col, nodePeak, glowBoost * 0.62);

    float shape = outerHalo * 0.55 + innerCore * 0.88;
    float alpha = shape * mix(0.28, 0.86, vElevation) * vDepthFade;
    gl_FragColor = vec4(col, alpha);
  }
`;

const RIBBON_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouseWorld;
  varying float vElevation;
  varying float vDepthFade;

  ${WAVE_HEIGHT_GLSL}

  void main() {
    vec3 pos = position;
    float elevation = computeWave(pos.xz, uTime, uMouseWorld);
    pos.y += elevation + 0.04;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float dist = max(-mvPosition.z, 1.0);
    vElevation = clamp((elevation + 2.4) / 4.8, 0.0, 1.0);
    vDepthFade = smoothstep(56.0, 14.0, dist);
  }
`;

const RIBBON_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uBaseOpacity;
  varying float vElevation;
  varying float vDepthFade;

  void main() {
    float alpha = uBaseOpacity * mix(0.32, 1.05, vElevation) * vDepthFade;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

interface CloudPatternsBackgroundProps {
  paused?: boolean;
}

export function CloudPatternsBackground({
  paused = false,
}: CloudPatternsBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const syncPlaybackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncPlaybackRef.current?.();
  }, [paused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 140);
    camera.position.set(0, 10.5, 29.5);
    camera.lookAt(0, -1.5, -2.0);

    const fieldGroup = new THREE.Group();
    fieldGroup.position.set(0, -2.2, -3.5);
    scene.add(fieldGroup);

    const fieldWidth = 72;
    const fieldDepth = 48;

    const positions = new Float32Array(POINT_COUNT * 3);
    const accents = new Float32Array(POINT_COUNT);

    for (let r = 0; r < ROWS; r++) {
      const v = r / (ROWS - 1) - 0.5;
      for (let c = 0; c < COLS; c++) {
        const u = c / (COLS - 1) - 0.5;
        const i = r * COLS + c;
        positions[i * 3] = u * fieldWidth;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = v * fieldDepth;

        const band = Math.sin(u * 9.0 + v * 5.0);
        accents[i] = band > 0.72 ? 1.0 : 0.0;
      }
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    pointsGeometry.setAttribute(
      'aAccent',
      new THREE.BufferAttribute(accents, 1),
    );

    const sharedTime = { value: 0 };
    const sharedMouseWorld = { value: new THREE.Vector2(999, 999) };

    const pointsMaterial = new THREE.ShaderMaterial({
      vertexShader: POINTS_VERTEX_SHADER,
      fragmentShader: POINTS_FRAGMENT_SHADER,
      uniforms: {
        uTime: sharedTime,
        uPixelRatio: { value: pixelRatio },
        uMouseWorld: sharedMouseWorld,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const wavePoints = new THREE.Points(pointsGeometry, pointsMaterial);
    fieldGroup.add(wavePoints);

    const ribbonDisposables: {
      geometry: THREE.BufferGeometry;
      material: THREE.ShaderMaterial;
    }[] = [];

    for (let r = 0; r < RIBBON_COUNT; r++) {
      const v = r / (RIBBON_COUNT - 1) - 0.5;
      const linePos = new Float32Array(RIBBON_SEGMENTS * 3);
      for (let s = 0; s < RIBBON_SEGMENTS; s++) {
        const u = s / (RIBBON_SEGMENTS - 1) - 0.5;
        linePos[s * 3] = u * fieldWidth;
        linePos[s * 3 + 1] = 0;
        linePos[s * 3 + 2] = v * fieldDepth;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(linePos, 3));

      const isGreenAccent = r % 7 === 3;
      const material = new THREE.ShaderMaterial({
        vertexShader: RIBBON_VERTEX_SHADER,
        fragmentShader: RIBBON_FRAGMENT_SHADER,
        uniforms: {
          uTime: sharedTime,
          uMouseWorld: sharedMouseWorld,
          uColor: {
            value: new THREE.Color(isGreenAccent ? '#A4CF63' : '#6b9940'),
          },
          uBaseOpacity: { value: isGreenAccent ? 0.22 : 0.11 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.Line(geometry, material);
      fieldGroup.add(line);
      ribbonDisposables.push({ geometry, material });
    }

    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0, active: false };
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = motionQuery.matches;

    function handlePointerMove(e: PointerEvent) {
      pointer.active = true;
      pointer.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    function handleResize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const nextRatio = Math.min(window.devicePixelRatio, 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(nextRatio);
      renderer.setSize(w, h);
      pointsMaterial.uniforms.uPixelRatio.value = nextRatio;
      renderer.render(scene, camera);
    }

    let elapsed = 0;
    let lastTime = 0;
    let rafId: number | null = null;

    function shouldRun(): boolean {
      return !prefersReduced && !pausedRef.current && !document.hidden;
    }

    function stopLoop() {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
    }

    function animate(now: number) {
      if (!shouldRun()) {
        rafId = null;
        return;
      }

      const dt = lastTime === 0 ? 0.016 : Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;

      pointer.x += (pointer.targetX - pointer.x) * 0.04;
      pointer.y += (pointer.targetY - pointer.y) * 0.04;

      sharedTime.value = elapsed;

      if (pointer.active) {
        sharedMouseWorld.value.set(pointer.x * 22.0, -pointer.y * 14.0);
      }

      camera.position.x = pointer.x * 1.45;
      camera.position.y = 10.5 + pointer.y * 0.85;
      camera.lookAt(0, -1.6, -2.5);

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    }

    function syncPlayback() {
      if (shouldRun()) {
        if (rafId === null) {
          lastTime = 0;
          rafId = window.requestAnimationFrame(animate);
        }
      } else {
        stopLoop();
        renderer.render(scene, camera);
      }
    }

    syncPlaybackRef.current = syncPlayback;

    function handleVisibilityChange() {
      syncPlayback();
    }

    function handleReducedMotionChange(e: MediaQueryListEvent) {
      prefersReduced = e.matches;
      syncPlayback();
    }

    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery.addEventListener('change', handleReducedMotionChange);

    // Render initial static frame immediately, then run loop if allowed
    renderer.render(scene, camera);
    syncPlayback();

    return () => {
      syncPlaybackRef.current = null;
      stopLoop();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleReducedMotionChange);

      pointsGeometry.dispose();
      pointsMaterial.dispose();

      for (const item of ribbonDisposables) {
        item.geometry.dispose();
        item.material.dispose();
      }

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden bg-[#014446]"
    >
      {/* Distant GPU GLSL wave field with #A4CF63 illuminated nodes */}
      <div ref={mountRef} className="h-full w-full" />
      {/* Soft #A4CF63 Horizon Light rising from lower center */}
      <div className="km-horizon-glow absolute inset-0 opacity-75" />
      {/* Soft top edge fade into #014446 */}
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#014446]/80 to-transparent" />
    </div>
  );
}
