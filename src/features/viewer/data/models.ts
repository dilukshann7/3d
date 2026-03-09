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
    subtitle: "ABRIS SUR MESURE",
    description:
      "A tailored shelter concept with a cleaner architectural silhouette and a stronger studio presentation.",
    accent: "#7dd3fc",
    variants: [{ label: "Animated", glb: "/ABRIS SUR MESURE.glb" }],
  },
  {
    id: "helios",
    name: "Helios",
    subtitle: "Solar pergola",
    description:
      "A solar pergola shown with warmer highlights and more contrast so the structure reads immediately.",
    accent: "#f59e0b",
    variants: [{ label: "Animated", glb: "/Helios.glb" }],
  },
];
