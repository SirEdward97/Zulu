import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface LetterS3DProps {
  className?: string;
  paused?: boolean;
}

interface SideModelConfig {
  url: string;
  targetSize: number;
  position: [number, number, number];
  baseRotation: [number, number, number];
  floatAmp: number;
  floatSpeed: number;
  spinY: number;
  swayY: number;
  phase: number;
  parallax: number;
}

interface LoadedSideModel {
  group: THREE.Group;
  config: SideModelConfig;
}

const SIDE_MODELS: SideModelConfig[] = [
  {
    url: '/models/guitar.glb',
    targetSize: 1.48,
    position: [-2.95, 0.52, -0.35],
    baseRotation: [0.1, 0.42, -0.34],
    floatAmp: 0.13,
    floatSpeed: 1.05,
    spinY: 0,
    swayY: 0.24,
    phase: 0.2,
    parallax: 0.34,
  },
  {
    url: '/models/soccer-ball.glb',
    targetSize: 0.94,
    position: [-2.18, -0.78, 0.22],
    baseRotation: [0.22, 0.15, 0.1],
    floatAmp: 0.11,
    floatSpeed: 1.35,
    spinY: 0.65,
    swayY: 0,
    phase: 1.7,
    parallax: 0.42,
  },
  {
    url: '/models/puzzle.glb',
    targetSize: 1.12,
    position: [2.75, 0.6, -0.22],
    baseRotation: [0.52, -0.38, 0.12],
    floatAmp: 0.12,
    floatSpeed: 1.18,
    spinY: 0,
    swayY: 0.28,
    phase: 2.8,
    parallax: 0.36,
  },
  {
    url: '/models/gym-weights.glb',
    targetSize: 1.28,
    position: [2.35, -0.76, 0.14],
    baseRotation: [0.28, -0.52, -0.1],
    floatAmp: 0.1,
    floatSpeed: 0.95,
    spinY: 0,
    swayY: 0.22,
    phase: 4.1,
    parallax: 0.38,
  },
];

/**
 * Interactive 3D Hero Stage:
 * - Center: Glossy SENA emerald Letter "S" (/models/letter-s.glb), draggable in 3D.
 * - Left & Right: Smaller Bienestar 3D objects from 3d/ (guitar, soccer ball, puzzle, gym weights)
 *   floating gently around the S with studio PBR reflections and smooth pointer parallax.
 */
export function LetterS3D({
  className = '',
  paused = false,
}: LetterS3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const syncPlaybackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
    syncPlaybackRef.current?.();
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
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

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 280;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Studio IBL environment so metallic/glossy PBR assets (weights, guitar, ball, S) reflect crisply
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    const updateCameraFraming = (w: number, h: number) => {
      const aspect = w / Math.max(h, 1);
      camera.aspect = aspect;
      // Keep center S and all 4 side objects comfortably inside frame on both desktop & narrow viewports
      camera.position.set(0, 0.18, aspect < 1.8 ? 10.8 : 8.1);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    updateCameraFraming(width, height);

    // Controlled studio lighting for brushed metallic S + balanced side PBR models
    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(5, 7, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xa4cf63, 1.05);
    rimLight.position.set(-6, 4, -3);
    scene.add(rimLight);

    const subtleFill = new THREE.PointLight(0xd8e2dc, 0.75, 22);
    subtleFill.position.set(0, -3.2, 3.2);
    scene.add(subtleFill);

    const sPivot = new THREE.Group();
    sPivot.position.set(0, 0, 0.25);
    scene.add(sPivot);

    const sideRoot = new THREE.Group();
    scene.add(sideRoot);

    const loader = new GLTFLoader();
    let isDisposed = false;

    const loadedSideModels: LoadedSideModel[] = [];
    const disposableGeometries: THREE.BufferGeometry[] = [];
    const disposableMaterials: THREE.Material[] = [];

    // 1. Load Hero Center Letter "S"
    loader.load('/models/letter-s.glb', (gltf) => {
      if (isDisposed) return;

      const model = gltf.scene;
      model.updateMatrixWorld(true);

      // Satin brushed anodized metallic SENA green (no harsh glow or glossy plastic shine)
      const metallicSenaMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#137a2d'),
        emissive: new THREE.Color('#000000'),
        emissiveIntensity: 0,
        metalness: 0.92,
        roughness: 0.32,
        envMapIntensity: 1.05,
        side: THREE.DoubleSide,
      });
      disposableMaterials.push(metallicSenaMat);

      const edgeMat = new THREE.LineBasicMaterial({
        color: 0xd1d5db,
        transparent: true,
        opacity: 0.14,
      });
      disposableMaterials.push(edgeMat);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.computeVertexNormals();
            const edgesGeo = new THREE.EdgesGeometry(child.geometry, 24);
            disposableGeometries.push(edgesGeo);
            const wire = new THREE.LineSegments(edgesGeo, edgeMat);
            child.add(wire);
          }
          child.material = metallicSenaMat;
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.85 / maxDim;

      const normalized = new THREE.Group();
      model.position.sub(center);
      normalized.add(model);
      normalized.scale.set(scale, scale, scale * 0.56);

      sPivot.add(normalized);
      renderer.render(scene, camera);
    });

    // 2. Load the 4 smaller 3D Bienestar objects flanking the Letter "S"
    SIDE_MODELS.forEach((cfg) => {
      loader.load(cfg.url, (gltf) => {
        if (isDisposed) return;

        const model = gltf.scene;
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = cfg.targetSize / maxDim;

        const inner = new THREE.Group();
        model.position.sub(center);
        inner.add(model);
        inner.scale.setScalar(scale);

        const wrapper = new THREE.Group();
        wrapper.add(inner);
        wrapper.position.set(...cfg.position);
        wrapper.rotation.set(...cfg.baseRotation);

        sideRoot.add(wrapper);
        loadedSideModels.push({ group: wrapper, config: cfg });
        renderer.render(scene, camera);
      });
    });

    // Interactive drag-to-rotate on the stage + subtle parallax
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragRotY = 0;
    let dragRotX = 0;
    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      container?.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (dragging) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        dragRotY += dx * 0.011;
        dragRotX = Math.max(-0.8, Math.min(0.8, dragRotX + dy * 0.008));
      }
    }

    function onPointerUp(e: PointerEvent) {
      if (dragging) {
        dragging = false;
        try {
          container?.releasePointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    }

    function onWindowPointerMove(e: PointerEvent) {
      pointer.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentRect.width || 720;
      const h = entry.contentRect.height || 280;
      renderer.setSize(w, h);
      updateCameraFraming(w, h);
      renderer.render(scene, camera);
    });
    resizeObserver.observe(container);

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReduced = motionQuery.matches;
    let isVisible = true;
    let elapsed = 0;
    let lastTime = 0;
    let rafId: number | null = null;

    function shouldRun(): boolean {
      return (
        !prefersReduced && !pausedRef.current && !document.hidden && isVisible
      );
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

      pointer.x += (pointer.targetX - pointer.x) * 0.05;
      pointer.y += (pointer.targetY - pointer.y) * 0.05;

      if (!dragging) {
        dragRotY *= 0.96;
        dragRotX *= 0.96;
      }

      // Hero S animation
      const idleYaw = Math.sin(elapsed * 0.7) * 0.3;
      const idlePitch = Math.cos(elapsed * 0.52) * 0.07;
      sPivot.rotation.y = idleYaw + pointer.x * 0.22 + dragRotY;
      sPivot.rotation.x = idlePitch - pointer.y * 0.14 + dragRotX;
      sPivot.position.y = Math.sin(elapsed * 1.1) * 0.11;

      // Side 3D objects gentle floating, subtle spin/sway, and depth parallax
      for (const item of loadedSideModels) {
        const c = item.config;
        const bob = Math.sin(elapsed * c.floatSpeed + c.phase) * c.floatAmp;

        item.group.position.x = c.position[0] + pointer.x * c.parallax;
        item.group.position.y =
          c.position[1] + bob + pointer.y * (c.parallax * 0.55);
        item.group.position.z = c.position[2];

        if (c.spinY !== 0) {
          item.group.rotation.y += c.spinY * dt;
          item.group.rotation.x =
            c.baseRotation[0] + Math.sin(elapsed * 0.6 + c.phase) * 0.18;
        } else {
          item.group.rotation.y =
            c.baseRotation[1] +
            Math.sin(elapsed * 0.65 + c.phase) * c.swayY +
            pointer.x * 0.16;
          item.group.rotation.x =
            c.baseRotation[0] +
            Math.cos(elapsed * 0.55 + c.phase) * 0.08 -
            pointer.y * 0.1;
        }
      }

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

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry ? entry.isIntersecting : true;
        syncPlayback();
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(container);

    function handleVisibilityChange() {
      syncPlayback();
    }

    function handleReducedMotionChange(e: MediaQueryListEvent) {
      prefersReduced = e.matches;
      syncPlayback();
    }

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('pointermove', onWindowPointerMove, {
      passive: true,
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    motionQuery.addEventListener('change', handleReducedMotionChange);

    renderer.render(scene, camera);
    syncPlayback();

    return () => {
      isDisposed = true;
      syncPlaybackRef.current = null;
      stopLoop();
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('pointermove', onWindowPointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleReducedMotionChange);

      const disposeSubtree = (root: THREE.Object3D) => {
        root.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry?.dispose();
            const mats = Array.isArray(obj.material)
              ? obj.material
              : [obj.material];
            mats.forEach((m) => {
              if (!m) return;
              Object.values(m).forEach((val) => {
                if (val instanceof THREE.Texture) {
                  val.dispose();
                }
              });
              m.dispose();
            });
          }
        });
      };

      disposeSubtree(sPivot);
      disposeSubtree(sideRoot);
      disposableGeometries.forEach((g) => g.dispose());
      disposableMaterials.forEach((m) => m.dispose());
      envTarget.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      className={`relative mx-auto flex h-[240px] w-full max-w-[760px] select-none items-center justify-center sm:h-[290px] ${className}`}
    >
      {/* Interactive WebGL 3D Composition: Center Letter S + 4 smaller flanking 3D models */}
      <div
        ref={containerRef}
        title="Arrastra para rotar la letra S en 3D"
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Subtle km.md wireframe corner selection brackets framing the center S */}
      <svg
        aria-hidden="true"
        viewBox="0 0 760 290"
        fill="none"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
      >
        <rect
          x="278"
          y="28"
          width="54"
          height="38"
          stroke="#A4CF63"
          strokeWidth="0.9"
          strokeOpacity="0.6"
        />
        <rect x="275.75" y="25.75" width="4.5" height="4.5" fill="#A4CF63" />
        <rect x="329.75" y="25.75" width="4.5" height="4.5" fill="#A4CF63" />
        <rect x="275.75" y="63.75" width="4.5" height="4.5" fill="#A4CF63" />
        <rect x="329.75" y="63.75" width="4.5" height="4.5" fill="#A4CF63" />

        <rect
          x="426"
          y="214"
          width="56"
          height="40"
          stroke="#A4CF63"
          strokeWidth="0.9"
          strokeOpacity="0.6"
        />
        <rect x="423.75" y="211.75" width="4.5" height="4.5" fill="#A4CF63" />
        <rect x="479.75" y="211.75" width="4.5" height="4.5" fill="#A4CF63" />
        <rect x="423.75" y="251.75" width="4.5" height="4.5" fill="#A4CF63" />
        <rect x="479.75" y="251.75" width="4.5" height="4.5" fill="#A4CF63" />
      </svg>
    </div>
  );
}
