import type { Locale } from './ui';

export const SECTION_KEYS = ['collections', 'about', 'dealers', 'inspiration', 'contact'] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

/** Bolum anchor'lari dile gore degisir: /#koleksiyonlar vs /en#collections */
export const sectionAnchors: Record<SectionKey, Record<Locale, string>> = {
  collections: { tr: 'koleksiyonlar', en: 'collections' },
  about: { tr: 'hakkimizda', en: 'about' },
  dealers: { tr: 'bayi-agi', en: 'dealers' },
  inspiration: { tr: 'ilham', en: 'inspiration' },
  contact: { tr: 'iletisim', en: 'contact' },
};

export const LEGAL_KEYS = ['kvkk', 'privacy', 'cookies'] as const;

export type LegalKey = (typeof LEGAL_KEYS)[number];

export const legalPaths: Record<LegalKey, Record<Locale, string>> = {
  kvkk: { tr: '/kvkk', en: '/en/personal-data-notice' },
  privacy: { tr: '/gizlilik', en: '/en/privacy-policy' },
  cookies: { tr: '/cerez-politikasi', en: '/en/cookie-policy' },
};

export const homePaths: Record<Locale, string> = { tr: '/', en: '/en' };
