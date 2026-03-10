import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  ContactShadows,
  OrbitControls,
  Html,
  PerspectiveCamera,
  useProgress,
  useGLTF,
  useAnimations,
  AdaptiveDpr,
  AdaptiveEvents,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { ModelConfig } from "../data/models";
import { prepareModelScene } from "../utils/modelScene";
import StudioEnvironment from "./StudioEnvironment";

type FrameData = {
  height: number;
  radius: number;
  boundingRadius: number;
  centerY: number;
};

// ─── Loader ───────────────────────────────────────────────────────────────────
function Loader() {
  const { progress } = useProgress();
  const width = Math.round(progress);
  return (
    <Html center>
      <div className="flex min-w-52 flex-col items-center gap-3 rounded-3xl border border-white/10 bg-slate-950/90 px-7 py-6 shadow-[0_25px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl">
        <span className="text-sm font-medium tracking-wide text-slate-200">
          Loading model…
        </span>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-sky-400/90 transition-all duration-300"
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-slate-500">{width}%</span>
      </div>
    </Html>
  );
}

// ─── Glass detection ──────────────────────────────────────────────────────────
function looksLikeGlass(
  mesh: THREE.Mesh,
  mat: THREE.Material & Partial<THREE.MeshStandardMaterial>,
): boolean {
  if (mat.transparent && (mat.opacity ?? 1) < 0.95) return true;

  const namesToCheck = [mesh.name, mat.name, mesh.parent?.name ?? ""].map((n) =>
    n.toLowerCase(),
  );
  const glassKeywords = [
    "glass",
    "window",
    "vitr",
    "panel",
    "roof",
    "toit",
    "glazing",
    "crystal",
    "transparent",
  ];
  if (namesToCheck.some((n) => glassKeywords.some((k) => n.includes(k))))
    return true;

  const color = (mat as THREE.MeshStandardMaterial).color;
  if (color) {
    const { r, g, b } = color;
    const isLightBlue = b > 0.55 && b > r * 1.15 && b > g * 0.85 && r > 0.45;
    const isNearWhite = r > 0.75 && g > 0.75 && b > 0.75;
    const isCyan = b > 0.5 && g > 0.5 && r < 0.6;
    if (isLightBlue || isNearWhite || isCyan) return true;
  }

  return false;
}

// ─── Material upgrade ─────────────────────────────────────────────────────────
function makeReflective(root: THREE.Object3D) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const upgraded = mats.map((mat) => {
      const old = mat as THREE.MeshStandardMaterial &
        THREE.MeshBasicMaterial &
        THREE.MeshPhysicalMaterial;

      if (old.isMeshPhysicalMaterial) {
        const isGlass = looksLikeGlass(mesh, old);
        if (isGlass) {
          old.color = new THREE.Color(0xffffff);
          old.metalness = 0;
          old.roughness = 0;
          old.transmission = 0.94;
          old.thickness = 0.4;
          old.ior = 1.52;
          old.reflectivity = 1;
          old.clearcoat = 1;
          old.clearcoatRoughness = 0;
          old.envMapIntensity = 3;
          old.transparent = true;
          old.opacity = 1;
        } else {
          old.envMapIntensity = 1.2;
          old.roughness = Math.min(old.roughness, 0.55);
          old.metalness = Math.max(old.metalness, 0.3);
          old.reflectivity = 0.5;
          old.clearcoat = 0.1;
          old.clearcoatRoughness = 0.3;
        }
        old.needsUpdate = true;
        return old;
      }

      const color =
        (old.color as THREE.Color | undefined) ?? new THREE.Color(0xffffff);
      const map = old.map ?? null;
      const isGlass = looksLikeGlass(mesh, old);

      const physical = isGlass
        ? new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(0xffffff),
            map: null,
            metalness: 0,
            roughness: 0,
            transmission: 0.94,
            thickness: 0.4,
            ior: 1.52,
            reflectivity: 1,
            envMapIntensity: 3,
            clearcoat: 1,
            clearcoatRoughness: 0,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
          })
        : new THREE.MeshPhysicalMaterial({
            color,
            map,
            metalness: 0.45,
            roughness: 0.42,
            reflectivity: 0.4,
            envMapIntensity: 1.1,
            clearcoat: 0.12,
            clearcoatRoughness: 0.35,
            transparent: false,
            side: old.side ?? THREE.FrontSide,
          });

      return physical;
    });

    mesh.material = upgraded.length === 1 ? upgraded[0] : upgraded;
  });
}

// ─── Animated model ───────────────────────────────────────────────────────────
function AnimatedModel({
  glbPath,
  wireframe,
  playing,
  reversed,
  onFinish,
  onPrepared,
}: {
  glbPath: string;
  wireframe: boolean;
  playing: boolean;
  reversed: boolean;
  onFinish: () => void;
  onPrepared: (frame: FrameData) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(glbPath);
  const prepared = useMemo(() => prepareModelScene(scene, 3.5), [scene]);
  const { actions, names } = useAnimations(animations, group);
  const finishedRef = useRef(false);

  useEffect(() => {
    makeReflective(prepared.root);
  }, [prepared.root]);

  useEffect(() => {
    onPrepared({
      height: prepared.height,
      radius: prepared.radius,
      boundingRadius: prepared.boundingRadius,
      centerY: prepared.centerY,
    });
  }, [onPrepared, prepared]);

  useEffect(() => {
    prepared.root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (m.wireframe !== undefined) m.wireframe = wireframe;
      });
    });
  }, [prepared.root, wireframe]);

  useEffect(() => {
    if (!names.length) return;
    finishedRef.current = false;

    names.forEach((name) => {
      const action = actions[name];
      if (!action) return;
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;

      if (playing) {
        action.timeScale = reversed ? -1 : 1;
        if (reversed && action.time <= 0.001)
          action.time = action.getClip().duration;
        if (!reversed && action.time >= action.getClip().duration - 0.001)
          action.reset();
        action.paused = false;
        if (!action.isRunning()) action.play();
      } else {
        action.paused = true;
      }
    });
  }, [playing, reversed, actions, names, glbPath]);

  useFrame(() => {
    if (!playing || !names.length || finishedRef.current) return;
    const allDone = names.every((name) => {
      const action = actions[name];
      if (!action) return true;
      const dur = action.getClip().duration;
      return reversed ? action.time <= 0.001 : action.time >= dur - 0.001;
    });
    if (allDone) {
      finishedRef.current = true;
      onFinish();
    }
  });

  return (
    <group ref={group}>
      <primitive
        object={prepared.root}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      />
    </group>
  );
}

// ─── Auto-frame camera ────────────────────────────────────────────────────────
function AutoFrameCamera({
  frame,
  controlsRef,
  camRef,
}: {
  frame: FrameData;
  controlsRef: { current: OrbitControlsImpl | null };
  camRef: RefObject<THREE.PerspectiveCamera | null>;
}) {
  const { size } = useThree();

  useEffect(() => {
    const controls = controlsRef.current;
    const cam = camRef.current;
    if (!controls || !cam) return;

    const aspect = Math.max(size.width / Math.max(size.height, 1), 0.01);
    const vFov = THREE.MathUtils.degToRad(cam.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    const halfHeight = Math.max(frame.height * 0.5, 0.35);
    const halfWidth = Math.max(frame.radius, 0.35);
    const distForHeight = halfHeight / Math.tan(vFov / 2);
    const distForWidth = halfWidth / Math.tan(hFov / 2);

    const fitDistance = Math.max(distForHeight, distForWidth) * 1.5;
    const targetY = Math.max(0.35, frame.centerY);
    const cameraY = targetY + Math.max(0.35, frame.height * 0.08);

    cam.position.set(0, cameraY, fitDistance);
    cam.near = 0.02;
    cam.far = Math.max(60, fitDistance * 8);
    cam.updateProjectionMatrix();

    const minDistance = Math.max(0.25, frame.radius * 0.22, fitDistance * 0.12);
    const maxDistance = Math.max(minDistance + 2, fitDistance * 5.5);

    controls.target.set(0, targetY, 0);
    controls.minDistance = minDistance;
    controls.maxDistance = maxDistance;
    controls.update();
    controls.saveState();
  }, [camRef, controlsRef, frame, size.height, size.width]);

  return null;
}

// ─── Post-processing ──────────────────────────────────────────────────────────
function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      {/* Subtle bloom — only hot specular highlights glow, not the whole scene */}
      <Bloom
        intensity={0.45}
        luminanceThreshold={0.75}
        luminanceSmoothing={0.35}
        kernelSize={KernelSize.MEDIUM}
        blendFunction={BlendFunction.SCREEN}
      />
      {/* Very light vignette — frames the scene without darkening it */}
      <Vignette
        offset={0.38}
        darkness={0.38}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

// ─── Reflective ground ────────────────────────────────────────────────────────
function ReflectiveGround() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.001, 0]}
      receiveShadow
    >
      <planeGeometry args={[30, 30]} />
      <MeshReflectorMaterial
        blur={[600, 200]}
        resolution={512}
        mixBlur={14}
        mixStrength={0.25}
        roughness={1}
        depthScale={0.6}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#060c18"
        metalness={0.2}
        mirror={0.15}
      />
    </mesh>
  );
}

// ─── Icon components ──────────────────────────────────────────────────────────
function PlayIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M6 4a1 1 0 00-1 1v10a1 1 0 102 0V5a1 1 0 00-1-1zm8 0a1 1 0 00-1 1v10a1 1 0 102 0V5a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function RewindIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
    </svg>
  );
}
function RotateIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
function WireframeIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 3l9 5.5-9 5.5-9-5.5L12 3zm0 0v11m9-5.5v5.5L12 20l-9-5.5V9"
      />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 12a9 9 0 109-9M3 12V7m0 5H8"
      />
    </svg>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────
export default function ModelViewer({
  model,
  onBack,
}: {
  model: ModelConfig;
  onBack: () => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);
  const [frame, setFrame] = useState<FrameData>({
    height: 2,
    radius: 1,
    boundingRadius: 1.35,
    centerY: 1,
  });

  const glbPath = model.variants[variantIdx].glb;
  const fov = 34;

  const handleAnimationFinish = useCallback(() => {
    setPlaying(false);
    setReversed((v) => !v);
  }, []);

  const handlePrepared = useCallback((nextFrame: FrameData) => {
    setFrame(nextFrame);
  }, []);

  useEffect(() => {
    setPlaying(false);
    setReversed(false);
  }, [glbPath]);

  function resetCamera() {
    controlsRef.current?.reset();
  }

  const btnBase =
    "flex w-full items-center gap-2 rounded-2xl border px-3.5 py-3 text-sm font-semibold transition duration-200";
  const btnDefault = `${btnBase} border-white/10 bg-white/5 text-slate-200 hover:border-white/20 hover:bg-white/10`;
  const btnActive = `${btnBase} border-transparent bg-sky-300 text-slate-950 shadow-[0_12px_30px_rgba(125,211,252,0.28)] hover:bg-sky-200`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(245,158,11,0.12),_transparent_24%),linear-gradient(180deg,_rgba(2,6,23,0.04),_rgba(2,6,23,0.78))]" />

      <Canvas
        shadows
        className="h-full w-full"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 2]}
      >
        <color attach="background" args={["#050816"]} />
        <fog attach="fog" args={["#050816", 10, 24]} />
        <PerspectiveCamera
          makeDefault
          position={[0, 2, 8]}
          fov={fov}
          near={0.02}
        />
        <ambientLight intensity={0.38} />
        <hemisphereLight args={["#cbd5e1", "#04101f", 0.86]} />
        <spotLight
          castShadow
          position={[5.5, 8, 5.5]}
          intensity={42}
          angle={0.34}
          penumbra={0.8}
          distance={24}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.00005}
        />
        <directionalLight
          position={[-5, 4, -5]}
          intensity={0.68}
          color="#dbeafe"
        />
        <pointLight
          position={[0, 2.2, 5.2]}
          intensity={4.2}
          distance={14}
          color={model.accent}
        />
        <StudioEnvironment accent={model.accent} intensity={0.9} />

        <Suspense key={glbPath} fallback={<Loader />}>
          <AnimatedModel
            glbPath={glbPath}
            wireframe={wireframe}
            playing={playing}
            reversed={reversed}
            onFinish={handleAnimationFinish}
            onPrepared={handlePrepared}
          />
        </Suspense>

        <AutoFrameCamera frame={frame} controlsRef={controlsRef} />

        <ContactShadows
          position={[0, -0.001, 0]}
          scale={10}
          opacity={0.52}
          blur={2.6}
          far={7}
          resolution={1024}
          color="#020617"
        />

        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={0.45}
          enableDamping
          dampingFactor={0.08}
          zoomSpeed={1.25}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.75}
          target={[0, 1, 0]}
          makeDefault
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,_rgba(2,6,23,0.12)_0%,_transparent_22%,_transparent_72%,_rgba(2,6,23,0.58)_100%)]" />

      <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-slate-950/50 px-4 py-3 shadow-[0_25px_70px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:px-5 lg:px-6">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              onClick={onBack}
              className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-200 transition duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
              aria-label="Back to catalog"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-[Sora] text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {model.name}
                </h1>
                <span
                  className="rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em]"
                  style={{
                    borderColor: `${model.accent}55`,
                    color: model.accent,
                    backgroundColor: `${model.accent}14`,
                  }}
                >
                  {model.subtitle}
                </span>
              </div>
              <p className="mt-1 max-w-2xl truncate text-sm text-slate-300 sm:pr-6">
                {model.description}
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300 lg:block">
            Drag to orbit · Scroll to zoom
          </div>
        </div>
      </header>

      <aside className="absolute bottom-4 left-4 right-4 z-20 sm:left-6 sm:right-auto lg:bottom-6 lg:left-8">
        <div className="pointer-events-auto w-full rounded-[30px] border border-white/10 bg-slate-950/58 p-4 shadow-[0_25px_70px_rgba(2,6,23,0.48)] backdrop-blur-xl sm:w-[22rem] sm:p-5">
          {model.variants.length > 1 && (
            <div className="mb-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Variant
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {model.variants.map((v, i) => (
                  <button
                    key={v.label}
                    onClick={() => {
                      setVariantIdx(i);
                      setPlaying(false);
                      setReversed(false);
                    }}
                    className={variantIdx === i ? btnActive : btnDefault}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-5 grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => setPlaying((v) => !v)}
              className={playing ? btnActive : btnDefault}
            >
              {playing ? (
                <>
                  <PauseIcon /> Pause
                </>
              ) : reversed ? (
                <>
                  <RewindIcon /> Rewind
                </>
              ) : (
                <>
                  <PlayIcon /> Play
                </>
              )}
            </button>

            <button
              onClick={() => setAutoRotate((v) => !v)}
              className={autoRotate ? btnActive : btnDefault}
            >
              <RotateIcon /> {autoRotate ? "Stop spin" : "Auto-rotate"}
            </button>

            <button
              onClick={() => setWireframe((v) => !v)}
              className={wireframe ? btnActive : btnDefault}
            >
              <WireframeIcon /> Wireframe
            </button>

            <button onClick={resetCamera} className={btnDefault}>
              <ResetIcon /> Reset view
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M6.3 2.841A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M6 4a1 1 0 00-1 1v10a1 1 0 102 0V5a1 1 0 00-1-1zm8 0a1 1 0 00-1 1v10a1 1 0 102 0V5a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function RewindIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
    </svg>
  );
}
function RotateIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
function WireframeIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3l9 5.5-9 5.5-9-5.5L12 3zm0 0v11m9-5.5v5.5L12 20l-9-5.5V9"
      />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 10l-4 4m0 0l-4-4m4 4V3"
      />
    </svg>
  );
}
