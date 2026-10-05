export const LOCALES = ['tr', 'en'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'tr';

const tr = {
  meta: {
    title: 'Premium Perde Koleksiyonları ve Türkiye Geneli Bayi Ağı',
    description:
      'Tül, fon, blackout, zebra, stor ve dikey perde koleksiyonları. Türkiye genelindeki bayi ağımızdan size en yakın noktayı keşfedin.',
  },
  nav: {
    collections: 'Koleksiyonlar',
    about: 'Hakkımızda',
    dealers: 'Bayi Ağı',
    inspiration: 'İlham',
    contact: 'İletişim',
    cta: 'Bayi Bul',
    menu: 'Menü',
    close: 'Kapat',
    skipToContent: 'İçeriğe geç',
    languageLabel: 'Dil',
  },
  hero: {
    titleLine1: 'Yaşam Alanlarınıza',
    titleLine2: 'Dokunan Tasarımlar',
    subtitle: 'Premium perde koleksiyonları. Türkiye genelinde güçlü bayi ağı.',
    ctaPrimary: 'Koleksiyonları Keşfet',
    ctaSecondary: 'Size En Yakın Bayi',
    scrollCue: 'Keşfetmek için kaydırın',
    imageAlt: 'Tül perdelerden süzülen sabah ışığıyla aydınlanan modern bir oturma odası',
  },
  story: {
    eyebrow: 'Hakkımızda',
    quote:
      'Bir perde sadece pencereyi kapatmaz. Bir mekânın ışığını, atmosferini ve karakterini değiştirir.',
    body: 'Dokuma, renk ve ışık üzerine çalışıyoruz. Her koleksiyon; kumaşın tuşesi, ışığı geçirme biçimi ve mekânla kurduğu ilişki düşünülerek hazırlanır.',
    imageAlt: 'Doğal ışıkta keten dokulu perde kumaşının yakın çekimi',
  },
  collections: {
    eyebrow: 'Koleksiyonlar',
    title: 'Her mekâna bir doku.',
    body: "Tülden blackout'a, zebradan premium kumaşlara; ihtiyacınıza ve mekânınızın karakterine göre kurgulanmış koleksiyonlar.",
    hint: 'Kaydırarak keşfedin',
  },
  fabric: {
    eyebrow: 'Kumaş ve Işık',
    title: 'Işığı Tasarlayın.',
    body: 'Dokular, renkler ve farklı geçirgenlik seçenekleriyle mekânınızdaki ışığın karakterini belirleyin.',
  },
  dealers: {
    eyebrow: 'Bayi Ağı',
    title: "Türkiye'nin her yerinde yanınızdayız.",
    body: 'Koleksiyonları yerinde görmek, kumaşa dokunmak ve ölçü aldırmak için size en yakın bayimizi bulun.',
    statCities: 'Şehir',
    statDistricts: 'İlçe',
    statDealers: 'Bayi',
    cityLabel: 'İl',
    cityPlaceholder: 'İl seçin',
    districtLabel: 'İlçe',
    districtPlaceholder: 'Tüm ilçeler',
    locateButton: 'Konumumu kullan',
    locating: 'Konumunuz alınıyor…',
    locateError: 'Konum alınamadı. Lütfen il seçerek devam edin.',
    locateUnsupported: 'Tarayıcınız konum desteği sunmuyor.',
    nearestTitle: 'Size en yakın bayiler',
    resultsEmpty: 'Bu bölgede kayıtlı bayi bulunamadı.',
    resultsCount: '{count} bayi listeleniyor',
    loading: 'Bayiler yükleniyor…',
    call: 'Ara',
    whatsapp: 'WhatsApp',
    directions: 'Yol tarifi',
    showroom: 'Showroom',
    distance: '{km} km',
    mapHint: 'Haritada bir bölgenin üzerine gelin, ile tıklayın.',
  },
  whyUs: {
    eyebrow: 'Neden Biz',
    title: 'Perde bir detay değil, mekânın kendisidir.',
  },
  inspiration: {
    eyebrow: 'İlham',
    title: 'İlham Veren Mekânlar',
    body: 'Salonlardan otel lobilerine; perdenin mekânla kurduğu ilişki.',
  },
  cta: {
    title: 'Size en yakın koleksiyonu keşfedin.',
    body: 'Türkiye genelindeki bayi ağımızdan size en yakın noktayı bulun.',
    button: 'En Yakın Bayiyi Bul',
    imageAlt: 'Zemine kadar inen fon perdeleriyle geniş pencereli bir iç mekân',
  },
  footer: {
    tagline: 'Yaşam alanlarına dokunan tasarımlar.',
    company: 'Kurumsal',
    collections: 'Koleksiyonlar',
    dealerNetwork: 'Bayi Ağı',
    contact: 'İletişim',
    legal: 'Yasal',
    kvkk: 'KVKK Aydınlatma Metni',
    privacy: 'Gizlilik Politikası',
    cookies: 'Çerez Politikası',
    dealerLogin: 'Bayi Girişi',
    social: 'Sosyal Medya',
    rights: 'Tüm hakları saklıdır.',
  },
  notFound: {
    title: 'Sayfa bulunamadı',
    body: 'Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.',
    home: 'Ana sayfaya dön',
  },
};

type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

export type UiDictionary = DeepStrings<typeof tr>;

const en: UiDictionary = {
  meta: {
    title: 'Premium Curtain Collections and a Nationwide Dealer Network',
    description:
      'Sheer curtains, drapery, blackout, zebra, roller and vertical blinds. Find your nearest point in our dealer network across Türkiye.',
  },
  nav: {
    collections: 'Collections',
    about: 'About',
    dealers: 'Dealer Network',
    inspiration: 'Inspiration',
    contact: 'Contact',
    cta: 'Find a Dealer',
    menu: 'Menu',
    close: 'Close',
    skipToContent: 'Skip to content',
    languageLabel: 'Language',
  },
  hero: {
    titleLine1: 'Designs That Touch',
    titleLine2: 'Your Living Spaces',
    subtitle: 'Premium curtain collections. A strong dealer network across Türkiye.',
    ctaPrimary: 'Explore Collections',
    ctaSecondary: 'Find Your Nearest Dealer',
    scrollCue: 'Scroll to explore',
    imageAlt: 'A modern living room lit by morning light filtered through sheer curtains',
  },
  story: {
    eyebrow: 'About Us',
    quote:
      'A curtain does not simply cover a window. It changes the light, the atmosphere and the character of a space.',
    body: 'We work with weave, colour and light. Every collection is built around the hand of the fabric, the way it filters daylight and the relationship it builds with the room.',
    imageAlt: 'Close-up of a linen-textured curtain fabric in natural light',
  },
  collections: {
    eyebrow: 'Collections',
    title: 'A texture for every space.',
    body: 'From sheers to blackout, from zebra blinds to premium fabrics: collections composed around your needs and the character of your space.',
    hint: 'Scroll to explore',
  },
  fabric: {
    eyebrow: 'Fabric and Light',
    title: 'Design the Light.',
    body: 'Shape the character of light in your space through textures, colours and different levels of transparency.',
  },
  dealers: {
    eyebrow: 'Dealer Network',
    title: 'Close to you, everywhere in Türkiye.',
    body: 'Find your nearest dealer to see the collections in person, feel the fabric and have your windows measured.',
    statCities: 'Cities',
    statDistricts: 'Districts',
    statDealers: 'Dealers',
    cityLabel: 'City',
    cityPlaceholder: 'Select a city',
    districtLabel: 'District',
    districtPlaceholder: 'All districts',
    locateButton: 'Use my location',
    locating: 'Getting your location…',
    locateError: 'We could not get your location. Please select a city instead.',
    locateUnsupported: 'Your browser does not support location services.',
    nearestTitle: 'Dealers nearest to you',
    resultsEmpty: 'No dealer is listed for this area.',
    resultsCount: 'Showing {count} dealers',
    loading: 'Loading dealers…',
    call: 'Call',
    whatsapp: 'WhatsApp',
    directions: 'Directions',
    showroom: 'Showroom',
    distance: '{km} km',
    mapHint: 'Hover a region on the map, then select a city.',
  },
  whyUs: {
    eyebrow: 'Why Us',
    title: 'A curtain is not a detail. It is the room itself.',
  },
  inspiration: {
    eyebrow: 'Inspiration',
    title: 'Spaces That Inspire',
    body: 'From living rooms to hotel lobbies: how a curtain shapes a space.',
  },
  cta: {
    title: 'Discover the collection nearest to you.',
    body: 'Find your closest point in our dealer network across Türkiye.',
    button: 'Find the Nearest Dealer',
    imageAlt: 'An interior with wide windows and floor-length drapery',
  },
  footer: {
    tagline: 'Designs that touch living spaces.',
    company: 'Company',
    collections: 'Collections',
    dealerNetwork: 'Dealer Network',
    contact: 'Contact',
    legal: 'Legal',
    kvkk: 'Personal Data Notice',
    privacy: 'Privacy Policy',
    cookies: 'Cookie Policy',
    dealerLogin: 'Dealer Login',
    social: 'Social Media',
    rights: 'All rights reserved.',
  },
  notFound: {
    title: 'Page not found',
    body: 'The page you are looking for may have moved, or may never have existed.',
    home: 'Back to home',
  },
};

export const ui: Record<Locale, UiDictionary> = { tr, en };
