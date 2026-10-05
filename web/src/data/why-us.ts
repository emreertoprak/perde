import type { Locale } from '../i18n/ui';

export interface ValueProp {
  icon: 'weave' | 'pin' | 'thread' | 'consult';
  title: Record<Locale, string>;
  body: Record<Locale, string>;
}

export const whyUs: ValueProp[] = [
  {
    icon: 'weave',
    title: { tr: 'Geniş Koleksiyon', en: 'A Wide Collection' },
    body: {
      tr: 'Yedi ana koleksiyon ve geniş bir kumaş, doku ve renk yelpazesi.',
      en: 'Seven core collections across a broad range of fabrics, textures and colours.',
    },
  },
  {
    icon: 'pin',
    title: { tr: 'Türkiye Genelinde Bayi Ağı', en: 'A Nationwide Dealer Network' },
    body: {
      tr: 'Şehirden şehre yayılan bayi ağıyla koleksiyonlar size en yakın noktada.',
      en: 'A dealer network spread city to city keeps the collections close to you.',
    },
  },
  {
    icon: 'thread',
    title: { tr: 'Kaliteli Kumaşlar', en: 'Quality Fabrics' },
    body: {
      tr: 'Dayanıklılık, tuşe ve ışık geçirgenliği gözetilerek seçilen dokumalar.',
      en: 'Weaves selected for durability, hand feel and light transmission.',
    },
  },
  {
    icon: 'consult',
    title: { tr: 'Profesyonel Danışmanlık', en: 'Professional Guidance' },
    body: {
      tr: 'Ölçüden montaja kadar bayilerimizde uzman desteği.',
      en: 'Expert support at our dealers, from measuring to installation.',
    },
  },
];
