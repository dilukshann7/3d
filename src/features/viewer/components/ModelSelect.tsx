import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import type { ModelConfig } from "../data/models";
import { MODELS } from "../data/models";
import { prepareModelScene } from "../utils/modelScene";
import StudioEnvironment from "./StudioEnvironment";

function PreviewScene({ glb, accent }: { glb: string; accent: string }) {
  const { scene } = useGLTF(glb);
  const prepared = useMemo(() => prepareModelScene(scene, 2.45), [scene]);
  const fov = 36;
  const fovRad = (fov * Math.PI) / 180;
  const distance = Math.max(
    2.8,
    (prepared.boundingRadius * 1.35) / Math.sin(fovRad / 2),
  );
  const targetY = Math.max(0.4, prepared.centerY);
  const cameraY = targetY + Math.max(0.7, prepared.height * 0.22);

  return (
    <group>
      <color attach="background" args={["#f8fafc"]} />
      <fog attach="fog" args={["#f1f5f9", 6, 12]} />
      <PerspectiveCamera
        makeDefault
        position={[0, cameraY, distance]}
        fov={fov}
      />
      <ambientLight intensity={0.66} />
      <hemisphereLight args={["#ffffff", "#e2e8f0", 0.75]} />
      <spotLight
        position={[3.2, 5, 4.5]}
        intensity={26}
        angle={0.34}
        penumbra={0.7}
        distance={20}
      />
      <directionalLight
        position={[-4, 4, -2]}
        intensity={0.66}
        color="#ffffff"
      />
      <pointLight
        position={[0, 1.4, 4]}
        intensity={2.8}
        distance={10}
        color={accent}
      />
      <StudioEnvironment accent={accent} intensity={0.78} />
      <primitive
        object={prepared.root}
        position={[0, 0, 0]}
        rotation={[0, 0.45, 0]}
      />
      <ContactShadows
        position={[0, -0.001, 0]}
        scale={6}
        opacity={0.32}
        blur={2.5}
        far={4}
        resolution={512}
        color="#94a3b8"
      />
      <OrbitControls
        autoRotate
        autoRotateSpeed={1.15}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 2.2}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, targetY, 0]}
      />
    </group>
  );
}

export default function ModelSelect({
  onSelect,
}: {
  onSelect: (m: ModelConfig) => void;
}) {
  return (
    <div className="relative h-screen w-screen overflow-auto bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(14,165,233,0.09),transparent_28%),radial-gradient(circle_at_90%_100%,rgba(37,99,235,0.07),transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                  stroke="#0f172a"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="font-[IBM_Plex_Sans] text-[15px] font-semibold tracking-tight text-slate-900">
                Product Model Library
              </p>
              <p className="text-[10px] tracking-[0.24em] text-slate-400 uppercase">
                Interactive previews
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 sm:block">
            {MODELS.length} models
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-[calc(100vh-57px)] w-full max-w-7xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.36em] text-slate-400">
            Select a model
          </p>
          <h1 className="font-[IBM_Plex_Sans] text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Simple, modern 3D product browsing.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            Compare the full range, open any model instantly, and review form,
            scale, and animation in a clean studio viewer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model)}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white text-left shadow-[0_12px_36px_rgba(15,23,42,0.07)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.11)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40"
              style={{
                backgroundImage: `radial-gradient(circle at top right, ${model.accent}18, transparent 38%)`,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-slate-200 to-transparent" />

              <div className="grid min-h-100 grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-72 border-b border-slate-100 lg:min-h-full lg:border-b-0 lg:border-r lg:border-slate-100">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(37,99,235,0.07),transparent_32%)]" />

                  <div
                    className="absolute left-5 top-5 z-10 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600"
                    style={{
                      backgroundColor: "rgba(15,23,42,0.04)",
                      border: "1px solid rgba(148,163,184,0.3)",
                    }}
                  >
                    {model.subtitle}
                  </div>

                  <div
                    className="absolute bottom-5 left-5 h-16 w-16 rounded-full blur-3xl"
                    style={{ backgroundColor: `${model.accent}44` }}
                  />

                  <Canvas dpr={[1, 1.75]} gl={{ antialias: true }}>
                    <Suspense fallback={null}>
                      <PreviewScene
                        glb={model.variants[0].glb}
                        accent={model.accent}
                      />
                    </Suspense>
                  </Canvas>
                </div>

                <div className="flex flex-col justify-between gap-6 p-6 sm:p-7">
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-[IBM_Plex_Sans] text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                          {model.name}
                        </h2>
                        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                          {model.description}
                        </p>
                      </div>
                      <div
                        className="mt-1.5 hidden h-2.5 w-2.5 shrink-0 rounded-full sm:block"
                        style={{
                          backgroundColor: model.accent,
                          boxShadow: `0 0 10px ${model.accent}cc`,
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {model.variants.map((variant) => (
                        <span
                          key={variant.label}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600"
                        >
                          {variant.label}
                        </span>
                      ))}
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                        Studio preview
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                        Open viewer
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Orbit, zoom, inspect materials, and review animation.
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition duration-300 group-hover:translate-x-0.5 group-hover:border-blue-300 group-hover:text-blue-500">
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

MODELS.forEach((model) => {
  model.variants.forEach((variant) => {
    useGLTF.preload(variant.glb);
  });
});
