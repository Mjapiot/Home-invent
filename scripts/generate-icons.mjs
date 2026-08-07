// Génère les icônes PWA (PNG) à partir d'un SVG, via sharp (déjà présent
// dans les dépendances de Next). Usage : node scripts/generate-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";

// Maison stylisée ambre sur fond sombre (dessin vectoriel, pas d'emoji :
// sharp n'embarque pas de police emoji couleur).
const svg = (rounded) => `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${rounded ? 96 : 0}" fill="#1c1917"/>
  <g>
    <path d="M256 96 L448 256 L400 256 L400 416 L112 416 L112 256 L64 256 Z" fill="#f59e0b"/>
    <rect x="216" y="300" width="80" height="116" rx="8" fill="#1c1917"/>
    <rect x="150" y="290" width="44" height="44" rx="6" fill="#1c1917"/>
    <rect x="318" y="290" width="44" height="44" rx="6" fill="#1c1917"/>
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
