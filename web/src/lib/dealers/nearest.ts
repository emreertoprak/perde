import type { DealerLocation } from '../contracts/dealer';

export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Haversine — km cinsinden kus ucusu mesafe. */
export function distanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface NearestDealer<T> {
  dealer: T;
  distanceKm: number;
}

export function nearestDealers<T extends DealerLocation>(
  dealers: readonly T[],
  origin: Coordinates,
  limit = 3,
): NearestDealer<T>[] {
  return dealers
    .map((dealer) => ({ dealer, distanceKm: distanceKm(origin, dealer) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}
