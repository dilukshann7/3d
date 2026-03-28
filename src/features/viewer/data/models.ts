import { assetUrl } from "../../../utils/assetUrl";

export type ModelVariant = { label: string; glb: string };
export type MaterialKind = "glass" | "water" | "concrete" | "metal" | "generic";

export type MaterialFinish = {
  color?: string;
  mapUrl?: string;
  roughnessMapUrl?: string;
  metalnessMapUrl?: string;
  normalMapUrl?: string;
  bumpMapUrl?: string;
  repeat?: [number, number];
  normalScale?: number | [number, number];
  metalness?: number;
  roughness?: number;
  reflectivity?: number;
  envMapIntensity?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  transmission?: number;
  opacity?: number;
  bumpScale?: number;
};

export type ModelTextureOption = {
  label: string;
  swatch: string;
  materials?: Partial<Record<MaterialKind, MaterialFinish>>;
};

export type ModelSurfaceOptions = {
  metal?: ModelTextureOption[];
  glass?: ModelTextureOption[];
};

export type ModelMetalTextureTargets = {
  materialNames?: string[];
  materialNameIncludes?: string[];
  nodePrefixes?: string[];
  excludedNodePrefixes?: string[];
};

export type ModelConfig = {
  id: string;
  name: string;
  description: string;
  image: string;
  accent: string;
  variants: ModelVariant[];
  surfaceOptions?: ModelSurfaceOptions;
  metalTextureTargets?: ModelMetalTextureTargets;
  irlImages?: string[];
  specs?: { label: string; value: string }[];
};

export const DEFAULT_VIEWER_ENVIRONMENT_URL = assetUrl(
  "textures/glass/DayEnvironmentHDRI070_1K_TONEMAPPED.jpg",
);

const SHARED_METAL_TEXTURES: ModelTextureOption[] = [
  {
    label: "Road",
    swatch: "#8b7355",
    materials: {
      metal: {
        mapUrl: assetUrl("textures/metal/Road015C_1K-JPG_Color.jpg"),
        repeat: [1, 1],
        metalness: 0.55,
        roughness: 0.58,
        reflectivity: 0.28,
        envMapIntensity: 0.65,
      },
    },
  },
  {
    label: "Asphalt",
    swatch: "#4b5563",
    materials: {
      metal: {
        mapUrl: assetUrl("textures/metal/Asphalt031_1K-JPG_Color.jpg"),
        roughnessMapUrl: assetUrl("textures/metal/Asphalt031_1K-JPG_Color.jpg"),
        bumpMapUrl: assetUrl("textures/metal/Asphalt031_1K-JPG_Color.jpg"),
        repeat: [1, 1],
        color: "#ffffff",
        metalness: 0.04,
        roughness: 0.98,
        reflectivity: 0.02,
        envMapIntensity: 0.12,
        bumpScale: 0.12,
      },
    },
  },
];

const SHARED_GLASS_TEXTURES: ModelTextureOption[] = [];

const BOX_ONLY_TARGETS: ModelMetalTextureTargets = {
  nodePrefixes: ["Box"],
  excludedNodePrefixes: ["Line", "Plane", "Rectangle", "Object"],
};

const BOX_AND_SHAPE_TARGETS: ModelMetalTextureTargets = {
  nodePrefixes: ["Box", "Shape"],
  excludedNodePrefixes: ["Line", "Plane", "Rectangle", "Object"],
};

export const MODELS: ModelConfig[] = [
  {
    id: "antares",
    name: "Antares",
    description:
      "Modern tilt-up pool enclosure with a white aluminum frame, providing easy access and stylish weather protection.",
    image: assetUrl("card-img-3-low.jpg"),
    accent: "#475569",
    variants: [{ label: "Standard", glb: assetUrl("antares.glb") }],
    surfaceOptions: {
      metal: SHARED_METAL_TEXTURES,
      glass: SHARED_GLASS_TEXTURES,
    },
    metalTextureTargets: {
      materialNames: ["02___Default", "07___Defaultddd", "15___Default"],
      nodePrefixes: ["Box", "Cylinder", "Shape"],
      excludedNodePrefixes: ["Line", "Plane", "Object"],
    },
    irlImages: [
      assetUrl("card-img-3-low.jpg"),
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200",
    ],
    specs: [
      { label: "Design", value: "Tilt-Up Access" },
      { label: "Frame Color", value: "White" },
      { label: "Protection", value: "Weather & UV" },
    ],
  },
  
  {
    id: "draco",
    name: "Draco",
    description:
      "A modern, rotatable dome spa enclosure with a sleek black frame, providing a panoramic, wind-shielded hot tub experience.",
    image: "/card-img-5-low.jpg",
    accent: "#334155",
    variants: [{ label: "Standard", glb: "/draco.glb" }],
    irlImages: [
      "/card-img-5-low.jpg",
      "https://images.unsplash.com/photo-1576013551627-11971f366114?auto=format&fit=crop&q=80&w=1200"
    ],
    specs: [
      { label: "Shape", value: "Rotatable Dome" },
      { label: "Visibility", value: "360° Panoramic" },
      { label: "Wind Shield", value: "Included" },
    ],
  },
  {
    id: "andromeda",
    name: "Andromeda",
    description:
      "Elegant telescopic glass sunroom featuring a charcoal frame, designed to create a versatile outdoor dining space.",
    image: "/card-img-6-low.jpg",
    accent: "#0ea5e9",
    variants: [{ label: "Standard", glb: "/andromeda.glb" }],
    irlImages: [
      "/card-img-6-low.jpg",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200"
    ],
    specs: [
      { label: "Style", value: "Telescopic Sunroom" },
      { label: "Application", value: "Outdoor Dining" },
      { label: "Glazing", value: "High Clear Glass" },
    ],
  },
  {
    id: "abris",
    name: "Abris Sur Mesure",
    description:
      "A sleek, telescopic glass pool enclosure featuring a retractable charcoal aluminum frame for year-round swimming protection.",
    image: "/card-img-1-low.jpg",
    accent: "#0f172a",
    variants: [{ label: "Standard", glb: "/abris.glb" }],
    irlImages: [
      "/card-img-1-low.jpg",
      "https://images.unsplash.com/photo-1576013551627-11971f366114?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200"
    ],
    specs: [
      { label: "Material", value: "Telescopic Glass" },
      { label: "Frame", value: "Charcoal Aluminum" },
      { label: "Usage", value: "Year-Round" },
    ],
  },
  {
    id: "moon",
    name: "Moon Deck",
    description:
      "Innovative sliding deck cover with wooden lounge chairs, designed to maximize patio space and protect pools.",
    image: "/card-img-2-low.jpg",
    accent: "#78350f",
    variants: [{ label: "Standard", glb: "/moon.glb" }],
    irlImages: [
      "/card-img-2-low.jpg",
      "https://images.unsplash.com/photo-1540544660406-6a69dacb2804?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
    ],
    specs: [
      { label: "Surface", value: "Natural Wood" },
      { label: "System", value: "Sliding Track" },
      { label: "Load", value: "Heavy Duty" },
    ],
  },
  {
    id: "borealis",
    name: "Borealis",
    description:
      "Ultra-low profile telescopic pool enclosure with a minimalist gray frame, offering sleek, flat-surface protection and safety.",
    image: "/card-img-7-low.jpg",
    accent: "#2563eb",
    variants: [{ label: "Standard", glb: "/borealis.glb" }],
    irlImages: [
      "/card-img-7-low.jpg",
      "https://images.unsplash.com/photo-1540544660406-6a69dacb2804?auto=format&fit=crop&q=80&w=1200"
    ],
    specs: [
      { label: "Profile", value: "Ultra-Low" },
      { label: "Aesthetic", value: "Minimalist Gray" },
      { label: "Key Feature", value: "Child Safety" },
    ],
  },
  {
    id: "helios",
    name: "Helios",
    description:
      "Contemporary hot tub setup featuring a central wood-paneled spa flanked by two symmetrical, glass-enclosed seating areas.",
    image: "/card-img-4-low.jpg",
    accent: "#475569",
    variants: [{ label: "Standard", glb: "/helios.glb" }],
    irlImages: [
      "/card-img-4-low.jpg",
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200"
    ],
    specs: [
      { label: "Setup", value: "Hot Tub & Lounge" },
      { label: "Enclosure", value: "Dual Glass Zones" },
      { label: "Accent", value: "Wood Paneling" },
    ],
  },
  {
    id: "galaxisis",
    name: "Galaxisis",
    description:
      "A spacious, high-profile telescopic pool enclosure with a black aluminum frame and clear glass gabled roof.",
    image: "/card-img-8-low.jpg",
    accent: "#14b8a6",
    variants: [{ label: "Standard", glb: "/galaxisis.glb" }],
    irlImages: [
      "/card-img-8-low.jpg",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200"
    ],
    specs: [
      { label: "Roof Type", value: "Gabled" },
      { label: "Frame", value: "Black Aluminum" },
      { label: "Internal Height", value: "Standing Room" },
    ],
  },
];
