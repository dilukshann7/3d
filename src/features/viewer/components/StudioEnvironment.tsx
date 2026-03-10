import { Environment, Lightformer } from "@react-three/drei";

export default function StudioEnvironment({
  accent,
  intensity = 1,
}: {
  accent: string;
  intensity?: number;
}) {
  return (
    <Environment resolution={512} frames={1} environmentIntensity={intensity}>
      <color attach="background" args={["#060b16"]} />

      {/* ── Key light: large soft ring above-behind ── */}
      <Lightformer
        form="ring"
        color="#f0f4f8"
        intensity={1.0}
        scale={7}
        position={[0, 5, -4]}
        target={[0, 0, 0]}
      />

      {/* ── Left fill: large soft rect, slightly warm ── */}
      <Lightformer
        form="rect"
        color="#fff8f0"
        intensity={1.4}
        scale={[10, 8, 1]}
        position={[-7, 3, 4]}
        rotation={[0, Math.PI / 2.4, 0]}
      />

      {/* ── Right fill: cool-toned counter-balance ── */}
      <Lightformer
        form="rect"
        color="#dbeafe"
        intensity={1.0}
        scale={[8, 6, 1]}
        position={[7, 2.5, 1]}
        rotation={[0, -Math.PI / 2.6, 0]}
      />

      {/* ── Accent / backlight: model-specific color, rear low ── */}
      <Lightformer
        form="rect"
        color={accent}
        intensity={0.45}
        scale={[5, 4.5, 1]}
        position={[0, 1.2, -8]}
        rotation={[0, Math.PI, 0]}
      />

      {/* ── Ground bounce: dark rect below to soften ground reflections ── */}
      <Lightformer
        form="rect"
        color="#0a0f1a"
        intensity={0.7}
        scale={[16, 5, 1]}
        position={[0, -2.5, 3]}
        rotation={[-Math.PI / 2, 0, 0]}
      />

      {/* ── Front catch-light: small circle at camera-height ── */}
      <Lightformer
        form="circle"
        color="#f1f5f9"
        intensity={0.7}
        scale={2.0}
        position={[-2, 1.8, 6]}
      />

      {/* ── Top strip: long horizontal bar for top-edge sheen ── */}
      <Lightformer
        form="rect"
        color="#cbd5e1"
        intensity={0.45}
        scale={[18, 1.5, 1]}
        position={[0, 7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* ── Second accent rim from opposite side for depth separation ── */}
      <Lightformer
        form="ring"
        color={accent}
        intensity={0.15}
        scale={3}
        position={[4, 2, -5]}
        target={[0, 0, 0]}
      />

      {/* ── Subtle warm under-fill to lift the belly of the model ── */}
      <Lightformer
        form="rect"
        color="#fde68a"
        intensity={0.1}
        scale={[6, 3, 1]}
        position={[0, -1.5, 2]}
        rotation={[-Math.PI / 3, 0, 0]}
      />
    </Environment>
  );
}
