import { site } from '../data/site';
import type { Locale } from '../i18n/ui';

interface OrganizationInput {
  locale: Locale;
  siteUrl: string;
  description: string;
}

/** Organization + WebSite JSON-LD. Yalnizca dogrulanabilir, siteye ait bilgiler. */
export function buildJsonLd({ locale, siteUrl, description }: OrganizationInput): string {
  const organization = {
    '@type': 'Organization',
    '@id': `${siteUrl}#organization`,
    name: site.brand.name,
    legalName: site.brand.legalName,
    url: siteUrl,
    logo: `${siteUrl}favicon.svg`,
    description,
    sameAs: site.social.map((item) => item.url),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.contact.address.street,
      addressLocality: site.contact.address.district,
      addressRegion: site.contact.address.city,
      postalCode: site.contact.address.postalCode,
      addressCountry: site.contact.address.country,
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: site.contact.phone,
        email: site.contact.email,
        contactType: 'customer support',
        areaServed: 'TR',
        availableLanguage: ['tr', 'en'],
      },
    ],
  };

  const website = {
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: site.brand.name,
    description,
    inLanguage: locale,
    publisher: { '@id': `${siteUrl}#organization` },
  };

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, website] });
}
