/**
 * Natural Earth (public domain) admin-1 verisinden stilize Turkiye haritasi uretir.
 * Cikti: src/data/geo/turkey.json  (SVG viewBox koordinatlarinda path + merkez + projeksiyon)
 * Kullanim: node scripts/build-turkey-map.mjs
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { geoMercator, geoPath } from 'd3-geo';

const root = resolve(import.meta.dirname, '..');
const cacheDir = resolve(root, '.cache');
const zipPath = resolve(cacheDir, 'ne_10m_admin_1_states_provinces.zip');
const geoPathOut = resolve(cacheDir, 'turkey-provinces.geojson');
const candidatesExist = () =>
  [
    geoPathOut,
    geoPathOut.replace('.geojson', '2.geojson'),
    geoPathOut.replace('.geojson', '1.geojson'),
  ].some((file) => existsSync(file));

const NE_URL = 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip';

const WIDTH = 1000;
const HEIGHT = 420;

await mkdir(cacheDir, { recursive: true });

if (!existsSync(zipPath)) {
  console.log('Natural Earth verisi indiriliyor…');
  const response = await fetch(NE_URL);
  if (!response.ok) throw new Error(`Indirme basarisiz: ${response.status}`);
  await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
}

if (!candidatesExist()) {
  console.log('mapshaper ile Turkiye illeri suzuluyor ve sadelestiriliyor…');
  execFileSync(
    'npx',
    [
      'mapshaper',
      zipPath,
      '-filter',
      "adm0_a3 === 'TUR'",
      '-simplify',
      '8%',
      'keep-shapes',
      '-o',
      'format=geojson',
      'rfc7946',
      'precision=0.0001',
      geoPathOut,
    ],
    { stdio: 'inherit', cwd: root },
  );
}

/** mapshaper cok katmanli girdilerde dosyayi bolebilir; icinde feature olan ciktiyi sec. */
const candidates = [
  geoPathOut,
  geoPathOut.replace('.geojson', '1.geojson'),
  geoPathOut.replace('.geojson', '2.geojson'),
  geoPathOut.replace('.geojson', '3.geojson'),
];
let geojson = null;
for (const candidate of candidates) {
  if (!existsSync(candidate)) continue;
  const parsed = JSON.parse(await readFile(candidate, 'utf8'));
  if (Array.isArray(parsed.features) && parsed.features.length > 0) {
    geojson = parsed;
    break;
  }
}
if (!geojson) throw new Error('mapshaper ciktisinda feature bulunamadi.');
console.log(`${geojson.features.length} il geometrisi okundu.`);

const sample = geojson.features[0]?.properties ?? {};
const isoKey = ['iso_3166_2', 'ISO_3166_2', 'code_hasc'].find((key) => key in sample);
if (!isoKey) {
  throw new Error(`ISO alani bulunamadi. Mevcut alanlar: ${Object.keys(sample).join(', ')}`);
}

/**
 * d3-geo kuresel poligonlarda saat yonu sarim bekler; Natural Earth/mapshaper ciktisi ters
 * oldugundan alan tabanli hesaplar (fitSize, centroid) dunyanin geri kalanini "ic" sayiyordu.
 * Sarimdan etkilenmeyen dogrudan koordinat hesabi kullaniyoruz.
 */
const ringsOf = (geometry) =>
  geometry.type === 'Polygon' ? geometry.coordinates : geometry.coordinates.flat();

const planarArea = (ring) => {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return area / 2;
};

const largestRing = (feature) => {
  const rings = ringsOf(feature.geometry);
  return rings.reduce((best, ring) =>
    Math.abs(planarArea(ring)) > Math.abs(planarArea(best)) ? ring : best,
  );
};

/** Standart shoelace: pozitif = saat yonunun tersi (CCW). */
const signedArea = (ring) => {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
  }
  return area / 2;
};

/**
 * d3-geo kuresel poligonlarda DIS halkalarin saat yonunde olmasini bekler.
 * Aksi halde poligonu "dunyanin geri kalani" sayar ve dev bir dikdortgen cizer.
 */
const rewind = (feature) => {
  const fix = (polygon) =>
    polygon.map((ring, index) => {
      const ccw = signedArea(ring) > 0;
      const shouldBeCcw = index > 0; // delikler ters yonde
      return ccw === shouldBeCcw ? ring : [...ring].reverse();
    });

  const geometry = feature.geometry;
  if (geometry.type === 'Polygon') {
    geometry.coordinates = fix(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates = geometry.coordinates.map(fix);
  }
  return feature;
};

const ringCentroid = (ring) => {
  let x = 0;
  let y = 0;
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cross = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1];
    area += cross;
    x += (ring[j][0] + ring[i][0]) * cross;
    y += (ring[j][1] + ring[i][1]) * cross;
  }
  area *= 0.5;
  if (area === 0) return ring[0];
  return [x / (6 * area), y / (6 * area)];
};

/** SVG path sayilarini 0.1 px hassasiyete indirir (1000px viewBox icin fazlasiyla yeterli). */
const round = (path) =>
  path.replace(/-?\d+\.\d+/g, (value) => String(Number.parseFloat(value).toFixed(1)));

geojson.features.forEach(rewind);

const allPoints = geojson.features.flatMap((feature) => ringsOf(feature.geometry).flat());
const projection = geoMercator().fitSize([WIDTH, HEIGHT], {
  type: 'MultiPoint',
  coordinates: allPoints,
});
const toPath = geoPath(projection);

const provinces = geojson.features
  .map((feature) => {
    const iso = String(feature.properties[isoKey] ?? '');
    const plate = Number.parseInt(iso.replace(/^TR-?/i, ''), 10);
    if (!Number.isInteger(plate) || plate < 1 || plate > 81) return null;
    const [lng, lat] = ringCentroid(largestRing(feature));
    const [cx, cy] = projection([lng, lat]);
    return {
      plate,
      d: round(toPath(feature)),
      centroid: [Number(cx.toFixed(1)), Number(cy.toFixed(1))],
      lngLat: [Number(lng.toFixed(4)), Number(lat.toFixed(4))],
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.plate - b.plate);

const seen = new Set();
const merged = [];
for (const province of provinces) {
  if (seen.has(province.plate)) continue;
  seen.add(province.plate);
  merged.push(province);
}

if (merged.length !== 81) {
  console.warn(`Uyari: ${merged.length} il eslesti (81 bekleniyor).`);
}

/** Lat/lng -> SVG donusumu icin projeksiyon parametreleri (bayi isaretcileri build'de hesaplanir). */
const output = {
  width: WIDTH,
  height: HEIGHT,
  projection: {
    type: 'mercator',
    scale: projection.scale(),
    translate: projection.translate(),
    center: projection.center(),
  },
  provinces: merged,
};

await writeFile(resolve(root, 'src/data/geo/turkey.json'), `${JSON.stringify(output)}\n`, 'utf8');

const bytes = JSON.stringify(output).length;
console.log(
  `src/data/geo/turkey.json yazildi (${(bytes / 1024).toFixed(0)} KB, ${merged.length} il).`,
);
