// Generate PWA PNG icons from SVG sources.
// Usage: node scripts/generate-pwa-icons.mjs
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");

const sources = [
  { svg: "icon-dashboard.svg", out: "icon-dashboard" },
  { svg: "icon-tablet.svg", out: "icon-tablet" },
];
const sizes = [192, 512];

for (const { svg, out } of sources) {
  const buf = await readFile(resolve(publicDir, svg));
  for (const size of sizes) {
    const outPath = resolve(publicDir, `${out}-${size}.png`);
    await sharp(buf).resize(size, size).png().toFile(outPath);
    console.log(`✓ ${outPath}`);
  }
}
