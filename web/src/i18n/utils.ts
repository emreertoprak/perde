import { homePaths, legalPaths, sectionAnchors, type LegalKey, type SectionKey } from './routes';
import { LOCALES, ui, type Locale, type UiDictionary } from './ui';

export function isLocale(value: string | undefined): value is Locale {
  return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

export function t(locale: Locale): UiDictionary {
  return ui[locale];
}

/** format('{count} bayi', { count: 12 }) -> '12 bayi' */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

export function sectionId(locale: Locale, key: SectionKey): string {
  return sectionAnchors[key][locale];
}

/** Her zaman tam yol dondurur: '/#koleksiyonlar' veya '/en#collections'. */
export function anchor(locale: Locale, key: SectionKey): string {
  return `${homePaths[locale]}#${sectionId(locale, key)}`;
}

export function legalPath(locale: Locale, key: LegalKey): string {
  return legalPaths[key][locale];
}

export function homePath(locale: Locale): string {
  return homePaths[locale];
}

export function otherLocale(locale: Locale): Locale {
  return locale === 'tr' ? 'en' : 'tr';
}

export function homeAlternates(): Record<Locale, string> {
  return { ...homePaths };
}

export function legalAlternates(key: LegalKey): Record<Locale, string> {
  return { ...legalPaths[key] };
}

export function ogLocale(locale: Locale): string {
  return locale === 'tr' ? 'tr_TR' : 'en_US';
}

/**
 * Sehir/ilce adlarini arama icin normalize eder: "Kadıköy" ve "kadikoy" eslesir.
 * Turkce'ye ozgu i/I ciftlerini once sabitler, sonra aksanlari kaldirir.
 */
export function normalizeTr(value: string): string {
  return value
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');
}

/** URL parcalarinda kullanilan Turkce uyumlu slug. */
export function slugifyTr(value: string): string {
  return normalizeTr(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const collator = new Intl.Collator('tr');
