import { describe, expect, it } from 'vitest';
import { LOCALES, ui } from '../../src/i18n/ui';
import { anchor, collator, format, legalPath, normalizeTr, slugifyTr } from '../../src/i18n/utils';

describe('normalizeTr', () => {
  it('Turkce karakterleri arama icin esitler', () => {
    expect(normalizeTr('Kadıköy')).toBe('kadikoy');
    expect(normalizeTr('İstanbul')).toBe('istanbul');
    expect(normalizeTr('Şanlıurfa')).toBe('sanliurfa');
    expect(normalizeTr('Ağrı')).toBe('agri');
    expect(normalizeTr('Çanakkale')).toBe('canakkale');
  });

  it('kullanicinin yazdigi ASCII karsiligiyla eslesir', () => {
    expect(normalizeTr('kadikoy')).toBe(normalizeTr('Kadıköy'));
    expect(normalizeTr('Istanbul')).toBe(normalizeTr('İstanbul'));
  });
});

describe('slugifyTr', () => {
  it('URL uyumlu slug uretir', () => {
    expect(slugifyTr('Kahramanmaraş')).toBe('kahramanmaras');
    expect(slugifyTr('Şehitkamil / Gaziantep')).toBe('sehitkamil-gaziantep');
    expect(slugifyTr('  Düzce  ')).toBe('duzce');
  });
});

describe('format', () => {
  it('yer tutuculari doldurur, bilinmeyeni korur', () => {
    expect(format('{count} bayi', { count: 12 })).toBe('12 bayi');
    expect(format('{a} / {b}', { a: 1 })).toBe('1 / {b}');
  });
});

describe('rotalar', () => {
  it('anchor her zaman tam yol dondurur', () => {
    expect(anchor('tr', 'collections')).toBe('/#koleksiyonlar');
    expect(anchor('en', 'collections')).toBe('/en#collections');
    expect(anchor('tr', 'dealers')).toBe('/#bayi-agi');
  });

  it('yasal sayfalar dile gore eslesir', () => {
    expect(legalPath('tr', 'kvkk')).toBe('/kvkk');
    expect(legalPath('en', 'kvkk')).toBe('/en/personal-data-notice');
  });
});

describe('sozluk', () => {
  const keyPaths = (value: unknown, prefix = ''): string[] =>
    typeof value === 'object' && value !== null
      ? Object.entries(value).flatMap(([key, child]) => keyPaths(child, `${prefix}${key}.`))
      : [prefix.slice(0, -1)];

  it('tum diller ayni anahtarlara sahip', () => {
    const reference = keyPaths(ui.tr).sort();
    for (const locale of LOCALES) {
      expect(keyPaths(ui[locale]).sort()).toEqual(reference);
    }
  });

  it('bos ceviri yok', () => {
    for (const locale of LOCALES) {
      const values = JSON.stringify(ui[locale]);
      expect(values).not.toMatch(/:\s*""/);
    }
  });
});

describe('collator', () => {
  it('Turkce alfabetik siralama yapar', () => {
    const cities = ['İzmir', 'Isparta', 'İstanbul', 'Çorum', 'Ankara'];
    expect([...cities].sort((a, b) => collator.compare(a, b))).toEqual([
      'Ankara',
      'Çorum',
      'Isparta',
      'İstanbul',
      'İzmir',
    ]);
  });
});
