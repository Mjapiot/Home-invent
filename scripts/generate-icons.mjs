// Génère les icônes PWA (PNG) à partir d'un SVG, via sharp (déjà présent
// dans les dépendances de Next). Usage : node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";

// Maison blanche sur fond lavande (design system de l'app).
const svg = (rounded) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 96 : 0}" fill="#7c6cf0"/>
  <g>
    <path d="M256 104 L440 258 L396 258 L396 412 L116 412 L116 258 L72 258 Z" fill="#ffffff"/>
    <rect x="220" y="304" width="72" height="108" rx="10" fill="#7c6cf0"/>
  </g>
</svg>`;

mkdirSync("public/icons", { recursive: true });

const jobs = [
  { file: "public/icons/icon-192.png", size: 192, rounded: true },
  { file: "public/icons/icon-512.png", size: 512, rounded: true },
  { file: "public/icons/icon-maskable-512.png", size: 512, rounded: false },
  { file: "public/icons/apple-touch-icon.png", size: 180, rounded: false },
];

for (const job of jobs) {
  await sharp(Buffer.from(svg(job.rounded)))
    .resize(job.size, job.size)
    .png()
    .toFile(job.file);
  console.log("✓", job.file);
}
