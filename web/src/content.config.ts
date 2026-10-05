import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { publicDealerSchema } from './lib/contracts/dealer';
import { dealersLoader } from './lib/dealers/loader';

/** Iki dil de zorunlu: ceviri eksikse build duser. */
const localized = z.object({
  tr: z.string().min(1),
  en: z.string().min(1),
});

const collectionsCollection = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/collections' }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int().positive(),
      category: z.enum(['tul', 'fon', 'blackout', 'zebra', 'stor', 'dikey', 'premium-kumas']),
      cover: image(),
      name: localized,
      description: localized,
    }),
});

const inspirationCollection = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/inspiration' }),
  schema: ({ image }) =>
    z.object({
      order: z.number().int().positive(),
      image: image(),
      alt: localized,
      space: localized,
      span: z.enum(['tall', 'wide', 'square']),
    }),
});

const legalCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    key: z.enum(['kvkk', 'privacy', 'cookies']),
    locale: z.enum(['tr', 'en']),
    title: z.string().min(1),
    description: z.string().min(1),
    updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});

const dealersCollection = defineCollection({
  loader: dealersLoader(),
  schema: publicDealerSchema,
});

export const collections = {
  dealers: dealersCollection,
  collections: collectionsCollection,
  inspiration: inspirationCollection,
  legal: legalCollection,
};
