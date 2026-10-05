/**
 * Marka ve iletisim bilgileri. TODO: firmadan gelen gercek degerlerle degistirilecek.
 */
export const site = {
  brand: {
    name: 'PERDE',
    legalName: 'Perde Tekstil A.S.',
    foundedYear: undefined as number | undefined,
  },
  contact: {
    phone: '+902120000000',
    phoneDisplay: '+90 212 000 00 00',
    email: 'info@perde.example',
    address: {
      street: 'Ornek Mahallesi, Ornek Caddesi No: 1',
      district: 'Ornek',
      city: 'Istanbul',
      country: 'TR',
      postalCode: '34000',
    },
  },
  social: [
    { name: 'Instagram', url: 'https://www.instagram.com/' },
    { name: 'Pinterest', url: 'https://www.pinterest.com/' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com/' },
    { name: 'YouTube', url: 'https://www.youtube.com/' },
  ],
  /** Pazarlama gerekcesiyle yuvarlanan sayilar; bos birakilirsa veriden hesaplanir. */
  statsOverride: {
    cities: undefined as number | undefined,
    districts: undefined as number | undefined,
    dealers: undefined as number | undefined,
  },
} as const;

export type Site = typeof site;
