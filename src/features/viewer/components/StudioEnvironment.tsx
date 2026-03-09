import { Environment, Lightformer } from "@react-three/drei";

export default function StudioEnvironment({
  accent,
  intensity = 1,
}: {
  accent: string;
  intensity?: number;
}) {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={intensity}>
      <color attach="background" args={["#060b16"]} />

      <Lightformer
        form="ring"
        color="#f8fafc"
        intensity={1.2}
        scale={4.8}
        position={[0, 4.2, -3.4]}
        target={[0, 0, 0]}
      />
      <Lightformer
        form="rect"
        color="#f8fafc"
        intensity={1.8}
        scale={[8, 7, 1]}
        position={[-6, 2.6, 4]}
        rotation={[0, Math.PI / 2.6, 0]}
      />
      <Lightformer
        form="rect"
        color="#e2e8f0"
        intensity={1.2}
        scale={[7, 5, 1]}
        position={[6, 2, 1]}
        rotation={[0, -Math.PI / 2.8, 0]}
      />
      <Lightformer
        form="rect"
        color={accent}
        intensity={0.45}
        scale={[4.5, 4, 1]}
        position={[0, 1, -7]}
        rotation={[0, Math.PI, 0]}
      />
      <Lightformer
        form="rect"
        color="#0f172a"
        intensity={0.65}
        scale={[12, 4, 1]}
        position={[0, -2, 3]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Lightformer
        form="circle"
        color="#f1f5f9"
        intensity={0.8}
        scale={1.8}
        position={[-2, 1.5, 5]}
      />
      <Lightformer
        form="rect"
        color="#94a3b8"
        intensity={0.55}
        scale={[14, 1.25, 1]}
        position={[0, 6, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </Environment>
  );
}
