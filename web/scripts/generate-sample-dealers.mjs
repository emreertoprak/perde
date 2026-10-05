/**
 * Ornek bayi verisi uretir (firmanin gercek Excel listesi gelene kadar).
 * Deterministik: ayni tohumla ayni cikti -> git'te gurultu olmaz.
 * Kullanim: node scripts/generate-sample-dealers.mjs
 */
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');
const geo = require('../src/data/geo/turkey.json');
const { provinces } = await import('../src/data/geo/provinces.ts');

const lngLatByPlate = new Map(geo.provinces.map((item) => [item.plate, item.lngLat]));

/** Buyuk sehirlerde gercek ilce adlari; digerlerinde merkez ilce. */
const districtsByPlate = {
  34: [
    'Kadıköy',
    'Beşiktaş',
    'Şişli',
    'Üsküdar',
    'Bakırköy',
    'Ataşehir',
    'Beylikdüzü',
    'Maltepe',
    'Kartal',
    'Sarıyer',
  ],
  6: ['Çankaya', 'Yenimahalle', 'Keçiören', 'Etimesgut', 'Mamak'],
  35: ['Konak', 'Karşıyaka', 'Bornova', 'Buca', 'Gaziemir'],
  16: ['Nilüfer', 'Osmangazi', 'Yıldırım'],
  7: ['Muratpaşa', 'Konyaaltı', 'Kepez', 'Alanya'],
  1: ['Seyhan', 'Çukurova', 'Yüreğir'],
  42: ['Selçuklu', 'Meram', 'Karatay'],
  27: ['Şahinbey', 'Şehitkamil'],
  38: ['Melikgazi', 'Kocasinan'],
  33: ['Yenişehir', 'Mezitli', 'Toroslar'],
  41: ['İzmit', 'Gebze', 'Darıca'],
  55: ['Atakum', 'İlkadım'],
  26: ['Tepebaşı', 'Odunpazarı'],
  61: ['Ortahisar', 'Akçaabat'],
  20: ['Pamukkale', 'Merkezefendi'],
  21: ['Kayapınar', 'Bağlar'],
  31: ['Antakya', 'İskenderun'],
  45: ['Şehzadeler', 'Yunusemre'],
  54: ['Adapazarı', 'Serdivan'],
  59: ['Süleymanpaşa', 'Çorlu'],
  63: ['Haliliye', 'Karaköprü'],
  65: ['İpekyolu', 'Edremit'],
  44: ['Battalgazi', 'Yeşilyurt'],
  25: ['Yakutiye', 'Palandöken'],
  10: ['Karesi', 'Altıeylül'],
  9: ['Efeler', 'Nazilli'],
  48: ['Menteşe', 'Bodrum'],
  17: ['Merkez', 'Biga'],
  52: ['Altınordu', 'Ünye'],
  46: ['Onikişubat', 'Dulkadiroğlu'],
};

const namePrefixes = ['Ev Tekstil', 'Perde Evi', 'Dekorasyon', 'Perde Studyo', 'Tekstil Merkezi'];
const streetNames = [
  'Cumhuriyet',
  'Atatürk',
  'İstiklal',
  'Bağdat',
  'Zafer',
  'Barbaros',
  'Mimar Sinan',
];

/** mulberry32 */
const makeRandom = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const random = makeRandom(20260917);

const slugify = (value) =>
  value
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + random() * (max - min);

/** 81 ilden 73'unde bayi var (brief'teki kapsamla ayni). */
const platesWithoutDealers = new Set([29, 69, 75, 76, 62, 73, 79, 30]);

const dealers = [];
let counter = 0;

for (const province of provinces) {
  if (platesWithoutDealers.has(province.plate)) continue;

  const districts = districtsByPlate[province.plate] ?? ['Merkez'];
  const base = lngLatByPlate.get(province.plate);
  if (!base) throw new Error(`Koordinat yok: ${province.name}`);

  const count = districts.length > 3 ? districts.length : Math.max(1, Math.round(between(1, 3)));

  for (let index = 0; index < count; index += 1) {
    const district = districts[index % districts.length];
    counter += 1;
    const id = `sample-${String(province.plate).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    const name = `${district} ${pick(namePrefixes)}`;
    const areaCode = 200 + (province.plate % 99);
    const phoneTail = String(1000000 + Math.floor(random() * 8999999)).slice(0, 7);
    const hasWhatsapp = random() > 0.35;

    dealers.push({
      id,
      slug: slugify(`${province.name}-${district}-${name}-${index + 1}`),
      name,
      plate: province.plate,
      city: province.name,
      citySlug: slugify(province.name),
      district,
      districtSlug: slugify(district),
      address: `${pick(streetNames)} Cad. No: ${Math.floor(between(2, 180))}, ${district} / ${province.name}`,
      phone: `+90${areaCode}${phoneTail}`,
      whatsapp: hasWhatsapp
        ? `+905${String(300000000 + Math.floor(random() * 99999999)).slice(0, 9)}`
        : null,
      email: null,
      lat: Number((base[1] + between(-0.14, 0.14)).toFixed(5)),
      lng: Number((base[0] + between(-0.18, 0.18)).toFixed(5)),
      isShowroom: random() > 0.72,
      openingHours: 'Pzt–Cmt 09:00–19:00',
    });
  }
}

dealers.sort((a, b) => a.plate - b.plate || a.district.localeCompare(b.district, 'tr'));

await writeFile(
  resolve(root, 'src/data/dealers.json'),
  `${JSON.stringify(dealers, null, 2)}\n`,
  'utf8',
);

const cities = new Set(dealers.map((dealer) => dealer.plate));
const districts = new Set(dealers.map((dealer) => `${dealer.plate}-${dealer.districtSlug}`));
console.log(
  `${dealers.length} bayi, ${cities.size} il, ${districts.size} ilce (${counter} kayit).`,
);
