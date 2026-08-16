// Generates installable PNG icons from the SVG source.
// Regular: 192 + 512 (with safe padding). Maskable: full-bleed background.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/icons/icon-512.svg', 'utf8');

// 1. Regular icons (rasterize the SVG as-is)
for (const size of [192, 512]) {
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
  console.log(`icon-${size}.png written`);
}

// 2. Maskable icon: full-bleed background + centered C within the safe zone
const maskable = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#7c6af7"/>
  <text x="256" y="330" font-family="Arial, sans-serif" font-size="220" font-weight="bold" fill="white" text-anchor="middle">C</text>
</svg>`;
await sharp(Buffer.from(maskable), { density: 300 })
  .resize(512, 512)
  .png()
  .toFile('public/icons/icon-maskable-512.png');
console.log('icon-maskable-512.png written');
