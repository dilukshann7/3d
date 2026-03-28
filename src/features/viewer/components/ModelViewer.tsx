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
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { ModelConfig } from "../data/models";
import { prepareModelScene } from "../utils/modelScene";
import StudioEnvironment from "./StudioEnvironment";
import { useNavigate } from "@tanstack/react-router";
import { ROUTES } from "../../../routes/routerPaths";

type FrameData = {
  height: number;
  radius: number;
  boundingRadius: number;
  centerY: number;
};

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

type MatKind = "glass" | "water" | "concrete" | "metal" | "generic";

function classifyMaterial(
  mesh: THREE.Mesh,
  mat: THREE.Material & Partial<THREE.MeshStandardMaterial>,
): MatKind {
  const matName = (mat.name ?? "").toLowerCase();
  const meshName = (mesh.name ?? "").toLowerCase();
  const parentName = (mesh.parent?.name ?? "").toLowerCase();
  const names = [matName, meshName, parentName];

  const glassKeywords = ["glass", "window", "vitr", "glazing", "crystal"];
  if (names.some((n) => glassKeywords.some((k) => n.includes(k))))
    return "glass";

  const concreteKeywords = [
    "concrete", "cement", "stone", "urban", "pavement", "floor",
    "ground", "sol", "dalle", "terr",
  ];
  if (names.some((n) => concreteKeywords.some((k) => n.includes(k))))
    return "concrete";

  const metalKeywords = ["metal", "steel", "alumin", "iron", "chrome", "zinc"];
  if (names.some((n) => metalKeywords.some((k) => n.includes(k))))
    return "metal";

  if (mat.transparent && (mat.opacity ?? 1) < 0.9) return "glass";

  const color = (mat as THREE.MeshStandardMaterial).color;
  if (color) {
    const r = color.r;
    const g = color.g;
    const b = color.b;

    if (r > 0.82 && g > 0.82 && b > 0.82) return "glass";
    if (b > 0.8 && g > 0.8 && r < 0.15) return "glass";

    const isWaterBlue =
      b > 0.45 &&
      (b > r * 1.25 || g > r * 1.25) &&
      r < 0.72 &&
      !(r > 0.78 && g > 0.78);
    if (isWaterBlue) return "water";

    const lum = (r + g + b) / 3;
    const isConcreteGrey =
      lum > 0.55 && Math.abs(r - g) < 0.12 && Math.abs(g - b) < 0.16 && b >= r;
    if (isConcreteGrey) return "concrete";

    if (r < 0.08 && g < 0.08 && b < 0.08) return "metal";
    if (lum < 0.22 && Math.abs(r - g) < 0.04 && Math.abs(g - b) < 0.04)
      return "metal";
  }

  return "generic";
}

function buildGlassMat(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0xffffff),
    metalness: 0,
    roughness: 0,
    transmission: 0.94,
    thickness: 0.35,
    ior: 1.52,
    reflectivity: 1,
    envMapIntensity: 1.2,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide,
  });
}

function buildWaterMat(originalColor: THREE.Color): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: originalColor.clone().lerp(new THREE.Color(0x0a2a4a), 0.35),
    metalness: 0,
    roughness: 0,
    transmission: 0.88,
    thickness: 1.2,
    ior: 1.333,
    reflectivity: 1,
    envMapIntensity: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });
}

function buildConcreteMat(
  originalColor: THREE.Color,
  map: THREE.Texture | null,
): THREE.MeshPhysicalMaterial {
  const concreteColor = originalColor.clone();
  concreteColor.r = Math.min(1, concreteColor.r * 1.08);
  concreteColor.g = Math.min(1, concreteColor.g * 1.04);
  concreteColor.b = Math.min(1, concreteColor.b * 0.88);
  return new THREE.MeshPhysicalMaterial({
    color: concreteColor,
    map,
    metalness: 0,
    roughness: 0.88,
    reflectivity: 0.05,
    envMapIntensity: 0.2,
    clearcoat: 0.04,
    clearcoatRoughness: 0.9,
    transparent: false,
    side: THREE.FrontSide,
  });
}

function buildMetalMat(
  originalColor: THREE.Color,
  map: THREE.Texture | null,
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: originalColor,
    map,
    metalness: 0.88,
    roughness: 0.22,
    reflectivity: 0.8,
    envMapIntensity: 0.6,
    clearcoat: 0.3,
    clearcoatRoughness: 0.15,
    transparent: false,
    side: THREE.FrontSide,
  });
}

function buildGenericMat(
  originalColor: THREE.Color,
  map: THREE.Texture | null,
  oldSide: THREE.Side,
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: originalColor,
    map,
    metalness: 0.1,
    roughness: 0.65,
    reflectivity: 0.15,
    envMapIntensity: 0.5,
    clearcoat: 0.08,
    clearcoatRoughness: 0.4,
    transparent: false,
    side: oldSide,
  });
}

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

      const kind = classifyMaterial(mesh, old);
      const originalColor =
        (old.color as THREE.Color | undefined)?.clone() ??
        new THREE.Color(0xffffff);
      const map = old.map ?? null;

      if (old.isMeshPhysicalMaterial) {
        switch (kind) {
          case "glass":
            old.color.set(0xffffff);
            old.metalness = 0;
            old.roughness = 0;
            old.transmission = 0.94;
            old.thickness = 0.35;
            old.ior = 1.52;
            old.reflectivity = 1;
            old.clearcoat = 1;
            old.clearcoatRoughness = 0;
            old.envMapIntensity = 1.2;
            old.transparent = true;
            old.opacity = 1;
            old.side = THREE.DoubleSide;
            break;
          case "water":
            old.color.lerp(new THREE.Color(0x0a2a4a), 0.35);
            old.metalness = 0;
            old.roughness = 0;
            old.transmission = 0.88;
            old.thickness = 1.2;
            old.ior = 1.333;
            old.reflectivity = 1;
            old.clearcoat = 1;
            old.clearcoatRoughness = 0;
            old.envMapIntensity = 1.5;
            old.transparent = true;
            old.opacity = 0.92;
            old.side = THREE.DoubleSide;
            break;
          case "concrete":
            old.color.r = Math.min(1, old.color.r * 1.08);
            old.color.g = Math.min(1, old.color.g * 1.04);
            old.color.b = Math.min(1, old.color.b * 0.88);
            old.metalness = 0;
            old.roughness = 0.88;
            old.reflectivity = 0.05;
            old.clearcoat = 0.04;
            old.clearcoatRoughness = 0.9;
            old.envMapIntensity = 0.2;
            old.transparent = false;
            break;
          case "metal":
            old.metalness = 0.88;
            old.roughness = 0.22;
            old.reflectivity = 0.8;
            old.clearcoat = 0.3;
            old.clearcoatRoughness = 0.15;
            old.envMapIntensity = 1.0;
            old.transparent = false;
            break;
          default:
            old.metalness = Math.max(old.metalness, 0.3);
            old.roughness = Math.min(old.roughness, 0.55);
            old.reflectivity = 0.4;
            old.clearcoat = 0.08;
            old.clearcoatRoughness = 0.4;
            old.envMapIntensity = 0.6;
            break;
        }
        old.needsUpdate = true;
        return old;
      }

      switch (kind) {
        case "glass":
          return buildGlassMat();
        case "water":
          return buildWaterMat(originalColor);
        case "concrete":
          return buildConcreteMat(originalColor, map);
        case "metal":
          return buildMetalMat(originalColor, map);
        default:
          return buildGenericMat(
            originalColor,
            map,
            old.side ?? THREE.FrontSide,
          );
      }
    });

    mesh.material = upgraded.length === 1 ? upgraded[0] : upgraded;
  });
}

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
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
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

    const fitDistance = Math.max(distForHeight, distForWidth) * 1.9;
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

function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.18}
        luminanceThreshold={0.92}
        luminanceSmoothing={0.6}
        kernelSize={KernelSize.SMALL}
        blendFunction={BlendFunction.SCREEN}
      />
      <Vignette
        offset={0.38}
        darkness={0.38}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}

function CementFloor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.001, 0]}
      receiveShadow
    >
      <planeGeometry args={[60, 60]} />
      <meshPhysicalMaterial
        color="#080808"
        metalness={0}
        roughness={1}
        reflectivity={0}
        envMapIntensity={0}
      />
    </mesh>
  );
}

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
  const navigate = useNavigate();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [reversed, setReversed] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
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
    const id = setTimeout(() => {
      setPlaying(false);
      setReversed(false);
    }, 0);
    return () => clearTimeout(id);
  }, [glbPath]);

  function resetCamera() {
    controlsRef.current?.reset();
  }

  const btnBase =
    "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium tracking-wide transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40";
  const btnDefault = `${btnBase} border-white/8 bg-white/4 text-slate-300 hover:border-white/16 hover:bg-white/8 hover:text-white`;
  const btnActive = `${btnBase} border-sky-400/30 bg-sky-400/14 text-sky-300 hover:bg-sky-400/20`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050a14] text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.07),transparent)]" />

      <Canvas
        shadows
        className="h-full w-full"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.9,
        }}
        dpr={[1, 2]}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <color attach="background" args={["#050a14"]} />
        <fog attach="fog" args={["#060c1a", 16, 32]} />

        <PerspectiveCamera
          ref={camRef}
          makeDefault
          position={[0, 2, 8]}
          fov={fov}
          near={0.02}
        />

        {/* ── Scene lights ── */}
        <ambientLight intensity={0.12} />
        <hemisphereLight args={["#8fb4d4", "#04101f", 0.5]} />

        <spotLight
          castShadow
          position={[4, 10, 5]}
          intensity={28}
          angle={0.26}
          penumbra={0.65}
          distance={30}
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.00004}
          shadow-normalBias={0.02}
        />

        <spotLight
          position={[-5, 4.5, -8]}
          intensity={8}
          angle={0.42}
          penumbra={0.85}
          distance={25}
          color={model.accent}
        />

        <directionalLight
          position={[6, 3, -6]}
          intensity={0.9}
          color="#dbeafe"
        />

        <pointLight
          position={[0, 1.5, 5]}
          intensity={5}
          distance={16}
          color={model.accent}
        />

        <StudioEnvironment accent={model.accent} intensity={1.0} />

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

        <AutoFrameCamera
          frame={frame}
          controlsRef={controlsRef}
          camRef={camRef}
        />

        <CementFloor />

        <ContactShadows
          position={[0, 0, 0]}
          scale={14}
          opacity={0.55}
          blur={3}
          far={7}
          resolution={1024}
          color="#010510"
        />

        <OrbitControls
          ref={controlsRef}
          autoRotate={autoRotate}
          autoRotateSpeed={0.4}
          enableDamping
          dampingFactor={0.07}
          zoomSpeed={1.2}
          minPolarAngle={Math.PI / 3.5}
          maxPolarAngle={Math.PI / 1.75}
          target={[0, 1, 0]}
          makeDefault
        />

        <PostFX />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_100%_at_50%_50%,transparent_55%,rgba(2,6,23,0.45)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-[rgba(2,6,23,0.18)] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-[rgba(2,6,23,0.55)] to-transparent" />

      <header className="absolute inset-x-0 top-0 z-20 px-4 pt-4 sm:px-6 lg:px-8 lg:pt-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl border border-white/8 bg-slate-950/55 px-3 py-2.5 shadow-[0_8px_32px_rgba(2,6,23,0.4)] backdrop-blur-xl sm:px-4 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={onBack}
              className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-white/5 text-slate-300 transition duration-200 hover:border-white/16 hover:bg-white/10 hover:text-white"
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
                <h1 className="font-[IBM_Plex_Sans] text-[15px] font-semibold tracking-tight text-white sm:text-base">
                  {model.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.26em] text-slate-500 lg:block">
            Drag · Scroll · Pinch
          </div>
        </div>
      </header>

      <aside className="absolute bottom-4 left-4 z-20 sm:bottom-5 sm:left-5 lg:bottom-6 lg:left-7">
        <div className="pointer-events-auto w-full max-h-[calc(100vh-8rem)] overflow-y-auto no-scrollbar rounded-2xl border border-white/8 bg-slate-950/65 p-3.5 shadow-[0_16px_48px_rgba(2,6,23,0.5)] backdrop-blur-xl sm:w-72 sm:p-4">

          {model.description && (
            <p className="mb-4 text-xs leading-relaxed text-slate-300">
              {model.description}
            </p>
          )}

          {model.specs && model.specs.length > 0 && (
            <div className="mb-5 rounded-xl border border-white/5 bg-white/5 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Specifications
              </p>
              <div className="grid gap-2">
                {model.specs.map((s, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-400">{s.label}</span>
                    <span className="font-medium text-slate-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {model.variants.length > 1 && (
            <div className="mb-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-600">
                Variant
              </p>
              <div className="grid gap-1.5 sm:grid-cols-2">
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

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setPlaying((v) => !v)}
              className={playing ? btnActive : btnDefault}
            >
              {playing ? (<><PauseIcon /> Pause</>) : reversed ? (<><RewindIcon /> Rewind</>) : (<><PlayIcon /> Play</>)}
            </button>

            <button
              onClick={() => setAutoRotate((v) => !v)}
              className={autoRotate ? btnActive : btnDefault}
            >
              <RotateIcon />
              {autoRotate ? "Stop spin" : "Rotate"}
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

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={() => navigate({ to: ROUTES.galleryById, params: { modelId: model.id } })}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3.5 py-3 text-[13px] font-semibold tracking-wide text-sky-300 transition duration-200 hover:bg-sky-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View gallery
            </button>
            <a
              href="mailto:contact@example.com?subject=Build My 3D Website"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-3 text-[13px] font-semibold tracking-wide text-emerald-300 transition duration-200 hover:bg-emerald-400/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Make your own 3d website
            </a>
          </div>

          <div
            className="mt-3.5 h-px w-full rounded-full opacity-30"
            style={{ background: `linear-gradient(90deg, transparent, ${model.accent}, transparent)` }}
          />
          <p className="mt-2 text-center text-[10px] text-slate-600">
            Interactive 3D viewer
          </p>
        </div>
      </aside>
    </div>
  );
}