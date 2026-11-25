import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface LetterS3DProps {
  className?: string;
  paused?: boolean;
}

interface AttachedModelConfig {
  url: string;
  targetSize: number;
  position: [number, number, number];
  baseRotation: [number, number, number];
}

const ATTACHED_MODELS: AttachedModelConfig[] = [
  {
    url: '/models/guitar.glb',
    targetSize: 1.18,
    position: [-1.26, -0.94, 0.16],
    baseRotation: [0.08, 0.32, -0.48],
  },
  {
    url: '/models/soccer-ball.glb',
    targetSize: 0.78,
    position: [-0.46, -1.14, 0.28],
    baseRotation: [0.18, 0.2, 0.08],
  },
  {
    url: '/models/puzzle.glb',
    targetSize: 0.88,
    position: [0.46, -1.12, 0.28],
    baseRotation: [0.45, -0.32, 0.1],
  },
  {
    url: '/models/gym-weights.glb',
    targetSize: 1.05,
    position: [1.26, -0.98, 0.18],
    baseRotation: [0.22, -0.42, 0.22],
  },
];

/**
 * Escenario 3D interactivo principal:
 * - Emblema 3D unificado: logo SENA 3D (/models/sena-logo-3d.glb) con los 4 objetos de Bienestar
 *   (guitarra, balón de fútbol, rompecabezas y pesas) fijados en su base como una sola pieza arrastrable.
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

    // Entorno IBL de estudio para que los modelos PBR metálicos y brillantes reflejen con nitidez
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
      // Encuadrar cómodamente el logo SENA 3D unificado junto con los objetos de Bienestar en su base
      camera.position.set(0, 0.05, aspect < 1.8 ? 8.6 : 7.2);
      camera.lookAt(0, -0.05, 0);
      camera.updateProjectionMatrix();
    };
    updateCameraFraming(width, height);

    // Iluminación controlada de estudio para el logo SENA 3D y los modelos PBR adjuntos
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

    // Fijar los 4 objetos de Bienestar directamente en sPivot para que permanezcan unidos al logo como una sola pieza
    const attachedRoot = new THREE.Group();
    sPivot.add(attachedRoot);

    const loader = new GLTFLoader();
    let isDisposed = false;

    // 1. Cargar el logo SENA 3D central
    loader.load('/models/sena-logo-3d.glb', (gltf) => {
      if (isDisposed) return;

      const model = gltf.scene;
      model.updateMatrixWorld(true);

      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const mats = Array.isArray(child.material)
            ? child.material
            : [child.material];
          mats.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.color.set('#00af00');
              mat.emissive.set('#00af00');
              mat.emissiveIntensity = 0.08;
              mat.metalness = 0.22;
              mat.roughness = 0.28;
              mat.envMapIntensity = 0.95;
              mat.needsUpdate = true;
            }
          });
        }
      });

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.65 / maxDim;

      const normalized = new THREE.Group();
      model.position.sub(center);
      normalized.add(model);
      normalized.scale.setScalar(scale);
      normalized.position.y = 0.22;

      sPivot.add(normalized);
      renderer.render(scene, camera);
    });

    // 2. Cargar los 4 objetos de Bienestar fijados en la base inferior del logo SENA 3D
    ATTACHED_MODELS.forEach((cfg) => {
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

        attachedRoot.add(wrapper);
        renderer.render(scene, camera);
      });
    });

    // Arrastre interactivo para rotar el escenario y paralaje sutil con el cursor
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
          // ignorar si ya se liberó la captura del puntero
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

      // Animación del emblema 3D unificado (logo SENA y objetos fijados en su base)
      const idleYaw = Math.sin(elapsed * 0.7) * 0.3;
      const idlePitch = Math.cos(elapsed * 0.52) * 0.07;
      sPivot.rotation.y = idleYaw + pointer.x * 0.22 + dragRotY;
      sPivot.rotation.x = idlePitch - pointer.y * 0.14 + dragRotX;
      sPivot.position.y = Math.sin(elapsed * 1.1) * 0.1;

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
      {/* Composición 3D interactiva en WebGL: logo SENA 3D central con 4 modelos de Bienestar fijados en la base */}
      <div
        ref={containerRef}
        title="Arrastra para rotar el logo SENA en 3D"
        className="h-full w-full cursor-grab active:cursor-grabbing"
      />

      {/* Esquinas decorativas tipo marco vectorial alrededor del emblema 3D central */}
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
