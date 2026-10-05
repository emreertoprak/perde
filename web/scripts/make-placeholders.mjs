/**
 * Gecici gorseller uretir (AI gorselleri gelene kadar).
 * Cikti oranlari nihai gorsellerle ayni; boylece layout ve LCP davranisi gercekci olur.
 * Kullanim: node scripts/make-placeholders.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');

const palette = [
  ['#efe7d8', '#d9c9b0'],
  ['#e6dccb', '#cbbeab'],
  ['#f2ebe0', '#e0cdb4'],
  ['#e9dfd0', '#c9b79c'],
];

/** @type {{ file: string, width: number, height: number, label: string }[]} */
const targets = [
  {
    file: 'src/assets/images/hero/hero-interior.jpg',
    width: 2400,
    height: 1350,
    label: 'HERO INTERIOR 16:9',
  },
  {
    file: 'src/assets/images/story/fabric-macro.jpg',
    width: 1600,
    height: 2000,
    label: 'FABRIC MACRO 4:5',
  },
  { file: 'src/assets/images/collections/tul.jpg', width: 1600, height: 2000, label: 'TUL 4:5' },
  { file: 'src/assets/images/collections/fon.jpg', width: 1600, height: 2000, label: 'FON 4:5' },
  {
    file: 'src/assets/images/collections/blackout.jpg',
    width: 1600,
    height: 2000,
    label: 'BLACKOUT 4:5',
  },
  {
    file: 'src/assets/images/collections/zebra.jpg',
    width: 1600,
    height: 2000,
    label: 'ZEBRA 4:5',
  },
  { file: 'src/assets/images/collections/stor.jpg', width: 1600, height: 2000, label: 'STOR 4:5' },
  {
    file: 'src/assets/images/collections/dikey.jpg',
    width: 1600,
    height: 2000,
    label: 'DIKEY 4:5',
  },
  {
    file: 'src/assets/images/collections/premium-kumas.jpg',
    width: 1600,
    height: 2000,
    label: 'PREMIUM 4:5',
  },
  { file: 'src/assets/images/fabric/light-1.jpg', width: 1500, height: 2000, label: 'LIGHT 3:4' },
  { file: 'src/assets/images/fabric/light-2.jpg', width: 1600, height: 1600, label: 'WEAVE 1:1' },
  { file: 'src/assets/images/fabric/light-3.jpg', width: 2400, height: 1350, label: 'LIGHT 16:9' },
  {
    file: 'src/assets/images/inspiration/salon.jpg',
    width: 1500,
    height: 2000,
    label: 'SALON 3:4',
  },
  {
    file: 'src/assets/images/inspiration/yatak-odasi.jpg',
    width: 2000,
    height: 1500,
    label: 'BEDROOM 4:3',
  },
  {
    file: 'src/assets/images/inspiration/otel-lobi.jpg',
    width: 2000,
    height: 1500,
    label: 'HOTEL 4:3',
  },
  {
    file: 'src/assets/images/inspiration/yemek-odasi.jpg',
    width: 1600,
    height: 1600,
    label: 'DINING 1:1',
  },
  {
    file: 'src/assets/images/inspiration/calisma-odasi.jpg',
    width: 1500,
    height: 2000,
    label: 'STUDY 3:4',
  },
  {
    file: 'src/assets/images/inspiration/oturma-odasi.jpg',
    width: 2000,
    height: 1500,
    label: 'LIVING 4:3',
  },
  { file: 'src/assets/images/inspiration/banyo.jpg', width: 1600, height: 1600, label: 'BATH 1:1' },
  {
    file: 'src/assets/images/inspiration/teras.jpg',
    width: 1500,
    height: 2000,
    label: 'TERRACE 3:4',
  },
  {
    file: 'src/assets/images/cta/cta-interior.jpg',
    width: 2520,
    height: 1080,
    label: 'CTA INTERIOR 21:9',
  },
  { file: 'public/og/og-default.jpg', width: 1200, height: 630, label: 'OG 1200x630' },
];

const svg = (width, height, label, index) => {
  const [from, to] = palette[index % palette.length];
  const fontSize = Math.round(Math.min(width, height) * 0.045);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <g fill="none" stroke="#9c8b79" stroke-opacity="0.35" stroke-width="${Math.max(1, Math.round(width / 900))}">
    ${Array.from({ length: 14 }, (_, i) => `<line x1="${(width / 14) * i}" y1="0" x2="${(width / 14) * i + width * 0.12}" y2="${height}"/>`).join('\n    ')}
  </g>
  <text x="50%" y="50%" fill="#5e554d" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize}" letter-spacing="${fontSize * 0.2}" text-anchor="middle">${label}</text>
  <text x="50%" y="${height / 2 + fontSize * 2}" fill="#9c8b79" font-family="Helvetica, Arial, sans-serif" font-size="${fontSize * 0.55}" letter-spacing="${fontSize * 0.12}" text-anchor="middle">PLACEHOLDER</text>
</svg>`;
};

const manifest = [];

for (const [index, target] of targets.entries()) {
  const outPath = resolve(root, target.file);
  await mkdir(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svg(target.width, target.height, target.label, index)))
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(outPath);
  manifest.push({
    file: target.file,
    slot: target.label,
    width: target.width,
    height: target.height,
    source: 'placeholder',
    model: null,
    prompt: null,
    generatedAt: new Date().toISOString().slice(0, 10),
  });
  console.log(`+ ${target.file}`);
}

await writeFile(
  resolve(root, 'src/assets/images/manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);
console.log(`\n${manifest.length} gorsel uretildi.`);
