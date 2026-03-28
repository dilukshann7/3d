import { Environment, Lightformer } from "@react-three/drei";

export default function StudioEnvironment({
  accent,
  intensity = 1,
  environmentMapUrl,
}: {
  accent: string;
  intensity?: number;
  environmentMapUrl?: string;
}) {
  if (environmentMapUrl) {
    return (
      <Environment
        files={environmentMapUrl}
        resolution={256}
        frames={1}
        environmentIntensity={intensity}
      />
    );
  }

  return (
    <Environment
      resolution={256}      // 256 is indistinguishable from 512 for env reflections
      frames={1}            // bake once — lightformers are all static
      environmentIntensity={intensity * 0.75}
    >
      <color attach="background" args={["#f1f5f9"]} />

      <Lightformer form="ring" color="#f0f4f8" intensity={0.5} scale={7}
        position={[0, 5, -4]} target={[0, 0, 0]} />

      <Lightformer form="rect" color="#fff8f0" intensity={0.6} scale={[10, 8, 1]}
        position={[-7, 3, 4]} rotation={[0, Math.PI / 2.4, 0]} />

      <Lightformer form="rect" color="#dbeafe" intensity={0.2} scale={[8, 6, 1]}
        position={[7, 2.5, 1]} rotation={[0, -Math.PI / 2.6, 0]} />

      <Lightformer form="rect" color={accent} intensity={0.45} scale={[5, 4.5, 1]}
        position={[0, 1.2, -8]} rotation={[0, Math.PI, 0]} />

      <Lightformer form="rect" color="#0d2a4a" intensity={0.6} scale={[24, 8, 1]}
        position={[0, -2.5, 3]} rotation={[-Math.PI / 2, 0, 0]} />

      <Lightformer form="circle" color="#f1f5f9" intensity={0.4} scale={2.5}
        position={[-2, 1.8, 6]} />

      <Lightformer form="rect" color="#1e4a7a" intensity={0.7} scale={[30, 2, 1]}
        position={[0, 0.05, 6]} rotation={[Math.PI / 2.1, 0, 0]} />

      <Lightformer form="rect" color="#cbd5e1" intensity={0.3} scale={[22, 2, 1]}
        position={[0, 7, 0]} rotation={[Math.PI / 2, 0, 0]} />

      <Lightformer form="ring" color={accent} intensity={0.08} scale={3}
        position={[4, 2, -5]} target={[0, 0, 0]} />

      <Lightformer form="rect" color="#fde68a" intensity={0.08} scale={[8, 4, 1]}
        position={[0, -1.5, 2]} rotation={[-Math.PI / 3, 0, 0]} />

      <Lightformer form="rect" color="#0a1e35" intensity={0.7} scale={[28, 6, 1]}
        position={[0, -1.8, -6]} rotation={[Math.PI / 2.3, 0, 0]} />
    </Environment>
  );
}
