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

  return (
    <group>
      <color attach="background" args={["#08111f"]} />
      <fog attach="fog" args={["#08111f", 6, 12]} />
      <PerspectiveCamera makeDefault position={[0, 1.8, 4.75]} fov={36} />
      <ambientLight intensity={0.48} />
      <hemisphereLight args={["#cbd5e1", "#08111f", 0.72]} />
      <spotLight
        position={[3.2, 5, 4.5]}
        intensity={34}
        angle={0.34}
        penumbra={0.7}
        distance={20}
      />
      <directionalLight
        position={[-4, 4, -2]}
        intensity={0.72}
        color="#dbeafe"
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
        opacity={0.55}
        blur={2.5}
        far={4}
        resolution={512}
        color="#020617"
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
    <div className="relative h-screen w-screen overflow-auto bg-transparent text-slate-50">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/8 shadow-[0_12px_32px_rgba(15,23,42,0.35)]">
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                  stroke="#e2e8f0"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="font-[Sora] text-base font-semibold tracking-tight text-white">
                Atelier Viewer
              </p>
              <p className="text-xs tracking-[0.24em] text-slate-400 uppercase">
                Curated 3D presentations
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300 sm:block">
            Interactive catalog
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl flex-col justify-center px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.34em] text-sky-200/70">
            Select a model
          </p>
          <h1 className="font-[Sora] text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Present the collection with depth, contrast, and clear hierarchy.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Each configuration now previews inside a lit studio card instead of
            a flat dark block, so the form reads before you even open the full
            viewer.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => onSelect(model)}
              className="group relative overflow-hidden rounded-[32px] border border-white/12 bg-slate-950/55 text-left shadow-[0_30px_80px_rgba(2,6,23,0.48)] transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-slate-950/72 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/60"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.18), rgba(2,6,23,0.86)), radial-gradient(circle at top right, ${model.accent}30, transparent 32%)`,
              }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-70" />
              <div className="grid min-h-[25rem] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[18rem] border-b border-white/10 lg:min-h-full lg:border-b-0 lg:border-r">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,_rgba(255,255,255,0.12),_transparent_28%)]" />
                  <div
                    className="absolute left-6 top-6 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80"
                    style={{
                      backgroundColor: `${model.accent}22`,
                      border: `1px solid ${model.accent}44`,
                    }}
                  >
                    {model.subtitle}
                  </div>
                  <div
                    className="absolute bottom-6 left-6 h-20 w-20 rounded-full blur-3xl"
                    style={{ backgroundColor: `${model.accent}55` }}
                  />
                  <Canvas dpr={[1, 1.75]} gl={{ antialias: true }}>
                    <Suspense fallback={null}>
                      <PreviewScene
                        glb={model.variants[0].glb}
                        accent={model.accent}
                      />
                    </Suspense>
                    <OrbitControls
                      autoRotate
                      autoRotateSpeed={1.15}
                      enableZoom={false}
                      enablePan={false}
                      minPolarAngle={Math.PI / 2.2}
                      maxPolarAngle={Math.PI / 1.9}
                    />
                  </Canvas>
                </div>

                <div className="flex flex-col justify-between gap-6 p-6 sm:p-7">
                  <div>
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-[Sora] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                          {model.name}
                        </h2>
                        <p className="mt-2 max-w-md text-sm leading-7 text-slate-300">
                          {model.description}
                        </p>
                      </div>
                      <div
                        className="mt-1 hidden h-3 w-3 shrink-0 rounded-full sm:block"
                        style={{
                          backgroundColor: model.accent,
                          boxShadow: `0 0 18px ${model.accent}`,
                        }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {model.variants.map((variant) => (
                        <span
                          key={variant.label}
                          className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200"
                        >
                          {variant.label}
                        </span>
                      ))}
                      <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
                        Studio lighting
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        Open viewer
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Orbit, zoom, inspect materials and run the animation.
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-white transition duration-300 group-hover:translate-x-1 group-hover:bg-white/14">
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
