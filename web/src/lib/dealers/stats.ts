import type { PublicDealer } from '../contracts/dealer';

export interface DealerStats {
  cities: number;
  districts: number;
  dealers: number;
}

export function computeStats(dealers: readonly PublicDealer[]): DealerStats {
  const cities = new Set<number>();
  const districts = new Set<string>();

  for (const dealer of dealers) {
    cities.add(dealer.plate);
    districts.add(`${dealer.plate}-${dealer.districtSlug}`);
  }

  return { cities: cities.size, districts: districts.size, dealers: dealers.length };
}

/** Pazarlama sayilari (ornegin "300+") site.ts'ten override edilebilir. */
export function applyStatsOverride(
  stats: DealerStats,
  override: {
    cities?: number | undefined;
    districts?: number | undefined;
    dealers?: number | undefined;
  },
): DealerStats {
  return {
    cities: override.cities ?? stats.cities,
    districts: override.districts ?? stats.districts,
    dealers: override.dealers ?? stats.dealers,
  };
}
