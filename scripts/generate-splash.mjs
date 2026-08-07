// Génère les écrans de lancement Apple (apple-touch-startup-image) :
// fond clair + logo lavande centré. Usage : node scripts/generate-splash.mjs
import sharp from "sharp";
import { mkdirSync } from "fs";

// Tailles portrait des iPhone supportés : [points w, points h, ratio]
export const SPLASH_SIZES = [
  [375, 667, 2], // SE 2/3, 8
  [414, 896, 2], // XR, 11
  [375, 812, 3], // X, XS, 11 Pro, 12/13 mini
  [390, 844, 3], // 12, 13, 14
  [393, 852, 3], // 14 Pro, 15, 16
  [402, 874, 3], // 16 Pro
  [414, 896, 3], // XS Max, 11 Pro Max
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [430, 932, 3], // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [440, 956, 3], // 16 Pro Max
];

function splashSvg(w, h) {
  const logo = Math.round(Math.min(w, h) * 0.24);
  const x = Math.round((w - logo) / 2);
  const y = Math.round((h - logo) / 2) - Math.round(h * 0.04);
  const r = Math.round(logo * 0.28);
  const s = logo / 512; // échelle du dessin maison (base 512)
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#f2f2f5"/>
  <g transform="translate(${x},${y})">
    <rect width="${logo}" height="${logo}" rx="${r}" fill="#7c6cf0"/>
    <g transform="scale(${s})">
      <path d="M256 124 L420 262 L382 262 L382 398 L130 398 L130 262 L92 262 Z" fill="#ffffff"/>
      <rect x="224" y="312" width="64" height="86" rx="10" fill="#7c6cf0"/>
    </g>
  </g>
</svg>`;
}

mkdirSync("public/splash", { recursive: true });

for (const [w, h, r] of SPLASH_SIZES) {
  const pw = w * r;
  const ph = h * r;
  const file = `public/splash/splash-${pw}x${ph}.png`;
  await sharp(Buffer.from(splashSvg(pw, ph))).png().toFile(file);
  console.log("✓", file);
}
