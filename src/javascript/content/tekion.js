// Single source of truth for all Tekion copy and links.
// Data comes from the (git-ignored) root config.json; a fresh clone falls back to config.example.json.
const files = import.meta.glob("../../../config{,.example}.json", {
  eager: true,
  import: "default",
});
const config =
  files["../../../config.json"] || files["../../../config.example.json"] || {};

// Palette. Brand values come from Tekion's own design tokens (tekion.com stylesheet): teal-500 #00C3B4 is the primary
// background colour, #222630 is the text/button colour, #00CBF7 starts their "sky" gradient. The floor and glass tones
// follow the campus reference image. Override anything via config.json "colors".
export const colors = {
  primary: "#222630",
  title: "#00C3B4", // intro TEKION letters
  accent: "#00C3B4",
  sky: "#00CBF7", // road pulses
  social: "#f4f6fb", // social icons (blue from Tekion's gradient tokens)
  surface: "#ffffff",
  text: "#222630",
  shadow: "#8d99b8",
  glow: "#eef2ff",
  car: "#c9c8c2",
  floor: {
    topLeft: "#d6dded",
    topRight: "#e4e9f4",
    bottomRight: "#f1f3fa",
    bottomLeft: "#dde3f0",
  },
  // Matcap colours of the scene materials (white = buildings, blue = glass, ...)
  shades: {
    white: "#f4f6fb",
    gray: "#b4bccd",
    blue: "#a9c8ee",
    black: "#222630",
    brown: "#b9a995",
    beige: "#e7e3da",
    emeraldGreen: "#4cc79a",
    green: "#cdeac0",
    purple: "#8a6be6",
  },
  ...config.colors,
};

export const brand = {
  name: config.name || "Tekion",
  tagline: config.tagline || "",
};

// Labels on the floating cards over the server farm (taken from the design reference); override with config.json "hubCards"
export const hubCards = config.hubCards || [
  "Simple platform",
  "Easy data access",
  "Business ready",
];

export const social = config.social || [];
// Product images: src/images/products/<name>.(png|jpg|webp). A product uses `image` (a file name) from config.json,
// or else the file whose name matches the product name (crm.png -> "Tekion CRM", tekion_pay.png -> "Tekion Pay").
const imageFiles = import.meta.glob(
  "../../images/products/*.{png,jpg,jpeg,webp}",
  { eager: true, query: "?url", import: "default" },
);
const normalise = (_text) =>
  _text
    .toLowerCase()
    .replace(/\.[a-z]+$/, "")
    .replace(/[^a-z0-9]/g, "");
const imageByName = {};
for (const _path in imageFiles) {
  imageByName[normalise(_path.split("/").pop())] = imageFiles[_path];
}

const findImage = (_product) => {
  if (_product.image) {
    return imageByName[normalise(_product.image)] || null;
  }
  const name = normalise(_product.name);
  return imageByName[name] || imageByName[name.replace(/^tekion/, "")] || null;
};

export const products = (config.products || []).map((_product) => ({
  ..._product,
  image: findImage(_product),
}));
export const achievements = config.achievements || [];
export const testimonials = config.testimonials || [];

export default {
  brand,
  colors,
  hubCards,
  social,
  products,
  achievements,
  testimonials,
};
