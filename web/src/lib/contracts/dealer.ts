import { z } from 'zod';

/** Turkiye sinirlari: Excel'de yer degistirmis lat/lng ciftlerini yakalar. */
export const TURKEY_BOUNDS = { minLat: 35.5, maxLat: 42.5, minLng: 25.5, maxLng: 45.0 } as const;

const phone = z.string().regex(/^\+90\d{10}$/, 'Telefon +90XXXXXXXXXX biciminde olmali');

export const publicDealerSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  plate: z.number().int().min(1).max(81),
  city: z.string().min(1),
  citySlug: z.string().min(1),
  district: z.string().min(1),
  districtSlug: z.string().min(1),
  address: z.string().min(1),
  phone,
  whatsapp: phone.nullable().default(null),
  email: z.email().nullable().default(null),
  lat: z.number().min(TURKEY_BOUNDS.minLat).max(TURKEY_BOUNDS.maxLat),
  lng: z.number().min(TURKEY_BOUNDS.minLng).max(TURKEY_BOUNDS.maxLng),
  isShowroom: z.boolean().default(false),
  openingHours: z.string().nullable().default(null),
});

export type PublicDealer = z.infer<typeof publicDealerSchema>;

/** Konum hesabi icin istemciye giden kucuk kayit. */
export const dealerLocationSchema = publicDealerSchema.pick({
  id: true,
  plate: true,
  city: true,
  district: true,
  lat: true,
  lng: true,
});

export type DealerLocation = z.infer<typeof dealerLocationSchema>;
