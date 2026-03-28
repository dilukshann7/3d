export type ModelVariant = { label: string; glb: string };

export type ModelConfig = {
  id: string;
  name: string;
  description: string;
  image: string;
  accent: string;
  variants: ModelVariant[];
  irlImages?: string[];
  specs?: { label: string; value: string }[];
};

export const MODELS: ModelConfig[] = [
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
