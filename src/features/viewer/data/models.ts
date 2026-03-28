export type ModelVariant = { label: string; glb: string };

export type ModelConfig = {
  id: string;
  name: string;
  description: string;
  image: string;
  accent: string;
  variants: ModelVariant[];
  irlImages?: string[];
};

export const MODELS: ModelConfig[] = [
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
  },
  {
    id: "antares",
    name: "Antares",
    description:
      "Modern tilt-up pool enclosure with a white aluminum frame, providing easy access and stylish weather protection.",
    image: "/card-img-3-low.jpg",
    accent: "#475569",
    variants: [{ label: "Standard", glb: "/antares.glb" }],
    irlImages: [
      "/card-img-3-low.jpg",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1200"
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
  },
];
