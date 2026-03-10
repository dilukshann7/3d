export type ModelVariant = { label: string; glb: string };

export type ModelConfig = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  variants: ModelVariant[];
};

export const MODELS: ModelConfig[] = [
  {
    id: "borealis",
    name: "Borealis",
    subtitle: "Compact canopy system",
    description:
      "A compact modular shelter with a clean architectural profile for terraces, hospitality, and urban outdoor zones.",
    accent: "#2563eb",
    variants: [{ label: "Borealis XS", glb: "/Borealis XS.glb" }],
  },
  {
    id: "abris",
    name: "Abris Sur Mesure",
    subtitle: "Custom shelter range",
    description:
      "A fully tailored shelter line engineered for bespoke dimensions, material finishes, and client-specific site constraints.",
    accent: "#0f172a",
    variants: [{ label: "Signature", glb: "/ABRIS SUR MESURE.glb" }],
  },
  {
    id: "helios",
    name: "Helios",
    subtitle: "Solar pergola platform",
    description:
      "A high-efficiency pergola solution integrating overhead solar surfaces with a streamlined structural language.",
    accent: "#475569",
    variants: [{ label: "Animated", glb: "/Helios.glb" }],
  },
  {
    id: "andromeda",
    name: "Andromeda",
    subtitle: "Large-span architecture",
    description:
      "A large-span deployment concept optimized for broad coverage zones and high-traffic enterprise environments.",
    accent: "#0ea5e9",
    variants: [{ label: "Animated", glb: "/Andromeda.glb" }],
  },
  {
    id: "draco",
    name: "Draco",
    subtitle: "Angular frame series",
    description:
      "A geometric frame-forward model focused on stronger visual identity and precise structural articulation.",
    accent: "#334155",
    variants: [{ label: "Animated", glb: "/Draco.glb" }],
  },
  {
    id: "galaxisis",
    name: "Galaxisis",
    subtitle: "Adaptive urban module",
    description:
      "A flexible urban module designed for adaptable installations across retail, civic, and mixed-use contexts.",
    accent: "#14b8a6",
    variants: [{ label: "Animated", glb: "/Galaxisis.glb" }],
  },
];
